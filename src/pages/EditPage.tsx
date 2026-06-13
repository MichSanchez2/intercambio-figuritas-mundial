import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { callFunction } from '../lib/supabase'
import { ManageListing, Sticker, StickerStatus, StickerEntry } from '../lib/types'
import StickerInput from '../components/StickerInput'

interface ManageResponse {
  listing: ManageListing
}
interface UpdateResponse { ok: boolean }
interface StickerStatusResponse { ok: boolean }
interface CloseResponse { ok: boolean }
interface RenewResponse { ok: boolean; expires_at: string }

function daysLeft(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
}

export default function EditPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [listing, setListing] = useState<ManageListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  // Edit form
  const [name, setName] = useState('')
  const [contactValue, setContactValue] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  // Add stickers
  const [newOffered, setNewOffered] = useState<StickerEntry[]>([])
  const [newWanted, setNewWanted] = useState<StickerEntry[]>([])
  const [addingStickers, setAddingStickers] = useState(false)

  // Status msgs
  const [statusMsg, setStatusMsg] = useState<Record<string, string>>({})
  const [renewMsg, setRenewMsg] = useState('')
  const [closeConfirm, setCloseConfirm] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    async function load() {
      if (!id || !token) { setAuthError('Enlace inválido.'); setLoading(false); return }
      const { data, error } = await callFunction<ManageResponse>('get-manage-listing', { id, token })
      setLoading(false)
      if (error || !data) { setAuthError('Enlace inválido o expirado. Verifica que hayas copiado el enlace completo.'); return }
      setListing(data.listing)
      setName(data.listing.display_name)
      setContactValue(data.listing.contact_value)
      setNeighborhood(data.listing.neighborhood || '')
      setNotes(data.listing.notes || '')
    }
    load()
  }, [id, token])

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault()
    setSaving(true)
    setSaveMsg('')
    const { error } = await callFunction<UpdateResponse>('update-listing', {
      id, token,
      display_name: name.trim(),
      contact_value: contactValue.trim(),
      neighborhood: neighborhood.trim(),
      notes: notes.trim(),
    })
    setSaving(false)
    if (error) { setSaveMsg('❌ ' + error); return }
    setSaveMsg('✅ Cambios guardados')
    setListing((l) => l ? { ...l, display_name: name, contact_value: contactValue, neighborhood, notes } : l)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  async function handleAddStickers() {
    if (newOffered.length === 0 && newWanted.length === 0) return
    setAddingStickers(true)
    const { error } = await callFunction<UpdateResponse>('update-listing', {
      id, token,
      new_offered_stickers: newOffered,
      new_wanted_stickers: newWanted,
    })
    setAddingStickers(false)
    if (error) { alert('Error: ' + error); return }
    // Reload
    const { data: d2 } = await callFunction<ManageResponse>('get-manage-listing', { id, token })
    if (d2) setListing(d2.listing)
    setNewOffered([])
    setNewWanted([])
  }

  async function handleStickerStatus(stickerId: string, status: StickerStatus) {
    setStatusMsg((m) => ({ ...m, [stickerId]: '...' }))
    const { error } = await callFunction<StickerStatusResponse>('update-sticker-status', { id, token, sticker_id: stickerId, status })
    if (error) { setStatusMsg((m) => ({ ...m, [stickerId]: '❌ Error' })); return }
    const label = status === 'SOLD' ? '✅ Vendida' : status === 'TRADED' ? '✅ Intercambiada' : '✅ Reactivada'
    setStatusMsg((m) => ({ ...m, [stickerId]: label }))
    setListing((l) => l ? {
      ...l,
      offered_stickers: l.offered_stickers.map((s) => s.id === stickerId ? { ...s, status } : s)
    } : l)
    setTimeout(() => setStatusMsg((m) => { const n = { ...m }; delete n[stickerId]; return n }), 2500)
  }

  async function handleRenew() {
    const { data, error } = await callFunction<RenewResponse>('renew-listing', { id, token })
    if (error || !data) { setRenewMsg('❌ ' + (error || 'Error')); return }
    setRenewMsg('✅ Renovada hasta ' + new Date(data.expires_at).toLocaleDateString('es-CO'))
    setListing((l) => l ? { ...l, expires_at: data.expires_at } : l)
    setTimeout(() => setRenewMsg(''), 4000)
  }

  async function handleClose() {
    setClosing(true)
    const { error } = await callFunction<CloseResponse>('close-listing', { id, token })
    setClosing(false)
    if (error) { alert('Error: ' + error); return }
    setListing((l) => l ? { ...l, status: 'CLOSED' } : l)
    setCloseConfirm(false)
  }

  if (loading) return <div className="loading-center"><div className="spinner spinner-lg" /><p>Verificando enlace...</p></div>

  if (authError) return (
    <div className="container page">
      <div className="card text-center" style={{ maxWidth: 480, margin: '0 auto', padding: 40 }}>
        <p style={{ fontSize: 32 }}>🔐</p>
        <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Acceso denegado</p>
        <p style={{ color: 'var(--gray-500)', fontSize: 14, marginBottom: 20 }}>{authError}</p>
        <Link to="/" className="btn btn-primary">Volver al inicio</Link>
      </div>
    </div>
  )

  if (!listing) return null

  const days = daysLeft(listing.expires_at)
  const isClosed = listing.status === 'CLOSED'

  const offeredGrouped = new Map<string, Sticker[]>()
  for (const s of listing.offered_stickers) {
    if (!offeredGrouped.has(s.category_label)) offeredGrouped.set(s.category_label, [])
    offeredGrouped.get(s.category_label)!.push(s)
  }

  return (
    <div className="container page">
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <Link to="/" style={{ fontSize: 14, color: 'var(--gray-500)', display: 'inline-flex', gap: 4, marginBottom: 16 }}>
          ← Volver al catálogo
        </Link>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🛠️ Gestionar publicación</h1>

        {isClosed && (
          <div className="alert alert-warning" style={{ marginBottom: 16 }}>
            Esta publicación está cerrada y no aparece en el catálogo.
          </div>
        )}

        {!isClosed && days <= 3 && (
          <div className="expiry-warning">
            <span>⏰ Tu publicación vence en {days} día{days !== 1 ? 's' : ''}.</span>
            <button className="btn btn-primary btn-sm" onClick={handleRenew}>
              Renovar por 15 días
            </button>
          </div>
        )}
        {renewMsg && <div className="alert alert-success" style={{ marginTop: 8, marginBottom: 8 }}>{renewMsg}</div>}

        {/* Edit basic info */}
        <div className="card" style={{ marginBottom: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>✏️ Editar información</div>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Nombre o apodo</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>
            <div className="field">
              <label>Contacto ({listing.contact_type === 'whatsapp' ? 'WhatsApp' : 'Instagram'})</label>
              <input type="text" value={contactValue} onChange={(e) => setContactValue(e.target.value)} />
            </div>
            <div className="field">
              <label>Sector o barrio</label>
              <input type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} maxLength={80} />
            </div>
            <div className="field">
              <label>Notas</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} />
            </div>
            {saveMsg && <div className={`alert ${saveMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 12 }}>{saveMsg}</div>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><div className="spinner" style={{ borderTopColor: 'white' }} /> Guardando...</> : '💾 Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Offered stickers management */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
            🃏 Mis figuritas ({listing.offered_stickers.length})
          </div>
          {listing.offered_stickers.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>No tienes figuritas cargadas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from(offeredGrouped.entries()).map(([label, stickers]) => (
                <div key={label}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 6 }}>{label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {stickers.sort((a, b) => a.sticker_number - b.sticker_number).map((s) => (
                      <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span className={`chip ${s.status === 'AVAILABLE' ? 'chip-number' : 'chip-gray'}`}>
                          #{s.sticker_number}
                          {s.status === 'SOLD' && ' 💰'}
                          {s.status === 'TRADED' && ' 🔄'}
                        </span>
                        {statusMsg[s.id] ? (
                          <span style={{ fontSize: 11 }}>{statusMsg[s.id]}</span>
                        ) : (
                          <div style={{ display: 'flex', gap: 3 }}>
                            {s.status === 'AVAILABLE' ? (
                              <>
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '2px 6px', fontSize: 11, background: '#fee2e2', color: '#991b1b', minHeight: 'auto', borderRadius: 4 }}
                                  onClick={() => handleStickerStatus(s.id, 'SOLD')}
                                  title="Marcar como vendida"
                                >Vendida</button>
                                <button
                                  className="btn btn-sm"
                                  style={{ padding: '2px 6px', fontSize: 11, background: 'var(--blue-light)', color: 'var(--blue)', minHeight: 'auto', borderRadius: 4 }}
                                  onClick={() => handleStickerStatus(s.id, 'TRADED')}
                                  title="Marcar como intercambiada"
                                >Trocada</button>
                              </>
                            ) : (
                              <button
                                className="btn btn-sm"
                                style={{ padding: '2px 6px', fontSize: 11, minHeight: 'auto', borderRadius: 4 }}
                                onClick={() => handleStickerStatus(s.id, 'AVAILABLE')}
                                title="Reactivar"
                              >Reactivar</button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new stickers */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>➕ Agregar figuritas</div>
          <StickerInput label="Nuevas repetidas" value={newOffered} onChange={setNewOffered} />
          <StickerInput label="Nuevas faltantes" value={newWanted} onChange={setNewWanted} />
          <button
            className="btn btn-secondary"
            onClick={handleAddStickers}
            disabled={addingStickers || (newOffered.length === 0 && newWanted.length === 0)}
          >
            {addingStickers ? <><div className="spinner" /> Agregando...</> : '➕ Agregar al listado'}
          </button>
        </div>

        {/* Renewal */}
        {!isClosed && days > 3 && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>⏰ Renovar publicación</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>
              Vence el {new Date(listing.expires_at).toLocaleDateString('es-CO')} ({days} días restantes).
            </p>
            <button className="btn btn-secondary" onClick={handleRenew}>Renovar por 15 días</button>
          </div>
        )}

        {/* Close */}
        {!isClosed && (
          <div className="card" style={{ marginBottom: 16, borderColor: '#fca5a5', borderWidth: 1.5, borderStyle: 'solid' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, color: '#991b1b' }}>🚫 Cerrar publicación</div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 12 }}>
              Al cerrar, tus figuritas dejarán de aparecer en el catálogo.
            </p>
            {!closeConfirm ? (
              <button className="btn btn-danger btn-sm" onClick={() => setCloseConfirm(true)}>
                Cerrar publicación
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="alert alert-error">¿Estás seguro? Esta acción no se puede deshacer fácilmente.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-danger" onClick={handleClose} disabled={closing}>
                    {closing ? 'Cerrando...' : 'Sí, cerrar'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setCloseConfirm(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
