-- VibeNovel v2 — Supabase Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- 13 tables + RLS + pgvector extension

-- ============================================================
-- 0. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================
-- 1. PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  genre                 TEXT NOT NULL DEFAULT '',
  genesis_mode          TEXT NOT NULL DEFAULT 'FRESH_BRAINSTORM'
                        CHECK (genesis_mode IN ('FRESH_BRAINSTORM','FRESH_BLUEPRINT','IMPORTED')),
  target_chapters       INT  NOT NULL DEFAULT 100,
  word_count_target     INT  NOT NULL DEFAULT 1500,
  word_count_min        INT  DEFAULT 1200,
  word_count_max        INT  DEFAULT 1800,
  prose_provider        TEXT NOT NULL DEFAULT 'gemini'
                        CHECK (prose_provider IN ('gemini','openrouter')),
  prose_model           TEXT NOT NULL DEFAULT 'gemini-2.0-flash',
  status                TEXT NOT NULL DEFAULT 'BRAINSTORMING'
                        CHECK (status IN ('BRAINSTORMING','OUTLINING','WRITING','PAUSED','COMPLETED')),
  narrative_constitution TEXT,
  target_ending         TEXT,
  theme_and_tone        TEXT,
  -- Sprint 5 — Hook Chain (top-level project hooks)
  series_hook           TEXT,
  season_hooks          JSONB NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. CHARACTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS characters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'SUPPORTING'
                  CHECK (role IN ('PROTAGONIST','ANTAGONIST','SUPPORTING','MINOR')),
  description     TEXT NOT NULL DEFAULT '',
  voice_dna       JSONB NOT NULL DEFAULT '{}',
  activation_keys TEXT[] NOT NULL DEFAULT '{}',
  priority        INT  NOT NULL DEFAULT 5,
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
  genesis         TEXT NOT NULL DEFAULT 'BRAINSTORMED'
                  CHECK (genesis IN ('BRAINSTORMED','IMPORTED','AUTO_EXTRACTED','MANUAL')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'OTHER'
                  CHECK (category IN ('WEAPON','MAGICAL','DOCUMENT','JEWELRY','VEHICLE','KEY_ITEM','OTHER')),
  description     TEXT NOT NULL DEFAULT '',
  significance    TEXT NOT NULL DEFAULT '',
  activation_keys TEXT[] NOT NULL DEFAULT '{}',
  current_owner   TEXT NOT NULL DEFAULT '',
  priority        INT  NOT NULL DEFAULT 5,
  genesis         TEXT NOT NULL DEFAULT 'BRAINSTORMED'
                  CHECK (genesis IN ('BRAINSTORMED','IMPORTED','AUTO_EXTRACTED','MANUAL')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. WORLD_RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS world_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category        TEXT NOT NULL DEFAULT 'OTHER'
                  CHECK (category IN ('MAGIC_SYSTEM','SOCIAL_RULE','GEOGRAPHY','TECHNOLOGY','OTHER')),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  priority        INT  NOT NULL DEFAULT 5,
  activation_keys TEXT[] NOT NULL DEFAULT '{}',
  genesis         TEXT NOT NULL DEFAULT 'BRAINSTORMED'
                  CHECK (genesis IN ('BRAINSTORMED','IMPORTED','AUTO_EXTRACTED','MANUAL')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. SEASONS
-- ============================================================
CREATE TABLE IF NOT EXISTS seasons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  season_number  INT  NOT NULL,
  title          TEXT NOT NULL DEFAULT '',
  premise        TEXT NOT NULL DEFAULT '',
  target_goal    TEXT NOT NULL DEFAULT '',
  start_chapter  INT  NOT NULL DEFAULT 1,
  end_chapter    INT  NOT NULL DEFAULT 50,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, season_number)
);

-- ============================================================
-- 6. SUB_ARCS
-- ============================================================
CREATE TABLE IF NOT EXISTS sub_arcs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id     UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  title         TEXT NOT NULL DEFAULT '',
  start_chapter INT  NOT NULL,
  end_chapter   INT  NOT NULL,
  goal          TEXT NOT NULL DEFAULT '',
  mini_climax   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. CHAPTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_number      INT  NOT NULL,

  -- Metadata
  title               TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'OUTLINE_ONLY'
                      CHECK (status IN ('OUTLINE_ONLY','GENERATING','DRAFT','FINAL','IMPORTED')),

  -- Outline fields
  synopsis            TEXT,
  key_events          JSONB NOT NULL DEFAULT '[]',
  active_characters   TEXT[] NOT NULL DEFAULT '{}',
  active_items        TEXT[] NOT NULL DEFAULT '{}',
  location            TEXT,
  time_in_story       TEXT,
  emotional_tone      TEXT,
  cliffhanger_type    TEXT,
  cliffhanger_setup   TEXT,
  dopamine_beat       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Sprint 5 — False Resolution flag (KBM Retention Engine)
  false_resolution    BOOLEAN NOT NULL DEFAULT FALSE,
  paywall_advice      TEXT,
  arc_position        JSONB,
  open_threads        TEXT[] NOT NULL DEFAULT '{}',
  resolved_threads    TEXT[] NOT NULL DEFAULT '{}',
  foreshadowing       TEXT[] NOT NULL DEFAULT '{}',
  chapter_end_state   JSONB,
  do_not_include      TEXT[] NOT NULL DEFAULT '{}',
  must_connect_to     TEXT,
  filler_risk         TEXT,

  -- Prose fields
  prose               TEXT,
  word_count          INT  NOT NULL DEFAULT 0,
  beats               JSONB NOT NULL DEFAULT '[]',

  -- Source tracking
  outline_source      TEXT NOT NULL DEFAULT 'GENERATED'
                      CHECK (outline_source IN ('GENERATED','MANUAL','IMPORTED')),
  prose_source        TEXT NOT NULL DEFAULT 'GENERATED'
                      CHECK (prose_source IN ('GENERATED','MANUAL_WRITE','IMPORTED','MIXED')),
  is_locked           BOOLEAN NOT NULL DEFAULT FALSE,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (project_id, chapter_number)
);

