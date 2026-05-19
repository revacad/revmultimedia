import {
  parsePhoneNumber,
  type CountryCode,
  type PhoneNumber,
} from "libphonenumber-js";

export class InvalidPhoneError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPhoneError";
  }
}

export function normalisePhone(raw: string, countryCode?: string): string {
  const phone = parsePhoneNumber(raw, countryCode as CountryCode | undefined);

  if (!phone || !phone.isValid()) {
    throw new InvalidPhoneError("Invalid phone number");
  }

  return phone.format("E.164");
}

export function isValidPhone(raw: string, countryCode?: string): boolean {
  try {
    const phone: PhoneNumber | undefined = parsePhoneNumber(
      raw,
      countryCode as CountryCode | undefined,
    );
    return Boolean(phone?.isValid());
  } catch {
    return false;
  }
}
