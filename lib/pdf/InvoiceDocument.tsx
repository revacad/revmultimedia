import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BrandDots } from '@/lib/pdf/BrandMark'

export type InvoicePdfData = {
  reference: string
  paymentForLabel: string
  courseTitle: string | null
  intakeName: string | null
  studentName: string
  studentEmail: string
  applicationReference: string
  amountGhs: number
  discountGhs: number
  totalGhs: number
  dueDate: string | null
  issuedDate: string
  status: string
  notes: string | null
  momoProvider?: string
  momoNumber?: string
  momoName?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  academyEmail: string
  academyWebsite: string
  academyPhone: string
}

function formatMoney(amount: number): string {
  return `GHS ${amount.toFixed(2)}`
}

const navy = '#1a1a2e'
const red = '#e63946'
const textWhite = '#FFFFFF'
const grayLight = '#B8B8C8'
const textBlack = '#000000'
const bodyFont = 'DM Sans'
const headingFont = 'Clash Display'

const styles = StyleSheet.create({
  page: {
    fontFamily: bodyFont,
    fontSize: 10,
    padding: 0,
    backgroundColor: '#FFFFFF',
    color: textBlack,
  },
  header: {
    backgroundColor: navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 22,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerBrandText: { marginLeft: 10 },
  schoolName: {
    fontFamily: headingFont,
    fontSize: 14,
    fontWeight: 700,
    color: textWhite,
  },
  schoolTagline: {
    fontFamily: bodyFont,
    fontSize: 7,
    fontWeight: 500,
    color: grayLight,
    marginTop: 2,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerRight: { alignItems: 'flex-end', maxWidth: '48%' },
  headerDocTitle: {
    fontFamily: headingFont,
    fontSize: 9,
    fontWeight: 600,
    color: '#EAEAF2',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerMeta: {
    fontFamily: bodyFont,
    fontSize: 8,
    color: grayLight,
    marginTop: 3,
    textAlign: 'right',
  },
  accentRule: { height: 3, backgroundColor: red, width: '100%' },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 54,
    backgroundColor: '#FFFFFF',
    color: textBlack,
  },
  sectionTitle: {
    fontFamily: headingFont,
    fontSize: 9,
    fontWeight: 700,
    color: textBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  twoCol: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  block: { flex: 1 },
  label: { fontFamily: bodyFont, fontSize: 8, color: '#5A5A7A' },
  value: { fontFamily: bodyFont, fontSize: 9, color: textBlack, marginTop: 2 },
  bold: { fontFamily: bodyFont, fontSize: 10, fontWeight: 700, color: textBlack },
  mono: { fontFamily: 'JetBrains Mono', fontSize: 9, color: textBlack },
  statusPill: {
    alignSelf: 'flex-end',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontFamily: bodyFont,
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  statusUnpaid: { backgroundColor: '#FFF4D6', color: '#8A5A00' },
  statusPaid: { backgroundColor: '#E9F9EF', color: '#1A7A4A' },
  table: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#E6E6EE', borderBottomWidth: 1, borderBottomColor: '#E6E6EE' },
  tableHeader: { flexDirection: 'row', paddingVertical: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8 },
  th: { fontFamily: bodyFont, fontSize: 8, fontWeight: 700, color: '#5A5A7A', textTransform: 'uppercase', letterSpacing: 0.6 },
  td: { fontFamily: bodyFont, fontSize: 9, color: textBlack },
  colDesc: { width: '72%' },
  colAmt: { width: '28%', textAlign: 'right' as const },
  totals: { marginTop: 14, marginLeft: 'auto', width: '52%' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalDueRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E6E6EE' },
  totalDueValue: { fontFamily: bodyFont, fontSize: 11, fontWeight: 700, color: red },
  howToPay: {
    marginTop: 16,
    backgroundColor: '#F2F2F5',
    borderLeftWidth: 4,
    borderLeftColor: '#1A1A2E',
    padding: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: navy,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontFamily: bodyFont, fontSize: 8, color: '#EAEAF2' },
})

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  const isPaid = data.status.toLowerCase() === 'paid'
  const descriptionParts = [
    data.paymentForLabel,
    data.courseTitle ? `— ${data.courseTitle}` : null,
    data.intakeName ? `(${data.intakeName})` : null,
  ].filter(Boolean)
  const description = descriptionParts.join(' ')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BrandDots size={10} gap={5} opacity={1} />
            <View style={styles.headerBrandText}>
              <Text style={styles.schoolName}>Rev Multimedia</Text>
              <Text style={styles.schoolTagline}>Creative Education</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDocTitle}>Invoice</Text>
            <Text style={styles.headerMeta}>{data.reference}</Text>
            <Text style={styles.headerMeta}>{data.issuedDate}</Text>
          </View>
        </View>
        <View style={styles.accentRule} />

        <View style={styles.body}>
          <View style={styles.twoCol}>
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Billed to</Text>
              <Text style={styles.bold}>{data.studentName}</Text>
              <Text style={styles.value}>{data.studentEmail}</Text>
              <Text style={[styles.label, { marginTop: 6 }]}>Application reference</Text>
              <Text style={styles.mono}>{data.applicationReference}</Text>
            </View>
            <View style={[styles.block, { alignItems: 'flex-end' }]}>
              <Text
                style={[
                  styles.statusPill,
                  isPaid ? styles.statusPaid : styles.statusUnpaid,
                ]}
              >
                {isPaid ? 'Paid' : 'Unpaid'}
              </Text>
              {data.dueDate ? (
                <>
                  <Text style={[styles.label, { marginTop: 8 }]}>Due date</Text>
                  <Text style={styles.value}>{data.dueDate}</Text>
                </>
              ) : null}
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colDesc]}>Description</Text>
              <Text style={[styles.th, styles.colAmt]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.td, styles.colDesc]}>{description}</Text>
              <Text style={[styles.td, styles.colAmt]}>{formatMoney(data.totalGhs)}</Text>
            </View>
          </View>

          <View style={styles.totals}>
            <View style={styles.totalsRow}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.value}>{formatMoney(data.amountGhs)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.label}>Discount</Text>
              <Text style={styles.value}>- {formatMoney(data.discountGhs)}</Text>
            </View>
            <View style={styles.totalDueRow}>
              <Text style={[styles.bold, { fontSize: 10 }]}>Total due</Text>
              <Text style={styles.totalDueValue}>{formatMoney(data.totalGhs)}</Text>
            </View>
          </View>

          <View style={styles.howToPay}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>How to pay</Text>
            <Text style={styles.value}>
              Quote reference <Text style={{ fontWeight: 700 }}>{data.reference}</Text> in your payment
              description.
            </Text>
            {data.momoNumber ? (
              <Text style={[styles.value, { marginTop: 6 }]}>
                Pay via {data.momoProvider ?? 'MTN MoMo'}: {data.momoNumber}
                {data.momoName ? ` (${data.momoName})` : ''}
              </Text>
            ) : null}
            {data.bankAccount ? (
              <Text style={[styles.value, { marginTop: 3 }]}>
                Bank: {data.bankName ?? '—'} · {data.bankAccount}
                {data.bankAccountName ? ` · ${data.bankAccountName}` : ''}
              </Text>
            ) : null}
          </View>

          {data.notes ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.value}>{data.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>{data.academyEmail}</Text>
            <Text style={styles.footerText}>{data.academyWebsite}</Text>
            <Text style={styles.footerText}>{data.academyPhone}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
