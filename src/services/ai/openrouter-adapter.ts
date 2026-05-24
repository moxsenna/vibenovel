import { useSettingsStore } from '../../store/useSettingsStore'
import type { ThinkingChunk } from './types'

class OpenRouterAdapter {
  /**
   * Generates prose using OpenRouter API
   */
  public async generateContent(
    prompt: string,
    systemInstruction?: string,
    model = 'anthropic/claude-3.5-sonnet',
    jsonMode = false
  ): Promise<string> {
    const { openRouterKey } = useSettingsStore.getState()
    
    if (!openRouterKey) {
      throw new Error('OpenRouter API key is not configured. Please add it in Settings.')
    }

    try {
      const messages = []
      if (systemInstruction) {
        messages.push({
          role: 'system',
          content: systemInstruction
        })
      }
      messages.push({
        role: 'user',
        content: prompt
      })

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://vibenovel.app', // Optional, for OpenRouter analytics
          'X-Title': 'VibeNovel v2'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.8,
          max_tokens: 4000,
          ...(jsonMode
            ? {
                response_format: { type: 'json_object' }
              }
            : {})
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenRouter API Error (${response.status}): ${errText}`)
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content
      
      if (!text) {
        throw new Error('Empty response received from OpenRouter API')
      }

      return text

    } catch (error) {
      console.error('Error with OpenRouter call:', error)
      throw error
    }
  }

  /**
   * Sprint 9.8 — Deep Outline non-streaming variant.
   *
   * Returns `{ text, thoughtSummary? }`. Used by the Outline Engine when
   * the active prose model is OpenRouter-routed (Claude Sonnet 4.6 or
   * DeepSeek V4 Pro). For Gemini routing, the Outline Engine continues
   * to call the gemini-pool variant directly; this method is currently
   * unused by the outline pipeline (which always routes through Gemini)
   * but exists for symmetry and future use.
   *
   * Defensive parsing covers `message.reasoning_details[]` (preferred),
   * `message.reasoning_content` (legacy alias), `message.reasoning`
   * (legacy raw string).
   */
  public async generateContentV2(
    prompt: string,
    systemInstruction?: string,
    model = 'anthropic/claude-sonnet-4.6',
    jsonMode = false,
    signal?: AbortSignal,
    thinkingBudget = 0
  ): Promise<{ text: string; thoughtSummary?: string }> {
    const { openRouterKey } = useSettingsStore.getState()

    if (!openRouterKey) {
      throw new Error('OpenRouter API key is not configured. Please add it in Settings.')
    }

    const messages: Array<{ role: string; content: string }> = []
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction })
    }
    messages.push({ role: 'user', content: prompt })

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.8,
      max_tokens: 4000
    }
    if (jsonMode) {
      body.response_format = { type: 'json_object' }
    }
    if (thinkingBudget > 0) {
      body.reasoning = { max_tokens: thinkingBudget }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openRouterKey}`,
        'HTTP-Referer': 'https://vibenovel.app',
        'X-Title': 'VibeNovel v2'
      },
      body: JSON.stringify(body),
      signal
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenRouter API Error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message
    if (!message) {
      throw new Error('Empty response received from OpenRouter API')
    }

    const text: string = typeof message.content === 'string' ? message.content : ''
    if (!text) {
      throw new Error('OpenRouter V2 response had no final content')
    }

    let thoughtSummary: string | undefined
    const details: Array<{ type?: string; text?: string }> | undefined = message.reasoning_details
    if (Array.isArray(details) && details.length > 0) {
      const parts: string[] = []
      for (const detail of details) {
        if (
          detail &&
          typeof detail.text === 'string' &&
          detail.text.length > 0 &&
          (detail.type === 'reasoning.text' || detail.type === 'reasoning.summary')
        ) {
          parts.push(detail.text)
        }
      }
      if (parts.length > 0) thoughtSummary = parts.join('\n')
    } else if (typeof message.reasoning_content === 'string' && message.reasoning_content.length > 0) {
      thoughtSummary = message.reasoning_content
    } else if (typeof message.reasoning === 'string' && message.reasoning.length > 0) {
      thoughtSummary = message.reasoning
    }

    return { text, thoughtSummary }
  }

