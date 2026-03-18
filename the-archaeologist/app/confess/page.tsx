import { ConfessionForm } from '@/components/confession-form'

export default function ConfessPage() {
  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">CONFESSION BOOTH</div>
        <p className="text-xs text-[#888]">anonymous. no wallets. no judgment.</p>
      </header>

      <div className="border-t border-[#1a1a1a] pt-6 mb-8 space-y-3">
        <p className="text-xs text-[#555] leading-relaxed">
          everyone has a story. a token they believed in, a bag they held too long,
          a dev they trusted. confessions are kept anonymous and may surface in future digs
          as testimony from the graveyard.
        </p>
      </div>

      <ConfessionForm />

      <div className="border-t border-[#1a1a1a] mt-8 pt-6">
        <p className="text-[10px] text-[#333] italic">
          your confession is not linked to any wallet or identity.
        </p>
      </div>
    </main>
  )
}
