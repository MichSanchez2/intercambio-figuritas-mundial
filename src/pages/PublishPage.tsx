import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { callFunction } from '../lib/supabase'
import { CreateListingPayload, ListingMode, ContactType, PriceType, StickerEntry } from '../lib/types'
import StickerInput from '../components/StickerInput'

const COLOMBIA_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Bucaramanga',
  'Pereira', 'Santa Marta', 'Ibagué', 'Manizales', 'Pasto', 'Neiva', 'Villavicencio',
  'Armenia', 'Valledupar', 'Montería', 'Sincelejo', 'Popayán', 'Florencia',
]

interface FormState {
  display_name: string
  contact_type: ContactType
  contact_value: string
  city: string
  neighborhood: string
  accepts_shipping: boolean
  listing_mode: ListingMode
  price_type: PriceType
  price_cop: string
  notes: string
  accept_contact: boolean
  honeypot: string
}

interface CreateResponse {
  listing_id: string
  edit_token: string
  edit_url: string
}

const INITIAL: FormState = {
  display_name: '',
  contact_type: 'whatsapp',
  contact_value: '',
  city: '',
  neighborhood: '',
  accepts_shipping: false,
  listing_mode: 'BOTH',
  price_type: 'NEGOTIABLE',
  price_cop: '',
  notes: '',
  accept_contact: false,
  honeypot: '',
}

