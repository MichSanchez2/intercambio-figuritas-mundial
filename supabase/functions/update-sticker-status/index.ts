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
    const { id, token, sticker_id, status } = await req.json()
    if (!id || !token || !sticker_id || !status) return err('Parámetros inválidos.', corsHeaders)
    if (!['AVAILABLE', 'TRADED', 'SOLD'].includes(status)) return err('Estado inválido.', corsHeaders)

    const tokenHash = await sha256(token)
    const supabase = createClient(
      Deno.env.get('DB_URL')!,
      Deno.env.get('DB_SERVICE_KEY')!
    )

    // Verify ownership
    const { data: listing, error: le } = await supabase
      .from('listings')
      .select('id')
      .eq('id', id)
      .eq('edit_token_hash', tokenHash)
      .single()

    if (le || !listing) return err('No autorizado.', corsHeaders)

    // Update sticker — must belong to this listing
    const { error: se } = await supabase
      .from('offered_stickers')
      .update({ status })
      .eq('id', sticker_id)
      .eq('listing_id', id)

    if (se) return err('Error al actualizar figurita.', corsHeaders)

    return new Response(JSON.stringify({ ok: true }), {
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
