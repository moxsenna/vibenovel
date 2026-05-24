import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../store/useUiStore'

export const PremiumToastContainer: React.FC = () => {
  const toasts = useUiStore((s) => s.toasts)
  const removeToast = useUiStore((s) => s.removeToast)

  // Get details per toast type
  const getToastMeta = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return {
          icon: 'check_circle',
          iconClass: 'text-[#3B5A40] dark:text-[#E2F0E5]',
          bgGradient: 'radial-gradient(circle at 0% 0%, rgba(59, 90, 64, 0.08) 0%, transparent 100%)',
          borderClass: 'border-[#3B5A40]/30'
        }
      case 'error':
        return {
          icon: 'error',
          iconClass: 'text-error',
          bgGradient: 'radial-gradient(circle at 0% 0%, rgba(186, 26, 26, 0.08) 0%, transparent 100%)',
          borderClass: 'border-error/30'
        }
      case 'warning':
        return {
          icon: 'warning',
          iconClass: 'text-secondary',
          bgGradient: 'radial-gradient(circle at 0% 0%, rgba(239, 189, 138, 0.08) 0%, transparent 100%)',
          borderClass: 'border-secondary/30'
        }
      case 'info':
      default:
        return {
          icon: 'info',
          iconClass: 'text-primary',
          bgGradient: 'radial-gradient(circle at 0% 0%, rgba(255, 190, 217, 0.08) 0%, transparent 100%)',
          borderClass: 'border-primary/30'
        }
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-[380px] w-full px-4 md:px-0 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const meta = getToastMeta(toast.type)
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              style={{ background: `radial-gradient(circle at 0% 0%, var(--m3-surface-container-high) 0%, var(--m3-surface-container) 100%), ${meta.bgGradient}` }}
              className={`pointer-events-auto w-full p-4 rounded-2xl border ${meta.borderClass} shadow-xl flex items-start gap-3 inner-glow relative overflow-hidden backdrop-blur-md`}
            >
              {/* Type Accent Icon */}
              <span className={`material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0 ${meta.iconClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                {meta.icon}
              </span>

              {/* Message Content */}
              <div className="flex-1 text-body-sm text-on-surface font-semibold leading-relaxed pr-6">
                {toast.message}
              </div>

              {/* Manual Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-3 right-3 text-on-surface-variant/40 hover:text-on-surface-variant cursor-pointer transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
