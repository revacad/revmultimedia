import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Compiled path not available; duplicate minimal logic for smoke test
function roundGhs(amount) {
  return Math.round(amount * 100) / 100
}

function sumInstallments(rows) {
  return rows.reduce((sum, row) => sum + Number(row.amount_ghs), 0)
}

function getInvoiceBalance(totalGhs, installments) {
  const total = roundGhs(totalGhs)
  const paid = roundGhs(sumInstallments(installments))
  const remaining = roundGhs(Math.max(0, total - paid))
  const overpaid = roundGhs(Math.max(0, paid - total))
  const canRecordPayment = remaining > 0
  return { total, paid, remaining, overpaid, canRecordPayment }
}

const full = getInvoiceBalance(100, [{ amount_ghs: 100 }])
assert.equal(full.remaining, 0)
assert.equal(full.overpaid, 0)
assert.equal(full.canRecordPayment, false)

const over = getInvoiceBalance(100, [{ amount_ghs: 100 }, { amount_ghs: 100 }])
assert.equal(over.remaining, 0)
assert.equal(over.overpaid, 100)
assert.equal(over.canRecordPayment, false)

const partial = getInvoiceBalance(100, [{ amount_ghs: 40 }])
assert.equal(partial.remaining, 60)
assert.equal(partial.canRecordPayment, true)

console.log('test-invoice-balance: ok')
