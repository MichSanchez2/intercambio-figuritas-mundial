import { useState } from 'react'
import { parseStickers, parseResultToEntries } from '../lib/parser'
import { StickerEntry } from '../lib/types'

interface Props {
  ownerName?: string
  ownerOffered: StickerEntry[]
  ownerWanted: StickerEntry[]
}

interface CompareResult {
  visitorHasForOwner: StickerEntry[]
  ownerHasForVisitor: StickerEntry[]
  mutualTrades: Array<{ forOwner: StickerEntry; forVisitor: StickerEntry }>
}

function compare(
  ownerOffered: StickerEntry[],
  ownerWanted: StickerEntry[],
  visitorOffered: StickerEntry[],
  visitorWanted: StickerEntry[]
): CompareResult {
  const ownerWantedSet = new Set(ownerWanted.map((e) => `${e.category_code}-${e.sticker_number}`))
  const visitorWantedSet = new Set(visitorWanted.map((e) => `${e.category_code}-${e.sticker_number}`))

  const visitorHasForOwner = visitorOffered.filter((e) =>
    ownerWantedSet.has(`${e.category_code}-${e.sticker_number}`)
  )
  const ownerHasForVisitor = ownerOffered.filter((e) =>
    visitorWantedSet.has(`${e.category_code}-${e.sticker_number}`)
  )

  const mutualTrades: CompareResult['mutualTrades'] = []
  for (const fo of ownerHasForVisitor) {
    for (const fv of visitorHasForOwner) {
      mutualTrades.push({ forOwner: fv, forVisitor: fo })
    }
  }

  return { visitorHasForOwner, ownerHasForVisitor, mutualTrades }
}

function entriesText(entries: StickerEntry[], title: string): string {
  if (entries.length === 0) return `${title}: ninguna`
  const grouped = new Map<string, number[]>()
  for (const e of entries) {
    if (!grouped.has(e.category_label)) grouped.set(e.category_label, [])
    grouped.get(e.category_label)!.push(e.sticker_number)
  }
  const lines = Array.from(grouped.entries())
    .map(([label, nums]) => `${label}: ${nums.sort((a, b) => a - b).join(', ')}`)
    .join('\n')
  return `${title}:\n${lines}`
}

interface EntryListProps {
  entries: StickerEntry[]
  empty: string
}
function EntryList({ entries, empty }: EntryListProps) {
  if (entries.length === 0) return <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>{empty}</p>
  const grouped = new Map<string, number[]>()
  for (const e of entries) {
    if (!grouped.has(e.category_label)) grouped.set(e.category_label, [])
    grouped.get(e.category_label)!.push(e.sticker_number)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from(grouped.entries()).map(([label, nums]) => (
        <div key={label}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)' }}>{label}: </span>
          <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
            {nums.sort((a, b) => a - b).map((n) => (
              <span key={n} className="chip chip-number">#{n}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Comparator({ ownerName = 'Michel', ownerOffered, ownerWanted }: Props) {
  const [rawOffered, setRawOffered] = useState('')
  const [rawWanted, setRawWanted] = useState('')
  const [result, setResult] = useState<CompareResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  function handleCompare() {
    setError('')
    const offered = parseResultToEntries(parseStickers(rawOffered))
    const wanted = parseResultToEntries(parseStickers(rawWanted))
    if (offered.length === 0 && wanted.length === 0) {
      setError('Pega al menos tus repetidas o tus faltantes para comparar.')
      return
    }
    setResult(compare(ownerOffered, ownerWanted, offered, wanted))
  }

  function buildSummary(): string {
    if (!result) return ''
    const lines: string[] = [`Resumen de intercambio con ${ownerName}`, '']
    lines.push(entriesText(result.visitorHasForOwner, `Tú tienes para ${ownerName}`))
    lines.push('')
    lines.push(entriesText(result.ownerHasForVisitor, `${ownerName} tiene para ti`))
    return lines.join('\n')
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildSummary())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div className="section-title">🔄 Comparador de listas</div>
      <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 16 }}>
        Pega tus repetidas y tus faltantes para ver qué puedes intercambiar con {ownerName}.
      </p>

      <div className="field">
        <label>Mis repetidas</label>
        <textarea
          value={rawOffered}
          onChange={(e) => setRawOffered(e.target.value)}
          placeholder={`COL 🇨🇴: 2, 6, 11\nFWC 🏆: 3, 4`}
          rows={4}
        />
      </div>
      <div className="field">
        <label>Mis faltantes</label>
        <textarea
          value={rawWanted}
          onChange={(e) => setRawWanted(e.target.value)}
          placeholder={`ARG 🇦🇷: 1, 5, 8\nBRA 🇧🇷: 2, 7`}
          rows={4}
        />
      </div>

      {error && <div className="alert alert-warning" style={{ marginBottom: 12 }}>{error}</div>}

      <button type="button" className="btn btn-primary btn-full" onClick={handleCompare}>
        🔍 Comparar listas
      </button>

      {result && (
        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--green-dark)' }}>
              ✅ Tú tienes {result.visitorHasForOwner.length} figurita(s) que busca {ownerName}
            </div>
            <EntryList entries={result.visitorHasForOwner} empty={`No tienes figuritas que le falten a ${ownerName}.`} />
          </div>
          <div className="divider" />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--blue)' }}>
              🌟 {ownerName} tiene {result.ownerHasForVisitor.length} figurita(s) que te faltan
            </div>
            <EntryList entries={result.ownerHasForVisitor} empty={`${ownerName} no tiene figuritas que te falten.`} />
          </div>
          {result.visitorHasForOwner.length > 0 && result.ownerHasForVisitor.length > 0 && (
            <>
              <div className="divider" />
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--orange)' }}>
                  🤝 ¡Intercambio posible! Hay {Math.min(result.visitorHasForOwner.length, result.ownerHasForVisitor.length)} coincidencia(s)
                </div>
              </div>
            </>
          )}
          <button className="btn btn-secondary" onClick={handleCopy}>
            {copied ? '✅ ¡Copiado!' : '📋 Copiar resumen del intercambio'}
          </button>
        </div>
      )}
    </div>
  )
}
