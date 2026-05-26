/**
 * Batch 2 validation smoke test (promo + tuition invoice schemas).
 * Run: node scripts/test-validation-batch2.mjs
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg)
    process.exit(1)
  }
}

assert(
  readFileSync(join(root, 'actions/promo.ts'), 'utf8').includes('createPromoCodeSchema'),
  'promo action uses createPromoCodeSchema',
)
assert(
  readFileSync(join(root, 'actions/invoice.ts'), 'utf8').includes('generateTuitionInvoiceSchema'),
  'invoice action uses generateTuitionInvoiceSchema',
)
assert(
  readFileSync(join(root, 'lib/validations/promo.ts'), 'utf8').includes('percentage'),
  'promo schema validates percentage cap',
)
assert(
  readFileSync(join(root, 'lib/validations/invoice.ts'), 'utf8').includes('generateTuitionInvoiceSchema'),
  'tuition invoice schema defined',
)

console.log('Batch 2 smoke checks passed (source wiring).')
console.log('Run `pnpm exec tsc --noEmit` for full TypeScript verification.')
