import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan variables de entorno de Supabase. Copia .env.example a .env.local y completa los valores.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`

export async function callFunction<T>(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(name, {
      body,
    })
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Error desconocido' }
  }
}
