import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
  type SimulationLinkDatum
} from 'd3-force'
import { useProjectStore } from '../../store/useProjectStore'
import type { Character, Item, PlotThread } from '../../types/project'

// ── Types ────────────────────────────────────────────────────────────────

type NodeType = 'character' | 'item' | 'thread'
type EdgeType = 'co-appearance' | 'ownership' | 'threaded-in'

interface VizNode extends SimulationNodeDatum {
  id: string
  label: string
  type: NodeType
  color: string
  description: string
  meta: string // role / category / urgency
  priority: number
  /** Set of chapter_numbers where this entity is "active". */
  chapters: Set<number>
}

interface VizEdge extends SimulationLinkDatum<VizNode> {
  source: string | VizNode
  target: string | VizNode
  type: EdgeType
  weight: number
}

// ── Color Maps ───────────────────────────────────────────────────────────

const ROLE_COLOR: Record<Character['role'], string> = {
  PROTAGONIST: '#a855f7',
  ANTAGONIST: '#f43f5e',
  SUPPORTING: '#34d399',
  MINOR: '#94a3b8'
}

const ITEM_COLOR: Record<Item['category'], string> = {
  WEAPON: '#f43f5e',
  MAGICAL: '#a855f7',
  DOCUMENT: '#fbbf24',
  JEWELRY: '#f472b6',
  VEHICLE: '#60a5fa',
  KEY_ITEM: '#34d399',
  OTHER: '#94a3b8'
}

const URGENCY_COLOR: Record<PlotThread['urgency'], string> = {
  LOW: '#94a3b8',
  MEDIUM: '#60a5fa',
  HIGH: '#fb923c',
  CRITICAL: '#f43f5e'
}

const EDGE_COLOR: Record<EdgeType, string> = {
  'co-appearance': '#60a5fa',
  ownership: '#fbbf24',
  'threaded-in': '#a855f7'
}

const NODE_CAP = 50

// ── Hook: viewport detection ─────────────────────────────────────────────

