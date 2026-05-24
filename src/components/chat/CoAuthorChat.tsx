import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/useChatStore'
import type { ChatMessage } from '../../store/useChatStore'
import { useProjectStore } from '../../store/useProjectStore'
import { AiMessageBubble } from './AiMessageBubble'
import { EditDraftModal } from '../modals/EditDraftModal'

interface CoAuthorChatProps {
  projectId: string
}

export const CoAuthorChat: React.FC<CoAuthorChatProps> = ({ projectId }) => {
  const [chatInput, setChatInput] = useState('')
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Local state for EditDraftModal
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)

  // Chat Store hooks
  const chatMessages = useChatStore((s) => s.getProjectMessages(projectId))
  const sendMessage = useChatStore((s) => s.sendMessage)
  const updateMessageDraftStatus = useChatStore((s) => s.updateMessageDraftStatus)
  const chatLoading = useChatStore((s) => s.loading)
  const regenerateResponse = useChatStore((s) => s.regenerateResponse)
  const stopResponse = useChatStore((s) => s.stopResponse)

  // Project Store hooks
  const activeProject = useProjectStore((s) => s.activeProject)

  const showRegenerate =
    !chatLoading &&
    chatMessages.length > 0 &&
    chatMessages[chatMessages.length - 1].role === 'assistant'

  // Scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    // Add a tiny delay to allow animations to finalize before scroll position calculates
    const timer = setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [chatMessages, chatLoading])

  const handleSendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const input = chatInput
    setChatInput('')
    await sendMessage(projectId, input)
  }

  if (!activeProject) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth chat-bg scrollbar-hide">
        
        {/* Welcome message wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-start gap-4 max-w-[85%]"
        >
          <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-on-primary shadow-[0_0_12px_rgba(232,160,191,0.25)] flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <div
            className="p-4 rounded-2xl rounded-tl-sm text-body-md leading-relaxed border border-surface-variant/30 text-on-surface shadow-sm"
            style={{
              background: 'radial-gradient(circle at 0% 0%, var(--color-primary-container, rgba(232, 160, 191, 0.08)) 0%, var(--color-surface-container-high, #1F1B1D) 100%)'
            }}
          >
            Halo! Saya Co-Author Anda. Mari kita rancang novel hebat bergenre <strong>{activeProject.genre}</strong> dengan target <strong>{activeProject.target_chapters} Bab</strong>! 🚀
            <br />
            <br />
            Ceritakan tentang premis, konflik utama, atau tokoh utama yang Anda bayangkan untuk memulai brainstorming.
          </div>
        </motion.div>

        {/* Message History list */}
        <AnimatePresence initial={false}>
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user'

            if (isUser) {
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="flex items-start gap-4 max-w-[85%] ml-auto flex-row-reverse"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container border border-outline-variant text-on-surface-variant shadow-sm flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <div className="p-4 rounded-2xl rounded-tr-sm text-body-md leading-relaxed border border-primary/20 bg-primary-container text-on-primary-container shadow-sm font-medium">
                    {msg.content}
                  </div>
                </motion.div>
              )
            }

            // AI messages
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              >
                <AiMessageBubble
                  message={msg}
                  onApprove={() => updateMessageDraftStatus(projectId, msg.id, 'approved')}
                  onEdit={() => setEditingMessage(msg)}
                  onReject={() => updateMessageDraftStatus(projectId, msg.id, 'rejected')}
                />
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Loading Spinner */}
        {chatLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-4 max-w-[85%]"
          >
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-on-primary shadow-sm flex-shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            </div>
            <div className="bg-surface-container-high p-4 rounded-2xl rounded-tl-sm border border-surface-variant/30 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.1s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
            </div>
          </motion.div>
        )}
        
        <div ref={chatBottomRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-4 md:p-6 bg-surface-dim/95 border-t border-surface-variant/20 relative z-20 backdrop-blur-lg">
        
        {/* Floating Regenerate Button */}
        <AnimatePresence>
          {showRegenerate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-30"
            >
              <button
                onClick={() => regenerateResponse(projectId)}
                className="h-9 px-4 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-label-md text-on-surface shadow-md hover-glow cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                Generate Ulang
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-surface-container-high border border-outline-variant focus-within:border-primary/50 focus-within:shadow-[0_0_15px_rgba(232,160,191,0.15)] rounded-[24px] overflow-hidden transition-all flex items-center">
            <textarea
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface text-body-md placeholder:text-on-surface-variant/50 p-4 resize-none max-h-32 min-h-[56px] focus:outline-none"
              placeholder="Ketik balasan atau arahan cerita di sini..."
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendChat()
                }
              }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = ''
                t.style.height = `${t.scrollHeight}px`
              }}
            />
          </div>
          
          {chatLoading ? (
            <button
              onClick={() => stopResponse(projectId)}
              className="w-14 h-14 rounded-full bg-error hover:bg-error-fixed text-on-error shadow-md hover:shadow-[0_0_15px_rgba(239,71,111,0.4)] transition-all flex items-center justify-center flex-shrink-0 group cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px] font-bold">
                stop
              </span>
            </button>
          ) : (
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className={`w-14 h-14 rounded-full text-on-primary shadow-md transition-all flex items-center justify-center flex-shrink-0 group cursor-pointer ${
                chatInput.trim()
                  ? 'bg-primary hover:bg-primary-fixed hover:shadow-[0_0_15px_rgba(255,190,217,0.4)]'
                  : 'bg-primary/40 cursor-not-allowed shadow-none'
              }`}
            >
              <span className="material-symbols-outlined group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
                send
              </span>
            </button>
          )}
        </div>
        <p className="text-center text-on-surface-variant/40 text-label-md text-[10px] mt-2">
          VibeNovel AI dapat membuat kesalahan. Cek kembali ide penting ceritamu.
        </p>
      </div>

      {/* Premium themed Edit Draft Modal */}
      <EditDraftModal
        isOpen={editingMessage !== null}
        onClose={() => setEditingMessage(null)}
        draftType={editingMessage?.draftData?.type || ''}
        initialData={editingMessage?.draftData?.data || {}}
        onSave={(updatedData) => {
          if (editingMessage) {
            updateMessageDraftStatus(projectId, editingMessage.id, 'edited', updatedData)
          }
        }}
      />
    </div>
  )
}
