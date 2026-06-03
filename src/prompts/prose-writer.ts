import type { ProseGenerateInput } from '../services/ai/types'

export function buildProseSystemInstruction(): string {
  return `You are the VibeNovel Prose Writer, an expert ghostwriter specialized in high-retention fiction.
Your task is to write immersive, emotional, and highly engaging prose for one specific story beat.

CRITICAL KBM MELODRAMA PROTOCOL:
1. SHORT PARAGRAPHS (KBM APP FORMAT): MAKSIMAL 2-3 KALIMAT PER PARAGRAF. You MUST use frequent line breaks. Do not write long blocks of text. Make it highly readable for mobile screen scrolling.
2. DIALOGUE-HEAVY: Characters must speak naturally, with subtext, using Indonesian modern conversational style (unless specified otherwise).
3. SHOW, DON'T TELL: Emphasize micro-expressions, body language, and visceral sensations rather than telling the reader how characters feel.
4. PACING: Match the requested emotional tone. If TENSION/CONFLICT, use shorter sentences. If RELIEF/BREATHER, allow more introspection and description.
5. NO WRAPPING: Output ONLY the prose content. No titles, no markdown code blocks, no "Here is your prose:", no explanations. Just the story text.
6. CONTINUITY: If previous prose is provided, seamlessly continue from where it left off. Do not repeat events that just happened.

🪝 MICRO-HOOK PROTOCOL (MANDATORY in every beat):
- Every dialogue line should carry SUBTEXT — what the character is NOT saying.
- Every description should plant ONE "wrong" detail (a contradiction or oddity the reader will notice but the character ignores).
- Every scene break / paragraph break should leave at least one open question or unfinished gesture.
- This is what makes readers commit to the next chapter.

🎬 CLIFFHANGER PROTOCOL (mandatory on the final beat of a chapter):
The final beat MUST end with the cliffhangerType provided in context. Quick reference:
  REVELATION — drop a shocking truth in the last 1-2 sentences.
  DANGER     — leave the protagonist on the edge of physical/emotional harm.
  DECISION   — pose an impossible choice; do not resolve it.
  BETRAYAL   — expose broken trust at the very end.
  COUNTDOWN  — emphasize a literal/metaphorical timer running out.
  EMOTIONAL  — close on a heart-wrenching internal beat (loss, longing, grief).

💔 FALSE RESOLUTION HANDLING:
- If "False Resolution" flag is true for this chapter, structure the prose so the reader feels the conflict is resolved BEFORE the final beat — then break the resolution at the cliffhanger.

🧲 CHARACTER VOICE:
- Adhere strictly to each character's Voice DNA (tone, vocabulary, verbal tics, internal monolog style, dialog quirks, charm factor).
- If a charm_factor is provided, surface a small moment of vulnerability or signature charm for that character.

Language: Indonesian (Modern, engaging fiction style).`
}

interface VoiceDnaShape {
  tone?: string
  vocabulary?: string
  verbal_tics?: string[]
  internal_monolog_style?: string
  dialog_quirks?: string
  charm_factor?: string
  // Calibrator output uses camelCase — accept both:
  verbalTics?: string[]
  internalMonologStyle?: string
  dialogQuirks?: string
}

/**
 * Convert a Voice DNA jsonb into a natural-language brief. Models follow
 * paragraph-style instructions more reliably than raw JSON dumps.
 */
function voiceDnaToBrief(name: string, dna: VoiceDnaShape): string {
  const lines: string[] = []
  if (dna.tone) lines.push(`tone-nya ${dna.tone}`)
  if (dna.vocabulary) lines.push(`vocabulary ${dna.vocabulary}`)
  const tics = dna.verbal_tics ?? dna.verbalTics ?? []
  if (tics.length > 0) lines.push(`sering mengucap "${tics.slice(0, 3).join('", "')}"`)
  const internal = dna.internal_monolog_style ?? dna.internalMonologStyle
  if (internal) lines.push(`internal monolog ${internal}`)
  const quirks = dna.dialog_quirks ?? dna.dialogQuirks
  if (quirks) lines.push(`dialog ciri khas ${quirks}`)
  if (dna.charm_factor) lines.push(`charm factor: ${dna.charm_factor}`)

  if (lines.length === 0) return ''
  return `${name} — ${lines.join('; ')}.`
}

