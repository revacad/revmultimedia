export const SETTINGS_TABS = [
  {
    id: 'payments',
    title: 'Payments',
    sections: [
      {
        title: 'Application',
        keys: ['application_fee_ghs'] as const,
      },
      {
        title: 'MoMo',
        keys: [
          'momo_number_1',
          'momo_name_1',
          'momo_number_2',
          'momo_name_2',
        ] as const,
      },
      {
        title: 'Bank Transfer',
        keys: [
          'bank_name',
          'bank_account_number',
          'bank_account_name',
          'bank_branch',
          'bank_swift_code',
          'bank_iban',
        ] as const,
      },
    ],
  },
  {
    id: 'academy',
    title: 'Academy Info',
    sections: [{ keys: ['academy_email', 'academy_phone', 'academy_address'] as const }],
  },
  {
    id: 'messaging',
    title: 'SMS & Messaging',
    sections: [],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    sections: [{ keys: ['application_deadline_message'] as const }],
  },
  {
    id: 'security',
    title: 'Security',
    sections: [],
  },
] as const

/** @deprecated Use SETTINGS_TABS */
export const SETTINGS_SECTIONS = SETTINGS_TABS.flatMap((tab) =>
  tab.sections
    .filter((section) => section.keys.length > 0)
    .map((section) => ({
      id: tab.id,
      title: ('title' in section && section.title) || tab.title,
      keys: section.keys,
    })),
)

export const SETTINGS_LABELS: Record<string, string> = {
  application_fee_ghs: 'Application Fee (GHS)',
  application_deadline_message: 'Deadline Banner Message',
  momo_number_1: 'Primary MoMo Number',
  momo_name_1: 'Primary MoMo Account Name',
  momo_number_2: 'Secondary MoMo Number (optional)',
  momo_name_2: 'Secondary MoMo Account Name (optional)',
  bank_name: 'Bank Name',
  bank_account_number: 'Account Number',
  bank_account_name: 'Account Name',
  bank_branch: 'Branch',
  bank_swift_code: 'SWIFT / BIC Code',
  bank_iban: 'IBAN',
  academy_email: 'Academy Email',
  academy_phone: 'Academy Phone',
  academy_address: 'Academy Address',
}

export const SETTINGS_HELPERS: Record<string, string> = {
  application_deadline_message:
    'Shown on the home page. Leave blank to hide.',
}

export const MESSAGING_SETTING_KEYS = [
  'sms_provider',
  'sentdm_api_key',
  'sentdm_sender_id',
  'fishafrica_api_key',
  'fishafrica_sender_id',
] as const
