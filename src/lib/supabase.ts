import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '[mcp-workflow] Missing Supabase env vars. ' +
    'Copy .env.example → .env and fill in your project credentials. ' +
    'The app will run with local seed data until Supabase is connected.'
  )
}

/**
 * Supabase client — typed against the generated Database interface.
 * Falls back gracefully when env vars are absent (prototype mode).
 */
export const supabase = createClient<Database>(
  supabaseUrl  || 'https://placeholder.supabase.co',
  supabaseKey  || 'placeholder',
  {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { 'x-app-version': import.meta.env.VITE_APP_VERSION || '0.1.0' } },
  }
)
