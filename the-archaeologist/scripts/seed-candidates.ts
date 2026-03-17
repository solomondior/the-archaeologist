import { createServerClient } from '../lib/supabase/server'
import { getDataProvider } from '../lib/data-provider'
import { scoreCandidate } from '../lib/scoring/candidate-scorer'

async function seed() {
  const supabase = createServerClient()
  const provider = getDataProvider()

  console.log('Loading fixture token candidates...')
  const candidates = await provider.getDeadTokenCandidates(0, 0)

  for (const candidate of candidates) {
    const { score, breakdown } = scoreCandidate(candidate)

    const { error } = await supabase.from('dig_candidates').upsert(
      {
        token_address: candidate.address,
        token_name: candidate.name,
        token_name_raw: candidate.name_raw,
        score,
        score_breakdown: breakdown,
        status: 'candidate',
      },
      { onConflict: 'token_address' }
    )

    if (error) {
      console.error(`Failed to upsert ${candidate.name}:`, error.message)
    } else {
      console.log(`Seeded ${candidate.name} (score: ${score.toFixed(1)})`)
    }
  }

  console.log(`Done. Seeded ${candidates.length} candidates.`)
}

seed().catch(console.error)
