import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { PublicStickerCard, ListingMode } from '../lib/types'
import StickerCard from '../components/StickerCard'
import HowToModal from '../components/HowToModal'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 24

interface Filters {
  search: string
  category: string
  number: string
  city: string
  neighborhood: string
  mode: string
  maxPrice: string
  shipping: boolean
}

const EMPTY_FILTERS: Filters = {
  search: '', category: '', number: '', city: '', neighborhood: '',
  mode: '', maxPrice: '', shipping: false,
}

interface Stats {
  totalStickers: number
  activeListings: number
  tradeListings: number
  sellListings: number
}

export default function HomePage() {
  const [stickers, setStickers] = useState<PublicStickerCard[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ totalStickers: 0, activeListings: 0, tradeListings: 0, sellListings: 0 })
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [heroSearch, setHeroSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])

  const fetchStickers = useCallback(async (f: Filters, pageNum: number, append = false) => {
    setLoading(true)
    let query = supabase
      .from('public_stickers')
      .select('*')
      .order('category_code', { ascending: true })
      .order('sticker_number', { ascending: true })
      .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1)

    if (f.search) query = query.or(`display_name.ilike.%${f.search}%,category_label.ilike.%${f.search}%,city.ilike.%${f.search}%`)
    if (f.category) query = query.eq('category_code', f.category)
    if (f.number) query = query.eq('sticker_number', parseInt(f.number))
    if (f.city) query = query.ilike('city', `%${f.city}%`)
    if (f.neighborhood) query = query.ilike('neighborhood', `%${f.neighborhood}%`)
    if (f.mode) query = query.eq('listing_mode', f.mode as ListingMode)
    if (f.shipping) query = query.eq('accepts_shipping', true)
    if (f.maxPrice) query = query.lte('price_cop', parseInt(f.maxPrice))

    const { data, error } = await query
    setLoading(false)
    if (!error && data) {
      if (append) setStickers((prev) => [...prev, ...data])
      else setStickers(data)
      setHasMore(data.length === PAGE_SIZE)
    }
  }, [])

  useEffect(() => { fetchStickers(filters, 0); setPage(0) }, [filters, fetchStickers])

  useEffect(() => {
    async function loadStats() {
      const now = new Date().toISOString()
      const { count: sc } = await supabase.from('public_stickers').select('*', { count: 'exact', head: true })
      const { count: al } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE').gt('expires_at', now)
      const { count: tl } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE').in('listing_mode', ['TRADE_ONLY', 'BOTH']).gt('expires_at', now)
      const { count: sl } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE').in('listing_mode', ['SELL_ONLY', 'BOTH']).gt('expires_at', now)
      setStats({ totalStickers: sc || 0, activeListings: al || 0, tradeListings: tl || 0, sellListings: sl || 0 })
    }
    loadStats()

    async function loadMeta() {
      const { data: cats } = await supabase.from('public_stickers').select('category_code').order('category_code')
      if (cats) setCategories([...new Set(cats.map((c: { category_code: string }) => c.category_code))])
      const { data: cs } = await supabase.from('public_stickers').select('city').not('city', 'is', null).order('city')
      if (cs) setCities([...new Set(cs.map((c: { city: string }) => c.city).filter(Boolean))])
    }
    loadMeta()
  }, [])

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters({ ...EMPTY_FILTERS, search: heroSearch })
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })
  }

  function loadMore() {
    const next = page + 1; setPage(next); fetchStickers(filters, next, true)
  }

  function clearFilters() { setFilters(EMPTY_FILTERS) }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-eyebrow">Colombia · USA Méx Can 26</div>
        <h1>Encuentra las figuritas<br /><em>que te faltan</em></h1>
        <p className="hero-sub">
          Publica tus repetidas, busca las que necesitas y coordina el intercambio en todo Colombia.
        </p>

        <form className="hero-search" onSubmit={handleHeroSearch}>
          <span style={{ opacity: 0.6, fontSize: 16 }}>🔍</span>
          <input
            type="search"
            placeholder="¿Qué figurita buscas? País, número..."
            value={heroSearch}
            onChange={(e) => setHeroSearch(e.target.value)}
            autoComplete="off"
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="hero-actions">
          <Link to="/publicar" className="btn btn-lg" style={{ background: 'white', color: 'var(--green-dark)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Publicar mis figuritas
          </Link>
          <button
            className="btn btn-lg"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.25)', fontWeight: 700 }}
            onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Ver catálogo ↓
          </button>
        </div>
      </div>

      <div className="container page">

        {/* ── STATS ── */}
        <div className="stats-bar">
          <div className="stat-item">
            <div className="stat-number">{stats.totalStickers}</div>
            <div className="stat-label">Figuritas disponibles</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.activeListings}</div>
            <div className="stat-label">Publicaciones activas</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.tradeListings}</div>
            <div className="stat-label">Para intercambio</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{stats.sellListings}</div>
            <div className="stat-label">Con opción de venta</div>
          </div>
        </div>

        {/* ── CATÁLOGO ── */}
        <div id="catalogo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div className="section-title" style={{ marginBottom: 0 }}>
              Figuritas en Colombia
              {stickers.length > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-400)', marginLeft: 8 }}>{stickers.length} resultados</span>}
            </div>
            <Link to="/publicar" className="btn btn-primary btn-sm">+ Publicar las mías</Link>
          </div>

          {/* Filters */}
          <div className="filter-bar">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="search"
                placeholder="Buscar por país, número, ciudad..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{ flex: 1 }}
              />
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setFiltersOpen((o) => !o)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {filtersOpen ? 'Ocultar filtros' : 'Más filtros'}{hasActiveFilters && !filters.search ? ' •' : ''}
              </button>
              {hasActiveFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ whiteSpace: 'nowrap' }}>
                  ✕ Limpiar
                </button>
              )}
            </div>

            {filtersOpen && (
              <>
                <div className="filter-row" style={{ marginTop: 8 }}>
                  <input
                    type="number"
                    placeholder="# Número"
                    value={filters.number}
                    onChange={(e) => setFilters({ ...filters, number: e.target.value })}
                    min={1}
                    style={{ maxWidth: 100 }}
                  />
                  <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                    <option value="">Todas las categorías</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}>
                    <option value="">Todas las ciudades</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="filter-row">
                  <select value={filters.mode} onChange={(e) => setFilters({ ...filters, mode: e.target.value })}>
                    <option value="">Cualquier modalidad</option>
                    <option value="TRADE_ONLY">Solo intercambio</option>
                    <option value="SELL_ONLY">Solo venta</option>
                    <option value="BOTH">Intercambio o venta</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Precio máx. COP"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    min={0}
                    style={{ maxWidth: 140 }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--gray-600)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={filters.shipping} onChange={(e) => setFilters({ ...filters, shipping: e.target.checked })} />
                    Con envío
                  </label>
                </div>
              </>
            )}
          </div>

          {loading && stickers.length === 0 ? (
            <div className="loading-center">
              <div className="spinner spinner-lg" />
              <p>Cargando figuritas...</p>
            </div>
          ) : stickers.length === 0 ? (
            <div className="card text-center" style={{ padding: 48 }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
              <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                {hasActiveFilters ? 'Sin resultados para esa búsqueda' : 'Aún no hay figuritas publicadas'}
              </p>
              <p style={{ color: 'var(--gray-400)', fontSize: 14, marginBottom: 20 }}>
                {hasActiveFilters ? 'Intenta con otros filtros.' : '¡Sé el primero en publicar tus repetidas!'}
              </p>
              {hasActiveFilters
                ? <button className="btn btn-secondary" onClick={clearFilters}>Limpiar filtros</button>
                : <Link to="/publicar" className="btn btn-primary btn-lg">Publicar mis figuritas</Link>
              }
            </div>
          ) : (
            <>
              <div className="sticker-grid">
                {stickers.map((s) => <StickerCard key={s.sticker_id} sticker={s} />)}
              </div>
              {loading && <div className="loading-center" style={{ padding: 24 }}><div className="spinner" /></div>}
              {hasMore && !loading && (
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <button className="btn btn-secondary" onClick={loadMore}>Cargar más figuritas</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── SECURITY ── */}
        <div className="security-note" style={{ marginTop: 28 }}>
          <span></span>
          <span><strong>Seguridad:</strong> Coordina la entrega en un lugar público. No publiques tu dirección exacta. Si eres menor de edad, realiza el intercambio con acompañamiento de un adulto.</span>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <HowToModal />
          <a href="https://www.figuritas.app/es/descargar" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)', fontSize: 13 }}>
            Descargar Figuritas App
          </a>
        </div>
      </div>
    </>
  )
}
