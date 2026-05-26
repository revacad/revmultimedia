/**
 * Batch 3 validation smoke test (contact form + admin invite).
 * Run: node scripts/test-validation-batch3.mjs
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
  readFileSync(join(root, 'actions/contact.ts'), 'utf8').includes('submitContactFormSchema'),
  'contact action uses schema',
)
assert(
  readFileSync(join(root, 'actions/admin.ts'), 'utf8').includes('inviteAdminSchema'),
  'inviteAdmin uses schema',
)
assert(
  readFileSync(join(root, 'lib/validations/contact.ts'), 'utf8').includes('Message is too long'),
  'contact message length capped',
)
assert(
  readFileSync(join(root, 'lib/validations/admin.ts'), 'utf8').includes('superadmin'),
  'invite role enum includes superadmin',
)

console.log('Batch 3 smoke checks passed (source wiring).')
console.log('Run `pnpm exec tsc --noEmit` for full TypeScript verification.')