const useIsMobile = (): boolean => {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

// ── Build graph from store data ──────────────────────────────────────────

const findCharacterIdByActivation = (
  rawName: string,
  characters: Character[]
): string | null => {
  const lower = rawName.toLowerCase()
  for (const c of characters) {
    if (c.name.toLowerCase() === lower) return c.id
    for (const k of c.activation_keys ?? []) {
      if (lower.includes(k.toLowerCase())) return c.id
    }
  }
  return null
}

interface BuildGraphInput {
  characters: Character[]
  items: Item[]
  threads: PlotThread[]
  chapters: Array<{ chapter_number: number; active_characters: string[]; active_items: string[] }>
  filterTypes: Set<NodeType>
  filterEdges: Set<EdgeType>
  rangeMin: number
  rangeMax: number
}

const buildGraph = (input: BuildGraphInput): { nodes: VizNode[]; edges: VizEdge[] } => {
  const charById = new Map<string, Character>()
  for (const c of input.characters) charById.set(c.id, c)
  const itemById = new Map<string, Item>()
  for (const i of input.items) itemById.set(i.id, i)

  // Step 1 — collect chapter membership per entity (in range)
  const charChapters = new Map<string, Set<number>>()
  const itemChapters = new Map<string, Set<number>>()

  for (const ch of input.chapters) {
    if (ch.chapter_number < input.rangeMin || ch.chapter_number > input.rangeMax) continue

    for (const raw of ch.active_characters ?? []) {
      const cid = findCharacterIdByActivation(raw, input.characters)
      if (!cid) continue
      const set = charChapters.get(cid) ?? new Set<number>()
      set.add(ch.chapter_number)
      charChapters.set(cid, set)
    }

    for (const raw of ch.active_items ?? []) {
      // Items keyed by name match
      const lower = raw.toLowerCase()
      const matched = input.items.find(
        (it) =>
          it.name.toLowerCase() === lower ||
          (it.activation_keys ?? []).some((k) => lower.includes(k.toLowerCase()))
      )
      if (!matched) continue
      const set = itemChapters.get(matched.id) ?? new Set<number>()
      set.add(ch.chapter_number)
      itemChapters.set(matched.id, set)
    }
  }

  const nodes: VizNode[] = []

  if (input.filterTypes.has('character')) {
    for (const c of input.characters) {
      const chapters = charChapters.get(c.id) ?? new Set<number>()
      // For protagonists/antagonists always include even if missing from active_characters
      if (chapters.size === 0 && c.role !== 'PROTAGONIST' && c.role !== 'ANTAGONIST') continue
      nodes.push({
        id: `char:${c.id}`,
        label: c.name,
        type: 'character',
        color: ROLE_COLOR[c.role],
        description: c.description?.slice(0, 140) ?? '',
        meta: c.role,
        priority: c.priority ?? 0,
        chapters
      })
    }
  }

  if (input.filterTypes.has('item')) {
    for (const i of input.items) {
      const chapters = itemChapters.get(i.id) ?? new Set<number>()
      if (chapters.size === 0 && (i.priority ?? 0) < 8) continue
      nodes.push({
        id: `item:${i.id}`,
        label: i.name,
        type: 'item',
        color: ITEM_COLOR[i.category],
        description: i.description?.slice(0, 140) ?? '',
        meta: i.category,
        priority: i.priority ?? 0,
        chapters
      })
    }
  }

  if (input.filterTypes.has('thread')) {
    for (const t of input.threads) {
      // Include thread if its planted_at falls within range, OR it's still active in range
      const inRange =
        t.planted_at <= input.rangeMax &&
        (t.resolved_at == null || t.resolved_at >= input.rangeMin)
      if (!inRange) continue
      nodes.push({
        id: `thread:${t.id}`,
        label: t.title,
        type: 'thread',
        color: URGENCY_COLOR[t.urgency],
        description: t.notes?.slice(0, 140) ?? '',
        meta: t.urgency,
        priority:
          t.urgency === 'CRITICAL'
            ? 10
            : t.urgency === 'HIGH'
              ? 8
              : t.urgency === 'MEDIUM'
                ? 5
                : 3,
        chapters: new Set<number>()
      })
    }
  }

  // Cap to top N by priority + chapter coverage
  nodes.sort((a, b) => {
    const aScore = a.priority + a.chapters.size * 0.5
    const bScore = b.priority + b.chapters.size * 0.5
    return bScore - aScore
  })
  const visibleNodes = nodes.slice(0, NODE_CAP)
  const visibleIds = new Set(visibleNodes.map((n) => n.id))

  const edges: VizEdge[] = []
  const edgeKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const addedEdges = new Set<string>()

  // Co-appearance: chars sharing chapters
  if (input.filterEdges.has('co-appearance')) {
    const charNodes = visibleNodes.filter((n) => n.type === 'character')
    for (let i = 0; i < charNodes.length; i++) {
      for (let j = i + 1; j < charNodes.length; j++) {
        const a = charNodes[i]
        const b = charNodes[j]
        const shared = [...a.chapters].filter((x) => b.chapters.has(x)).length
        if (shared === 0) continue
        const k = edgeKey(a.id, b.id)
        if (addedEdges.has(k)) continue
        addedEdges.add(k)
        edges.push({
          source: a.id,
          target: b.id,
          type: 'co-appearance',
          weight: shared
        })
      }
    }
  }

  // Ownership: item.current_owner → char (by name match)
  if (input.filterEdges.has('ownership')) {
    for (const i of input.items) {
      if (!visibleIds.has(`item:${i.id}`) || !i.current_owner) continue
      const ownerCharId = findCharacterIdByActivation(i.current_owner, input.characters)
      if (!ownerCharId) continue
      if (!visibleIds.has(`char:${ownerCharId}`)) continue
      const k = edgeKey(`item:${i.id}`, `char:${ownerCharId}`)
      if (addedEdges.has(k)) continue
      addedEdges.add(k)
      edges.push({
        source: `item:${i.id}`,
        target: `char:${ownerCharId}`,
        type: 'ownership',
        weight: 1
      })
    }
  }

  // Threaded-in: thread → related_characters
  if (input.filterEdges.has('threaded-in')) {
    for (const t of input.threads) {
      if (!visibleIds.has(`thread:${t.id}`)) continue
      for (const cid of t.related_characters ?? []) {
        if (!visibleIds.has(`char:${cid}`)) continue
        const k = edgeKey(`thread:${t.id}`, `char:${cid}`)
        if (addedEdges.has(k)) continue
        addedEdges.add(k)
        edges.push({
          source: `thread:${t.id}`,
          target: `char:${cid}`,
          type: 'threaded-in',
          weight: 1
        })
      }
    }
  }

  return { nodes: visibleNodes, edges }
}

// ── Mobile fallback ──────────────────────────────────────────────────────

const ConstellationListFallback: React.FC<{ nodes: VizNode[]; edges: VizEdge[] }> = ({
  nodes,
  edges
}) => {
  const groups = useMemo(() => {
    const buckets: Record<NodeType, VizNode[]> = { character: [], item: [], thread: [] }
    for (const n of nodes) buckets[n.type].push(n)
    return buckets
  }, [nodes])

  const connectionsForNode = useCallback(
    (nodeId: string) => {
      const matches: Array<{ partner: VizNode; type: EdgeType; weight: number }> = []
      for (const e of edges) {
        const srcId = typeof e.source === 'string' ? e.source : e.source.id
        const tgtId = typeof e.target === 'string' ? e.target : e.target.id
        if (srcId === nodeId) {
          const partner = nodes.find((n) => n.id === tgtId)
          if (partner) matches.push({ partner, type: e.type, weight: e.weight })
        } else if (tgtId === nodeId) {
          const partner = nodes.find((n) => n.id === srcId)
          if (partner) matches.push({ partner, type: e.type, weight: e.weight })
        }
      }
      return matches.sort((a, b) => b.weight - a.weight).slice(0, 3)
    },
    [edges, nodes]
  )

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto">
      {(['character', 'item', 'thread'] as NodeType[]).map((type) => {
        const items = groups[type]
        if (items.length === 0) return null
        return (
          <section key={type}>
            <h3 className="text-title-sm font-bold text-on-surface mb-2 capitalize">
              {type === 'character' ? '👤 Karakter' : type === 'item' ? '🗝️ Item' : '🧵 Thread'} (
              {items.length})
            </h3>
            <div className="space-y-2">
              {items.map((n) => {
                const partners = connectionsForNode(n.id)
                return (
                  <div
                    key={n.id}
                    className="bg-surface-container-low rounded-lg p-3 border border-outline-variant/15"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block shrink-0"
                        style={{ backgroundColor: n.color }}
                      />
                      <span className="font-bold text-on-surface">{n.label}</span>
                      <span className="text-[10px] text-on-surface-variant/60 uppercase">
                        {n.meta}
                      </span>
                    </div>
                    {partners.length > 0 ? (
                      <ul className="mt-2 ml-5 space-y-0.5 text-body-sm text-on-surface-variant">
                        {partners.map((p, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: EDGE_COLOR[p.type] }}
                            />
                            <span className="truncate">
                              {p.type === 'co-appearance'
                                ? `bersama ${p.partner.label} (${p.weight} bab)`
                                : p.type === 'ownership'
                                  ? `dimiliki ${p.partner.label}`
                                  : `terhubung ke ${p.partner.label}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-on-surface-variant/50 mt-1 ml-5 italic">
                        belum ada koneksi
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ── Desktop SVG Force Graph ──────────────────────────────────────────────

interface ForceGraphProps {
  nodes: VizNode[]
  edges: VizEdge[]
  width: number
  height: number
}

const ForceGraph: React.FC<ForceGraphProps> = ({ nodes, edges, width, height }) => {
  const simRef = useRef<Simulation<VizNode, VizEdge> | null>(null)
  const [tick, setTick] = useState(0)
  const [hovered, setHovered] = useState<VizNode | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })

  // Build / restart simulation when graph changes
  useEffect(() => {
    // Stop previous sim
    if (simRef.current) {
      simRef.current.stop()
    }

    if (nodes.length === 0) {
      return
    }

    const sim = forceSimulation<VizNode, VizEdge>(nodes)
      .force(
        'link',
        forceLink<VizNode, VizEdge>(edges)
          .id((d) => d.id)
          .distance(80)
          .strength(0.6)
      )
      .force('charge', forceManyBody<VizNode>().strength(-220))
      .force('center', forceCenter<VizNode>(width / 2, height / 2))
      .force('collide', forceCollide<VizNode>(22))
      .alpha(1)
      .alphaDecay(0.05)

    simRef.current = sim
    sim.on('tick', () => setTick((t) => t + 1))

    return () => {
      sim.stop()
    }
  }, [nodes, edges, width, height])

  // Compute connected node ids for highlight
  const connectedIds = useMemo(() => {
    if (!selected) return null
    const ids = new Set<string>([selected])
    for (const e of edges) {
      const srcId = typeof e.source === 'string' ? e.source : e.source.id
      const tgtId = typeof e.target === 'string' ? e.target : e.target.id
      if (srcId === selected) ids.add(tgtId)
      if (tgtId === selected) ids.add(srcId)
    }
    return ids
  }, [selected, edges])

  // Drag state
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null)
  const panRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)

  const onNodeMouseDown = (e: React.MouseEvent, node: VizNode) => {
    e.stopPropagation()
    if (node.x == null || node.y == null) return
    node.fx = node.x
    node.fy = node.y
    dragRef.current = {
      id: node.id,
      offsetX: e.clientX - node.x,
      offsetY: e.clientY - node.y
    }
    simRef.current?.alphaTarget(0.3).restart()
  }

  const onSvgMouseMove = (e: React.MouseEvent) => {
    if (dragRef.current) {
      const node = nodes.find((n) => n.id === dragRef.current?.id)
      if (node) {
        node.fx = e.clientX - dragRef.current.offsetX
        node.fy = e.clientY - dragRef.current.offsetY
      }
    } else if (panRef.current) {
      setTransform((t) => ({
        ...t,
        x: panRef.current!.tx + (e.clientX - panRef.current!.startX),
        y: panRef.current!.ty + (e.clientY - panRef.current!.startY)
      }))
    }
  }

  const onSvgMouseUp = () => {
    if (dragRef.current) {
      const node = nodes.find((n) => n.id === dragRef.current?.id)
      if (node) {
        node.fx = null
        node.fy = null
      }
      simRef.current?.alphaTarget(0)
      dragRef.current = null
    }
    panRef.current = null
  }

  const onSvgMouseDown = (e: React.MouseEvent) => {
    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      tx: transform.x,
      ty: transform.y
    }
  }

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setTransform((t) => ({ ...t, k: Math.max(0.3, Math.min(3, t.k * delta)) }))
  }

  // Render node shapes per type
  const renderNodeShape = (n: VizNode, isFaded: boolean, isSelected: boolean) => {
    const opacity = isFaded ? 0.2 : 1
    const stroke = isSelected ? '#fff' : 'rgba(0,0,0,0.4)'
    const strokeWidth = isSelected ? 3 : 1.5

    if (n.type === 'character') {
      return (
        <circle
          r={12}
          fill={n.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )
    }
    if (n.type === 'item') {
      return (
        <rect
          x={-10}
          y={-10}
          width={20}
          height={20}
          rx={3}
          fill={n.color}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )
    }
    // hexagon for thread
    const r = 12
    const points: string[] = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`)
    }
    return (
      <polygon
        points={points.join(' ')}
        fill={n.color}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
      />
    )
  }

  // Reference tick to satisfy lint
  void tick

  return (
    <div className="relative" style={{ width, height }}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Constellation map dengan ${nodes.length} nodes dan ${edges.length} edges`}
        className="rounded-lg bg-surface-container-low border border-outline-variant/15 cursor-grab active:cursor-grabbing"
        onMouseMove={onSvgMouseMove}
        onMouseUp={onSvgMouseUp}
        onMouseLeave={onSvgMouseUp}
        onMouseDown={onSvgMouseDown}
        onWheel={onWheel}
        onClick={() => setSelected(null)}
      >
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Edges */}
          {edges.map((e, i) => {
            const src = typeof e.source === 'string' ? null : e.source
            const tgt = typeof e.target === 'string' ? null : e.target
            if (!src || !tgt || src.x == null || src.y == null || tgt.x == null || tgt.y == null)
              return null
            const isFaded =
              connectedIds !== null &&
              !(connectedIds.has(src.id) && connectedIds.has(tgt.id))
            return (
              <line
                key={`e-${i}`}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={EDGE_COLOR[e.type]}
                strokeWidth={Math.min(4, 1 + Math.log2(e.weight + 1))}
                opacity={isFaded ? 0.1 : 0.6}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            if (n.x == null || n.y == null) return null
            const isFaded = connectedIds !== null && !connectedIds.has(n.id)
            const isSelected = selected === n.id
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: 'pointer' }}
                onMouseDown={(e) => onNodeMouseDown(e, n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelected((cur) => (cur === n.id ? null : n.id))
                }}
              >
                {renderNodeShape(n, isFaded, isSelected)}
                <text
                  x={16}
                  y={4}
                  fontSize={11}
                  fill="#e2e8f0"
                  opacity={isFaded ? 0.3 : 1}
                  style={{
                    pointerEvents: 'none',
                    paintOrder: 'stroke',
                    stroke: 'rgba(0,0,0,0.6)',
                    strokeWidth: 2
                  }}
                >
                  {n.label.length > 20 ? `${n.label.slice(0, 20)}…` : n.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hovered && (
        <div className="absolute top-2 right-2 bg-surface-container-high border border-outline-variant/40 rounded-lg shadow-lg px-3 py-2 max-w-[280px] text-body-sm pointer-events-none">
          <div className="flex items-center gap-2 font-bold text-on-surface">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: hovered.color }}
            />
            {hovered.label}
            <span className="text-[10px] text-on-surface-variant/60 uppercase">
              {hovered.meta}
            </span>
          </div>
          {hovered.description && (
            <div className="text-on-surface-variant/80 mt-1 text-[11px] leading-snug">
              {hovered.description}
            </div>
          )}
          {hovered.chapters.size > 0 && (
            <div className="text-[10px] text-on-surface-variant/60 mt-1">
              Aktif di {hovered.chapters.size} bab
            </div>
          )}
        </div>
      )}

      {/* Reset zoom */}
      <button
        onClick={() => setTransform({ x: 0, y: 0, k: 1 })}
        className="absolute bottom-2 right-2 px-2 py-1 rounded bg-surface-container-high text-[10px] text-on-surface-variant border border-outline-variant/30 cursor-pointer hover:bg-surface-container-highest"
      >
        🔍 Reset
      </button>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────

export const ConstellationMap: React.FC = () => {
  const characters = useProjectStore((s) => s.characters)
  const items = useProjectStore((s) => s.items)
  const threads = useProjectStore((s) => s.plotThreads)
  const chapters = useProjectStore((s) => s.chapters)
  const project = useProjectStore((s) => s.activeProject)
  const isMobile = useIsMobile()

  const totalChapters = project?.target_chapters || chapters.length || 1

  const [filterTypes, setFilterTypes] = useState<Set<NodeType>>(
    () => new Set(['character', 'item', 'thread'])
  )
  const [filterEdges, setFilterEdges] = useState<Set<EdgeType>>(
    () => new Set(['co-appearance', 'ownership', 'threaded-in'])
  )
  const [rangeMin, setRangeMin] = useState(1)
  const [rangeMax, setRangeMax] = useState(totalChapters)
  const [lastTotalChapters, setLastTotalChapters] = useState(totalChapters)

  // Reset range when project's total chapters changes (prev-prop-during-render
  // pattern; avoids effect-driven setState).
  if (totalChapters !== lastTotalChapters) {
    setLastTotalChapters(totalChapters)
    setRangeMin(1)
    setRangeMax(totalChapters)
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 600, h: 480 })

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const e = entries[0]
      if (e) {
        setSize({ w: Math.max(300, e.contentRect.width), h: 480 })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const { nodes, edges } = useMemo(
    () =>
      buildGraph({
        characters,
        items,
        threads,
        chapters: chapters.map((c) => ({
          chapter_number: c.chapter_number,
          active_characters: c.active_characters ?? [],
          active_items: c.active_items ?? []
        })),
        filterTypes,
        filterEdges,
        rangeMin,
        rangeMax
      }),
    [characters, items, threads, chapters, filterTypes, filterEdges, rangeMin, rangeMax]
  )

  const toggleType = (t: NodeType) => {
    setFilterTypes((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  const toggleEdge = (e: EdgeType) => {
    setFilterEdges((prev) => {
      const next = new Set(prev)
      if (next.has(e)) next.delete(e)
      else next.add(e)
      return next
    })
  }

  return (
    <div className="flex flex-col gap-3" ref={containerRef}>
      {/* Filters */}
      <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant/15">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mr-1">
            Nodes
          </span>
          {(['character', 'item', 'thread'] as NodeType[]).map((t) => (
            <label key={t} className="flex items-center gap-1 text-body-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filterTypes.has(t)}
                onChange={() => toggleType(t)}
                className="cursor-pointer accent-primary"
              />
              <span className="capitalize text-on-surface-variant">
                {t === 'character' ? '👤 Char' : t === 'item' ? '🗝️ Item' : '🧵 Thread'}
              </span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mr-1">
            Edges
          </span>
          {(['co-appearance', 'ownership', 'threaded-in'] as EdgeType[]).map((e) => (
            <label key={e} className="flex items-center gap-1 text-body-sm cursor-pointer">
              <input
                type="checkbox"
                checked={filterEdges.has(e)}
                onChange={() => toggleEdge(e)}
                className="cursor-pointer accent-primary"
              />
              <span className="text-on-surface-variant">
                <span
                  className="inline-block w-2 h-0.5 mr-1 align-middle"
                  style={{ backgroundColor: EDGE_COLOR[e] }}
                />
                {e}
              </span>
            </label>
          ))}
        </div>
        {totalChapters > 1 && (
          <div className="flex items-center gap-2 text-body-sm">
            <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant/60 mr-1 shrink-0">
              Range
            </span>
            <span className="text-on-surface-variant text-[11px] shrink-0 w-16 text-right">
              Bab {rangeMin}
            </span>
            <input
              type="range"
              min={1}
              max={totalChapters}
              value={rangeMin}
              onChange={(e) =>
                setRangeMin(Math.min(Number(e.target.value), rangeMax))
              }
              className="flex-1 accent-primary cursor-pointer"
            />
            <input
              type="range"
              min={1}
              max={totalChapters}
              value={rangeMax}
              onChange={(e) =>
                setRangeMax(Math.max(Number(e.target.value), rangeMin))
              }
              className="flex-1 accent-primary cursor-pointer"
            />
            <span className="text-on-surface-variant text-[11px] shrink-0 w-16">
              – {rangeMax}
            </span>
          </div>
        )}
      </div>

      {/* Graph or fallback */}
      {nodes.length === 0 ? (
        <div className="text-center py-8 text-on-surface-variant/70">
          Tidak ada entity di range/filter ini. Coba longgarkan filter atau range bab.
        </div>
      ) : isMobile ? (
        <ConstellationListFallback nodes={nodes} edges={edges} />
      ) : (
        <ForceGraph nodes={nodes} edges={edges} width={size.w} height={size.h} />
      )}

      {nodes.length >= NODE_CAP && (
        <div className="text-[11px] text-amber-400 italic">
          Menampilkan {NODE_CAP} entity teratas. Sempitkan filter untuk lihat lebih spesifik.
        </div>
      )}
    </div>
  )
}
