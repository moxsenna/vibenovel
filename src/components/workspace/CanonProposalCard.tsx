import React from 'react'
import type { CanonProposal } from '../../types/project'

interface CanonProposalCardProps {
  proposal: CanonProposal
  disabled?: boolean
  onApprove: (proposalId: string) => void | Promise<void>
  onReject: (proposalId: string) => void
}

function payloadString(proposal: CanonProposal, key: string, fallback = ''): string {
  const value = proposal.payload[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export const CanonProposalCard: React.FC<CanonProposalCardProps> = ({
  proposal,
  disabled,
  onApprove,
  onReject
}) => {
  const name = payloadString(proposal, 'name', 'Canon baru')
  const description = payloadString(proposal, 'description', proposal.reason)
  const typeLabel = proposal.proposal_type === 'item' ? 'Item' : 'Karakter'
  const evidence = proposal.evidence.filter(Boolean).slice(0, 2)

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="material-symbols-outlined text-[18px] text-amber-400">rule</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Approval Canon Bab {proposal.chapter_number}
            </span>
          </div>
          <h4 className="text-body-md font-bold text-on-surface truncate">
            {typeLabel}: {name}
          </h4>
          <p className="text-body-sm text-on-surface-variant leading-relaxed mt-1">
            {description}
          </p>
        </div>
        <span className="shrink-0 px-2 py-1 rounded-lg bg-surface-container/70 border border-outline-variant/20 text-[10px] font-bold text-on-surface-variant uppercase">
          {proposal.classification.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="rounded-xl bg-surface-container-low/70 border border-outline-variant/15 p-3">
        <p className="text-[11px] font-semibold text-on-surface-variant mb-1">
          Alasan validator
        </p>
        <p className="text-body-sm text-on-surface-variant leading-relaxed">
          {proposal.reason}
        </p>
      </div>

      {evidence.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
            Bukti dari draft AI
          </p>
          {evidence.map((item, index) => (
            <p
              key={`${proposal.id}-evidence-${index}`}
              className="text-[11px] text-on-surface-variant/80 leading-relaxed line-clamp-2"
            >
              {item}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onApprove(proposal.id)}
          disabled={disabled}
          className="h-9 px-4 rounded-lg bg-primary text-on-primary font-semibold text-label-md cursor-pointer hover-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Setujui & Tambahkan
        </button>
        <button
          onClick={() => onReject(proposal.id)}
          disabled={disabled}
          className="h-9 px-4 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface-variant font-semibold text-label-md cursor-pointer hover:bg-surface-container-high disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">block</span>
          Tolak Draft Bab Ini
        </button>
      </div>
    </div>
  )
}
