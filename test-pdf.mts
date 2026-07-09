const { generateInvoicePdf } = await import('./src/lib/invoice/generate-invoice')

const fakeOrder = {
  id: 'test123456',
  orderNumber: '#SL-1234567890',
  createdAt: new Date(),
  subtotal: 120,
  discount: 0,
  shippingFee: 2,
  total: 122,
  items: [{ name: 'Dior Sauvage EDT', qty: 1, price: 120 }],
  address: {
    recipientName: 'Chan Sopheak',
    phone: '012345678',
    email: 'chan@example.com',
    houseNumber: null,
    streetAddress: 'St 51',
    village: null,
    commune: null,
    district: 'Chamkar Mon',
    province: 'Phnom Penh',
    deliveryMethod: 'LOCAL_COURIER' as const,
    deliveryCompany: null,
  },
  payment: { method: 'ABA_KHQR', status: 'PAID' },
  user: { email: 'chan@example.com' },
}

const buf = await generateInvoicePdf(fakeOrder)
const fs = await import('fs')
fs.writeFileSync('./test-invoice.pdf', buf)
console.log('PDF generated, size:', buf.length, 'bytes')
console.log('starts with %PDF:', buf.subarray(0, 4).toString())
