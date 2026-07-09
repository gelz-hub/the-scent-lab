// InvoiceNumberService — the only thing responsible for producing invoice
// numbers. Separate from InvoiceService/PDF generation on purpose: the
// numbering scheme is an accounting concern that changes independently of
// how the PDF is rendered or stored.

import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { invoiceNumberConfig, type InvoiceNumberFormat } from './invoice-number-config'

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

/** The reset boundary a sequential format counts within — "GLOBAL" for formats that never reset. */
function scopeFor(format: InvoiceNumberFormat, date: Date): string {
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1, 2)
  switch (format) {
    case 'YEAR_SEQUENTIAL':
      return String(year)
    case 'YEAR_MONTH_SEQUENTIAL':
      return `${year}${month}`
    default:
      return 'GLOBAL'
  }
}

/**
 * Atomically increments and returns the next value for a scope — safe under
 * concurrent order creation. Prisma's upsert is not fully race-proof for a
 * brand-new scope: two concurrent first-time calls can both attempt the
 * `create` branch, and the loser gets a unique-constraint error rather than
 * silently falling back to an update. We retry as a plain increment in that
 * case — the row the winner just created is guaranteed to exist by then.
 */
async function nextSequence(scope: string): Promise<number> {
  try {
    const counter = await db.invoiceNumberCounter.upsert({
      where: { scope },
      update: { value: { increment: 1 } },
      create: { scope, value: 1 },
    })
    return counter.value
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const counter = await db.invoiceNumberCounter.update({
        where: { scope },
        data: { value: { increment: 1 } },
      })
      return counter.value
    }
    throw error
  }
}

function dateOrderSuffix(orderId: string, date: Date): string {
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '')
  const suffix = orderId.slice(-6).toUpperCase()
  return `${invoiceNumberConfig.prefix}-${datePart}-${suffix}`
}

export const InvoiceNumberService = {
  /**
   * Generates an invoice number per the active format (see
   * invoice-number-config.ts). Call exactly once per invoice — the result
   * must be threaded through to both the PDF and the DB row, never
   * regenerated for the same invoice (sequential formats are not
   * idempotent).
   */
  async generate(orderId: string, date: Date): Promise<string> {
    const { format, prefix, sequentialPadding } = invoiceNumberConfig

    if (format === 'DATE_ORDER_SUFFIX') {
      // Already unique via orderId — no counter/DB round-trip needed.
      return dateOrderSuffix(orderId, date)
    }

    const scope = scopeFor(format, date)
    const seq = await nextSequence(scope)
    return `${prefix}-${scope}-${pad(seq, sequentialPadding)}`
  },

  /** Defensive check before persisting — catches the near-impossible case of an external collision. */
  async isUnique(invoiceNumber: string): Promise<boolean> {
    const existing = await db.invoice.findUnique({ where: { invoiceNumber } })
    return !existing
  },
}