  /**
   * Generates content using Server-Sent Events (SSE) streaming for real-time UI updates
   */
  public async *generateContentStream(
    prompt: string,
    systemInstruction?: string,
    model = 'anthropic/claude-3.5-sonnet'
  ): AsyncGenerator<string, void, unknown> {
    const { openRouterKey } = useSettingsStore.getState()
    
    if (!openRouterKey) {
      throw new Error('OpenRouter API key is not configured. Please add it in Settings.')
    }

    try {
      const messages = []
      if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction })
      }
      messages.push({ role: 'user', content: prompt })

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://vibenovel.app',
          'X-Title': 'VibeNovel v2'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.8,
          max_tokens: 4000,
          stream: true
        })
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenRouter API Error (${response.status}): ${errText}`)
      }

      if (!response.body) throw new Error('ReadableStream not supported by browser.')

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // keep the incomplete line in the buffer

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine) continue
          if (trimmedLine === 'data: [DONE]') return

          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.replace('data: ', '')
            try {
              const data = JSON.parse(dataStr)
              const textChunk = data.choices?.[0]?.delta?.content
              if (textChunk) {
                yield textChunk
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
      
      return // End of stream

    } catch (error) {
      console.error('Error with OpenRouter streaming:', error)
      throw error
    }
  }

  /**
   * Sprint 9.7 — Deep Think streaming variant for OpenRouter.
   *
   * Yields {@link ThinkingChunk} objects so the prose writer can split the
   * model's reasoning tokens from final prose. Uses OpenRouter's unified
   * `reasoning.max_tokens` parameter (Anthropic-style) which is normalized
   * across providers (Claude Sonnet 4.6, DeepSeek V4 Flash/Pro, etc.).
   *
   * Defensive parsing covers three response shapes:
   *   1. `delta.reasoning_details[]` — new unified array (preferred)
   *   2. `delta.reasoning_content`   — legacy alias string
   *   3. `delta.reasoning`           — legacy raw string
   * Final prose text comes from `delta.content` as before.
   *
   * Backward-compat: existing {@link generateContentStream} is unchanged.
   */
  public async *generateContentStreamV2(
    prompt: string,
    systemInstruction?: string,
    model = 'anthropic/claude-sonnet-4.6',
    thinkingBudget = 0,
    signal?: AbortSignal
  ): AsyncGenerator<ThinkingChunk, void, unknown> {
    const { openRouterKey } = useSettingsStore.getState()

    if (!openRouterKey) {
      throw new Error('OpenRouter API key is not configured. Please add it in Settings.')
    }

    const messages: Array<{ role: string; content: string }> = []
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction })
    }
    messages.push({ role: 'user', content: prompt })

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.8,
      max_tokens: 4000,
      stream: true
    }
    if (thinkingBudget > 0) {
      body.reasoning = { max_tokens: thinkingBudget }
    }

    let response: Response
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openRouterKey}`,
          'HTTP-Referer': 'https://vibenovel.app',
          'X-Title': 'VibeNovel v2'
        },
        body: JSON.stringify(body),
        signal
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      console.error('Error with OpenRouter V2 streaming:', error)
      throw error
    }

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenRouter API Error (${response.status}): ${errText}`)
    }

    if (!response.body) throw new Error('ReadableStream not supported by browser.')

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        if (trimmed === 'data: [DONE]') return

        if (!trimmed.startsWith('data: ')) continue

        const dataStr = trimmed.replace('data: ', '')
        try {
          const data = JSON.parse(dataStr)
          const delta = data.choices?.[0]?.delta
          if (!delta) continue

          // Primary: unified reasoning_details[] array
          const details: Array<{ type?: string; text?: string }> | undefined =
            delta.reasoning_details
          if (Array.isArray(details) && details.length > 0) {
            for (const detail of details) {
              if (
                detail &&
                typeof detail.text === 'string' &&
                detail.text.length > 0 &&
                (detail.type === 'reasoning.text' || detail.type === 'reasoning.summary')
              ) {
                yield { type: 'thought', content: detail.text }
              }
            }
          } else if (typeof delta.reasoning_content === 'string' && delta.reasoning_content.length > 0) {
            // Fallback 1: legacy alias
            yield { type: 'thought', content: delta.reasoning_content }
          } else if (typeof delta.reasoning === 'string' && delta.reasoning.length > 0) {
            // Fallback 2: raw legacy field
            yield { type: 'thought', content: delta.reasoning }
          }

          // Final prose text
          if (typeof delta.content === 'string' && delta.content.length > 0) {
            yield { type: 'text', content: delta.content }
          }
        } catch {
          // Ignore JSON parse errors for incomplete chunks
        }
      }
    }
  }
}

export const openRouterAdapter = new OpenRouterAdapter()