-- ============================================================
-- 8. CHARACTER_STATES
-- ============================================================
CREATE TABLE IF NOT EXISTS character_states (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id        UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_number      INT  NOT NULL,
  location            TEXT NOT NULL DEFAULT '',
  physical_condition  TEXT NOT NULL DEFAULT '',
  emotional_state     TEXT NOT NULL DEFAULT '',
  inventory           TEXT[] NOT NULL DEFAULT '{}',
  relationships       JSONB NOT NULL DEFAULT '{}',
  last_action         TEXT NOT NULL DEFAULT '',
  source              TEXT NOT NULL DEFAULT 'AUTO_GENERATED'
                      CHECK (source IN ('AUTO_GENERATED','MANUAL_EDIT','IMPORTED')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (character_id, chapter_number)
);

-- ============================================================
-- 9. MYSTERY_LAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS mystery_layers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  season_id            UUID REFERENCES seasons(id) ON DELETE SET NULL,
  layer_number         INT  NOT NULL,
  central_question     TEXT NOT NULL DEFAULT '',
  revealed_at_chapter  INT,
  answer               TEXT,
  opens_next_question  TEXT,
  breadcrumbs          JSONB NOT NULL DEFAULT '[]',
  status               TEXT NOT NULL DEFAULT 'PLANNED'
                       CHECK (status IN ('PLANNED','ACTIVE','REVEALED')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, layer_number)
);

-- ============================================================
-- 10. PLOT_THREADS
-- ============================================================
CREATE TABLE IF NOT EXISTS plot_threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL DEFAULT '',
  planted_at          INT  NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'PLANTED'
                      CHECK (status IN ('PLANTED','ACTIVE','RESOLVED','ABANDONED')),
  resolved_at         INT,
  urgency             TEXT NOT NULL DEFAULT 'MEDIUM'
                      CHECK (urgency IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  related_characters  TEXT[] NOT NULL DEFAULT '{}',
  related_items       TEXT[] NOT NULL DEFAULT '{}',
  notes               TEXT NOT NULL DEFAULT '',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. CHAPTER_SUMMARIES  (for RAG / pgvector)
-- ============================================================
CREATE TABLE IF NOT EXISTS chapter_summaries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  summary       TEXT NOT NULL DEFAULT '',
  embedding     vector(768),          -- Gemini text-embedding-004 dim
  key_facts     JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chapter_id)
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS chapter_summaries_embedding_idx
  ON chapter_summaries USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- 12. EMOTIONAL_PATTERNS
