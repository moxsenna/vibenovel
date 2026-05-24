/**
 * FreeWriteIndexerWatcher — Sprint 9.5 Hardening
 *
 * Global watcher mounted di Workspace yang:
 *   1. Memantau toggle freeWriteMode di useSettingsStore
 *   2. Ketika user toggle Free Write OFF (true → false), scan chapters
 *      yang punya prose tapi tidak punya AI artifacts (state snapshot,
 *      summary, dll)
 *   3. Kalau ada bab yang butuh sync, buka ReindexModal otomatis
 *
 * Plus expose modal yang bisa di-trigger manual dari Settings Tutorial tab
 * via useUiStore.openModal('reindex'). Same-component, dual entry point.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useUiStore } from '../../store/useUiStore'
import { useProjectStore } from '../../store/useProjectStore'
import { findChaptersNeedingReindex } from '../../services/chapter-reindexer'
import { ReindexModal } from '../modals/ReindexModal'

export const FreeWriteIndexerWatcher: React.FC = () => {
  const freeWriteMode = useSettingsStore((s) => s.freeWriteMode)
  const activeModal = useUiStore((s) => s.activeModal)
  const openModal = useUiStore((s) => s.openModal)
  const activeProject = useProjectStore((s) => s.activeProject)
  const prevFreeWriteRef = useRef<boolean>(freeWriteMode)

  const [autoOpen, setAutoOpen] = useState(false)

  // Detect Free Write toggle off → check pending reindex.
  useEffect(() => {
    const wasFreeWrite = prevFreeWriteRef.current
    prevFreeWriteRef.current = freeWriteMode

    if (!wasFreeWrite || freeWriteMode) return // only trigger on true → false
    if (!activeProject) return

    // Defer scan slightly so the prose flush settles into the store.
    const t = setTimeout(() => {
      const pending = findChaptersNeedingReindex()
      if (pending.length > 0) {
        setAutoOpen(true)
      }
    }, 800)

    return () => clearTimeout(t)
  }, [freeWriteMode, activeProject])

  const isOpen = autoOpen || activeModal === 'reindex'

  const handleClose = () => {
    setAutoOpen(false)
    if (activeModal === 'reindex') openModal(null)
  }

  return <ReindexModal isOpen={isOpen} onClose={handleClose} />
}
