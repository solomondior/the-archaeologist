import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Archaeologist',
  description: 'digging through solana\'s memecoin graveyard.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistMono.className}>
      <body className="bg-[#0a0a0a] text-[#e8e8e8] min-h-screen">
        <nav className="border-b border-[#1a1a1a] px-6 py-3 flex gap-6 text-[10px] tracking-widest">
          <Link href="/" className="text-[#d97706] hover:text-[#e8e8e8] transition-colors">
            THE ARCHAEOLOGIST
          </Link>
          <span className="text-[#333]">·</span>
          <Link href="/digs" className="text-[#555] hover:text-[#888] transition-colors">
            ARCHIVE
          </Link>
          <Link href="/fragments" className="text-[#555] hover:text-[#888] transition-colors">
            FRAGMENTS
          </Link>
          <Link href="/nominations" className="text-[#555] hover:text-[#888] transition-colors">
            NOMINATE
          </Link>
          <Link href="/confess" className="text-[#555] hover:text-[#888] transition-colors">
            CONFESS
          </Link>
          <Link href="/fossils" className="text-[#555] hover:text-[#888] transition-colors">
            FOSSILS
          </Link>
        </nav>
        {children}
      </body>
    </html>
  )
}
