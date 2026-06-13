import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

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
    const { password } = await req.json()
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    if (!adminPassword) {
      return new Response(JSON.stringify({ error: 'Panel no configurado.' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!password || password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Contraseña incorrecta.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Generate a session token valid for this session
    // In production you'd use JWT; here we use a signed hash of password + timestamp bucket
    const bucket = Math.floor(Date.now() / (3600 * 1000)) // 1-hour buckets
    const sessionToken = await sha256(`${adminPassword}:${bucket}`)

    return new Response(JSON.stringify({ token: sessionToken }), {
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
