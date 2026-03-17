import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: 'The Archaeologist',
  description: 'digging through solana\'s memecoin graveyard.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistMono.className}>
      <body className="bg-[#0a0a0a] text-[#e8e8e8] min-h-screen">
        {children}
      </body>
    </html>
  )
}
