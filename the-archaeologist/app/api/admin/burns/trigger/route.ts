import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { recordBurn, type BurnTriggerType } from '@/lib/burns/engine'

const schema = z.object({
  trigger_type: z.enum(['rug_confirmed', 'fossil_found', 'nomination', 'series', 'milestone_100']),
  trigger_reference: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const supabase = createServerClient()
  const result = await recordBurn(supabase, {
    triggerType: parsed.data.trigger_type as BurnTriggerType,
    triggerReference: parsed.data.trigger_reference,
  })

  if (!result) {
    return NextResponse.json({ error: 'Burn amount was zero' }, { status: 400 })
  }

  return NextResponse.json(result, { status: 201 })
}
