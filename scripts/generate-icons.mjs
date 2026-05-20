import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]

const svgSource = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1A1A2E"/>
  <circle cx="168" cy="168" r="72" fill="#C74A86"/>
  <circle cx="344" cy="168" r="72" fill="#F18F3B"/>
  <circle cx="168" cy="344" r="72" fill="#2DBFB8"/>
  <circle cx="344" cy="344" r="72" fill="#C74A86" opacity="0.7"/>
</svg>
`

const svgBuffer = Buffer.from(svgSource)

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`)
  console.log(`Generated icon-${size}.png`)
}

console.log('All icons generated!')
