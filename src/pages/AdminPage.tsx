import { useState, useEffect } from 'react'
import { callFunction } from '../lib/supabase'
import { Listing } from '../lib/types'

interface AdminLoginResponse { token: string }
interface AdminListingsResponse { listings: Listing[] }
interface AdminUpdateResponse { ok: boolean }

type AdminAction = 'HIDE' | 'CLOSE' | 'ACTIVATE'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [adminToken, setAdminToken] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [actionMsg, setActionMsg] = useState('')
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})

  async function handleLogin(ev: React.FormEvent) {
    ev.preventDefault()
    setLoggingIn(true)
    setLoginError('')
    const { data, error } = await callFunction<AdminLoginResponse>('admin-login', { password })
    setLoggingIn(false)
    if (error || !data?.token) { setLoginError('Contraseña incorrecta.'); return }
    setAdminToken(data.token)
  }

  async function loadListings() {
    if (!adminToken) return
    setLoading(true)
    const { data, error } = await callFunction<AdminListingsResponse>('admin-listings', {
      admin_token: adminToken,
      status: statusFilter,
      search,
    })
    setLoading(false)
    if (error || !data) { alert('Error: ' + error); return }
    setListings(data.listings)
  }

  useEffect(() => { if (adminToken) loadListings() }, [adminToken, statusFilter])

  async function handleAction(listingId: string, action: AdminAction, note?: string) {
    const { error } = await callFunction<AdminUpdateResponse>('admin-update-listing', {
      admin_token: adminToken,
      listing_id: listingId,
      action,
      notes: note || '',
    })
    if (error) { alert('Error: ' + error); return }
    setActionMsg(`✅ Acción "${action}" aplicada.`)
    setTimeout(() => setActionMsg(''), 3000)
    loadListings()
  }

  if (!adminToken) {
    return (
      <div className="container page">
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <div className="card">
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>🔐 Panel administrativo</h1>
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña administrativa"
                  autoFocus
                />
              </div>
              {loginError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{loginError}</div>}
              <button type="submit" className="btn btn-primary btn-full" disabled={loggingIn}>
                {loggingIn ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>🛡️ Panel administrativo</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => setAdminToken('')}>Cerrar sesión</button>
      </div>

      {actionMsg && <div className="alert alert-success" style={{ marginBottom: 16 }}>{actionMsg}</div>}

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="filter-row">
          <input
            type="search"
            placeholder="Buscar por nombre o contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadListings()}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ACTIVE">Activas</option>
            <option value="CLOSED">Cerradas</option>
            <option value="HIDDEN">Ocultas</option>
            <option value="EXPIRED">Vencidas</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={loadListings}>Buscar</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner spinner-lg" /></div>
      ) : listings.length === 0 ? (
        <div className="card text-center" style={{ padding: 32 }}>
          <p style={{ color: 'var(--gray-400)' }}>No se encontraron publicaciones.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listings.map((l) => (
            <div key={l.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{l.display_name}</span>
                  <span style={{ color: 'var(--gray-500)', fontSize: 13, marginLeft: 8 }}>
                    {l.contact_type}: {l.contact_value}
                  </span>
                  {l.neighborhood && <span style={{ color: 'var(--gray-400)', fontSize: 13, marginLeft: 8 }}>· {l.neighborhood}</span>}
                </div>
                <span className={`badge ${l.status === 'ACTIVE' ? 'badge-active' : 'badge-closed'}`}>{l.status}</span>
              </div>

              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 10 }}>
                Creado: {new Date(l.created_at).toLocaleString('es-CO')} ·
                Vence: {new Date(l.expires_at).toLocaleString('es-CO')} ·
                ID: {l.id.slice(0, 8)}
              </div>

              {l.notes && (
                <div style={{ fontSize: 13, color: 'var(--gray-600)', background: 'var(--gray-50)', padding: '6px 10px', borderRadius: 6, marginBottom: 10 }}>
                  {l.notes}
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {l.status !== 'ACTIVE' && (
                  <button className="btn btn-sm btn-secondary" onClick={() => handleAction(l.id, 'ACTIVATE')}>Reactivar</button>
                )}
                {l.status === 'ACTIVE' && (
                  <button className="btn btn-sm btn-ghost" onClick={() => handleAction(l.id, 'HIDE')}>Ocultar</button>
                )}
                {l.status !== 'CLOSED' && (
                  <button className="btn btn-sm btn-danger" onClick={() => handleAction(l.id, 'CLOSE')}>Cerrar</button>
                )}

                <input
                  type="text"
                  placeholder="Nota de moderación..."
                  value={noteInputs[l.id] || ''}
                  onChange={(e) => setNoteInputs((n) => ({ ...n, [l.id]: e.target.value }))}
                  style={{ flex: 1, minWidth: 160, padding: '6px 10px', border: '1px solid var(--gray-200)', borderRadius: 6, fontSize: 13 }}
                />
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleAction(l.id, 'ACTIVATE', noteInputs[l.id])}
                  disabled={!noteInputs[l.id]?.trim()}
                >
                  Guardar nota
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
