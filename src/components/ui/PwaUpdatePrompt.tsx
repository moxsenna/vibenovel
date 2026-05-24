import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * PWA Update Prompt
 *
 * Shows a small toast in the bottom-right when:
 *   - A new SW version is ready (`needRefresh`)
 *   - The app is fully cached and offline-ready (`offlineReady`)
 *
 * The prompt is dismissable. Tapping "Reload" activates the new version.
 */
export const PwaUpdatePrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.info('[PWA] Service worker registered at:', swUrl)
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error)
    }
  })

  const [dismissed, setDismissed] = useState(false)

  // Auto-dismiss the offline-ready toast after 4s
  useEffect(() => {
    if (offlineReady) {
      const t = setTimeout(() => setOfflineReady(false), 4000)
      return () => clearTimeout(t)
    }
  }, [offlineReady, setOfflineReady])

  const visible = (needRefresh || offlineReady) && !dismissed

  const handleReload = () => {
    setDismissed(true)
    updateServiceWorker(true)
  }

  const handleDismiss = () => {
    setDismissed(true)
    setNeedRefresh(false)
    setOfflineReady(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 right-4 z-[60] max-w-sm bg-surface-container-high border border-primary/40 rounded-2xl shadow-xl backdrop-blur-md p-4 inner-glow"
        >
          {needRefresh ? (
            <>
              <div className="flex items-start gap-3 mb-3">
                <span className="material-symbols-outlined text-primary text-2xl">
                  system_update
                </span>
                <div className="flex-1">
                  <p className="font-bold text-on-surface text-sm">Versi Baru Tersedia</p>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Reload untuk memuat versi terbaru VibeNovel.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface rounded-lg cursor-pointer transition-colors"
                >
                  Nanti
                </button>
                <button
                  onClick={handleReload}
                  className="px-4 py-1.5 text-xs font-bold text-on-primary bg-primary rounded-lg hover-glow cursor-pointer"
                >
                  Reload Sekarang
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-400 text-2xl">
                wifi_off
              </span>
              <div className="flex-1">
                <p className="font-bold text-on-surface text-sm">Siap Dipakai Offline</p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Semua fitur inti tersedia tanpa koneksi.
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                aria-label="Dismiss"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
