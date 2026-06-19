// Supabase client factory — instance dibuat hanya kalau env vars terisi.
// Mode dipilih otomatis: ada VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY → Supabase, kalau tidak → localStorage.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const SUPABASE_ENABLED = Boolean(url && anon)

export const supabase = SUPABASE_ENABLED
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'kbc_supabase_auth_v1'
      }
    })
  : null
