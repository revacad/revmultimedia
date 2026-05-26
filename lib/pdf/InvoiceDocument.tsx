import { Document, Page, Text, View } from '@react-pdf/renderer'
import { PdfBrandHeader, PdfWatermark } from '@/lib/pdf/BrandMark'
import { pdfStyles } from '@/lib/pdf/styles'

export type InvoicePdfData = {
  reference: string
  paymentForLabel: string
  studentName: string
  studentEmail: string
  applicationReference: string
  amountGhs: number
  discountGhs: number
  totalGhs: number
  dueDate: string | null
  status: string
  notes: string | null
  momoNumber?: string
  momoName?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
}

function formatMoney(amount: number): string {
  return `GHS ${amount.toFixed(2)}`
}

export function InvoiceDocument({ data }: { data: InvoicePdfData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfWatermark />
        <PdfBrandHeader documentTitle="Invoice" subtitle={data.reference} />

        <View style={{ marginBottom: 16 }}>
          <Text style={pdfStyles.muted}>Bill to</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{data.studentName}</Text>
          <Text style={pdfStyles.muted}>{data.studentEmail}</Text>
          <Text style={[pdfStyles.muted, { marginTop: 4 }]}>
            Application: {data.applicationReference}
          </Text>
        </View>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Payment for</Text>
          <Text style={pdfStyles.value}>{data.paymentForLabel}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Status</Text>
          <Text style={pdfStyles.value}>{data.status.replace(/_/g, ' ')}</Text>
        </View>
        {data.dueDate && (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Due date</Text>
            <Text style={pdfStyles.value}>{data.dueDate}</Text>
          </View>
        )}

        <View style={{ marginTop: 12 }}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Amount</Text>
            <Text style={pdfStyles.value}>{formatMoney(data.amountGhs)}</Text>
          </View>
          {data.discountGhs > 0 && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Discount</Text>
              <Text style={pdfStyles.value}>- {formatMoney(data.discountGhs)}</Text>
            </View>
          )}
        </View>

        <View style={pdfStyles.totalBox}>
          <Text style={pdfStyles.muted}>Total due</Text>
          <Text style={pdfStyles.totalAmount}>{formatMoney(data.totalGhs)}</Text>
        </View>

        {data.notes ? (
          <View style={{ marginTop: 16 }}>
            <Text style={pdfStyles.muted}>Notes</Text>
            <Text style={{ marginTop: 4 }}>{data.notes}</Text>
          </View>
        ) : null}

        {(data.momoNumber || data.bankAccount) && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>How to pay</Text>
            <Text style={pdfStyles.muted}>
              Quote invoice reference {data.reference} in your payment description.
            </Text>
            {data.momoNumber ? (
              <Text style={{ marginTop: 8 }}>
                MoMo: {data.momoNumber}
                {data.momoName ? ` (${data.momoName})` : ''}
              </Text>
            ) : null}
            {data.bankAccount ? (
              <Text style={{ marginTop: 4 }}>
                Bank: {data.bankName} · {data.bankAccount}
                {data.bankAccountName ? ` · ${data.bankAccountName}` : ''}
              </Text>
            ) : null}
          </View>
        )}

        <Text style={pdfStyles.footer}>
          Rev Multimedia · revmultimedia.com · This invoice was issued electronically.
        </Text>
      </Page>
    </Document>
  )
}
