/**
 * Auto-generated Supabase types.
 *
 * To regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts
 *
 * This stub keeps TypeScript happy in prototype mode.
 */
export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          emoji: string
          caps: string[]
          status: string
          version: string
          model: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['agents']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['agents']['Insert']>
      }
      workflows: {
        Row: {
          id: string
          name: string
          mode: string
          nodes: unknown
          edges: unknown
          schedule: unknown | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['workflows']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['workflows']['Insert']>
      }
      run_logs: {
        Row: {
          id: string
          workflow_id: string
          events: unknown
          started_at: string
          finished_at: string | null
          status: string
        }
        Insert: Omit<Database['public']['Tables']['run_logs']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['run_logs']['Insert']>
      }
    }
  }
}
