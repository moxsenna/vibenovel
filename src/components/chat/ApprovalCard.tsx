import React from 'react'

interface ApprovalCardProps {
  category: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'edited'
  onApprove: () => void
  onEdit: () => void
  onReject: () => void
  disabled?: boolean
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  category,
  content,
  status,
  onApprove,
  onEdit,
  onReject,
  disabled = false
}) => {
  if (status === 'approved') {
    return (
      <div className="text-label-md text-primary font-bold flex items-center gap-1.5 py-1 animate-fade-in">
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
        Draf disetujui & disimpan ke Pustaka Lore!
      </div>
    )
  }

  if (status === 'edited') {
    return (
      <div className="text-label-md text-secondary font-bold flex items-center gap-1.5 py-1 animate-fade-in">
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          edit_square
        </span>
        Draf diedit & disimpan ke Pustaka Lore!
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="text-label-md text-on-surface-variant/50 flex items-center gap-1.5 py-1 animate-fade-in italic">
        <span className="material-symbols-outlined text-[16px]">
          block
        </span>
        Draf ditolak.
      </div>
    )
  }

  return (
    <div className="bg-surface-container-highest border border-secondary/30 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />

      {/* Category Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
          ads_click
        </span>
        <h3 className="text-label-lg text-secondary font-bold tracking-wide uppercase">
          Draf {category}
        </h3>
      </div>

      {/* Content String */}
      <p className="text-body-lg text-on-surface mb-6 leading-relaxed whitespace-pre-line">
        {content}
      </p>

      {/* Interactive Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onApprove}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-[#3B5A40] hover:bg-[#4A6E4F] active:scale-[0.98] text-[#E2F0E5] py-2.5 px-4 rounded-xl text-label-md transition-all shadow-sm flex items-center justify-center gap-2 border border-[#4A6E4F]/50 cursor-pointer font-bold disabled:opacity-50 disabled:cursor-wait disabled:active:scale-100"
        >
          <span className="material-symbols-outlined text-sm font-bold">
            {disabled ? 'hourglass_empty' : 'check'}
          </span>
          {disabled ? 'Memproses...' : 'Setuju!'}
        </button>

        <button
          onClick={onEdit}
          disabled={disabled}
          className="flex-1 min-w-[120px] bg-secondary-container hover:bg-secondary-container/85 active:scale-[0.98] text-on-secondary-container py-2.5 px-4 rounded-xl text-label-md transition-all shadow-sm flex items-center justify-center gap-2 border border-secondary/30 cursor-pointer font-bold disabled:opacity-50 disabled:cursor-wait disabled:active:scale-100"
        >
          <span className="material-symbols-outlined text-sm">edit</span>Edit Dulu
        </button>

        <button
          onClick={onReject}
          disabled={disabled}
          aria-label="Tolak"
          className="p-2.5 rounded-xl border border-surface-variant text-on-surface-variant hover:bg-surface-variant/30 active:scale-[0.95] transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>
    </div>
  )
}
