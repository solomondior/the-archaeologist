import { TwitterApi } from 'twitter-api-v2'
import type { DigRow, FragmentRow } from '@/lib/supabase/types'

function getClient(): TwitterApi | null {
  const { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET } =
    process.env
  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    return null
  }
  return new TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN,
    accessSecret: TWITTER_ACCESS_SECRET,
  })
}

function formatMcap(n: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

export function formatDigTweet(dig: DigRow): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const hook = dig.content.what_happened
    ? dig.content.what_happened.slice(0, 200) +
      (dig.content.what_happened.length > 200 ? '…' : '')
    : ''

  return [
    `DIG #${String(dig.dig_number).padStart(3, '0')}: ${dig.token_name}`,
    '',
    hook,
    '',
    `peak: ${formatMcap(dig.peak_market_cap)} | cause: ${(dig.cause_of_death ?? 'unknown').replace(/_/g, ' ')}`,
    '',
    `full dig → ${appUrl}/digs/${dig.dig_number}`,
    '',
    '#solana #RELIC',
  ]
    .join('\n')
    .slice(0, 280)
}

export function formatFragmentTweet(fragment: FragmentRow): string {
  const body = fragment.content.slice(0, 255)
  return `${body}\n\n#solana #RELIC`
}

export function formatBurnTweet(opts: {
  amount: number
  triggerType: string
  txHash: string
  currentSupply: number
}): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const isMock = opts.txHash.startsWith('mock_')
  const lines = [
    'BURN EVENT',
    '',
    `${opts.amount.toLocaleString()} RELIC destroyed.`,
    '',
    `trigger: ${opts.triggerType.replace(/_/g, ' ')}`,
    `supply remaining: ${opts.currentSupply.toLocaleString()}`,
    ...(isMock ? [] : [`tx: ${opts.txHash}`]),
    '',
    `witness → ${appUrl}/witness`,
    '#solana #RELIC',
  ]
  return lines.join('\n').slice(0, 280)
}

export async function postTweet(text: string): Promise<string | null> {
  const client = getClient()
  if (!client) return null
  const { data } = await client.v2.tweet(text)
  return data.id
}
