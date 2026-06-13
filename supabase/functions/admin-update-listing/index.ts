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

async function verifyAdminToken(token: string): Promise<boolean> {
  const adminPassword = Deno.env.get('ADMIN_PASSWORD')
  if (!adminPassword) return false
  const bucket = Math.floor(Date.now() / (3600 * 1000))
  const expected = await sha256(`${adminPassword}:${bucket}`)
  const prevExpected = await sha256(`${adminPassword}:${bucket - 1}`)
  return token === expected || token === prevExpected
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { admin_token, listing_id, action, notes } = await req.json()

    if (!admin_token || !(await verifyAdminToken(admin_token))) {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!listing_id || !action) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('DB_URL')!,
      Deno.env.get('DB_SERVICE_KEY')!
    )

    const statusMap: Record<string, string> = {
      HIDE: 'HIDDEN',
      CLOSE: 'CLOSED',
      ACTIVATE: 'ACTIVE',
    }

    if (statusMap[action]) {
      const { error } = await supabase
        .from('listings')
        .update({ status: statusMap[action] })
        .eq('id', listing_id)
      if (error) return new Response(JSON.stringify({ error: 'Error al actualizar.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Always log the action
    await supabase.from('moderation_log').insert({
      listing_id,
      action,
      notes: notes || null,
    })

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
