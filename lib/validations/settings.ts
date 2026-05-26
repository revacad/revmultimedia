import { z } from 'zod'
import { ALLOWED_SETTINGS_KEYS, SETTINGS_VALUE_MAX_LENGTH } from '@/lib/settings/allowed-keys'

const valueSchema = z.string().max(SETTINGS_VALUE_MAX_LENGTH)

function rejectUnknownKeys(
  keys: string[],
  ctx: z.RefinementCtx,
  pathPrefix: (string | number)[] = [],
) {
  for (const key of keys) {
    if (!ALLOWED_SETTINGS_KEYS.has(key)) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown settings key: ${key}`,
        path: [...pathPrefix, key],
      })
    }
  }
}

const updatesRecordSchema = z
  .record(z.string(), valueSchema)
  .superRefine((obj, ctx) => {
    rejectUnknownKeys(Object.keys(obj), ctx)
  })

const updatesArraySchema = z
  .array(
    z.object({
      key: z.string().min(1),
      value: valueSchema,
    }),
  )
  .superRefine((rows, ctx) => {
    rows.forEach((row, index) => {
      if (!ALLOWED_SETTINGS_KEYS.has(row.key)) {
        ctx.addIssue({
          code: 'custom',
          message: `Unknown settings key: ${row.key}`,
          path: [index, 'key'],
        })
      }
    })
  })

export const updateSettingsSchema = z.union([updatesRecordSchema, updatesArraySchema])
