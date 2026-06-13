import { Link } from 'react-router-dom'
import { PublicStickerCard, ListingMode, PriceType } from '../lib/types'

interface Props {
  sticker: PublicStickerCard
}

function modeLabel(mode: ListingMode) {
  if (mode === 'TRADE_ONLY') return { text: 'Solo intercambio', cls: 'badge-trade' }
  if (mode === 'SELL_ONLY') return { text: 'Solo venta', cls: 'badge-sell' }
  return { text: 'Intercambio o venta', cls: 'badge-both' }
}

function priceLabel(type: PriceType, amount: number | null): string {
  if (type === 'NOT_APPLICABLE') return ''
  if (type === 'NEGOTIABLE') return 'Precio negociable'
  if (type === 'PER_LOT') return amount ? `$${amount.toLocaleString('es-CO')} el lote` : 'Precio por lote'
  if (type === 'PER_STICKER') return amount ? `$${amount.toLocaleString('es-CO')} c/u` : 'Precio por figura'
  return ''
}

export default function StickerCard({ sticker }: Props) {
  const mode = modeLabel(sticker.listing_mode)
  const price = priceLabel(sticker.price_type, sticker.price_cop)

  const waLink =
    sticker.contact_type === 'whatsapp'
      ? `https://wa.me/${sticker.contact_value}?text=${encodeURIComponent(
          `Hola ${sticker.display_name}, vi tu publicación en Figuritas Cartagena. Tienes la figurita ${sticker.category_label} #${sticker.sticker_number} disponible?`
        )}`
      : null

  const igLink =
    sticker.contact_type === 'instagram'
      ? `https://instagram.com/${sticker.contact_value.replace('@', '')}`
      : null

  function copyIg() {
    navigator.clipboard.writeText(sticker.contact_value)
    const btn = document.getElementById(`copy-ig-${sticker.sticker_id}`)
    if (btn) { btn.textContent = '¡Copiado!'; setTimeout(() => { btn.textContent = 'Copiar'; }, 1500) }
  }

  return (
    <div className="sticker-card">
      <div className="sticker-card-header">
        <div>
          <div className="sticker-category">{sticker.category_label}</div>
          <div className="sticker-number-big">#{sticker.sticker_number}</div>
        </div>
        <span className={`badge ${mode.cls}`}>{mode.text}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{sticker.display_name}</div>
        {sticker.neighborhood && (
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>📍 {sticker.neighborhood}</div>
        )}
        {price && (
          <div style={{ fontSize: 13, color: 'var(--orange)', fontWeight: 600 }}>💰 {price}</div>
        )}
        {sticker.notes && (
          <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4 }}>
            {sticker.notes.length > 80 ? sticker.notes.slice(0, 80) + '…' : sticker.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to={`/publicacion/${sticker.listing_id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
          Ver publicación
        </Link>
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, background: '#25d366' }}>
            💬 WhatsApp
          </a>
        )}
        {igLink && (
          <div style={{ display: 'flex', gap: 6, flex: 1 }}>
            <a href={igLink} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-ghost" style={{ flex: 1 }}>
              📸 {sticker.contact_value}
            </a>
            <button id={`copy-ig-${sticker.sticker_id}`} className="btn btn-ghost btn-sm" onClick={copyIg}>
              Copiar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
