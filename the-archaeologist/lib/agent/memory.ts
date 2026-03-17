import { createServerClient } from '../supabase/server'
import type { AgentMemoryRow, DigRow } from '../supabase/types'

type SupabaseServer = ReturnType<typeof createServerClient>

export class MemoryManager {
  constructor(private supabase: SupabaseServer) {}

  async getRecentMemory(limit = 10): Promise<AgentMemoryRow[]> {
    const { data, error } = await this.supabase
      .from('agent_memory')
      .select('*')
      .order('cycle_number', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`MemoryManager.getRecentMemory failed: ${error.message}`)
    return (data ?? []) as AgentMemoryRow[]
  }

  async getNextCycleNumber(): Promise<number> {
    const { data, error } = await this.supabase
      .from('agent_memory')
      .select('cycle_number')
      .order('cycle_number', { ascending: false })
      .limit(1)

    if (error) throw new Error(`MemoryManager.getNextCycleNumber failed: ${error.message}`)
    return data && data.length > 0 ? (data[0].cycle_number as number) + 1 : 1
  }

  async recordSuccess(params: {
    cycleNumber: number
    cycleType: 'dig' | 'fragment'
    tokensCovered: string[]
    dig?: DigRow
  }): Promise<void> {
    const content = params.dig?.content as { what_remains?: string } | undefined
    const summary = params.dig
      ? `DIG #${params.dig.dig_number}: ${params.dig.token_name} — ${params.dig.cause_of_death}. ${content?.what_remains ?? ''}`
      : `Fragment cycle ${params.cycleNumber} completed.`

    const { error } = await this.supabase.from('agent_memory').insert({
      cycle_number: params.cycleNumber,
      cycle_type: params.cycleType,
      tokens_covered: params.tokensCovered,
      memory_summary: summary,
      status: 'completed',
    })

    if (error) throw new Error(`MemoryManager.recordSuccess failed: ${error.message}`)
  }

  async recordFailure(params: {
    cycleNumber: number
    cycleType: 'dig' | 'fragment'
    errorMessage: string
  }): Promise<void> {
    await this.supabase.from('agent_memory').insert({
      cycle_number: params.cycleNumber,
      cycle_type: params.cycleType,
      tokens_covered: [],
      status: 'failed',
      error_message: params.errorMessage,
    })
  }
}
