import type {
  Character,
  CharacterRole,
  Chapter,
  Item,
  MysteryLayer,
  StoryContract,
  StoryValidationIssue,
  StoryValidationResult
} from '../types/project'

type DraftChapter = Omit<Chapter, 'id'>

interface OutlineValidationInput {
  storyContract?: StoryContract | Record<string, unknown> | null
  chapter: DraftChapter | Chapter
  characters: Character[]
  items: Item[]
  mysteryLayers: MysteryLayer[]
}

const VALID_CHARACTER_ROLES: CharacterRole[] = [
  'PROTAGONIST',
  'ANTAGONIST',
  'SUPPORTING',
  'MINOR'
]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function lower(value: unknown): string {
  return typeof value === 'string' ? value.toLowerCase() : ''
}

function addIssue(
  issues: StoryValidationIssue[],
  issue: StoryValidationIssue
): void {
  issues.push(issue)
}

function compactText(chapter: DraftChapter | Chapter): string {
  return [
    chapter.title,
    chapter.synopsis,
    chapter.location,
    chapter.time_in_story,
    chapter.cliffhanger_setup,
    chapter.must_connect_to,
    ...(chapter.key_events || []),
    ...(chapter.open_threads || []),
    ...(chapter.resolved_threads || []),
    ...(chapter.foreshadowing || []),
    ...(chapter.do_not_include || [])
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

function listFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function getOpeningContract(contract: Record<string, unknown>) {
  return isPlainObject(contract.opening_contract)
    ? contract.opening_contract
    : null
}

function getArcOrder(contract: Record<string, unknown>) {
  return Array.isArray(contract.arc_order) ? contract.arc_order : []
}

function getRelationshipAddressing(contract: Record<string, unknown>) {
  return Array.isArray(contract.relationship_addressing)
    ? contract.relationship_addressing
    : []
}

export function isNonEmptyStoryContract(
  contract?: StoryContract | Record<string, unknown> | null
): boolean {
  return isPlainObject(contract) && Object.keys(contract).length > 0
}

export function normalizeCharacterRole(value: unknown): CharacterRole {
  return VALID_CHARACTER_ROLES.includes(value as CharacterRole)
    ? (value as CharacterRole)
    : 'SUPPORTING'
}

export function normalizeMysteryBreadcrumbs(value: unknown): { chapter: number; hint: string }[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return { chapter: 0, hint: entry.trim() }
      }
      if (!isPlainObject(entry)) return null

      const rawChapter = entry.chapter
      const chapter =
        typeof rawChapter === 'number'
          ? rawChapter
          : typeof rawChapter === 'string'
            ? parseInt(rawChapter, 10)
            : 0
      const hint = typeof entry.hint === 'string'
        ? entry.hint.trim()
        : typeof entry.description === 'string'
          ? entry.description.trim()
          : ''

      return hint ? { chapter: Number.isFinite(chapter) ? chapter : 0, hint } : null
    })
    .filter((entry): entry is { chapter: number; hint: string } => Boolean(entry))
}

export function resolveRelationshipAddressTerm(
  contract: StoryContract | Record<string, unknown> | null | undefined,
  speaker: string,
  addressee: string,
  fallback = ''
): string {
  if (!isPlainObject(contract)) return fallback

  const speakerKey = speaker.trim().toLowerCase()
  const addresseeKey = addressee.trim().toLowerCase()
  for (const rawRule of getRelationshipAddressing(contract)) {
    if (!isPlainObject(rawRule)) continue
    if (lower(rawRule.speaker) !== speakerKey || lower(rawRule.addressee) !== addresseeKey) {
      continue
    }
    if (typeof rawRule.default_term === 'string' && rawRule.default_term.trim()) {
      return rawRule.default_term.trim()
    }
    const allowedTerms = listFromUnknown(rawRule.allowed_terms)
    return allowedTerms[0] || fallback
  }

  return fallback
}

