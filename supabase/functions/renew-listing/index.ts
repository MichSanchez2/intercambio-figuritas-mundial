import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { id, token } = await req.json()
    if (!id || !token) return err('Parámetros inválidos.', corsHeaders)

    const tokenHash = await sha256(token)
    const supabase = createClient(
      Deno.env.get('DB_URL')!,
      Deno.env.get('DB_SERVICE_KEY')!
    )

    const { data: listing, error: le } = await supabase
      .from('listings')
      .select('id, expires_at')
      .eq('id', id)
      .eq('edit_token_hash', tokenHash)
      .single()

    if (le || !listing) return err('No autorizado.', corsHeaders)

    // Extend from today or from current expiry, whichever is later
    const base = Math.max(Date.now(), new Date(listing.expires_at).getTime())
    const newExpiry = new Date(base + 15 * 24 * 60 * 60 * 1000).toISOString()

    const { error: ue } = await supabase
      .from('listings')
      .update({ expires_at: newExpiry, status: 'ACTIVE' })
      .eq('id', id)

    if (ue) return err('Error al renovar.', corsHeaders)

    return new Response(JSON.stringify({ ok: true, expires_at: newExpiry }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

function err(msg: string, headers: Record<string, string>) {
  return new Response(JSON.stringify({ error: msg }), {
    status: 400,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
