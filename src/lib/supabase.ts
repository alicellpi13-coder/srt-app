import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

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