// Auto-generated Supabase database types for VibeNovel v2
// Reflects supabase/schema.sql

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          genre: string
          genesis_mode: 'FRESH_BRAINSTORM' | 'FRESH_BLUEPRINT' | 'IMPORTED'
          target_chapters: number
          word_count_target: number
          word_count_min: number | null
          word_count_max: number | null
          prose_provider: 'gemini' | 'openrouter'
          prose_model: string
          status: 'BRAINSTORMING' | 'OUTLINING' | 'WRITING' | 'PAUSED' | 'COMPLETED'
          narrative_constitution: string | null
          target_ending: string | null
          theme_and_tone: string | null
          story_contract: Json
          series_hook: string | null
          season_hooks: Json
          voice_dna_project: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
        Relationships: []
      }
      characters: {
        Row: {
          id: string
          project_id: string
          name: string
          role: 'PROTAGONIST' | 'ANTAGONIST' | 'SUPPORTING' | 'MINOR'
          description: string
          voice_dna: Json
          activation_keys: string[]
          priority: number
          is_locked: boolean
          genesis: 'BRAINSTORMED' | 'IMPORTED' | 'AUTO_EXTRACTED' | 'MANUAL'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['characters']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['characters']['Insert']>
        Relationships: []
      }
      items: {
        Row: {
          id: string
          project_id: string
          name: string
          category: 'WEAPON' | 'MAGICAL' | 'DOCUMENT' | 'JEWELRY' | 'VEHICLE' | 'KEY_ITEM' | 'OTHER'
          description: string
          significance: string
          activation_keys: string[]
          current_owner: string
          priority: number
          genesis: 'BRAINSTORMED' | 'IMPORTED' | 'AUTO_EXTRACTED' | 'MANUAL'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['items']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['items']['Insert']>
        Relationships: []
      }
      world_rules: {
        Row: {
          id: string
          project_id: string
          category: 'MAGIC_SYSTEM' | 'SOCIAL_RULE' | 'GEOGRAPHY' | 'TECHNOLOGY' | 'OTHER'
          name: string
          description: string
          priority: number
          activation_keys: string[]
          genesis: 'BRAINSTORMED' | 'IMPORTED' | 'AUTO_EXTRACTED' | 'MANUAL'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['world_rules']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['world_rules']['Insert']>
        Relationships: []
      }
      seasons: {
        Row: {
          id: string
          project_id: string
          season_number: number
          title: string
          premise: string
          target_goal: string
          start_chapter: number
          end_chapter: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['seasons']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>
        Relationships: []
      }
      sub_arcs: {
        Row: {
          id: string
          season_id: string
          title: string
          start_chapter: number
          end_chapter: number
          goal: string
          mini_climax: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['sub_arcs']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['sub_arcs']['Insert']>
        Relationships: []
      }
      chapters: {
        Row: {
          id: string
          project_id: string
          chapter_number: number
          title: string
          status: 'OUTLINE_ONLY' | 'GENERATING' | 'DRAFT' | 'FINAL' | 'IMPORTED'
          synopsis: string | null
          key_events: Json
          active_characters: string[]
          active_items: string[]
          location: string | null
          time_in_story: string | null
          emotional_tone: string | null
          cliffhanger_type: string | null
          cliffhanger_setup: string | null
          dopamine_beat: boolean
          false_resolution: boolean
          paywall_advice: string | null
          arc_position: Json | null
          open_threads: string[]
          resolved_threads: string[]
          foreshadowing: string[]
          chapter_end_state: Json | null
          do_not_include: string[]
          must_connect_to: string | null
          filler_risk: string | null
          prose: string | null
          word_count: number
          beats: Json
          outline_source: 'GENERATED' | 'MANUAL' | 'IMPORTED'
          prose_source: 'GENERATED' | 'MANUAL_WRITE' | 'IMPORTED' | 'MIXED'
          is_locked: boolean
          qa_logs: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['chapters']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['chapters']['Insert']>
        Relationships: []
      }
      character_states: {
        Row: {
          id: string
          character_id: string
          project_id: string
          chapter_number: number
          location: string
          physical_condition: string
          emotional_state: string
          inventory: string[]
          relationships: Json
          last_action: string
          knowledge_state: string[]
          active_goal: string
          secrets: string[]
          appearance_notes: string
          alliances: string[]
          source: 'AUTO_GENERATED' | 'MANUAL_EDIT' | 'IMPORTED'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['character_states']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['character_states']['Insert']>
        Relationships: []
      }
      mystery_layers: {
        Row: {
          id: string
          project_id: string
          season_id: string | null
          layer_number: number
          central_question: string
          revealed_at_chapter: number | null
          answer: string | null
          opens_next_question: string | null
          breadcrumbs: Json
          status: 'PLANNED' | 'ACTIVE' | 'REVEALED'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['mystery_layers']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['mystery_layers']['Insert']>
        Relationships: []
      }
      plot_threads: {
        Row: {
          id: string
          project_id: string
          title: string
          planted_at: number
          status: 'PLANTED' | 'ACTIVE' | 'RESOLVED' | 'ABANDONED'
          resolved_at: number | null
          urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
          related_characters: string[]
          related_items: string[]
          notes: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['plot_threads']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['plot_threads']['Insert']>
        Relationships: []
      }
      chapter_summaries: {
        Row: {
          id: string
          chapter_id: string
          project_id: string
          summary: string
          embedding: number[] | null
          key_facts: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chapter_summaries']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chapter_summaries']['Insert']>
        Relationships: []
      }
      emotional_patterns: {
        Row: {
          id: string
          project_id: string
          chapter_number: number
          planned_emotion: 'TENSION' | 'RELIEF' | 'DOPAMINE' | 'SHOCK' | 'BREATHER'
          actual_emotion: string | null
          false_resolution: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['emotional_patterns']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['emotional_patterns']['Insert']>
        Relationships: []
      }
      archived_outlines: {
        Row: {
          id: string
          project_id: string
          chapter_number: number
          outline_data: Json
          archived_at: string
        }
        Insert: Omit<Database['public']['Tables']['archived_outlines']['Row'], 'id' | 'archived_at'> & {
          id?: string
          archived_at?: string
        }
        Update: Partial<Database['public']['Tables']['archived_outlines']['Insert']>
        Relationships: []
      }
      chapter_versions: {
        Row: {
          id: string
          chapter_id: string
          prose: string
          word_count: number
          change_summary: string
          beats: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chapter_versions']['Row'], 'id' | 'created_at' | 'beats'> & {
          id?: string
          created_at?: string
          beats?: Json
        }
        Update: Partial<Database['public']['Tables']['chapter_versions']['Insert']>
        Relationships: []
      }
      recaps: {
        Row: {
          id: string
          project_id: string
          chapter_range_start: number
          chapter_range_end: number
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['recaps']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['recaps']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_chapter_summaries: {
        Args: {
          p_project_id: string
          p_query_embedding: number[]
          p_match_count?: number
          p_min_similarity?: number
        }
        Returns: Array<{
          id: string
          chapter_id: string
          project_id: string
          summary: string
          key_facts: Json
          similarity: number
        }>
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
