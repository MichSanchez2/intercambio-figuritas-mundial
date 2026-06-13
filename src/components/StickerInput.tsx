import { useState } from 'react'
import { parseStickers, parseResultToEntries } from '../lib/parser'
import { StickerEntry } from '../lib/types'

interface Props {
  label: string
  hint?: string
  value: StickerEntry[]
  onChange: (entries: StickerEntry[]) => void
  error?: string
}

export default function StickerInput({ label, hint, value, onChange, error }: Props) {
  const [raw, setRaw] = useState('')
  const [parseError, setParseError] = useState<string[]>([])

  function handleParse(text?: string) {
    const input = (text ?? raw).trim()
    if (!input) return
    const result = parseStickers(input)
    if (result.totalCount === 0) {
      setParseError(['No se encontraron figuritas válidas. Asegúrate de usar el formato correcto.'])
      return
    }
    setParseError(result.errors)
    const newEntries = parseResultToEntries(result)
    const existing = new Set(value.map((e) => `${e.category_code}-${e.sticker_number}`))
    const toAdd = newEntries.filter((e) => !existing.has(`${e.category_code}-${e.sticker_number}`))
    onChange([...value, ...toAdd])
    setRaw('')
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text')
    if (text.trim()) {
      e.preventDefault()
      handleParse(text)
    }
  }

  function removeEntry(code: string, num: number) {
    onChange(value.filter((e) => !(e.category_code === code && e.sticker_number === num)))
  }

  // Group current entries by category
  const grouped = new Map<string, { label: string; numbers: number[] }>()
  for (const e of value) {
    if (!grouped.has(e.category_code)) {
      grouped.set(e.category_code, { label: e.category_label, numbers: [] })
    }
    grouped.get(e.category_code)!.numbers.push(e.sticker_number)
  }

  return (
    <div className="field">
      <label>{label}</label>
      {hint && <span className="hint">{hint}</span>}
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onPaste={handlePaste}
        placeholder={`COL 🇨🇴: 2, 6, 11, 13\nFWC 🏆: 3, 4\nSCO 🏴: 7, 11`}
        rows={5}
        className={error ? 'error' : ''}
      />
      <button type="button" className="btn btn-secondary btn-sm" onClick={handleParse} disabled={!raw.trim()}>
        ➕ Agregar figuritas
      </button>
      {parseError.map((e, i) => (
        <div key={i} className="error-msg">⚠️ {e}</div>
      ))}
      {error && <div className="error-msg">{error}</div>}

      {value.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6 }}>
            {value.length} figurita{value.length !== 1 ? 's' : ''} cargada{value.length !== 1 ? 's' : ''}:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from(grouped.entries()).map(([code, { label: catLabel, numbers }]) => (
              <div key={code}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-700)', marginBottom: 4 }}>
                  {catLabel}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {numbers.sort((a, b) => a - b).map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="chip chip-number"
                      onClick={() => removeEntry(code, num)}
                      title="Clic para eliminar"
                      style={{ cursor: 'pointer' }}
                    >
                      #{num} ✕
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
