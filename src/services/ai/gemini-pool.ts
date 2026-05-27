import { useSettingsStore, type GeminiKeyConfig } from '../../store/useSettingsStore'
import type { ThinkingChunk } from './types'

interface KeyStatus {
  key: string
  cooldownUntil: number // timestamp
  consecutiveFailures: number
}

/**
 * Return a non-sensitive label for a key (e.g. "key #2") so we never log
 * any portion of the actual secret. The label uses the key index in the
 * current pool snapshot.
 */
function keyLabel(pool: KeyStatus[], key: string): string {
  const idx = pool.findIndex((s) => s.key === key)
  return idx >= 0 ? `key #${idx}` : 'unknown key'
}

class GeminiPool {
  private keyStatuses: KeyStatus[] = []
  private currentIndex = 0

  constructor() {
    this.syncKeys()
    // Sync with settings store changes
    useSettingsStore.subscribe((state) => {
      this.syncKeys(state.geminiKeys)
    })
  }

  private syncKeys(storeKeys?: Array<string | GeminiKeyConfig>) {
    const keys = storeKeys || useSettingsStore.getState().geminiKeys

    // Merge existing statuses
    const newStatuses = keys.map((rawKey) => {
      const key = typeof rawKey === 'string' ? rawKey : rawKey.key
      const existing = this.keyStatuses.find((ks) => ks.key === key)
      return existing || { key, cooldownUntil: 0, consecutiveFailures: 0 }
    })

    this.keyStatuses = newStatuses
    if (this.currentIndex >= this.keyStatuses.length) {
      this.currentIndex = 0
    }
  }

  public getNextKey(): string | null {
    this.syncKeys()
    if (this.keyStatuses.length === 0) return null

    const now = Date.now()
    let checkedCount = 0

    while (checkedCount < this.keyStatuses.length) {
      const status = this.keyStatuses[this.currentIndex]
      this.currentIndex = (this.currentIndex + 1) % this.keyStatuses.length

      if (status.cooldownUntil <= now) {
        return status.key
      }

      checkedCount++
    }

    // If all keys are in cooldown, grab the one with the earliest cooldown expiration
    const sorted = [...this.keyStatuses].sort((a, b) => a.cooldownUntil - b.cooldownUntil)
    const bestStatus = sorted[0]

    if (bestStatus) {
      console.warn(
        `All Gemini keys in cooldown. Forcing usage of ${keyLabel(this.keyStatuses, bestStatus.key)} (earliest recovery).`
      )
      return bestStatus.key
    }

    return null
  }

  public reportRateLimit(key: string) {
    const status = this.keyStatuses.find((ks) => ks.key === key)
    if (status) {
      status.cooldownUntil = Date.now() + 60 * 1000
      status.consecutiveFailures++
      console.warn(`${keyLabel(this.keyStatuses, key)} rate-limited. Cooldown active for 60s.`)
    }
  }

  public reportSuccess(key: string) {
    const status = this.keyStatuses.find((ks) => ks.key === key)
    if (status) {
      status.consecutiveFailures = 0
    }
  }

  public reportError(key: string, error: unknown) {
    const status = this.keyStatuses.find((ks) => ks.key === key)
    if (status) {
      status.consecutiveFailures++
      if (status.consecutiveFailures >= 3) {
        status.cooldownUntil = Date.now() + 30 * 1000
        console.error(
          `${keyLabel(this.keyStatuses, key)} failed repeatedly. Cooling down for 30s.`,
          error
        )
      }
    }
  }

