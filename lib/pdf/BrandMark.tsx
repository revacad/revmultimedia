import { Text, View } from '@react-pdf/renderer'
import { pdfStyles } from '@/lib/pdf/styles'

/** Brand grid: pink, orange, teal, pink (soft) — matches favicon / LogoLoader */
const BRAND_DOTS = [
  { color: '#C74A86' },
  { color: '#F18F3B' },
  { color: '#2DBFB8' },
  { color: 'rgba(199, 74, 134, 0.7)' },
] as const

type BrandDotsProps = {
  size?: number
  gap?: number
  opacity?: number
}

export function BrandDots({ size = 10, gap = 5, opacity = 1 }: BrandDotsProps) {
  const dot = (index: number) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: BRAND_DOTS[index].color,
  })

  const row = { flexDirection: 'row' as const }
  const spacer = { marginRight: gap }
  const rowSpacer = { marginTop: gap }

  return (
    <View style={{ opacity }}>
      <View style={row}>
        <View style={[dot(0), spacer]} />
        <View style={dot(1)} />
      </View>
      <View style={[row, rowSpacer]}>
        <View style={[dot(2), spacer]} />
        <View style={dot(3)} />
      </View>
    </View>
  )
}

type PdfBrandHeaderProps = {
  documentTitle: string
  subtitle?: string
}

export function PdfBrandHeader({ documentTitle, subtitle }: PdfBrandHeaderProps) {
  return (
    <View style={pdfStyles.header}>
      <View style={pdfStyles.headerRow}>
        <View style={pdfStyles.headerLogoSpacing}>
          <BrandDots size={11} gap={5} />
        </View>
        <View style={pdfStyles.headerText}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={pdfStyles.brandRev}>Rev</Text>
            <Text style={pdfStyles.brandMultimedia}> Multimedia</Text>
          </View>
          <Text style={pdfStyles.title}>{documentTitle}</Text>
          {subtitle ? <Text style={pdfStyles.muted}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  )
}

/** Centered watermark behind page content (~5% opacity) */
export function PdfWatermark() {
  const blockSize = 120
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        top: '32%',
        left: '50%',
        marginLeft: -(blockSize / 2),
        width: blockSize,
        alignItems: 'center',
        opacity: 0.05,
      }}
    >
      <BrandDots size={28} gap={12} />
      <Text
        style={{
          marginTop: 14,
          fontSize: 22,
          fontWeight: 'bold',
          color: '#1A1A2E',
          textAlign: 'center',
        }}
      >
        Rev Multimedia
      </Text>
    </View>
  )
}
