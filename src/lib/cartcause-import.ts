import type {
  EvidenceType,
  LeakCandidate,
  StoreProfile,
} from "../data/cartCause";

export const MAX_CARTCAUSE_IMPORT_BYTES = 250_000;
const MAX_CANDIDATES = 5;
const MIN_EVIDENCE_PER_CANDIDATE = 2;
const MAX_EVIDENCE_PER_CANDIDATE = 12;

const requiredHeaders = [
  "store_name",
  "candidate_id",
  "sku",
  "product_name",
  "estimated_leakage_cents",
  "orders",
  "returns",
  "baseline_return_rate_bps",
  "evidence_id",
  "evidence_type",
  "evidence_excerpt",
  "source_label",
  "current_description",
  "current_faq",
] as const;

const evidenceTypes = new Set<EvidenceType>([
  "return",
  "review",
  "support",
  "product_copy",
]);

type RequiredHeader = (typeof requiredHeaders)[number];

export interface CartCauseImport {
  store: StoreProfile;
  candidates: LeakCandidate[];
  rowCount: number;
  evidenceCount: number;
}

interface CandidateAccumulator {
  candidate: LeakCandidate;
}

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];

    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("CSV contains an unclosed quoted field.");
  }

  row.push(field);
  if (row.some((value) => value.trim().length > 0)) {
    rows.push(row);
  }

  return rows;
}

