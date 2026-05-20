import { Client } from '@upstash/qstash'
import { withRetry } from '@/lib/retry'

export function getQStashClient(): Client | null {
  const token = process.env.QSTASH_TOKEN
  if (!token) return null
  return new Client({ token })
}

export async function publishJSONWithRetry(
  client: Client,
  params: Parameters<Client['publishJSON']>[0],
): Promise<Awaited<ReturnType<Client['publishJSON']>>> {
  return withRetry(() => client.publishJSON(params), {
    maxRetries: 3,
    baseDelayMs: 1000,
  })
}
