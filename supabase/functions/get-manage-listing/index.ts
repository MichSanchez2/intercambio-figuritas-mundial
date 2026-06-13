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
      .select('*')
      .eq('id', id)
      .eq('edit_token_hash', tokenHash)
      .single()

    if (le || !listing) return err('Enlace inválido o expirado.', corsHeaders)

    const { data: offered } = await supabase
      .from('offered_stickers')
      .select('*')
      .eq('listing_id', id)
      .order('category_code')
      .order('sticker_number')

    const { data: wanted } = await supabase
      .from('wanted_stickers')
      .select('*')
      .eq('listing_id', id)
      .order('category_code')
      .order('sticker_number')

    // Don't expose token hash to client
    const { edit_token_hash: _, ...safeListingData } = listing

    return new Response(
      JSON.stringify({ listing: { ...safeListingData, offered_stickers: offered || [], wanted_stickers: wanted || [] } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
    status: 401,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
