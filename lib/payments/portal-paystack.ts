/** Application fees use Paystack whenever the global Paystack setting is on. */
export function isApplicationFeePaystackActive(
  paystackEnabled: boolean,
  invoiceType: string,
): boolean {
  return paystackEnabled && invoiceType === 'application_fee'
}

/** Tuition and other invoice types respect payment type allow_paystack. */
export function isInvoicePaystackActive(
  paystackEnabled: boolean,
  invoiceType: string,
  allowPaystackOnPaymentType: boolean,
): boolean {
  if (invoiceType === 'application_fee') {
    return paystackEnabled
  }
  return paystackEnabled && allowPaystackOnPaymentType
}
