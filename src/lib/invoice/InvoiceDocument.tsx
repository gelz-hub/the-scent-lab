import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { formatPrice } from '@/lib/format'
import { courierDisplayName } from '@/lib/shipping/couriers'

const PINE = '#2F5D50'
const INK = '#1C2622'
const MUTED = '#6B7A73'
const RULE = '#D9DDD3'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: INK, fontFamily: 'Helvetica' },
  brand: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: PINE, marginBottom: 2 },
  tagline: { fontSize: 9, color: MUTED, marginBottom: 16 },
  rule: { borderBottomWidth: 1, borderBottomColor: RULE, marginVertical: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  metaGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: MUTED, width: 110 },
  value: { flex: 1, textAlign: 'right' },
  sectionTitle: { fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: INK, paddingBottom: 6, marginBottom: 6 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: RULE },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  colSubtotal: { flex: 1, textAlign: 'right' },
  th: { fontSize: 8, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalsBlock: { alignSelf: 'flex-end', width: 220, marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: INK },
  grandTotalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  grandTotalValue: { fontFamily: 'Helvetica-Bold', fontSize: 12 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#E8F0EC', color: PINE, fontFamily: 'Helvetica-Bold', fontSize: 9, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3 },
  footer: { marginTop: 30, textAlign: 'center', color: MUTED, fontSize: 9 },
})

export interface InvoiceOrderItem {
  name: string
  qty: number
  price: number
}

export interface InvoiceData {
  invoiceNumber: string
  orderNumber: string
  date: string
  customerName: string
  phone: string
  email: string
  shippingAddress: string
  paymentMethod: string
  items: InvoiceOrderItem[]
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  paymentStatus: string
  deliveryMethod: 'LOCAL_COURIER' | 'LOGISTICS'
  deliveryCompany: string | null
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const courierLabel =
    data.deliveryMethod === 'LOCAL_COURIER' ? 'Local Courier' : courierDisplayName(data.deliveryCompany)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>The Scent Lab</Text>
        <Text style={styles.tagline}>Curated Fragrances. Authentic Brands.</Text>

        <View style={styles.rule} />

        <View style={styles.metaGrid}>
          <View style={{ flex: 1 }}>
            <View style={styles.row}><Text style={styles.label}>Invoice No.</Text><Text>{data.invoiceNumber}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Order No.</Text><Text>{data.orderNumber}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Date</Text><Text>{data.date}</Text></View>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.row}><Text style={styles.label}>Customer</Text><Text style={styles.value}>{data.customerName}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Phone</Text><Text style={styles.value}>{data.phone}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{data.email}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Shipping Address</Text><Text style={styles.value}>{data.shippingAddress}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Payment Method</Text><Text style={styles.value}>{data.paymentMethod}</Text></View>

        <View style={styles.rule} />

        <Text style={styles.sectionTitle}>Products</Text>
        <View style={styles.tableHeader}>
          <Text style={[styles.colName, styles.th]}>Name</Text>
          <Text style={[styles.colQty, styles.th]}>Quantity</Text>
          <Text style={[styles.colPrice, styles.th]}>Price</Text>
          <Text style={[styles.colSubtotal, styles.th]}>Subtotal</Text>
        </View>
        {data.items.map((item, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.colName}>{item.name}</Text>
            <Text style={styles.colQty}>{item.qty}</Text>
            <Text style={styles.colPrice}>{formatPrice(item.price)}</Text>
            <Text style={styles.colSubtotal}>{formatPrice(item.price * item.qty)}</Text>
          </View>
        ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}><Text style={{ color: MUTED }}>Subtotal</Text><Text>{formatPrice(data.subtotal)}</Text></View>
          <View style={styles.totalRow}><Text style={{ color: MUTED }}>Shipping</Text><Text>{data.shippingFee === 0 ? 'Free' : formatPrice(data.shippingFee)}</Text></View>
          {data.discount > 0 && (
            <View style={styles.totalRow}><Text style={{ color: MUTED }}>Discount</Text><Text>−{formatPrice(data.discount)}</Text></View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatPrice(data.total)}</Text>
          </View>
        </View>

        <View style={styles.rule} />

        <View style={styles.row}>
          <Text style={styles.label}>Payment Status</Text>
          <Text style={styles.badge}>{data.paymentStatus}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Delivery Company</Text>
          <Text style={styles.value}>{courierLabel}</Text>
        </View>

        <View style={styles.rule} />

        <Text style={styles.footer}>Thank you for shopping with The Scent Lab</Text>
      </Page>
    </Document>
  )
}
