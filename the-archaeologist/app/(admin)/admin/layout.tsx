import Link from 'next/link'

const NAV = [
  { href: '/admin', label: 'DASHBOARD' },
  { href: '/admin/queue', label: 'QUEUE' },
  { href: '/admin/nominations', label: 'NOMINATIONS' },
  { href: '/admin/burns', label: 'BURNS' },
  { href: '/admin/logs', label: 'LOGS' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-40 border-r border-[#1a1a1a] p-6 space-y-3 shrink-0">
        <div className="text-[10px] text-[#d97706] tracking-widest mb-4">ADMIN</div>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="block text-[10px] text-[#555] hover:text-[#888] tracking-widest transition-colors"
          >
            {n.label}
          </Link>
        ))}
        <form action="/api/admin/logout" method="POST" className="pt-4">
          <button
            type="submit"
            className="text-[10px] text-[#333] hover:text-[#555] transition-colors"
          >
            LOGOUT
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8 min-w-0">{children}</main>
    </div>
  )
}
