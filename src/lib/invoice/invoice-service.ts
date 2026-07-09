// InvoiceService — the only thing responsible for generating, storing, and
// retrieving invoices. Cloudinary is the permanent storage provider; every
// future operation (delete/replace/regenerate/move/version) goes through
// pdfPublicId, never by parsing pdfUrl. Numbering itself is delegated to
// InvoiceNumberService (a sibling, not a dependency of the numbering
// scheme's business logic — see invoice-number-service.ts). Never imports
// NotificationService or EmailService — see src/lib/invoice/README.md for
// how a future EmailService plugs in without this file changing.
//
// Numbers are reserved BEFORE generation, not after — see "Reserve Invoice
// Number" in the README. A reserved number is permanent: on failure the row
// moves to FAILED, it is never deleted, and the number is never reused.

import { db } from '@/lib/db'
import { cloudinary } from '@/lib/cloudinary'
import { generateInvoicePdf } from './generate-invoice'
import { InvoiceNumberService } from './invoice-number-service'

interface OrderForInvoice {
  id: string
  orderNumber: string
  createdAt: Date
  subtotal: number
  discount: number
  shippingFee: number
  total: number
  items: { name: string; qty: number; price: number }[]
  address: {
    recipientName: string
    phone: string
    email: string | null
    houseNumber: string | null
    streetAddress: string
    village: string | null
    commune: string | null
    district: string
    province: string
    deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
    deliveryCompany: string | null
  } | null
  payment: { method: string; status: string } | null
  user: { email: string }
}

export interface InvoiceResult {
  invoiceId: string
  invoiceNumber: string
  pdfPublicId: string
  pdfUrl: string
  generatedAt: Date
}

const INVOICE_FOLDER = 'the-scent-lab/invoices'

function uploadPdfToCloudinary(buffer: Buffer, publicId: string): Promise<{ publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: INVOICE_FOLDER,
        public_id: publicId,
        resource_type: 'raw',
        format: 'pdf',
        overwrite: true,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload returned no result'))
        resolve({ publicId: result.public_id, url: result.secure_url })
      }
    )
    stream.end(buffer)
  })
}

/** Builds a Cloudinary delivery URL from the stored public id — never from a parsed/stored URL string. */
export function getInvoiceDownloadUrl(pdfPublicId: string, opts: { attachment?: boolean } = {}) {
  return cloudinary.url(pdfPublicId, {
    resource_type: 'raw',
    type: 'upload',
    flags: opts.attachment ? 'attachment' : undefined,
  })
}

/**
 * Reserves an invoice number for this order, permanently. If a row already
 * exists (PENDING/FAILED from a prior interrupted attempt, or GENERATED),
 * it's returned as-is rather than allocating a second number — a retry
 * resumes the same reservation, it never burns a new sequence value.
 */
async function reserveInvoice(order: OrderForInvoice) {
  const existing = await db.invoice.findUnique({ where: { orderId: order.id } })
  if (existing) return existing

  const invoiceNumber = await InvoiceNumberService.generate(order.id, order.createdAt)
  return db.invoice.create({
    data: { invoiceNumber, orderId: order.id, status: 'PENDING' },
  })
}

/**
 * Reserve → generate PDF → upload → finalize. The row created by
 * reserveInvoice is never deleted: a failure at any step moves it to
 * FAILED (keeping its permanently-allocated number as the audit trail)
 * rather than rolling back or reusing the number. The order itself always
 * stays valid regardless of what happens here.
 */
export async function generateAndStoreInvoice(order: OrderForInvoice): Promise<InvoiceResult | null> {
  const record = await reserveInvoice(order)

  if (record.status === 'GENERATED' && record.pdfPublicId && record.pdfUrl && record.generatedAt) {
    return {
      invoiceId: record.id,
      invoiceNumber: record.invoiceNumber,
      pdfPublicId: record.pdfPublicId,
      pdfUrl: record.pdfUrl,
      generatedAt: record.generatedAt,
    }
  }

  // record.status is PENDING or FAILED here — (re)attempt using the number
  // already reserved on this row.
  const { invoiceNumber } = record

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateInvoicePdf(order, invoiceNumber)
  } catch (error) {
    console.error('[invoice] PDF rendering failed — number stays reserved, marking FAILED', { orderId: order.id, invoiceNumber, error })
    await db.invoice.update({ where: { id: record.id }, data: { status: 'FAILED' } }).catch(() => {})
    return null
  }

  let uploaded: { publicId: string; url: string }
  try {
    uploaded = await uploadPdfToCloudinary(pdfBuffer, invoiceNumber)
  } catch (error) {
    console.error('[invoice] Cloudinary upload failed — number stays reserved, marking FAILED', { orderId: order.id, invoiceNumber, error })
    await db.invoice.update({ where: { id: record.id }, data: { status: 'FAILED' } }).catch(() => {})
    return null
  }

  try {
    const updated = await db.invoice.update({
      where: { id: record.id },
      data: {
        pdfPublicId: uploaded.publicId,
        pdfUrl: uploaded.url,
        status: 'GENERATED',
        generatedAt: new Date(),
      },
    })
    return {
      invoiceId: updated.id,
      invoiceNumber: updated.invoiceNumber,
      pdfPublicId: updated.pdfPublicId!,
      pdfUrl: updated.pdfUrl!,
      generatedAt: updated.generatedAt!,
    }
  } catch (error) {
    // The PDF is safely uploaded under this invoiceNumber's public id even
    // though the DB write failed. We don't destroy it: a retry re-uploads
    // to the same public id (overwrite: true) and finalizes the same row.
    console.error('[invoice] finalizing DB record failed after successful upload — marking FAILED, asset kept for retry', { orderId: order.id, invoiceNumber, error })
    await db.invoice.update({ where: { id: record.id }, data: { status: 'FAILED' } }).catch(() => {})
    return null
  }
}

/** Staff retry path — resumes a PENDING/FAILED reservation, or returns the existing GENERATED result as-is. */
export async function regenerateInvoice(order: OrderForInvoice): Promise<InvoiceResult | null> {
  return generateAndStoreInvoice(order)
}

export async function getInvoiceForOrder(orderId: string) {
  return db.invoice.findUnique({ where: { orderId } })
}
