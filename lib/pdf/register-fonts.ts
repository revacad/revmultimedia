import fs from 'fs'
import path from 'path'
import { Font } from '@react-pdf/renderer'

let registered = false

function registerFamilyIfFilesExist(
  family: string,
  fonts: { src: string; fontWeight: number }[],
): void {
  const existing = fonts.filter((f) => fs.existsSync(f.src))
  if (existing.length === 0) return
  Font.register({
    family,
    fonts: existing,
  })
}

export function registerPdfFonts(): void {
  if (registered) return
  registered = true

  const fontsDir = path.join(process.cwd(), 'public', 'fonts')

  try {
    registerFamilyIfFilesExist('Clash Display', [
      { src: path.join(fontsDir, 'ClashDisplay-Regular.otf'), fontWeight: 400 },
      { src: path.join(fontsDir, 'ClashDisplay-Medium.otf'), fontWeight: 500 },
      { src: path.join(fontsDir, 'ClashDisplay-Semibold.otf'), fontWeight: 600 },
      { src: path.join(fontsDir, 'ClashDisplay-Bold.otf'), fontWeight: 700 },
    ])

    // DM Sans: use local .ttf (woff2 in public/fonts is web-only; gstatic URLs rot).
    registerFamilyIfFilesExist('DM Sans', [
      { src: path.join(fontsDir, 'DMSans-Regular.ttf'), fontWeight: 400 },
      { src: path.join(fontsDir, 'DMSans-Medium.ttf'), fontWeight: 500 },
      { src: path.join(fontsDir, 'DMSans-SemiBold.ttf'), fontWeight: 600 },
      { src: path.join(fontsDir, 'DMSans-Bold.ttf'), fontWeight: 700 },
    ])

    const jetbrains = path.join(fontsDir, 'JetBrainsMono-VariableFont_wght.ttf')
    if (fs.existsSync(jetbrains)) {
      Font.register({
        family: 'JetBrains Mono',
        fonts: [
          { src: jetbrains, fontWeight: 400 },
          { src: jetbrains, fontWeight: 700 },
        ],
      })
    }
  } catch (error) {
    console.warn('[pdf] custom font registration skipped', error)
  }
}
