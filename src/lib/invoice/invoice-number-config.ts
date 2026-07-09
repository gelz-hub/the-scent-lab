// Central configuration for InvoiceNumberService — switching formats is an
// env var change, never a code change in InvoiceService or the PDF/routes
// that consume the resulting number.

export type InvoiceNumberFormat =
  | 'DATE_ORDER_SUFFIX' // INV-20260708-RSO3RG — current default, no counter needed (unique via orderId)
  | 'YEAR_SEQUENTIAL' // INV-2026-000001 — resets yearly
  | 'YEAR_MONTH_SEQUENTIAL' // INV-202607-000234 — resets monthly

const VALID_FORMATS: InvoiceNumberFormat[] = ['DATE_ORDER_SUFFIX', 'YEAR_SEQUENTIAL', 'YEAR_MONTH_SEQUENTIAL']

function resolveFormat(): InvoiceNumberFormat {
  const raw = process.env.INVOICE_NUMBER_FORMAT as InvoiceNumberFormat | undefined
  return raw && VALID_FORMATS.includes(raw) ? raw : 'DATE_ORDER_SUFFIX'
}

export const invoiceNumberConfig = {
  format: resolveFormat(),
  /** e.g. "INV" or "TSL-INV" — the literal prefix before the date/sequence segment. */
  prefix: process.env.INVOICE_NUMBER_PREFIX || 'INV',
  /** Zero-padding width for sequential formats — 6 gives 000001. */
  sequentialPadding: Number(process.env.INVOICE_NUMBER_SEQUENTIAL_PADDING) || 6,
}
