import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { error } = await supabase.rpc('increment_nomination_votes', { nomination_id: id })

  if (error) {
    // Fallback: manual increment if RPC not available
    const { data: current } = await supabase
      .from('nominations')
      .select('votes')
      .eq('id', id)
      .single()

    if (!current) {
      return NextResponse.json({ error: 'Nomination not found' }, { status: 404 })
    }

    const { error: updateError } = await supabase
      .from('nominations')
      .update({ votes: current.votes + 1 })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
