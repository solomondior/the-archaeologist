import type { DataProvider } from './types'
import { MockDataProvider } from './mock'

let _provider: DataProvider | null = null

export function getDataProvider(): DataProvider {
  if (_provider) return _provider
  const mode = process.env.DATA_PROVIDER ?? 'mock'
  if (mode === 'mock') {
    _provider = new MockDataProvider()
    return _provider
  }
  throw new Error(`DATA_PROVIDER="${mode}" is not implemented yet. Use DATA_PROVIDER=mock.`)
}
