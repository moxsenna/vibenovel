import { useSettingsStore } from '../../store/useSettingsStore'

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
}

export const openRouterAdapter = new OpenRouterAdapter()
