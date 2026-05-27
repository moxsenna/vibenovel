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
    const records = (k: string): Record<string, unknown>[] => {
      const v = data[k]
      return Array.isArray(v)
        ? v.filter((item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null
          )
        : []
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
    if (draftData.type === 'story_contract') {
      const parts = [
        str('core_promise') ? `✨ Premis Utama:\n${str('core_promise')}` : null,
        str('reader_promise') ? `\n💖 Janji Pembaca:\n${str('reader_promise')}` : null,
      ]

      if (data.opening_contract) {
        const oc = data.opening_contract as Record<string, unknown>
        parts.push(`\n🎬 Kondisi Pembuka:`)
        if (oc.opening_timeline) parts.push(`- Timeline: ${oc.opening_timeline}`)
        if (oc.opening_relationship_state) parts.push(`- Status Relasi: ${oc.opening_relationship_state}`)
        if (oc.must_start_with) parts.push(`- Dimulai Dengan: ${oc.must_start_with}`)
      }

      const tone = data.tone_contract as Record<string, unknown>
      if (tone && tone.description) {
        parts.push(`\n🎭 Nada & Suasana:\n${tone.description}`)
      }

      const arcs = records('arc_order')
      if (arcs && arcs.length > 0) {
        parts.push(`\n📈 Babak Cerita (Arcs):`)
        arcs.forEach((arc) => {
          const label = typeof arc.label === 'string' ? arc.label : ''
          const range = Array.isArray(arc.chapter_range) ? arc.chapter_range : []
          if (label && range.length >= 2) {
            parts.push(`- Bab ${String(range[0])}-${String(range[1])}: ${label}`)
          }
        })
      }

      return parts.filter(Boolean).join('\n')
    }
    if (draftData.type.toLowerCase() === 'mystery') {
      const parts = [
        str('central_question') ? `❓ Pertanyaan Utama:\n${str('central_question')}` : null,
        str('answer') ? `\n💡 Jawaban/Rahasia:\n${str('answer')}` : null,
        data.revealed_at_chapter ? `\n📖 Diungkap pada Bab: ${data.revealed_at_chapter}` : null,
        str('opens_next_question') ? `\n🔗 Pertanyaan Selanjutnya:\n${str('opens_next_question')}` : null,
      ]

      const breadcrumbs = arr('breadcrumbs')
      if (breadcrumbs && breadcrumbs.length > 0) {
        parts.push(`\n🐾 Petunjuk (Breadcrumbs):\n${breadcrumbs.map((b, i) => `${i + 1}. ${b}`).join('\n')}`)
      }

      return parts.filter(Boolean).join('\n')
    }

    const nameStr = str('name') || str('item_name') || str('character_name') || str('rule_name')
    if (nameStr) {
      const parts = [`"${nameStr}" — ${str('description')}`]
      if (str('significance')) parts.push(`\n📌 Signifikansi: ${str('significance')}`)
      if (str('category') && draftData.type !== 'character') parts.push(`\n🏷️ Kategori: ${str('category')}`)
      return parts.join('')
    }
    if (str('target_ending')) {
      return `Target Ending: "${str('target_ending')}"`
    }
    return JSON.stringify(data, null, 2)
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
