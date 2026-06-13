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
    const body = await req.json()
    const { id, token } = body
    if (!id || !token) return err('Parámetros inválidos.', corsHeaders)

    const tokenHash = await sha256(token)
    const supabase = createClient(
      Deno.env.get('DB_URL')!,
      Deno.env.get('DB_SERVICE_KEY')!
    )

    // Verify token
    const { data: listing, error: le } = await supabase
      .from('listings')
      .select('id, status')
      .eq('id', id)
      .eq('edit_token_hash', tokenHash)
      .single()

    if (le || !listing) return err('Enlace inválido.', corsHeaders)
    if (listing.status === 'CLOSED') return err('Esta publicación está cerrada.', corsHeaders)

    // Update basic fields if provided
    const updates: Record<string, unknown> = {}
    if (body.display_name !== undefined) updates.display_name = String(body.display_name).trim()
    if (body.contact_value !== undefined) updates.contact_value = String(body.contact_value).trim()
    if (body.neighborhood !== undefined) updates.neighborhood = String(body.neighborhood).trim() || null
    if (body.notes !== undefined) updates.notes = String(body.notes).trim() || null
    if (body.listing_mode !== undefined) updates.listing_mode = body.listing_mode
    if (body.price_type !== undefined) updates.price_type = body.price_type
    if (body.price_cop !== undefined) updates.price_cop = body.price_cop || null

    if (Object.keys(updates).length > 0) {
      const { error: ue } = await supabase.from('listings').update(updates).eq('id', id)
      if (ue) { console.error(ue); return err('Error al actualizar.', corsHeaders) }
    }

    // Add new offered stickers
    const newOffered = body.new_offered_stickers || []
    if (newOffered.length > 0) {
      const rows = newOffered.map((s: { category_code: string; category_label: string; sticker_number: number }) => ({
        listing_id: id,
        category_code: s.category_code.toUpperCase(),
        category_label: s.category_label,
        sticker_number: Number(s.sticker_number),
        status: 'AVAILABLE',
      }))
      await supabase.from('offered_stickers').upsert(rows, { onConflict: 'listing_id,category_code,sticker_number' })
    }

    // Add new wanted stickers
    const newWanted = body.new_wanted_stickers || []
    if (newWanted.length > 0) {
      const rows = newWanted.map((s: { category_code: string; category_label: string; sticker_number: number }) => ({
        listing_id: id,
        category_code: s.category_code.toUpperCase(),
        category_label: s.category_label,
        sticker_number: Number(s.sticker_number),
      }))
      await supabase.from('wanted_stickers').upsert(rows, { onConflict: 'listing_id,category_code,sticker_number' })
    }

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
