import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Listing, Sticker, WantedSticker } from '../lib/types'

interface FullListing extends Listing {
  offered_stickers: Sticker[]
  wanted_stickers: WantedSticker[]
}

function priceLabel(listing: Listing): string {
  if (listing.price_type === 'NOT_APPLICABLE') return ''
  if (listing.price_type === 'NEGOTIABLE') return 'Precio negociable'
  if (listing.price_type === 'PER_LOT') return listing.price_cop ? `$${listing.price_cop.toLocaleString('es-CO')} el lote` : 'Precio por lote'
  if (listing.price_type === 'PER_STICKER') return listing.price_cop ? `$${listing.price_cop.toLocaleString('es-CO')} por figurita` : 'Precio por figurita'
  return ''
}

function modeLabel(mode: string): string {
  if (mode === 'TRADE_ONLY') return 'Solo intercambio'
  if (mode === 'SELL_ONLY') return 'Solo venta'
  return 'Intercambio o venta'
}

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
}

export default function ListingPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<FullListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      if (!id) return
      setLoading(true)
      const { data: l, error: le } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (le || !l) { setError('Publicación no encontrada o no disponible.'); setLoading(false); return }

      const { data: os } = await supabase
        .from('offered_stickers')
        .select('*')
        .eq('listing_id', id)
        .eq('status', 'AVAILABLE')
        .order('category_code')
        .order('sticker_number')

      const { data: ws } = await supabase
        .from('wanted_stickers')
        .select('*')
        .eq('listing_id', id)
        .order('category_code')
        .order('sticker_number')

      setListing({ ...l, offered_stickers: os || [], wanted_stickers: ws || [] })
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /><p>Cargando...</p></div>
  if (error || !listing) return (
    <div className="container page">
      <div className="card text-center" style={{ padding: 40 }}>
        <p style={{ fontSize: 32 }}>😞</p>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{error || 'Publicación no encontrada'}</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>Volver al inicio</Link>
      </div>
    </div>
  )

  const days = daysLeft(listing.expires_at)
  const waLink = listing.contact_type === 'whatsapp'
    ? `https://wa.me/${listing.contact_value}?text=${encodeURIComponent(`Hola ${listing.display_name}, vi tu publicación en Figuritas Cartagena y quiero coordinar un intercambio.`)}`
    : null
  const igLink = listing.contact_type === 'instagram'
    ? `https://instagram.com/${listing.contact_value.replace('@', '')}`
    : null

  // Group offered stickers by category
  const grouped = new Map<string, number[]>()
  for (const s of listing.offered_stickers) {
    if (!grouped.has(s.category_label)) grouped.set(s.category_label, [])
    grouped.get(s.category_label)!.push(s.sticker_number)
  }

  const wantedGrouped = new Map<string, number[]>()
  for (const s of listing.wanted_stickers) {
    if (!wantedGrouped.has(s.category_label)) wantedGrouped.set(s.category_label, [])
    wantedGrouped.get(s.category_label)!.push(s.sticker_number)
  }

  return (
    <div className="container page">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Link to="/" style={{ fontSize: 14, color: 'var(--gray-500)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          ← Volver al catálogo
        </Link>

        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>{listing.display_name}</h1>
              {listing.neighborhood && <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>📍 {listing.neighborhood}</p>}
            </div>
            <span className={`badge ${listing.listing_mode === 'TRADE_ONLY' ? 'badge-trade' : listing.listing_mode === 'SELL_ONLY' ? 'badge-sell' : 'badge-both'}`}>
              {modeLabel(listing.listing_mode)}
            </span>
          </div>

          {priceLabel(listing) && (
            <div style={{ fontSize: 15, color: 'var(--orange)', fontWeight: 700, marginBottom: 12 }}>
              💰 {priceLabel(listing)}
            </div>
          )}

          {listing.notes && (
            <div style={{ fontSize: 14, color: 'var(--gray-600)', background: 'var(--gray-50)', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>
              {listing.notes}
            </div>
          )}

          <div style={{ fontSize: 13, color: 'var(--gray-400)', marginBottom: 16 }}>
            Publicado el {new Date(listing.created_at).toLocaleDateString('es-CO')} · Vence en {days} día{days !== 1 ? 's' : ''}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {waLink && (
              <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: 1, background: '#25d366' }}>
                💬 Contactar por WhatsApp
              </a>
            )}
            {igLink && (
              <a href={igLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1 }}>
                📸 Instagram: {listing.contact_value}
              </a>
            )}
          </div>
        </div>

        {/* Offered stickers */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
            🃏 Figuritas disponibles ({listing.offered_stickers.length})
          </div>
          {listing.offered_stickers.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No hay figuritas disponibles.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from(grouped.entries()).map(([label, nums]) => (
                <div key={label}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 4 }}>{label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {nums.sort((a, b) => a - b).map((n) => (
                      <span key={n} className="chip chip-number">#{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wanted stickers */}
        {listing.wanted_stickers.length > 0 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
              🔍 Figuritas que busca ({listing.wanted_stickers.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array.from(wantedGrouped.entries()).map(([label, nums]) => (
                <div key={label}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 4 }}>{label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {nums.sort((a, b) => a - b).map((n) => (
                      <span key={n} className="chip chip-number" style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>#{n}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="security-note">
          <span>⚠️</span>
          <span>Coordina la entrega en un lugar público y seguro.</span>
        </div>
      </div>
    </div>
  )
}
