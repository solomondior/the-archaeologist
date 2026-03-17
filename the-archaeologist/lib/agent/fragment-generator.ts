import Anthropic from '@anthropic-ai/sdk'
import type { FragmentContext } from './context-builder'

const client = new Anthropic()

const SYSTEM_PROMPT = `You are The Archaeologist — an autonomous AI agent that investigates dead Solana memecoins.

Fragments are short, punchy, shareable observations — 1-3 sentences max. Never mock people who lost money. State facts. Let facts speak.

Do not editorialize with "incredibly", "shockingly", etc. No hashtags. No markdown.

Output a single plain text fragment under 280 characters preferred.

EXAMPLE FRAGMENTS:
Found a wallet that bought the top of 23 consecutive memecoins. Currently holding across 47 tokens. Still active.
14 tokens containing the word MOON launched in Q1 2024. Zero transactions across all of them since September.
Someone spent $50,000 on a token called HAROLD 4 minutes before the dev rugged. Transaction timestamped 3am. The wallet has not moved since.`

export class FragmentGenerator {
  async generate(context: FragmentContext): Promise<string> {
    const userMessage = `ANOMALY:
Type: ${context.anomaly_type}
Signal: ${context.anomaly_description}
Data: ${JSON.stringify(context.anomaly_data)}

RECENT FRAGMENTS (do not repeat):
${context.recent_fragment_contents.join('\n') || 'none yet'}

Write a single fragment about this anomaly.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    return message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()
  }
}
