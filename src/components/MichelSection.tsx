import { useState, useMemo } from 'react'
import { MICHEL_OFFERED_RAW, MICHEL_WANTED_RAW, MICHEL_WHATSAPP } from '../data/michel'
import { parseStickers, parseResultToEntries } from '../lib/parser'
import Comparator from './Comparator'

export default function MichelSection() {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'offered' | 'wanted'>('offered')
  const [copied, setCopied] = useState(false)
  const [showComparator, setShowComparator] = useState(false)

  const offeredEntries = useMemo(() => parseResultToEntries(parseStickers(MICHEL_OFFERED_RAW)), [])
  const wantedEntries = useMemo(() => parseResultToEntries(parseStickers(MICHEL_WANTED_RAW)), [])

  const offered = parseStickers(MICHEL_OFFERED_RAW)
  const wanted = parseStickers(MICHEL_WANTED_RAW)

  const activeCategories = tab === 'offered' ? offered.categories : wanted.categories

  const filtered = activeCategories
    .map((cat) => ({
      ...cat,
      numbers: cat.numbers.filter(
        (n) =>
          !search ||
          cat.label.toLowerCase().includes(search.toLowerCase()) ||
          cat.code.toLowerCase().includes(search.toLowerCase()) ||
          String(n).includes(search)
      ),
    }))
    .filter((cat) => cat.numbers.length > 0)

  function handleCopy() {
    const raw = tab === 'offered' ? MICHEL_OFFERED_RAW : MICHEL_WANTED_RAW
    navigator.clipboard.writeText(raw)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const waLink = `https://wa.me/${MICHEL_WHATSAPP}?text=${encodeURIComponent(
    'Hola Michel, vi tu lista en Figuritas Cartagena y quiero intercambiar figuritas contigo.'
  )}`

  return (
    <div className="michel-card" style={{ marginBottom: 28 }}>
      <div className="michel-card-title">⭐ Lista de Michel</div>
      <div className="michel-card-sub">Mis repetidas y mis faltantes · actualizado junio 2026</div>

      <div className="michel-tabs">
        <button
          className={`michel-tab ${tab === 'offered' ? 'active' : ''}`}
          onClick={() => setTab('offered')}
        >
          Repetidas ({offered.totalCount})
        </button>
        <button
          className={`michel-tab ${tab === 'wanted' ? 'active' : ''}`}
          onClick={() => setTab('wanted')}
        >
          Me faltan ({wanted.totalCount})
        </button>
      </div>

      <input
        className="michel-search"
        type="search"
        placeholder="Buscar país o número..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="michel-chips-area">
        {filtered.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Sin resultados.</p>
        ) : (
          filtered.map((cat) => (
            <div key={cat.code} className="michel-category">
              <div className="michel-category-label">{cat.label}</div>
              <div>
                {cat.numbers.map((n) => (
                  <span key={n} className="michel-chip">#{n}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="michel-actions">
        <button className="michel-btn michel-btn-outline" onClick={handleCopy}>
          {copied ? '✅ Copiada' : '📋 Copiar lista'}
        </button>
        <button
          className="michel-btn michel-btn-outline"
          onClick={() => setShowComparator(!showComparator)}
        >
          🔄 Comparar mi lista
        </button>
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="michel-btn michel-btn-wa">
          💬 Contactar a Michel
        </a>
      </div>

      {showComparator && (
        <div style={{ marginTop: 16 }}>
          <Comparator ownerName="Michel" ownerOffered={offeredEntries} ownerWanted={wantedEntries} />
        </div>
      )}
    </div>
  )
}