-- ============================================================
CREATE TABLE IF NOT EXISTS emotional_patterns (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_number   INT  NOT NULL,
  planned_emotion  TEXT NOT NULL DEFAULT 'TENSION'
                   CHECK (planned_emotion IN ('TENSION','RELIEF','DOPAMINE','SHOCK','BREATHER')),
  actual_emotion   TEXT,
  false_resolution BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, chapter_number)
);

-- ============================================================
-- 13. ARCHIVED_OUTLINES  (when target chapters decreases)
-- ============================================================
CREATE TABLE IF NOT EXISTS archived_outlines (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  chapter_number INT  NOT NULL,
  outline_data   JSONB NOT NULL DEFAULT '{}',
  archived_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- PROJECTS — direct user ownership
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_owner_policy" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- CHARACTERS — via project ownership
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "characters_owner_policy" ON characters
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- ITEMS
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_owner_policy" ON items
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- WORLD_RULES
ALTER TABLE world_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "world_rules_owner_policy" ON world_rules
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- SEASONS
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seasons_owner_policy" ON seasons
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- SUB_ARCS
ALTER TABLE sub_arcs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_arcs_owner_policy" ON sub_arcs
  FOR ALL USING (
    season_id IN (
      SELECT s.id FROM seasons s
      JOIN projects p ON s.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- CHAPTERS
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapters_owner_policy" ON chapters
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- CHARACTER_STATES
ALTER TABLE character_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "character_states_owner_policy" ON character_states
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- MYSTERY_LAYERS
ALTER TABLE mystery_layers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mystery_layers_owner_policy" ON mystery_layers
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- PLOT_THREADS
ALTER TABLE plot_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plot_threads_owner_policy" ON plot_threads
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- CHAPTER_SUMMARIES
ALTER TABLE chapter_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chapter_summaries_owner_policy" ON chapter_summaries
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- EMOTIONAL_PATTERNS
ALTER TABLE emotional_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "emotional_patterns_owner_policy" ON emotional_patterns
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- ARCHIVED_OUTLINES
ALTER TABLE archived_outlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "archived_outlines_owner_policy" ON archived_outlines
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- ============================================================
-- DONE! 13 tables created with RLS.
-- Next: Enable Google OAuth in Supabase Auth dashboard,
--       then copy VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local
-- ============================================================


-- ============================================================
-- SPRINT 5 MIGRATION (idempotent — safe to re-run)
-- ============================================================
-- Run this block on databases provisioned before Sprint 5 to add
-- the new Retention Engine columns. New databases that ran the
-- CREATE TABLE statements above already include these columns.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS series_hook  TEXT,
  ADD COLUMN IF NOT EXISTS season_hooks JSONB NOT NULL DEFAULT '[]';

ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS false_resolution BOOLEAN NOT NULL DEFAULT FALSE;


-- ============================================================
-- SPRINT 7 — RAG search RPC
-- ============================================================
-- Run this on databases that already have chapter_summaries with
-- embeddings populated. Idempotent — safe to re-run.

CREATE OR REPLACE FUNCTION match_chapter_summaries(
  p_project_id      UUID,
  p_query_embedding vector(768),
  p_match_count     INT DEFAULT 3,
  p_min_similarity  FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  id              UUID,
  chapter_id      UUID,
  project_id      UUID,
  summary         TEXT,
  key_facts       JSONB,
  similarity      FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.chapter_id,
    cs.project_id,
    cs.summary,
    cs.key_facts,
    1 - (cs.embedding <=> p_query_embedding) AS similarity
  FROM chapter_summaries cs
  WHERE cs.project_id = p_project_id
    AND cs.embedding IS NOT NULL
    AND 1 - (cs.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY cs.embedding <=> p_query_embedding
  LIMIT p_match_count;
END;
$$;


-- ============================================================
-- SPRINT 9 — Mimicry Engine: project-wide voice DNA
-- ============================================================
-- Idempotent migration. Default empty jsonb so existing rows are safe.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS voice_dna_project JSONB NOT NULL DEFAULT '{}'::jsonb;