export default function PublishPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [offered, setOffered] = useState<StickerEntry[]>([])
  const [wanted, setWanted] = useState<StickerEntry[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'offered' | 'global', string>>>({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<CreateResponse | null>(null)
  const [copied, setCopied] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.display_name.trim()) e.display_name = 'Ingresa tu nombre o apodo.'
    if (!form.contact_value.trim()) e.contact_value = 'Ingresa tu medio de contacto.'
    if (form.contact_type === 'whatsapp' && !/^\d{7,15}$/.test(form.contact_value.trim())) {
      e.contact_value = 'El número de WhatsApp debe tener solo dígitos (sin +, sin espacios). Ej: 573001234567'
    }
    if (!form.city.trim()) e.city = 'Ingresa tu ciudad.'
    if (!form.accept_contact) e.accept_contact = 'Debes aceptar mostrar tu medio de contacto.'
    if (offered.length === 0) e.offered = 'Agrega al menos una figurita repetida.'
    if (['PER_STICKER', 'PER_LOT'].includes(form.price_type) && form.listing_mode !== 'TRADE_ONLY') {
      if (!form.price_cop || isNaN(Number(form.price_cop))) {
        e.price_cop = 'Ingresa un precio en pesos colombianos.'
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    setSaving(true)
    const payload: CreateListingPayload = {
      display_name: form.display_name.trim(),
      contact_type: form.contact_type,
      contact_value: form.contact_value.trim(),
      city: form.city.trim(),
      neighborhood: form.neighborhood.trim(),
      accepts_shipping: form.accepts_shipping,
      listing_mode: form.listing_mode,
      price_type: form.listing_mode === 'TRADE_ONLY' ? 'NOT_APPLICABLE' : form.price_type,
      price_cop: ['PER_STICKER', 'PER_LOT'].includes(form.price_type) ? Number(form.price_cop) : null,
      notes: form.notes.trim(),
      offered_stickers: offered,
      wanted_stickers: wanted,
      honeypot: form.honeypot,
    }

    const { data, error } = await callFunction<CreateResponse>('create-listing', payload)
    setSaving(false)
    if (error || !data) {
      setErrors({ global: error || 'Error al publicar. Intenta nuevamente.' })
      return
    }
    setResult(data)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function copyLink() {
    if (!result) return
    const url = `${window.location.origin}/editar/${result.listing_id}?token=${result.edit_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    const editUrl = `${window.location.origin}/editar/${result.listing_id}?token=${result.edit_token}`
    return (
      <div className="container page">
        <div className="card" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Publicación creada!</h2>
          <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
            Tus figuritas ya están disponibles en el catálogo. Tu publicación es válida por 15 días.
          </p>

          <div className="link-box" style={{ textAlign: 'left', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>🔐 Tu enlace privado de edición</div>
            <div className="alert alert-warning" style={{ fontSize: 13 }}>
              ⚠️ <strong>Guarda este enlace.</strong> Lo necesitarás para actualizar tus figuritas o cerrar tu publicación. No lo compartas con nadie.
            </div>
            <div className="link-text">{editUrl}</div>
            <button className="btn btn-primary btn-full" onClick={copyLink}>
              {copied ? '✅ ¡Copiado!' : '📋 Copiar enlace privado'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate(`/editar/${result.listing_id}?token=${result.edit_token}`)}>
              Gestionar publicación
            </button>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container page">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>📋 Publicar figuritas</h1>
        <p style={{ color: 'var(--gray-600)', marginBottom: 24, fontSize: 15 }}>
          Completa el formulario para publicar tus repetidas. Tu publicación dura 15 días y puedes renovarla.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>👤 Tus datos</div>

            <div className="field">
              <label>Nombre o apodo *</label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
                placeholder="Ej: Juan, Caro, El coleccionista..."
                className={errors.display_name ? 'error' : ''}
                maxLength={60}
              />
              {errors.display_name && <span className="error-msg">{errors.display_name}</span>}
            </div>

            <div className="field">
              <label>Tipo de contacto *</label>
              <select value={form.contact_type} onChange={(e) => set('contact_type', e.target.value as ContactType)}>
                <option value="whatsapp">WhatsApp</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>

            <div className="field">
              <label>
                {form.contact_type === 'whatsapp' ? 'Número de WhatsApp *' : 'Usuario de Instagram *'}
              </label>
              <input
                type={form.contact_type === 'whatsapp' ? 'tel' : 'text'}
                value={form.contact_value}
                onChange={(e) => set('contact_value', e.target.value.trim())}
                placeholder={form.contact_type === 'whatsapp' ? '573001234567 (con código de país, sin +)' : '@usuario'}
                className={errors.contact_value ? 'error' : ''}
                maxLength={80}
              />
              {form.contact_type === 'whatsapp' && (
                <span className="hint">Solo números, sin espacios ni +. Incluye el código del país. Ej: 573001234567</span>
              )}
              {errors.contact_value && <span className="error-msg">{errors.contact_value}</span>}
            </div>

            <div className="field">
              <label>Ciudad *</label>
              <input
                type="text"
                list="cities-list"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="Ej: Bogotá, Medellín, Cali..."
                className={errors.city ? 'error' : ''}
                maxLength={80}
              />
              <datalist id="cities-list">
                {COLOMBIA_CITIES.map((c) => <option key={c} value={c} />)}
              </datalist>
              {errors.city && <span className="error-msg">{errors.city}</span>}
            </div>

            <div className="field">
              <label>Barrio o sector (opcional)</label>
              <input
                type="text"
                value={form.neighborhood}
                onChange={(e) => set('neighborhood', e.target.value)}
                placeholder="Ej: Chapinero, Laureles, El Prado..."
                maxLength={80}
              />
            </div>

            <div className="field">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.accepts_shipping}
                  onChange={(e) => set('accepts_shipping', e.target.checked)}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span>Puedo enviar por correo o mensajería a otra ciudad</span>
              </label>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>💰 Modalidad y precio</div>

            <div className="field">
              <label>¿Qué quieres hacer con tus figuritas? *</label>
              <select value={form.listing_mode} onChange={(e) => set('listing_mode', e.target.value as ListingMode)}>
                <option value="BOTH">Intercambio o venta</option>
                <option value="TRADE_ONLY">Solo intercambio</option>
                <option value="SELL_ONLY">Solo venta</option>
              </select>
            </div>

            {form.listing_mode !== 'TRADE_ONLY' && (
              <>
                <div className="field">
                  <label>Tipo de precio *</label>
                  <select value={form.price_type} onChange={(e) => set('price_type', e.target.value as PriceType)}>
                    <option value="PER_STICKER">Por figurita</option>
                    <option value="PER_LOT">Por el lote completo</option>
                    <option value="NEGOTIABLE">Negociable</option>
                  </select>
                </div>

                {['PER_STICKER', 'PER_LOT'].includes(form.price_type) && (
                  <div className="field">
                    <label>Precio en pesos colombianos (COP) *</label>
                    <input
                      type="number"
                      value={form.price_cop}
                      onChange={(e) => set('price_cop', e.target.value)}
                      placeholder="Ej: 500"
                      min={0}
                      className={errors.price_cop ? 'error' : ''}
                    />
                    {errors.price_cop && <span className="error-msg">{errors.price_cop}</span>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🃏 Mis figuritas repetidas *</div>
            <div className="alert alert-info" style={{ marginBottom: 12, fontSize: 13 }}>
              <div>
                Puedes pegar directamente la lista que genera <strong>Figuritas App</strong>. Ejemplo:
                <pre style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 12, background: 'white', padding: '8px 10px', borderRadius: 6 }}>
                  {`COL 🇨🇴: 2, 6, 11, 13\nFWC 🏆: 3, 4\nSCO 🏴: 7, 11`}
                </pre>
              </div>
            </div>
            <StickerInput
              label=""
              value={offered}
              onChange={setOffered}
              error={errors.offered}
            />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>🔍 Figuritas que busco (opcional)</div>
            <StickerInput
              label=""
              hint="Agrega las figuritas que te faltan para que otros puedan encontrarte más fácil."
              value={wanted}
              onChange={setWanted}
            />
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>Notas adicionales (opcional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Ej: Solo intercambio los fines de semana. Puedo encontrarme en el parque."
                maxLength={300}
              />
              <span className="hint">{form.notes.length}/300 caracteres</span>
            </div>

            <div className="field">
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.accept_contact}
                  onChange={(e) => set('accept_contact', e.target.checked)}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <span>Acepto que mi medio de contacto se muestre para coordinar el intercambio o la venta. *</span>
              </label>
              {errors.accept_contact && <span className="error-msg">{errors.accept_contact}</span>}
            </div>

            <input
              type="text"
              value={form.honeypot}
              onChange={(e) => set('honeypot', e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              style={{ display: 'none' }}
              aria-hidden="true"
            />
          </div>

          {errors.global && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>
              ❌ {errors.global}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={saving}
          >
            {saving ? (
              <><div className="spinner" style={{ borderTopColor: 'white' }} /> Publicando...</>
            ) : (
              '🚀 Publicar mis figuritas'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
