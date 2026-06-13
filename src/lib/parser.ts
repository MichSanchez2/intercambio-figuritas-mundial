import { ParsedCategory, ParseResult, StickerEntry } from './types'

const IGNORE_LINES = [
  'figuritas app',
  'usa méx can 26',
  'usa mex can 26',
  'repetidas',
  'me faltan',
  'descarga la app',
  'lista de',
  'http',
  'https',
  'www.',
  '@',
]

function shouldIgnore(line: string): boolean {
  const lower = line.toLowerCase().trim()
  if (!lower) return true
  return IGNORE_LINES.some((pattern) => lower.includes(pattern))
}

// Matches lines like: "COL 🇨🇴: 2, 6, 11, 13" or "FWC 🏆: 3, 4"
// Emoji part is any non-colon characters after the code (handles flags, trophies, etc.)
const LINE_PATTERN = /^([A-Z0-9]+(?:\s+[A-Z0-9]+)?)\s*([^:0-9]*):\s*([\d,\s]+)$/

export function parseStickers(raw: string): ParseResult {
  const lines = raw.split('\n')
  const categories: ParsedCategory[] = []
  const errors: string[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (shouldIgnore(line)) continue

    const match = line.match(LINE_PATTERN)
    if (!match) {
      // Only report as error if it looks like it was meant to be a sticker line
      if (line.includes(':') && /\d/.test(line)) {
        errors.push(`No se pudo interpretar: "${line}"`)
      }
      continue
    }

    const code = match[1].trim().toUpperCase()
    const emoji = (match[2] || '').trim()
    const label = emoji ? `${code} ${emoji}` : code
    const numbersRaw = match[3]

    const numbers = numbersRaw
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0)

    if (numbers.length === 0) {
      errors.push(`No se encontraron números válidos en: "${line}"`)
      continue
    }

    const existing = categories.find((c) => c.code === code)
    if (existing) {
      existing.numbers = [...new Set([...existing.numbers, ...numbers])].sort((a, b) => a - b)
    } else {
      categories.push({
        code,
        label,
        numbers: [...new Set(numbers)].sort((a, b) => a - b),
      })
    }
  }

  const totalCount = categories.reduce((sum, c) => sum + c.numbers.length, 0)
  return { categories, totalCount, errors }
}

export function parseResultToEntries(result: ParseResult): StickerEntry[] {
  const entries: StickerEntry[] = []
  for (const cat of result.categories) {
    for (const num of cat.numbers) {
      entries.push({
        category_code: cat.code,
        category_label: cat.label,
        sticker_number: num,
      })
    }
  }
  return entries
}

export function entriesToDisplayString(entries: StickerEntry[]): string {
  const grouped = new Map<string, { label: string; numbers: number[] }>()
  for (const e of entries) {
    if (!grouped.has(e.category_code)) {
      grouped.set(e.category_code, { label: e.category_label, numbers: [] })
    }
    grouped.get(e.category_code)!.numbers.push(e.sticker_number)
  }
  return Array.from(grouped.entries())
    .map(([, v]) => `${v.label}: ${v.numbers.sort((a, b) => a - b).join(', ')}`)
    .join('\n')
}
