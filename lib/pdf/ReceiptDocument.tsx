import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BrandDots } from '@/lib/pdf/BrandMark'

export type ReceiptPdfData = {
  receiptId: string
  invoiceReference: string
  paymentForLabel: string
  courseTitle: string | null
  intakeName: string | null
  studentName: string
  studentEmail: string
  amountPaidGhs: number
  totalInvoiceGhs: number
  totalPaidGhs: number
  remainingGhs: number
  paymentMethod: string
  transactionRef: string | null
  paidAt: string
  fullyPaid: boolean
  academyEmail: string
  academyWebsite: string
  academyPhone: string
}

function formatMoney(amount: number): string {
  return `GHS ${amount.toFixed(2)}`
}

export function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
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
            <Text style={styles.headerDocTitle}>Receipt</Text>
            <Text style={styles.headerMeta}>{data.invoiceReference}</Text>
            <Text style={styles.headerMeta}>{data.paidAt}</Text>
          </View>
        </View>
        <View
          style={[styles.accentRule, data.fullyPaid ? styles.accentPaid : styles.accentPartial]}
        />

        <View style={styles.body}>
          <View style={styles.twoCol}>
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Received from</Text>
              <Text style={styles.bold}>{data.studentName}</Text>
              <Text style={styles.value}>{data.studentEmail}</Text>
            </View>
            <View style={[styles.block, { alignItems: 'flex-end' }]}>
              <Text
                style={[
                  styles.statusPill,
                  data.fullyPaid ? styles.statusPaid : styles.statusPartial,
                ]}
              >
                {data.fullyPaid ? 'PAID' : 'PARTIALLY PAID'}
              </Text>
              <Text style={[styles.label, { marginTop: 8 }]}>Payment date</Text>
              <Text style={styles.value}>{data.paidAt}</Text>
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.colDesc]}>Details</Text>
              <Text style={[styles.th, styles.colAmt]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.td, styles.colDesc]}>{description}</Text>
              <Text style={[styles.td, styles.colAmt]}>{formatMoney(data.amountPaidGhs)}</Text>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Payment method</Text>
              <Text style={styles.metaValue}>{data.paymentMethod.replace(/_/g, ' ')}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Reference</Text>
              <Text style={styles.metaValue}>{data.transactionRef ?? '—'}</Text>
            </View>
          </View>

          {data.fullyPaid ? (
            <>
              <View style={styles.amountReceived}>
                <Text style={styles.amountReceivedLabel}>Amount received</Text>
                <Text style={styles.amountReceivedValue}>
                  {formatMoney(data.amountPaidGhs)}
                </Text>
              </View>
              <View style={[styles.confirmation, styles.confirmationPaid]}>
                <Text style={styles.confirmationTitlePaid}>
                  This invoice is fully paid. Thank you.
                </Text>
                <Text style={styles.confirmationText}>
                  Please keep this receipt for your records.
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Amount received in this payment</Text>
                  <Text style={styles.summaryValueGreen}>
                    {formatMoney(data.amountPaidGhs)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total paid to date</Text>
                  <Text style={styles.summaryValue}>{formatMoney(data.totalPaidGhs)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Outstanding balance</Text>
                  <Text style={styles.summaryValueRed}>
                    {formatMoney(data.remainingGhs)}
                  </Text>
                </View>
              </View>
              <View style={[styles.confirmation, styles.confirmationPartial]}>
                <Text style={styles.confirmationTitlePartial}>
                  {`Payment received. Your outstanding balance is ${formatMoney(data.remainingGhs)}. Please settle the remaining amount according to the payment schedule.`}
                </Text>
                <Text style={styles.confirmationText}>
                  Please keep this receipt for your records.
                </Text>
              </View>
            </>
          )}
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

const navy = '#1a1a2e'
const green = '#2ecc71'
const amber = '#C4701E'
const red = '#E84A4A'
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
  accentRule: { height: 3, width: '100%' },
  accentPaid: { backgroundColor: green },
  accentPartial: { backgroundColor: amber },
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
  value: { fontFamily: bodyFont, fontSize: 9, color: textBlack, marginTop: 2 },
  bold: { fontFamily: bodyFont, fontSize: 10, fontWeight: 700, color: textBlack },
  label: { fontFamily: bodyFont, fontSize: 8, color: '#5A5A7A' },
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
  statusPaid: { backgroundColor: '#E9F9EF', color: '#1A7A4A' },
  statusPartial: { backgroundColor: '#FEF6EE', color: amber },
  table: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E6E6EE',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6EE',
  },
  tableHeader: { flexDirection: 'row', paddingVertical: 8 },
  tableRow: { flexDirection: 'row', paddingVertical: 8 },
  th: {
    fontFamily: bodyFont,
    fontSize: 8,
    fontWeight: 700,
    color: '#5A5A7A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  td: { fontFamily: bodyFont, fontSize: 9, color: textBlack },
  colDesc: { width: '72%' },
  colAmt: { width: '28%', textAlign: 'right' as const },
  metaGrid: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFEFF5',
    borderRadius: 8,
    padding: 10,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  metaLabel: { fontFamily: bodyFont, fontSize: 8, color: '#5A5A7A' },
  metaValue: {
    fontFamily: bodyFont,
    fontSize: 9,
    color: textBlack,
    maxWidth: '65%',
    textAlign: 'right' as const,
  },
  amountReceived: {
    marginTop: 14,
    marginLeft: 'auto',
    width: '52%',
  },
  amountReceivedLabel: {
    fontFamily: bodyFont,
    fontSize: 8,
    color: '#5A5A7A',
    textAlign: 'right' as const,
  },
  amountReceivedValue: {
    fontFamily: bodyFont,
    fontSize: 12,
    fontWeight: 700,
    color: green,
    textAlign: 'right',
    marginTop: 3,
  },
  summaryBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#EFEFF5',
    borderRadius: 8,
    padding: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontFamily: bodyFont, fontSize: 8, color: '#5A5A7A', maxWidth: '58%' },
  summaryValue: {
    fontFamily: bodyFont,
    fontSize: 10,
    fontWeight: 700,
    color: textBlack,
    textAlign: 'right' as const,
  },
  summaryValueGreen: {
    fontFamily: bodyFont,
    fontSize: 10,
    fontWeight: 700,
    color: green,
    textAlign: 'right' as const,
  },
  summaryValueRed: {
    fontFamily: bodyFont,
    fontSize: 10,
    fontWeight: 700,
    color: red,
    textAlign: 'right' as const,
  },
  confirmation: {
    marginTop: 16,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  confirmationPaid: {
    backgroundColor: '#E9F9EF',
    borderColor: '#BFECCC',
  },
  confirmationPartial: {
    backgroundColor: '#FEF6EE',
    borderColor: '#F5D4B0',
  },
  confirmationTitlePaid: {
    fontFamily: bodyFont,
    fontSize: 10,
    fontWeight: 700,
    color: '#1A7A4A',
  },
  confirmationTitlePartial: {
    fontFamily: bodyFont,
    fontSize: 10,
    fontWeight: 700,
    color: amber,
  },
  confirmationText: { fontFamily: bodyFont, fontSize: 9, color: '#000000', marginTop: 4 },
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
