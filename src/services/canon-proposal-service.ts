import type {
  CanonProposal,
  Chapter,
  Character,
  Item,
  StoryValidationIssue
} from '../types/project'

interface BuildOutlineCanonProposalsInput {
  projectId: string
  chapter: Omit<Chapter, 'id'>
  existingChapterId?: string
  characters: Character[]
  items: Item[]
  issues: StoryValidationIssue[]
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function makeGroupId(chapterNumber: number): string {
  return `outline:${chapterNumber}:${crypto.randomUUID()}`
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function unknownActiveCharacters(chapter: Omit<Chapter, 'id'>, characters: Character[]): string[] {
  const known = new Set(characters.map((character) => normalize(character.name)))
  return unique(chapter.active_characters || []).filter((name) => !known.has(normalize(name)))
}

function unknownActiveItems(chapter: Omit<Chapter, 'id'>, items: Item[]): string[] {
  const known = new Set(items.map((item) => normalize(item.name)))
  return unique(chapter.active_items || []).filter((name) => !known.has(normalize(name)))
}

function relevantIssuesForName(issues: StoryValidationIssue[], name: string): StoryValidationIssue[] {
  const needle = normalize(name)
  return issues.filter((issue) => normalize(issue.message).includes(needle))
}

export function buildOutlineCanonProposals({
  projectId,
  chapter,
  existingChapterId,
  characters,
  items,
  issues
}: BuildOutlineCanonProposalsInput): CanonProposal[] {
  const proposalIssues = issues.filter((issue) =>
    issue.code === 'UNKNOWN_ACTIVE_CHARACTER' || issue.code === 'UNKNOWN_ACTIVE_ITEM'
  )
  if (proposalIssues.length === 0) return []

  const groupId = makeGroupId(chapter.chapter_number)
  const createdAt = new Date().toISOString()
  const characterNames = unknownActiveCharacters(chapter, characters).slice(0, 2)
  const itemNames = unknownActiveItems(chapter, items).slice(0, 2)

  const characterProposals: CanonProposal[] = characterNames.map((name) => ({
    id: crypto.randomUUID(),
    group_id: groupId,
    project_id: projectId,
    chapter_number: chapter.chapter_number,
    source: 'outline',
    source_id: existingChapterId,
    proposal_type: 'character',
    status: 'PENDING',
    classification: 'NEW_CANON_REQUIRED',
    reason: `Outline Bab ${chapter.chapter_number} memakai "${name}" sebagai karakter aktif, tetapi karakter ini belum ada di Lorebook.`,
    evidence: [
      chapter.synopsis || '',
      ...(chapter.key_events || []),
      chapter.cliffhanger_setup || ''
    ].filter(Boolean),
    payload: {
      name,
      role: 'SUPPORTING',
      description: `Karakter pendukung yang diusulkan AI untuk Bab ${chapter.chapter_number}. Edit deskripsi ini sebelum menyetujui jika karakter ini akan menjadi canon penting.`,
      voice_dna: {},
      activation_keys: [name],
      priority: 5,
      is_locked: false,
      genesis: 'BRAINSTORMED'
    },
    suggested_contract_patch: {
      canon_entities: [
        {
          name,
          entity_type: 'character',
          db_role: 'SUPPORTING',
          story_tags: ['ai_proposed', `chapter_${chapter.chapter_number}`],
          aliases: [name]
        }
      ]
    },
    validation_issues: relevantIssuesForName(proposalIssues, name),
    candidate_chapter: chapter,
    existing_chapter_id: existingChapterId,
    created_at: createdAt
  }))

  const itemProposals: CanonProposal[] = itemNames.map((name) => ({
    id: crypto.randomUUID(),
    group_id: groupId,
    project_id: projectId,
    chapter_number: chapter.chapter_number,
    source: 'outline',
    source_id: existingChapterId,
    proposal_type: 'item',
    status: 'PENDING',
    classification: 'NEW_CANON_REQUIRED',
    reason: `Outline Bab ${chapter.chapter_number} memakai "${name}" sebagai item aktif, tetapi item ini belum ada di Lorebook.`,
    evidence: [
      chapter.synopsis || '',
      ...(chapter.key_events || []),
      chapter.cliffhanger_setup || ''
    ].filter(Boolean),
    payload: {
      name,
      category: 'OTHER',
      description: `Item yang diusulkan AI untuk Bab ${chapter.chapter_number}. Edit deskripsi ini sebelum menyetujui jika item ini akan menjadi canon penting.`,
      significance: 'Diusulkan oleh AI karena muncul sebagai item aktif di outline.',
      activation_keys: [name],
      current_owner: '',
      priority: 5,
      genesis: 'BRAINSTORMED'
    },
    suggested_contract_patch: {
      canon_entities: [
        {
          name,
          entity_type: 'item',
          story_tags: ['ai_proposed', `chapter_${chapter.chapter_number}`],
          aliases: [name]
        }
      ]
    },
    validation_issues: relevantIssuesForName(proposalIssues, name),
    candidate_chapter: chapter,
    existing_chapter_id: existingChapterId,
    created_at: createdAt
  }))

  return [...characterProposals, ...itemProposals]
}

export function getPendingCanonProposalGroups(proposals: CanonProposal[]): string[] {
  return unique(
    proposals
      .filter((proposal) => proposal.status === 'PENDING')
      .map((proposal) => proposal.group_id)
  )
}
