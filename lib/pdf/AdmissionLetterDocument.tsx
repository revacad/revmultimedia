import { Document, Page, Text, View } from '@react-pdf/renderer'
import { PdfBrandHeader, PdfWatermark } from '@/lib/pdf/BrandMark'
import { pdfStyles } from '@/lib/pdf/styles'

export type AdmissionLetterPdfData = {
  studentName: string
  applicationReference: string
  courseTitle: string
  intakeName: string
  intakeStartDate: string
  issuedDate: string
  academyName: string
  academyEmail: string
  academyPhone: string
}

export function AdmissionLetterDocument({ data }: { data: AdmissionLetterPdfData }) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <PdfWatermark />
        <PdfBrandHeader
          documentTitle="Letter of admission"
          subtitle={`Application ${data.applicationReference}`}
        />

        <Text style={{ marginTop: 8, marginBottom: 16, fontSize: 10, color: '#5A5A7A' }}>
          {data.issuedDate}
        </Text>

        <Text style={{ marginBottom: 12, lineHeight: 1.5 }}>
          Dear {data.studentName},
        </Text>

        <Text style={{ marginBottom: 12, lineHeight: 1.5 }}>
          We are pleased to confirm your admission to Rev Multimedia for the programme{' '}
          <Text style={{ fontWeight: 'bold' }}>{data.courseTitle}</Text>
          {data.intakeName ? ` (${data.intakeName})` : ''}.
          {data.intakeStartDate
            ? ` Classes are scheduled to begin on ${data.intakeStartDate}.`
            : ''}
        </Text>

        <Text style={{ marginBottom: 12, lineHeight: 1.5 }}>
          This letter confirms that you have been admitted following review of your application
          and receipt of your tuition payment. Please keep this document for your records and
          present it if requested during orientation.
        </Text>

        <Text style={{ marginBottom: 12, lineHeight: 1.5 }}>
          Log in to your student portal at revmultimedia.com to view invoices, resources, and
          programme updates. If you have questions, contact us using the details below.
        </Text>

        <Text style={{ marginTop: 24, marginBottom: 4, fontWeight: 'bold' }}>
          {data.academyName}
        </Text>
        <Text style={pdfStyles.muted}>{data.academyEmail}</Text>
        <Text style={pdfStyles.muted}>{data.academyPhone}</Text>

        <Text style={[pdfStyles.footer, { marginTop: 32 }]}>
          This is an official admission letter issued by Rev Multimedia. Application reference:{' '}
          {data.applicationReference}.
        </Text>
      </Page>
    </Document>
  )
}
