import type { DataProvider, GeneratedDig } from '../data-provider/types'

export interface ValidationResult {
  passed: boolean
  failures: string[]
}

export class ValidationLayer {
  constructor(private provider: DataProvider) {}

  async verify(dig: GeneratedDig): Promise<ValidationResult> {
    const failures: string[] = []

    for (const evidence of dig.on_chain_evidence) {
      if (evidence.hash) {
        const valid = await this.provider.verifyTransactionHash(evidence.hash)
        if (!valid) failures.push(`hash:${evidence.hash}`)
      }
      if (evidence.address) {
        const valid = await this.provider.verifyWalletAddress(evidence.address)
        if (!valid) failures.push(`address:${evidence.address}`)
      }
    }

    return { passed: failures.length === 0, failures }
  }
}
