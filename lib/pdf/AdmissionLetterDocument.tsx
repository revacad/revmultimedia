import type { ReactElement } from 'react'
import { createElement } from 'react'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { BrandDots } from '@/lib/pdf/BrandMark'

export const PRESIDENT_SIGNATURE_URL =
  'https://pub-bbb162ceae7d4144908b4a619a20c34a.r2.dev/president-signature.png'

export const PRESIDENT_SIGNATURE_IMAGE_SRC = {
  uri: PRESIDENT_SIGNATURE_URL,
  cache: false as const,
}

/** Probes R2 so we only embed the signature when the asset is reachable at render time. */
export async function isPresidentSignatureAvailable(): Promise<boolean> {
  try {
    const response = await fetch(PRESIDENT_SIGNATURE_URL, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10_000),
    })
    if (response.ok) return true
    const getResponse = await fetch(PRESIDENT_SIGNATURE_URL, {
      signal: AbortSignal.timeout(10_000),
    })
    return getResponse.ok
  } catch {
    return false
  }
}

export async function createAdmissionLetterDocument(
  data: AdmissionLetterPdfData,
): Promise<ReactElement> {
  let showPresidentSignature = false
  try {
    showPresidentSignature = await isPresidentSignatureAvailable()
  } catch {
    showPresidentSignature = false
  }
  return createElement(AdmissionLetterDocument, { data, showPresidentSignature })
}

export type AdmissionLetterPdfData = {
  studentName: string
  applicationReference: string
  permanentStudentId: string | null
  courseTitle: string
  intakeName: string
  courseEnrollmentLine: string
  intakeStartDate: string
  issuedDate: string
  totalCourseFeeGhs: number
  amountPaidGhs: number
  outstandingBalanceGhs: number
  academyName: string
  academyEmail: string
  academyPhone: string
  signatoryName: string
  signatoryTitle: string
}

const navy = '#1A1A2E'
const red = '#E63946'
const grayLight = '#B8B8C8'
const grayBox = '#F7F7F7'
const blueBox = '#EEF6FC'
const blueBorder = '#C5DCE8'
const greenPaid = '#1A7A4A'
const outstandingRed = '#C1121F'
const textBlack = '#000000'
const textWhite = '#FFFFFF'
const bodyFont = 'DM Sans'
const headingFont = 'Clash Display'
const monoFont = 'JetBrains Mono'