export function mergeValidationResults(
  ...results: StoryValidationResult[]
): StoryValidationResult {
  const issues = results.flatMap((result) => result.issues)
  return {
    passed: !issues.some((issue) => issue.severity === 'BLOCKER'),
    issues
  }
}

export function validationHasBlocker(result: StoryValidationResult): boolean {
  return result.issues.some((issue) => issue.severity === 'BLOCKER')
}

export function validateOutlineAgainstStoryContract({
  storyContract,
  chapter,
  characters,
  items,
  mysteryLayers
}: OutlineValidationInput): StoryValidationResult {
  const issues: StoryValidationIssue[] = []
  const contract = isPlainObject(storyContract) ? storyContract : {}
  const knownCharacters = new Set(characters.map((c) => c.name.toLowerCase()))
  const knownItems = new Set(items.map((i) => i.name.toLowerCase()))
  if (Array.isArray(contract.canon_entities)) {
    for (const rawEntity of contract.canon_entities) {
      if (!isPlainObject(rawEntity)) continue
      const entityType = rawEntity.entity_type
      const targetSet = entityType === 'item' ? knownItems : entityType === 'character' ? knownCharacters : null
      if (!targetSet) continue
      for (const alias of listFromUnknown(rawEntity.aliases)) {
        if (alias.trim()) targetSet.add(alias.trim().toLowerCase())
      }
    }
  }
  const relationshipAddressTerms = new Set<string>()
  for (const rawRule of getRelationshipAddressing(contract)) {
    if (!isPlainObject(rawRule)) continue
    for (const term of listFromUnknown(rawRule.allowed_terms)) {
      if (term.trim()) relationshipAddressTerms.add(term.trim().toLowerCase())
    }
    if (typeof rawRule.default_term === 'string' && rawRule.default_term.trim()) {
      relationshipAddressTerms.add(rawRule.default_term.trim().toLowerCase())
    }
  }
  const fullText = compactText(chapter)

  if (!isNonEmptyStoryContract(storyContract)) {
    addIssue(issues, {
      severity: 'BLOCKER',
      code: 'MISSING_STORY_CONTRACT',
      message: 'Story Contract belum disetujui, sehingga outline belum punya kontrak canon untuk divalidasi.',
      suggestion: 'Selesaikan dan setujui Story Contract di Story Compass sebelum membuat outline.'
    })
  }

  for (const name of chapter.active_characters || []) {
    if (name && !knownCharacters.has(name.toLowerCase())) {
      if (relationshipAddressTerms.has(name.toLowerCase())) {
        addIssue(issues, {
          severity: 'WARNING',
          code: 'RELATIONSHIP_ADDRESS_TERM_AS_ACTIVE_CHARACTER',
          message: `"${name}" adalah panggilan relasi, bukan nama karakter canon.`,
          suggestion: 'Gunakan nama karakter canon di activeCharacters. Panggilan seperti Mas/Sayang dipakai hanya di dialog atau prose.'
        })
        continue
      }
      addIssue(issues, {
        severity: 'BLOCKER',
        code: 'UNKNOWN_ACTIVE_CHARACTER',
        message: `Karakter aktif "${name}" belum ada di Lorebook.`,
        suggestion: 'Tambahkan karakter ke Lorebook terlebih dahulu, atau ganti dengan karakter canon yang sudah disetujui.'
      })
    }
  }

  for (const name of chapter.active_items || []) {
    if (name && !knownItems.has(name.toLowerCase())) {
      addIssue(issues, {
        severity: 'BLOCKER',
        code: 'UNKNOWN_ACTIVE_ITEM',
        message: `Item aktif "${name}" belum ada di Lorebook.`,
        suggestion: 'Tambahkan item ke Lorebook terlebih dahulu, atau kosongkan activeItems jika item itu belum canon.'
      })
    }
  }

  const opening = getOpeningContract(contract)
  if (chapter.chapter_number === 1 && opening) {
    for (const forbidden of listFromUnknown(opening.must_not_start_with)) {
      const normalized = forbidden.trim().toLowerCase()
      if (normalized && fullText.includes(normalized)) {
        addIssue(issues, {
          severity: 'BLOCKER',
          code: 'OPENING_FORBIDDEN_FACT',
          message: `Bab 1 memuat fakta pembuka yang dilarang: "${forbidden}".`,
          suggestion: 'Regenerate Bab 1 agar mengikuti Opening Contract, bukan langsung masuk ke kondisi yang baru boleh terjadi nanti.'
        })
      }
    }

    for (const required of listFromUnknown(opening.first_chapter_required_facts)) {
      const words = required
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length >= 5)
      const hasSignal = words.length > 0 && words.some((word) => fullText.includes(word))
      if (!hasSignal) {
        addIssue(issues, {
          severity: 'WARNING',
          code: 'OPENING_REQUIRED_FACT_MAY_BE_MISSING',
          message: `Bab 1 mungkin belum menampilkan fakta wajib: "${required}".`,
          suggestion: 'Pastikan sinopsis dan key events Bab 1 memperlihatkan fakta pembuka ini secara eksplisit.'
        })
      }
    }
  }

  for (const rawArc of getArcOrder(contract)) {
    if (!isPlainObject(rawArc) || !Array.isArray(rawArc.chapter_range)) continue
    const [start, end] = rawArc.chapter_range
    if (
      typeof start !== 'number' ||
      typeof end !== 'number' ||
      chapter.chapter_number < start ||
      chapter.chapter_number > end
    ) {
      continue
    }
    for (const forbidden of listFromUnknown(rawArc.forbidden_events)) {
      const normalized = forbidden.trim().toLowerCase()
      if (normalized && fullText.includes(normalized)) {
        addIssue(issues, {
          severity: 'BLOCKER',
          code: 'ARC_FORBIDDEN_EVENT',
          message: `Bab ${chapter.chapter_number} melanggar urutan arc: "${forbidden}".`,
          suggestion: 'Sesuaikan event bab dengan chapter intent/arc yang sedang aktif.'
        })
      }
    }
  }

  for (const mystery of mysteryLayers) {
    if (!mystery.answer || !mystery.revealed_at_chapter) continue
    if (chapter.chapter_number >= mystery.revealed_at_chapter) continue
    const answerSignal = mystery.answer
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 6)
      .slice(0, 5)
    if (answerSignal.length >= 2 && answerSignal.every((word) => fullText.includes(word))) {
      addIssue(issues, {
        severity: 'BLOCKER',
        code: 'MYSTERY_REVEALED_TOO_EARLY',
        message: `Jawaban misteri layer ${mystery.layer_number} tampak muncul sebelum Bab ${mystery.revealed_at_chapter}.`,
        suggestion: 'Ubah menjadi breadcrumb samar, bukan reveal eksplisit.'
      })
    }
  }

  const addressingRules = getRelationshipAddressing(contract)
  if (addressingRules.length > 0) {
    for (const rawRule of addressingRules) {
      if (!isPlainObject(rawRule)) continue
      const speaker = lower(rawRule.speaker)
      const addressee = lower(rawRule.addressee)
      if (!speaker || !addressee) continue
      if (!knownCharacters.has(speaker) || !knownCharacters.has(addressee)) {
        addIssue(issues, {
          severity: 'WARNING',
          code: 'ADDRESSING_CHARACTER_NOT_CANON',
          message: 'Ada aturan panggilan relasi yang merujuk karakter yang belum ada di Lorebook.',
          suggestion: 'Pastikan speaker/addressee pada relationship_addressing memakai nama karakter canon.'
        })
      }
    }
  }

  return {
    passed: !issues.some((issue) => issue.severity === 'BLOCKER'),
    issues
  }
}
