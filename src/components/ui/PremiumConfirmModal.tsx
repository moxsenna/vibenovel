import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUiStore } from '../../store/useUiStore'

export const PremiumConfirmModal: React.FC = () => {
  const confirmOptions = useUiStore((s) => s.confirmOptions)
  const hideConfirm = useUiStore((s) => s.hideConfirm)

  if (!confirmOptions) return null

  const {
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    severity = 'info',
    onConfirm,
    onCancel
  } = confirmOptions

  const handleCancel = () => {
    if (onCancel) onCancel()
    hideConfirm()
  }

  const handleConfirm = () => {
    onConfirm()
    hideConfirm()
  }

  // Get icon and color scheme based on severity
  const getSeverityStyle = () => {
    switch (severity) {
      case 'danger':
        return {
          icon: 'warning',
          iconClass: 'text-error bg-error/10 dark:bg-error-container/20 border-error/20',
          btnClass: 'bg-error hover:bg-error-fixed hover:shadow-[0_0_15px_rgba(186,26,26,0.3)] text-on-error'
        }
      case 'warning':
        return {
          icon: 'report',
          iconClass: 'text-secondary bg-secondary/10 dark:bg-secondary-container/20 border-secondary/20',
          btnClass: 'bg-secondary hover:bg-secondary-fixed hover:shadow-[0_0_15px_rgba(239,189,138,0.3)] text-on-secondary'
        }
      case 'info':
      default:
        return {
          icon: 'info',
          iconClass: 'text-primary bg-primary/10 dark:bg-primary-container/20 border-primary/20',
          btnClass: 'btn-gradient text-white'
        }
    }
  }

  const style = getSeverityStyle()

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleCancel}
        />

        {/* Modal content box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.3 }}
          className="bg-surface-container-high rounded-[24px] w-full max-w-[420px] p-6 shadow-2xl relative inner-glow border border-outline-variant/30 z-10 flex flex-col items-center text-center"
        >
          {/* Header Severity Icon */}
          <div className={`w-14 h-14 rounded-full border flex items-center justify-center mb-4 ${style.iconClass} animate-bounce-slow`}>
            <span className="material-symbols-outlined text-[28px] fill" style={{ fontVariationSettings: "'FILL' 1" }}>{style.icon}</span>
          </div>

          {/* Title */}
          <h4 className="text-headline-md font-bold text-on-surface mb-2 px-2">
            {title}
          </h4>

          {/* Message */}
          <p className="text-body-md text-on-surface-variant/80 mb-6 leading-relaxed px-1">
            {message}
          </p>

          {/* Actions Footer */}
          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={handleCancel}
              className="flex-1 h-11 rounded-xl bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-on-surface text-label-lg font-bold cursor-pointer transition-all active:scale-[0.98]"
              type="button"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 h-11 rounded-xl text-label-lg font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98] ${style.btnClass}`}
              type="button"
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
