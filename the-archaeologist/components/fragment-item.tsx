import type { FragmentRow } from '@/lib/supabase/types'

interface FragmentItemProps {
  fragment: FragmentRow
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function FragmentItem({ fragment }: FragmentItemProps) {
  return (
    <div className="border-b border-[#1a1a1a] py-3 last:border-0">
      <p className="text-xs text-[#888] leading-relaxed">
        <span className="text-[#444] mr-2">›</span>
        {fragment.content}
      </p>
      <p className="text-[10px] text-[#444] mt-1">{formatDate(fragment.generated_at)}</p>
    </div>
  )
}
