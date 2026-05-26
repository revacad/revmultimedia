import { Document, Page, Text, View } from '@react-pdf/renderer'
import { PdfBrandHeader, PdfWatermark } from '@/lib/pdf/BrandMark'
import { pdfStyles } from '@/lib/pdf/styles'

export type ReceiptPdfData = {
  receiptId: string
  invoiceReference: string
  paymentForLabel: string
  studentName: string
  amountPaidGhs: number
  totalInvoiceGhs: number
  totalPaidGhs: number
  remainingGhs: number
  paymentMethod: string
  transactionRef: string | null
  paidAt: string
  fullyPaid: boolean
}

function formatMoney(amount: number): string {
  return `GHS ${amount.toFixed(2)}`
}

export function ReceiptDocument({ data }: { data: ReceiptPdfData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfWatermark />
        <PdfBrandHeader
          documentTitle="Payment receipt"
          subtitle={`Invoice ${data.invoiceReference}`}
        />

        <View style={{ marginBottom: 16 }}>
          <Text style={pdfStyles.muted}>Received from</Text>
          <Text style={{ fontWeight: 'bold', marginTop: 4 }}>{data.studentName}</Text>
        </View>

        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Payment for</Text>
          <Text style={pdfStyles.value}>{data.paymentForLabel}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Date</Text>
          <Text style={pdfStyles.value}>{data.paidAt}</Text>
        </View>
        <View style={pdfStyles.row}>
          <Text style={pdfStyles.label}>Method</Text>
          <Text style={pdfStyles.value}>{data.paymentMethod.replace(/_/g, ' ')}</Text>
        </View>
        {data.transactionRef ? (
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Reference</Text>
            <Text style={pdfStyles.value}>{data.transactionRef}</Text>
          </View>
        ) : null}

        <View style={[pdfStyles.totalBox, { marginTop: 20 }]}>
          <Text style={pdfStyles.muted}>Amount received</Text>
          <Text style={pdfStyles.totalAmount}>{formatMoney(data.amountPaidGhs)}</Text>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Invoice total</Text>
            <Text style={pdfStyles.value}>{formatMoney(data.totalInvoiceGhs)}</Text>
          </View>
          <View style={pdfStyles.row}>
            <Text style={pdfStyles.label}>Total paid to date</Text>
            <Text style={pdfStyles.value}>{formatMoney(data.totalPaidGhs)}</Text>
          </View>
          {!data.fullyPaid && (
            <View style={pdfStyles.row}>
              <Text style={pdfStyles.label}>Balance remaining</Text>
              <Text style={pdfStyles.value}>{formatMoney(data.remainingGhs)}</Text>
            </View>
          )}
        </View>

        {data.fullyPaid && (
          <Text style={{ marginTop: 16, color: '#1E9990', fontWeight: 'bold' }}>
            This invoice is fully paid. Thank you.
          </Text>
        )}

        <Text style={pdfStyles.footer}>
          Receipt {data.receiptId.slice(0, 8)}… · Rev Multimedia · revmultimedia.com
        </Text>
      </Page>
    </Document>
  )
}