export function buildProseUserPrompt(input: ProseGenerateInput): string {
  // Extract the current beat instructions
  const currentBeat = input.beats[input.beatIndex]
  const isFirstBeat = input.beatIndex === 0
  const isLastBeat = input.beatIndex === input.beats.length - 1

  // Format previous text for continuity
  let previousTextContext = ''
  if (!isFirstBeat && input.previousBeatsProse.length > 0) {
    const recentText = input.previousBeatsProse.join('\n\n')
    // Get last ~300 words to ensure continuity without overloading context
    const words = recentText.split(/\s+/)
    const truncated = words.slice(Math.max(words.length - 300, 0)).join(' ')
    previousTextContext = `
[PREVIOUS PROSE IN THIS CHAPTER - CONTINUE SEAMLESSLY FROM HERE]
... ${truncated}
[END PREVIOUS PROSE]`
  } else if (isFirstBeat && input.slidingWindowPrevChapter) {
    previousTextContext = `
[END OF PREVIOUS CHAPTER - FOR CONTEXT ONLY, DO NOT REPEAT]
... ${input.slidingWindowPrevChapter}
[END PREVIOUS CHAPTER CONTEXT]`
  }

  // Voice DNA — convert each character's jsonb into a natural-language brief
  // for higher model fidelity than a raw JSON dump.
  const voiceBriefs: string[] = []
  if (input.voiceDna && Object.keys(input.voiceDna).length > 0) {
    for (const [name, dna] of Object.entries(input.voiceDna)) {
      const brief = voiceDnaToBrief(name, dna as VoiceDnaShape)
      if (brief) voiceBriefs.push(brief)
    }
  }
  const voiceInstructions = voiceBriefs.length > 0
    ? `\n[CHARACTER VOICE DNA — natural language brief]\n${voiceBriefs.join('\n')}\nMatch each character's voice exactly when they speak or think.`
    : ''

  const characterStateBlock = input.characterStates
    ? `\n[DYNAMIC CHARACTER STATES - LAYER 2 MEMORY]\n${input.characterStates}\nGunakan state ini untuk menjaga lokasi, emosi, pengetahuan, rahasia, relasi, panggilan, dan tujuan aktif karakter. Jangan membuat karakter lupa informasi yang sudah mereka tahu.`
    : ''

  const ragMemoryBlock = input.ragMemory
    ? `\n[LONG-TERM MEMORY - LAYER 3 RAG]\n${input.ragMemory}\nGunakan memori ini hanya untuk menjaga kontinuitas canon. Jangan mengulang adegan lama kecuali diminta outline.`
    : ''

  const storyContractBlock = input.storyContract && Object.keys(input.storyContract).length > 0
    ? `\n[STORY CONTRACT - CANON GUARDRAILS]\n${JSON.stringify(input.storyContract, null, 2)}\nIkuti relationship_addressing untuk panggilan dialog antar karakter. Jangan memakai panggilan relasi secara acak jika kontrak sudah menentukan istilah seperti "Mas", "Sayang", "Kak", atau nama kecil.`
    : ''

  // Sprint 9 — Mimicry Engine: project-wide voice style block. Only included
  // when project.voice_dna_project is non-empty.
  let projectVoiceBlock = ''
  if (input.projectVoiceDna && Object.keys(input.projectVoiceDna).length > 0) {
    const lines: string[] = []
    for (const [k, v] of Object.entries(input.projectVoiceDna)) {
      if (v == null) continue
      const value = typeof v === 'string' ? v : JSON.stringify(v)
      if (!value.trim()) continue
      lines.push(`- ${k}: ${value}`)
    }
    if (lines.length > 0) {
      projectVoiceBlock = `\n[PROJECT VOICE STYLE — global writing voice for this novel]\nCermin gaya tulisan ini secara konsisten di seluruh narasi (deskripsi, ritme kalimat, paragraph density, dialog style):\n${lines.join('\n')}\n\nGabungkan dengan voice DNA per-karakter di atas — voice karakter prioritas saat dialog, voice proyek prioritas saat narasi.`
    }
  }

  const beatTargetWords = Math.ceil((input.wordCountTarget || 1000) / (input.beats.length || 1))

  // Build the prompt
  return `
[STORY CONTEXT]
Novel Title: ${input.title}
Genre: ${input.genre}
Narrative Constitution: ${input.narrativeConstitution}
Chapter ${input.chapterNumber}: ${input.chapterTitle}
Location: ${input.location}
Overall Chapter Tone: ${input.emotionalTone}

[LORE & ACTIVE ENTITIES]
${input.loreContext || 'None specified.'}
${voiceInstructions}
${characterStateBlock}
${ragMemoryBlock}
${storyContractBlock}
${projectVoiceBlock}

[CHAPTER OUTLINE]
${input.synopsis}
Target Cliffhanger: ${input.cliffhangerType} - ${input.cliffhangerSetup}
Total Beats: ${input.beats.length}

[CURRENT TASK: WRITE BEAT ${input.beatIndex + 1} OF ${input.beats.length}]
Beat Direction: ${currentBeat?.direction || 'Continue the scene logically.'}

${previousTextContext}

INSTRUCTIONS FOR THIS BEAT:
1. Write approximately ${beatTargetWords} words covering ONLY the current Beat Direction. Do NOT rush the narrative. Describe things vividly to reach this word count.
2. ${isFirstBeat ? 'Start the chapter with a strong hook.' : 'Continue naturally from the previous prose.'}
3. ${isLastBeat ? `This is the FINAL beat of the chapter. End EXACTLY with the target cliffhanger (type: ${input.cliffhangerType}, setup: ${input.cliffhangerSetup}). Make the last 1-2 sentences hit hard — this is what sells the next chapter.` : 'Do NOT rush to the end of the chapter. Leave room for the remaining beats.'}
4. Apply the MICRO-HOOK PROTOCOL: subtext in dialog, one "wrong" detail in description, an open question at every scene break.
5. Focus on sensory details and character emotional states.

Write the prose now:
`
}
