import { useCallback, useEffect, useState } from 'react'

const PREFIX = 'vn_draft_'

interface DraftPayload {
  text: string
  timestamp: number
}

const buildKey = (chapterId: string, beatIndex: number) =>
  `${PREFIX}${chapterId}_${beatIndex}`

const isDraftKey = (key: string) => key.startsWith(PREFIX)

const parseKey = (key: string): { chapterId: string; beatIndex: number } | null => {
  if (!isDraftKey(key)) return null
  const trimmed = key.slice(PREFIX.length)
  const lastUnderscore = trimmed.lastIndexOf('_')
  if (lastUnderscore <= 0) return null
  const chapterId = trimmed.slice(0, lastUnderscore)
  const beatIndex = Number(trimmed.slice(lastUnderscore + 1))
  if (Number.isNaN(beatIndex)) return null
  return { chapterId, beatIndex }
}

export interface PendingDraft {
  chapterId: string
  beatIndex: number
  text: string
  timestamp: number
}

/**
 * Offline draft fallback.
 *
 * When the browser is offline, prose buffers should be saved to localStorage
 * keyed by `vn_draft_{chapterId}_{beatIndex}`. When connectivity returns,
 * `syncPendingDrafts` flushes the queue back to Supabase via a callback.
 */
export function useOfflineDraft() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState<number>(() => listPendingDrafts().length)

  // Keep online flag in sync with browser events
  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const refreshPendingCount = useCallback(() => {
    setPendingCount(listPendingDrafts().length)
  }, [])

  const saveDraft = useCallback(
    (chapterId: string, beatIndex: number, text: string) => {
      try {
        const payload: DraftPayload = { text, timestamp: Date.now() }
        localStorage.setItem(buildKey(chapterId, beatIndex), JSON.stringify(payload))
        refreshPendingCount()
      } catch (e) {
        console.warn('[OfflineDraft] saveDraft failed:', e)
      }
    },
    [refreshPendingCount]
  )

  const loadDraft = useCallback(
    (chapterId: string, beatIndex: number): DraftPayload | null => {
      try {
        const raw = localStorage.getItem(buildKey(chapterId, beatIndex))
        if (!raw) return null
        return JSON.parse(raw) as DraftPayload
      } catch {
        return null
      }
    },
    []
  )

  const clearDraft = useCallback(
    (chapterId: string, beatIndex: number) => {
      try {
        localStorage.removeItem(buildKey(chapterId, beatIndex))
        refreshPendingCount()
      } catch {
        /* noop */
      }
    },
    [refreshPendingCount]
  )

  /**
   * Flush every pending draft via the provided sync callback.
   * The callback should resolve true on successful upload (so we can drop it
   * from localStorage) or false to retry next time.
   */
  const syncPendingDrafts = useCallback(
    async (
      sync: (draft: PendingDraft) => Promise<boolean>
    ): Promise<{ synced: number; failed: number }> => {
      const drafts = listPendingDrafts()
      let synced = 0
      let failed = 0
      for (const d of drafts) {
        try {
          const ok = await sync(d)
          if (ok) {
            localStorage.removeItem(buildKey(d.chapterId, d.beatIndex))
            synced += 1
          } else {
            failed += 1
          }
        } catch (e) {
          console.warn('[OfflineDraft] sync failed for draft:', d, e)
          failed += 1
        }
      }
      refreshPendingCount()
      return { synced, failed }
    },
    [refreshPendingCount]
  )

  return {
    isOnline,
    pendingCount,
    hasPendingDrafts: pendingCount > 0,
    saveDraft,
    loadDraft,
    clearDraft,
    syncPendingDrafts
  }
}

/** Return all currently pending drafts in localStorage. */
export function listPendingDrafts(): PendingDraft[] {
  if (typeof localStorage === 'undefined') return []
  const out: PendingDraft[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    const parsed = parseKey(key)
    if (!parsed) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const payload = JSON.parse(raw) as DraftPayload
      out.push({
        chapterId: parsed.chapterId,
        beatIndex: parsed.beatIndex,
        text: payload.text,
        timestamp: payload.timestamp
      })
    } catch {
      /* skip malformed entries */
    }
  }
  return out
}