function parseInteger(value: string, label: string, rowNumber: number): number {
  if (!/^-?\d+$/.test(value)) {
    throw new Error(`Row ${rowNumber}: ${label} must be an integer.`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Row ${rowNumber}: ${label} is outside the supported range.`);
  }

  return parsed;
}

function assertLength(
  value: string,
  label: string,
  rowNumber: number,
  maximum: number,
  allowEmpty = false,
): void {
  if ((!allowEmpty && value.length === 0) || value.length > maximum) {
    const requirement = allowEmpty ? `at most ${maximum}` : `1 to ${maximum}`;
    throw new Error(`Row ${rowNumber}: ${label} must contain ${requirement} characters.`);
  }
}

function rowsToRecords(rows: string[][]): Record<RequiredHeader, string>[] {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow) {
    throw new Error("CSV is empty.");
  }

  const headers = headerRow.map((value, index) =>
    (index === 0 ? value.replace(/^\uFEFF/, "") : value).trim().toLowerCase(),
  );
  const duplicateHeader = headers.find(
    (header, index) => header.length > 0 && headers.indexOf(header) !== index,
  );
  if (duplicateHeader) {
    throw new Error(`CSV header ${duplicateHeader} appears more than once.`);
  }

  const missingHeader = requiredHeaders.find((header) => !headers.includes(header));
  if (missingHeader) {
    throw new Error(`CSV is missing the required ${missingHeader} column.`);
  }

  if (dataRows.length === 0) {
    throw new Error("CSV must include at least one evidence row.");
  }

  return dataRows.map((values, index) => {
    const rowNumber = index + 2;
    if (values.length > headers.length) {
      throw new Error(`Row ${rowNumber}: found more values than header columns.`);
    }

    return Object.fromEntries(
      requiredHeaders.map((header) => {
        const headerIndex = headers.indexOf(header);
        return [header, (values[headerIndex] ?? "").trim()];
      }),
    ) as Record<RequiredHeader, string>;
  });
}

export function parseCartCauseCsv(input: string): CartCauseImport {
  if (new TextEncoder().encode(input).byteLength > MAX_CARTCAUSE_IMPORT_BYTES) {
    throw new Error("CSV must be 250 KB or smaller.");
  }

  const records = rowsToRecords(parseCsvRows(input));
  const candidates = new Map<string, CandidateAccumulator>();
  const evidenceIds = new Set<string>();
  let storeName = "";

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    assertLength(record.store_name, "store_name", rowNumber, 120);
    assertLength(record.candidate_id, "candidate_id", rowNumber, 64);
    assertLength(record.sku, "sku", rowNumber, 80);
    assertLength(record.product_name, "product_name", rowNumber, 160);
    assertLength(record.evidence_id, "evidence_id", rowNumber, 64);
    assertLength(record.evidence_excerpt, "evidence_excerpt", rowNumber, 600);
    assertLength(record.source_label, "source_label", rowNumber, 120);
    assertLength(record.current_description, "current_description", rowNumber, 3000, true);
    assertLength(record.current_faq, "current_faq", rowNumber, 3000, true);

    if (storeName && record.store_name !== storeName) {
      throw new Error(`Row ${rowNumber}: store_name must be consistent across the file.`);
    }
    storeName = record.store_name;

    if (!evidenceTypes.has(record.evidence_type as EvidenceType)) {
      throw new Error(
        `Row ${rowNumber}: evidence_type must be return, review, support, or product_copy.`,
      );
    }

    if (evidenceIds.has(record.evidence_id)) {
      throw new Error(`Row ${rowNumber}: evidence_id must be unique across the file.`);
    }
    evidenceIds.add(record.evidence_id);

    const estimatedLeakageCents = parseInteger(
      record.estimated_leakage_cents,
      "estimated_leakage_cents",
      rowNumber,
    );
    const orders = parseInteger(record.orders, "orders", rowNumber);
    const returns = parseInteger(record.returns, "returns", rowNumber);
    const baselineReturnRateBps = parseInteger(
      record.baseline_return_rate_bps,
      "baseline_return_rate_bps",
      rowNumber,
    );

    if (estimatedLeakageCents < 0 || orders < 0 || returns < 0) {
      throw new Error(`Row ${rowNumber}: leakage, orders, and returns cannot be negative.`);
    }
    if (returns > orders) {
      throw new Error(`Row ${rowNumber}: returns cannot exceed orders.`);
    }
    if (baselineReturnRateBps < 0 || baselineReturnRateBps > 10_000) {
      throw new Error(`Row ${rowNumber}: baseline_return_rate_bps must be 0 to 10000.`);
    }

    const existing = candidates.get(record.candidate_id);
    if (!existing) {
      if (candidates.size >= MAX_CANDIDATES) {
        throw new Error(`Row ${rowNumber}: CSV can include at most ${MAX_CANDIDATES} candidates.`);
      }

      candidates.set(record.candidate_id, {
        candidate: {
          id: record.candidate_id,
          product: {
            sku: record.sku,
            name: record.product_name,
          },
          computed: {
            estimatedLeakageCents,
            orders,
            returns,
            returnRateBps: orders === 0 ? 0 : Math.round((returns / orders) * 10_000),
            baselineReturnRateBps,
          },
          evidence: [],
          currentCopy: {
            description: record.current_description,
            faq: record.current_faq,
          },
        },
      });
    } else {
      const { candidate } = existing;
      const consistent =
        candidate.product.sku === record.sku &&
        candidate.product.name === record.product_name &&
        candidate.computed.estimatedLeakageCents === estimatedLeakageCents &&
        candidate.computed.orders === orders &&
        candidate.computed.returns === returns &&
        candidate.computed.baselineReturnRateBps === baselineReturnRateBps &&
        candidate.currentCopy.description === record.current_description &&
        candidate.currentCopy.faq === record.current_faq;
      if (!consistent) {
        throw new Error(
          `Row ${rowNumber}: repeated candidate fields must match earlier rows for ${record.candidate_id}.`,
        );
      }
    }

    candidates.get(record.candidate_id)!.candidate.evidence.push({
      id: record.evidence_id,
      type: record.evidence_type as EvidenceType,
      excerpt: record.evidence_excerpt,
      sourceLabel: record.source_label,
    });
  });

  const parsedCandidates = Array.from(candidates.values(), ({ candidate }) => candidate);
  for (const candidate of parsedCandidates) {
    if (
      candidate.evidence.length < MIN_EVIDENCE_PER_CANDIDATE ||
      candidate.evidence.length > MAX_EVIDENCE_PER_CANDIDATE
    ) {
      throw new Error(
        `${candidate.id} must include ${MIN_EVIDENCE_PER_CANDIDATE} to ${MAX_EVIDENCE_PER_CANDIDATE} evidence rows.`,
      );
    }
  }

  return {
    store: { name: storeName, currency: "USD" },
    candidates: parsedCandidates,
    rowCount: records.length,
    evidenceCount: evidenceIds.size,
  };
}
