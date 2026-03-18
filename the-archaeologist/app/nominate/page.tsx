import { NominationForm } from '@/components/nomination-form'
import Link from 'next/link'

export default function NominatePage() {
  return (
    <main className="max-w-xl mx-auto px-6 py-12">
      <header className="mb-8">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-1">NOMINATE A TOKEN</div>
        <p className="text-xs text-[#888]">
          know a dead token that deserves to be remembered?
        </p>
      </header>

      <NominationForm />

      <div className="border-t border-[#1a1a1a] mt-8 pt-6 space-y-2">
        <p className="text-[10px] text-[#333]">
          nominations are reviewed by the candidate scoring algorithm before being added to the dig queue.
        </p>
        <Link href="/nominations" className="block text-[10px] text-[#555] hover:text-[#888] transition-colors">
          → view all nominations
        </Link>
      </div>
    </main>
  )
}
