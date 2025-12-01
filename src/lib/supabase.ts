import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if both URL and key are valid strings
export const supabase = supabaseUrl && supabaseAnonKey &&
  supabaseUrl.startsWith('http') ? createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
}) : null

export type Job = {
  id: string
  user_id?: string
  filename: string
  program_name: string
  status: 'processing' | 'processing_audio' | 'completed' | 'error'
  file_size?: number
  srt_url?: string
  error_message?: string
  created_at: string
  completed_at?: string
}

export type Speaker = {
  id: string
  name: string
  comment: string
}