  /**
   * Helper to make a client-side API call to Gemini with automatic key rotation and retries
   */
  public async generateContent(
    prompt: string,
    systemInstruction?: string,
    jsonMode = false,
    model = 'gemini-flash-latest',
    signal?: AbortSignal
  ): Promise<string> {
    // Lock model to gemini-flash-latest for all Gemini calls
    model = 'gemini-flash-latest'

    let retries = Math.max(3, this.keyStatuses.length)
    let lastError: unknown = null

    while (retries > 0) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const key = this.getNextKey()
      if (!key) {
        throw new Error('No Gemini API keys configured. Please add keys in Settings.')
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              ...(systemInstruction
                ? {
                    systemInstruction: {
                      parts: [{ text: systemInstruction }]
                    }
                  }
                : {}),
              generationConfig: {
                temperature: 0.7,
                topP: 0.95,
                maxOutputTokens: 8192,
                ...(jsonMode
                  ? {
                      responseMimeType: 'application/json'
                    }
                  : {})
              }
            }),
            signal
          }
        )

        if (response.status === 429) {
          this.reportRateLimit(key)
          retries--
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini API Error (${response.status}): ${errText}`)
        }

        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
          throw new Error('Invalid response structure from Gemini API')
        }

        this.reportSuccess(key)
        return text
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(`Error with Gemini ${keyLabel(this.keyStatuses, key)}:`, error)
        this.reportError(key, error)
        lastError = error
        retries--
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to generate content after exhausting keys in the pool')
  }

  /**
   * Sprint 9.8 — Deep Outline non-streaming variant.
   *
   * Returns `{ text, thoughtSummary? }` where `text` is the final model
   * output (used for JSON parsing in the outline engine) and
   * `thoughtSummary` is the joined `thought: true` parts (currently
   * discarded by the outline caller, but exposed for future use).
   *
   * Combines `responseMimeType: 'application/json'` with `thinkingConfig`.
   * If a provider rejects this combo the caller can fall back to legacy
   * `generateContent()` since this method only adds a non-breaking field.
   *
   * Backward-compat: original `generateContent()` is untouched. This is
   * a strictly additive helper used only by `generateChapterOutline`.
   */
  public async generateContentV2(
    prompt: string,
    systemInstruction?: string,
    jsonMode = false,
    model = 'gemini-flash-latest',
    signal?: AbortSignal,
    thinkingBudget = 0
  ): Promise<{ text: string; thoughtSummary?: string }> {
    // Lock model to gemini-flash-latest for all Gemini calls
    model = 'gemini-flash-latest'

    let retries = Math.max(3, this.keyStatuses.length)
    let lastError: unknown = null

    while (retries > 0) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const key = this.getNextKey()
      if (!key) {
        throw new Error('No Gemini API keys configured. Please add keys in Settings.')
      }

      try {
        const generationConfig: Record<string, unknown> = {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 8192
        }
        if (jsonMode) {
          generationConfig.responseMimeType = 'application/json'
        }
        if (thinkingBudget > 0) {
          generationConfig.thinkingConfig = {
            thinkingBudget,
            includeThoughts: true
          }
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              ...(systemInstruction
                ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
                : {}),
              generationConfig
            }),
            signal
          }
        )

        if (response.status === 429) {
          this.reportRateLimit(key)
          retries--
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini API Error (${response.status}): ${errText}`)
        }

        const data = await response.json()
        const parts: Array<{ text?: string; thought?: boolean }> | undefined =
          data.candidates?.[0]?.content?.parts

        if (!parts || parts.length === 0) {
          throw new Error('Invalid response structure from Gemini API')
        }

        const textParts: string[] = []
        const thoughtParts: string[] = []
        for (const p of parts) {
          if (typeof p.text !== 'string' || p.text.length === 0) continue
          if (p.thought === true) thoughtParts.push(p.text)
          else textParts.push(p.text)
        }
        const text = textParts.join('')
        if (!text) {
          throw new Error('Gemini V2 response had no final text content')
        }

        this.reportSuccess(key)
        return {
          text,
          thoughtSummary: thoughtParts.length > 0 ? thoughtParts.join('\n') : undefined
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(`Error with Gemini V2 ${keyLabel(this.keyStatuses, key)}:`, error)
        this.reportError(key, error)
        lastError = error
        retries--
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to generate V2 content after exhausting keys in the pool')
  }

  /**
   * Generates content using Server-Sent Events (SSE) streaming for real-time UI updates
   */
  public async *generateContentStream(
    prompt: string,
    systemInstruction?: string,
    model = 'gemini-flash-latest',
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown> {
    // Lock model to gemini-flash-latest for all Gemini calls
    model = 'gemini-flash-latest'

    let retries = Math.max(3, this.keyStatuses.length)
    let lastError: unknown = null

    while (retries > 0) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const key = this.getNextKey()
      if (!key) throw new Error('No Gemini API keys configured. Please add keys in Settings.')

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              ...(systemInstruction
                ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
                : {}),
              generationConfig: { temperature: 0.7, topP: 0.95, maxOutputTokens: 8192 }
            }),
            signal
          }
        )

        if (response.status === 429) {
          this.reportRateLimit(key)
          retries--
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini API Error (${response.status}): ${errText}`)
        }

        this.reportSuccess(key)

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
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim()
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr)
                  const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text
                  if (textChunk) {
                    yield textChunk
                  }
                } catch {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        }

        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(`Streaming error with Gemini ${keyLabel(this.keyStatuses, key)}:`, error)
        this.reportError(key, error)
        lastError = error
        retries--
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to generate stream after exhausting keys')
  }

  /**
   * Sprint 9.7 — Deep Think streaming variant.
   *
   * Yields {@link ThinkingChunk} objects so callers can distinguish thought
   * tokens (model's internal reasoning) from final prose text. When
   * `thinkingBudget > 0`, injects Gemini's `thinkingConfig` into the
   * generation config and parses each SSE part for `thought === true` flag.
   *
   * Backward-compat note: existing {@link generateContentStream} method is
   * untouched — Director's Cut, recap and other non-prose callers continue
   * yielding raw `string` chunks.
   *
   * Graceful degradation: if the model ignores `thinkingConfig` or yields
   * no thought parts, all chunks are emitted as `{ type: 'text' }`.
   */
  public async *generateContentStreamV2(
    prompt: string,
    systemInstruction?: string,
    model = 'gemini-flash-latest',
    signal?: AbortSignal,
    thinkingBudget = 0
  ): AsyncGenerator<ThinkingChunk, void, unknown> {
    // Lock model to gemini-flash-latest for all Gemini calls
    model = 'gemini-flash-latest'

    let retries = Math.max(3, this.keyStatuses.length)
    let lastError: unknown = null

    while (retries > 0) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const key = this.getNextKey()
      if (!key) throw new Error('No Gemini API keys configured. Please add keys in Settings.')

      try {
        const generationConfig: Record<string, unknown> = {
          temperature: 0.7,
          topP: 0.95,
          maxOutputTokens: 8192
        }
        if (thinkingBudget > 0) {
          generationConfig.thinkingConfig = {
            thinkingBudget,
            includeThoughts: true
          }
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              ...(systemInstruction
                ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
                : {}),
              generationConfig
            }),
            signal
          }
        )

        if (response.status === 429) {
          this.reportRateLimit(key)
          retries--
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini API Error (${response.status}): ${errText}`)
        }

        this.reportSuccess(key)

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
            if (line.startsWith('data: ')) {
              const dataStr = line.replace('data: ', '').trim()
              if (dataStr) {
                try {
                  const data = JSON.parse(dataStr)
                  const parts: Array<{ text?: string; thought?: boolean }> | undefined =
                    data.candidates?.[0]?.content?.parts
                  if (!parts || parts.length === 0) continue
                  for (const part of parts) {
                    if (typeof part.text !== 'string' || part.text.length === 0) continue
                    yield {
                      type: part.thought === true ? 'thought' : 'text',
                      content: part.text
                    }
                  }
                } catch {
                  // Ignore JSON parse errors for incomplete chunks
                }
              }
            }
          }
        }

        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(
          `Streaming V2 error with Gemini ${keyLabel(this.keyStatuses, key)}:`,
          error
        )
        this.reportError(key, error)
        lastError = error
        retries--
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to generate V2 stream after exhausting keys')
  }

  /**
   * Embed text via Gemini `text-embedding-004` (768 dimensions, free tier).
   * Used for the RAG semantic search over chapter summaries.
   */
  public async embedContent(
    text: string,
    signal?: AbortSignal,
    model = 'text-embedding-004'
  ): Promise<number[]> {
    let retries = Math.max(3, this.keyStatuses.length)
    let lastError: unknown = null

    while (retries > 0) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const key = this.getNextKey()
      if (!key) throw new Error('No Gemini API keys configured. Please add keys in Settings.')

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: { parts: [{ text }] }
            }),
            signal
          }
        )

        if (response.status === 429) {
          this.reportRateLimit(key)
          retries--
          continue
        }

        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`Gemini Embed API Error (${response.status}): ${errText}`)
        }

        const data = await response.json()
        const values: number[] | undefined = data?.embedding?.values
        if (!Array.isArray(values) || values.length === 0) {
          throw new Error('Invalid embedding response from Gemini')
        }

        this.reportSuccess(key)
        return values
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') throw error
        console.error(`Embedding error with Gemini ${keyLabel(this.keyStatuses, key)}:`, error)
        this.reportError(key, error)
        lastError = error
        retries--
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to embed content after exhausting keys')
  }
}

export const geminiPool = new GeminiPool()
