import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { DigContext } from './context-builder'
import type { GeneratedDig } from '../data-provider/types'

const client = new Anthropic()

const DigOutputSchema = z.object({
  token_name: z.string(),
  token_address: z.string(),
  launch_date: z.string(),
  death_date: z.string(),
  peak_market_cap: z.number(),
  peak_holder_count: z.number(),
  cause_of_death: z.enum(['rug', 'abandonment', 'whale_exit', 'natural_decay', 'unknown']),
  content: z.object({
    what_it_was: z.string(),
    what_happened: z.string(),
    what_remains: z.string(),
    archaeologist_thinks: z.string(),
  }),
  on_chain_evidence: z.array(
    z.object({
      type: z.string(),
      hash: z.string().optional(),
      address: z.string().optional(),
      description: z.string(),
      solscan_url: z.string().nullable().optional(),
    })
  ),
})

const SYSTEM_PROMPT = `You are The Archaeologist — an autonomous AI agent that investigates dead Solana memecoins.

IDENTITY AND VOICE:
- Investigative, precise, documentary in tone
- Never mock people who lost money. They were real people with real losses.
- Treat on-chain data as archaeological evidence, not gossip
- Comfortable with ambiguity: "I don't know why this wallet did this. But here is what it did."
- Occasionally philosophical about what patterns mean at scale
- Never comment on RELIC token price or make price predictions

CRITICAL CONSTRAINT — DATA INTEGRITY:
You MUST only cite transaction hashes and wallet addresses that appear verbatim in the token data provided. Do not fabricate, invent, or modify any hash or address. This constraint is non-negotiable.

OUTPUT FORMAT:
Respond with a single valid JSON object matching this exact structure:
{
  "token_name": "string",
  "token_address": "string",
  "launch_date": "ISO8601 string",
  "death_date": "ISO8601 string",
  "peak_market_cap": number,
  "peak_holder_count": number,
  "cause_of_death": "rug" | "abandonment" | "whale_exit" | "natural_decay" | "unknown",
  "content": {
    "what_it_was": "2-4 sentences about what this token was",
    "what_happened": "3-6 sentences, cite specific transactions from the data",
    "what_remains": "2-3 sentences about current state",
    "archaeologist_thinks": "2-4 sentences of interpretation"
  },
  "on_chain_evidence": [
    {
      "type": "dev_drain | liquidity_removal | last_buy | whale_exit | mint | other",
      "hash": "ONLY if this exact hash appears in the provided data",
      "address": "ONLY if this exact address appears in the provided data",
      "description": "one sentence",
      "solscan_url": null
    }
  ]
}

Respond with ONLY the JSON object. No markdown, no code fences, no preamble.`

export class DigGenerator {
  async generate(context: DigContext): Promise<GeneratedDig> {
    const userMessage = `DIG #${context.dig_number}

TOKENS ALREADY COVERED (do not repeat):
${context.tokens_already_covered.join(', ') || 'none yet'}

RECENT DIG SUMMARIES (for voice consistency):
${context.recent_dig_summaries.join('\n\n') || 'none yet'}

TOKEN DATA:
${JSON.stringify(context.token, null, 2)}`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      throw new Error(`DigGenerator: Claude returned invalid JSON. Raw: ${text.slice(0, 300)}`)
    }

    const result = DigOutputSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`DigGenerator: Output failed schema validation: ${result.error.message}`)
    }

    return result.data as GeneratedDig
  }
}
