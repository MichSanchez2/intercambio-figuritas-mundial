import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BANNED_WORDS = [
  'sexo', 'anal', 'porno', 'puta', 'prostitut', 'escort', 'prepago',
  'droga', 'cocain', 'marihuan', 'bazuco', 'heroina',
  'negro loco', 'negroland', 'spam', 'test123',
]

function containsBannedContent(text: string): boolean {
  const lower = text.toLowerCase()
  return BANNED_WORDS.some((w) => lower.includes(w))
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateToken(length = 48): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()

    if (body.honeypot) {
      return new Response(JSON.stringify({ error: 'Spam detectado.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { display_name, contact_type, contact_value, city, listing_mode, price_type, offered_stickers } = body
    if (!display_name?.trim()) return err('Nombre requerido.', corsHeaders)
    if (!['whatsapp', 'instagram'].includes(contact_type)) return err('Tipo de contacto inválido.', corsHeaders)
    if (!contact_value?.trim()) return err('Contacto requerido.', corsHeaders)
    if (contact_type === 'whatsapp' && !/^\d{7,15}$/.test(contact_value.trim())) {
      return err('Número de WhatsApp inválido. Solo dígitos, sin + ni espacios.', corsHeaders)
    }
    if (!city?.trim()) return err('Ciudad requerida.', corsHeaders)
    if (!['TRADE_ONLY', 'SELL_ONLY', 'BOTH'].includes(listing_mode)) return err('Modalidad inválida.', corsHeaders)
    if (!Array.isArray(offered_stickers) || offered_stickers.length === 0) return err('Debes agregar al menos una figurita.', corsHeaders)

    const textsToCheck = [display_name, body.neighborhood, body.notes, city].filter(Boolean).join(' ')
    if (containsBannedContent(textsToCheck)) return err('La publicación contiene contenido no permitido.', corsHeaders)

    const supabase = createClient(
      Deno.env.get('DB_URL')!,
      Deno.env.get('DB_SERVICE_KEY')!
    )

    const token = generateToken()
    const tokenHash = await sha256(token)
    const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .insert({
        display_name: display_name.trim(),
        contact_type,
        contact_value: contact_value.trim(),
        city: city.trim(),
        neighborhood: body.neighborhood?.trim() || null,
        accepts_shipping: body.accepts_shipping === true,
        listing_mode,
        price_type: listing_mode === 'TRADE_ONLY' ? 'NOT_APPLICABLE' : (price_type || 'NEGOTIABLE'),
        price_cop: body.price_cop || null,
        notes: body.notes?.trim() || null,
        edit_token_hash: tokenHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (listingError || !listing) {
      console.error('listing insert error:', listingError)
      return err('Error al guardar la publicación.', corsHeaders)
    }

    if (offered_stickers.length > 0) {
      const rows = offered_stickers.map((s: { category_code: string; category_label: string; sticker_number: number }) => ({
        listing_id: listing.id,
        category_code: s.category_code.toUpperCase(),
        category_label: s.category_label,
        sticker_number: Number(s.sticker_number),
      }))
      const { error: se } = await supabase.from('offered_stickers').upsert(rows, { onConflict: 'listing_id,category_code,sticker_number' })
      if (se) console.error('offered_stickers insert error:', se)
    }

    const wanted_stickers = body.wanted_stickers || []
    if (wanted_stickers.length > 0) {
      const rows = wanted_stickers.map((s: { category_code: string; category_label: string; sticker_number: number }) => ({
        listing_id: listing.id,
        category_code: s.category_code.toUpperCase(),
        category_label: s.category_label,
        sticker_number: Number(s.sticker_number),
      }))
      await supabase.from('wanted_stickers').upsert(rows, { onConflict: 'listing_id,category_code,sticker_number' })
    }

    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || ''
    const editUrl = `${siteUrl}/editar/${listing.id}?token=${token}`

    return new Response(
      JSON.stringify({ listing_id: listing.id, edit_token: token, edit_url: editUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
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