const styles = StyleSheet.create({
  page: {
    fontFamily: bodyFont,
    fontSize: 9,
    padding: 0,
    backgroundColor: textWhite,
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBrandText: {
    marginLeft: 10,
  },
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
  headerRight: {
    alignItems: 'flex-end',
    maxWidth: '48%',
  },
  headerDocTitle: {
    fontFamily: headingFont,
    fontSize: 9,
    fontWeight: 600,
    color: red,
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
  accentRule: {
    height: 3,
    backgroundColor: red,
    width: '100%',
  },
  body: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 36,
    backgroundColor: textWhite,
    color: textBlack,
  },
  salutation: {
    fontFamily: bodyFont,
    fontSize: 9,
    color: textBlack,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: headingFont,
    fontSize: 10,
    fontWeight: 700,
    color: textBlack,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: navy,
  },
  paragraph: {
    fontFamily: bodyFont,
    fontSize: 9,
    color: textBlack,
    lineHeight: 1.38,
    marginBottom: 7,
  },
  paymentBox: {
    backgroundColor: grayBox,
    borderLeftWidth: 3,
    borderLeftColor: red,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  paymentLabel: {
    fontFamily: headingFont,
    fontSize: 7,
    fontWeight: 600,
    color: textBlack,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  paymentRowLabel: {
    fontFamily: bodyFont,
    fontSize: 9,
    color: textBlack,
  },
  paymentRowValue: {
    fontFamily: bodyFont,
    fontSize: 9,
    fontWeight: 600,
    color: textBlack,
  },
  studentIdBox: {
    backgroundColor: blueBox,
    borderWidth: 1,
    borderColor: blueBorder,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  studentIdLabel: {
    fontFamily: headingFont,
    fontSize: 7,
    fontWeight: 600,
    color: textBlack,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  studentIdValue: {
    fontFamily: monoFont,
    fontSize: 11,
    fontWeight: 700,
    color: navy,
    marginBottom: 4,
  },
  studentIdHint: {
    fontFamily: bodyFont,
    fontSize: 8,
    color: textBlack,
    lineHeight: 1.35,
  },
  closing: {
    fontFamily: bodyFont,
    fontSize: 9,
    color: textBlack,
    marginTop: 2,
    marginBottom: 6,
  },
  signatoryName: {
    fontFamily: bodyFont,
    fontSize: 9,
    fontWeight: 700,
    color: textBlack,
    marginBottom: 1,
  },
  signatoryTitle: {
    fontFamily: bodyFont,
    fontSize: 9,
    color: textBlack,
    marginBottom: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: navy,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  footerText: {
    fontFamily: bodyFont,
    fontSize: 7.5,
    color: grayLight,
    flex: 1,
    textAlign: 'center',
  },
})

function formatGhsPdf(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0
  return `GHS ${safe.toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function PaymentRow({
  label,
  value,
  rowColor = textBlack,
}: {
  label: string
  value: string
  rowColor?: string
}) {
  return (
    <View style={styles.paymentRow}>
      <Text style={[styles.paymentRowLabel, { color: rowColor }]}>{label}</Text>
      <Text style={[styles.paymentRowValue, { color: rowColor }]}>{value}</Text>
    </View>
  )
}

export function AdmissionLetterDocument({
  data,
  showPresidentSignature = false,
}: {
  data: AdmissionLetterPdfData
  showPresidentSignature?: boolean
}) {
  const studentName = data.studentName?.trim() || 'Student'
  const courseLine = data.courseEnrollmentLine?.trim() || data.courseTitle || 'Programme'
  const website = 'revmultimedia.com'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BrandDots size={7} gap={3} />
            <View style={styles.headerBrandText}>
              <Text style={styles.schoolName}>Rev Multimedia</Text>
              <Text style={styles.schoolTagline}>Creative Education</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDocTitle}>Letter of Enrollment</Text>
            <Text style={styles.headerMeta}>{data.applicationReference}</Text>
            <Text style={styles.headerMeta}>{data.issuedDate}</Text>
          </View>
        </View>

        <View style={styles.accentRule} />

        <View style={styles.body}>
          <Text style={[styles.salutation, { color: textBlack }]}>Dear {studentName},</Text>

          <Text style={[styles.sectionTitle, { color: textBlack }]}>Letter of Enrollment</Text>

          <Text style={[styles.paragraph, { color: textBlack }]}>
            We are pleased to confirm your enrollment at Rev Multimedia for the {courseLine}.
            Following the successful review of your application and confirmation of your initial
            tuition payment, you have been officially enrolled in the programme.
          </Text>

          {data.intakeStartDate ? (
            <Text style={[styles.paragraph, { color: textBlack }]}>
              Your classes for {data.intakeName || 'your intake'} are scheduled to commence on{' '}
              {data.intakeStartDate}. Please plan to attend orientation and bring this letter with
              you if requested by the administration.
            </Text>
          ) : (
            <Text style={[styles.paragraph, { color: textBlack }]}>
              Your class schedule will be communicated through the student portal. Please bring
              this letter with you if requested by the administration.
            </Text>
          )}

          <View style={styles.paymentBox}>
            <Text style={[styles.paymentLabel, { color: textBlack }]}>Payment Summary</Text>
            <PaymentRow label="Total Course Fee" value={formatGhsPdf(data.totalCourseFeeGhs)} />
            <PaymentRow
              label="Amount Paid"
              value={formatGhsPdf(data.amountPaidGhs)}
              rowColor={greenPaid}
            />
            <PaymentRow
              label="Outstanding Balance"
              value={formatGhsPdf(data.outstandingBalanceGhs)}
              rowColor={outstandingRed}
            />
          </View>

          {data.permanentStudentId ? (
            <View style={styles.studentIdBox}>
              <Text style={[styles.studentIdLabel, { color: textBlack }]}>Your Student ID</Text>
              <Text style={[styles.studentIdValue, { color: navy }]}>{data.permanentStudentId}</Text>
              <Text style={[styles.studentIdHint, { color: textBlack }]}>
                Use this permanent student ID to log in to your student portal at {website}.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.paragraph, { color: textBlack }]}>
            Kindly note that all outstanding balances should be settled according to the
            school&apos;s payment schedule to maintain active enrollment status.
          </Text>

          <Text style={[styles.paragraph, { color: textBlack }]}>
            You may log in to your student portal at {website} to access invoices, learning
            resources, schedules, and course updates. Please keep this letter for your records.
          </Text>

          <Text style={[styles.paragraph, { color: textBlack }]}>
            We are excited to welcome you to Rev Multimedia and look forward to supporting your
            creative growth and professional journey.
          </Text>

          <Text style={[styles.closing, { color: textBlack }]}>Warm regards,</Text>

          {showPresidentSignature ? (
            <Image
              src={PRESIDENT_SIGNATURE_IMAGE_SRC}
              style={{ width: 120, marginBottom: 4, marginTop: 16 }}
            />
          ) : null}

          <Text style={[styles.signatoryName, { color: textBlack }]}>{data.signatoryName}</Text>
          <Text style={[styles.signatoryTitle, { color: textBlack }]}>{data.signatoryTitle}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={[styles.footerText, { textAlign: 'left', flex: 1.2 }]}>
            {data.academyEmail}
          </Text>
          <Text style={[styles.footerText, { flex: 0.3 }]}>|</Text>
          <Text style={[styles.footerText, { flex: 1 }]}>{website}</Text>
          <Text style={[styles.footerText, { flex: 0.3 }]}>|</Text>
          <Text style={[styles.footerText, { textAlign: 'right', flex: 1.2 }]}>
            {data.academyPhone}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
