/**
 * Batch 1 validation smoke test (settings allowlist + communications schemas).
 * Run: node scripts/test-validation-batch1.mjs
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Dynamic import won't work for TS without compilation — inline minimal checks via spawning tsc is heavy.
// This script documents expected behavior; run `pnpm exec tsx` if added later.

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

const labelsSrc = readFileSync(join(root, 'lib/settings/labels.ts'), 'utf8')
assert(labelsSrc.includes('application_fee_ghs'), 'labels defines payment keys')
assert(labelsSrc.includes('sentdm_api_key'), 'labels defines messaging keys')
assert(
  readFileSync(join(root, 'lib/settings/allowed-keys.ts'), 'utf8').includes('ALLOWED_SETTINGS_KEYS'),
  'allowed-keys module exists',
)

const settingsAction = readFileSync(join(root, 'actions/settings.ts'), 'utf8')
assert(settingsAction.includes('updateSettingsSchema'), 'settings action uses schema')
assert(settingsAction.includes("role !== 'superadmin'"), 'settings requires superadmin')

const commAction = readFileSync(join(root, 'actions/communications.ts'), 'utf8')
assert(commAction.includes('createCampaignInputSchema'), 'createCampaign uses schema')
assert(commAction.includes('sendDirectMessageInputSchema'), 'sendDirectMessage uses schema')

console.log('Batch 1 smoke checks passed (source wiring).')
console.log('Run `pnpm build` for full TypeScript verification.')
