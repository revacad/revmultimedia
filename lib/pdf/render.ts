import { renderToBuffer } from '@react-pdf/renderer'
import type { ReactElement } from 'react'

export async function renderPdfToBuffer(element: ReactElement): Promise<Buffer> {
  // @react-pdf/renderer expects a Document element, but our call sites all provide one.
  const buf = await renderToBuffer(element as unknown as Parameters<typeof renderToBuffer>[0])
  return Buffer.from(buf)
}
