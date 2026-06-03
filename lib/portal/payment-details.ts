export function hasManualPaymentDetails(settings: Record<string, string>): boolean {
  return Boolean(settings.momo_number_1 || settings.bank_account_number)
}
