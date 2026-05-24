import React from 'react'
import { ApprovalCard } from './ApprovalCard'

interface AiMessageBubbleProps {
  message: {
    id: string
    content: string
    draftData?: {
      status: 'pending' | 'approved' | 'rejected' | 'edited'
      type: string
      data: Record<string, unknown>
    } | null
  }
  onApprove: () => void
  onEdit: () => void
  onReject: () => void
  actionsDisabled?: boolean
}

export const AiMessageBubble: React.FC<AiMessageBubbleProps> = ({
  message,
  onApprove,
  onEdit,
  onReject,
  actionsDisabled = false
}) => {
  const { content, draftData } = message

  // Get draft data details
  const getDraftContentString = () => {
    if (!draftData || !draftData.data) return ''
    const data = draftData.data

    const str = (k: string): string => {
      const v = data[k]
      return typeof v === 'string' ? v : ''
    }
    const arr = (k: string): string[] => {
      const v = data[k]
      return Array.isArray(v) ? (v as string[]) : []
    }

    if (draftData.type === 'character_state') {
      const knowledge = arr('knowledge_state')
      const secrets = arr('secrets')
      const inventory = arr('inventory')
      const parts = [
        `Karakter: ${str('character_name')} (Bab ${str('chapter_number') || 'Sekarang'})`,
        str('location') ? `📍 Lokasi: ${str('location')}` : null,
        str('physical_condition') ? `💊 Kondisi: ${str('physical_condition')}` : null,
        str('emotional_state') ? `🎭 Emosi: ${str('emotional_state')}` : null,
        str('active_goal') ? `🎯 Tujuan: ${str('active_goal')}` : null,
        str('last_action') ? `⚡ Aksi Terakhir: ${str('last_action')}` : null,
        knowledge.length ? `🧠 Tahu: ${knowledge.join(', ')}` : null,
        secrets.length ? `🤫 Rahasia: ${secrets.join(', ')}` : null,
        inventory.length ? `🎒 Inventaris: ${inventory.join(', ')}` : null
      ]
      return parts.filter(Boolean).join('\n')
    }
    if (str('name')) {
      return `"${str('name')}" — ${str('description')}`
    }
    if (str('target_ending')) {
      return `Target Ending: "${str('target_ending')}"`
    }
    return JSON.stringify(data)
  }

  return (
    <div className="flex items-start gap-4 max-w-[85%] animate-fade-in group">
      {/* AI Avatar with premium HSL glow */}
      <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-on-primary shadow-[0_0_12px_rgba(232,160,191,0.3)] flex-shrink-0 hover:scale-105 transition-transform duration-300">
        <span className="material-symbols-outlined text-[20px] animate-pulse-slow">auto_awesome</span>
      </div>

      <div className="space-y-3 flex-1">
        {/* Chat Bubble with Malam Kreatif HSL/Radial Gradient */}
        <div
          className="p-4 rounded-2xl rounded-tl-sm text-body-md leading-relaxed border border-surface-variant/30 text-on-surface shadow-sm relative overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 0% 0%, var(--color-primary-container, rgba(232, 160, 191, 0.08)) 0%, var(--color-surface-container-high, #1F1B1D) 100%)'
          }}
        >
          {/* Subtle radial sheen */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none" />
          
          <div className="relative z-10 whitespace-pre-wrap">{content}</div>
        </div>

        {/* Render Approval Card if there's active draftData */}
        {draftData && (
          <div className="mt-2">
            <ApprovalCard
              category={draftData.type}
              content={getDraftContentString()}
              status={draftData.status}
              onApprove={onApprove}
              onEdit={onEdit}
              onReject={onReject}
              disabled={actionsDisabled}
            />
          </div>
        )}
      </div>
    </div>
  )
}
