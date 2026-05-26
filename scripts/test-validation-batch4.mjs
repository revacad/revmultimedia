/**
 * Batch 4 validation smoke test (confirm payment + portal password reset).
 * Run: node scripts/test-validation-batch4.mjs
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
  readFileSync(join(root, 'actions/payment.ts'), 'utf8').includes('confirmPaymentSchema'),
  'confirmPayment uses schema',
)
assert(
  readFileSync(join(root, 'actions/auth.ts'), 'utf8').includes('passwordResetRequestSchema'),
  'requestPasswordReset uses schema',
)
assert(
  readFileSync(join(root, 'actions/auth.ts'), 'utf8').includes('portalPasswordResetConfirmSchema'),
  'confirmPasswordReset uses schema',
)
assert(
  readFileSync(join(root, 'lib/validations/auth.ts'), 'utf8').includes('APPLICATION_REF_RE'),
  'portal identifier patterns defined',
)

console.log('Batch 4 smoke checks passed (source wiring).')
console.log('Run `pnpm exec tsc --noEmit` for full TypeScript verification.')
