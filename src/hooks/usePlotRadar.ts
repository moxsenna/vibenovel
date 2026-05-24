import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { aiRouter } from '../services/ai/ai-router'
import { stateTracker } from '../services/state-tracker'

export function usePlotRadar() {
  const { updateChapter, chapters, characters } = useProjectStore()
  const [qaStatus, setQaStatus] = useState<'idle' | 'analyzing' | 'done' | 'error'>('idle')

  const triggerPlotRadar = async (chapterId: string, prose: string) => {
    const chapter = chapters.find(c => c.id === chapterId)
    if (!chapter) return

    setQaStatus('analyzing')
    try {
      // Dapatkan konteks state sebelumnya
      const prevStates = useProjectStore.getState().getLatestStatesForChapter(chapter.chapter_number)
      const prevContext = prevStates.length > 0
        ? stateTracker.formatStatesForContext(prevStates, characters)
        : undefined

      const chapterWithProse = { ...chapter, prose }
      
      const qaLogs = await aiRouter.runQARadar(chapterWithProse, prevContext)
      
      if (qaLogs.length > 0) {
        await updateChapter(chapter.id, { qa_logs: qaLogs })
      } else {
        await updateChapter(chapter.id, { qa_logs: [] }) // Kosongkan jika sukses bersih
      }
      
      setQaStatus('done')
    } catch (err) {
      console.error('Plot Radar failed:', err)
      setQaStatus('error')
    }
  }

  return { triggerPlotRadar, qaStatus }
}
