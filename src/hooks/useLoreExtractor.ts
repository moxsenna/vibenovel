import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { aiRouter } from '../services/ai/ai-router'

export function useLoreExtractor() {
  const { characters, items, worldRules, setExtractedLore, clearExtractedLore } = useProjectStore()
  const [extractStatus, setExtractStatus] = useState<'idle' | 'extracting' | 'done' | 'error'>('idle')

  const triggerLoreExtraction = async (prose: string) => {
    setExtractStatus('extracting')
    try {
      const result = await aiRouter.extractLore(prose, characters, items, worldRules)
      
      // Jika ada setidaknya satu entitas baru
      if (
        (result.new_characters && result.new_characters.length > 0) ||
        (result.new_items && result.new_items.length > 0) ||
        (result.new_rules && result.new_rules.length > 0)
      ) {
        setExtractedLore(result)
      } else {
        setExtractedLore(null)
      }
      
      setExtractStatus('done')
    } catch (err) {
      console.error('Lore Extraction failed:', err)
      setExtractStatus('error')
    }
  }

  return { triggerLoreExtraction, extractStatus, clearExtractedLore }
}
