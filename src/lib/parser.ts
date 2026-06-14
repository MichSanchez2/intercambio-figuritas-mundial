import { ParsedCategory, ParseResult, StickerEntry } from './types'

const COUNTRY_NAMES: Record<string, string> = {
  AFG: 'Afganistán', ALB: 'Albania', ALG: 'Argelia', AND: 'Andorra', ANG: 'Angola',
  ARG: 'Argentina', ARM: 'Armenia', AUS: 'Australia', AUT: 'Austria', AZE: 'Azerbaiyán',
  BEL: 'Bélgica', BEN: 'Benín', BFA: 'Burkina Faso', BGD: 'Bangladesh', BIH: 'Bosnia y Herzegovina',
  BLR: 'Bielorrusia', BOL: 'Bolivia', BRA: 'Brasil', BRN: 'Baréin', BUL: 'Bulgaria',
  CAN: 'Canadá', CHI: 'Chile', CHN: 'China', CIV: 'Costa de Marfil', CMR: 'Camerún',
  COD: 'Congo (RDC)', COL: 'Colombia', CPV: 'Cabo Verde', CRC: 'Costa Rica', CRO: 'Croacia',
  CUB: 'Cuba', CUW: 'Curazao', CYP: 'Chipre', CZE: 'República Checa', DEN: 'Dinamarca',
  ECU: 'Ecuador', EGY: 'Egipto', ENG: 'Inglaterra', ESP: 'España', EST: 'Estonia',
  ETH: 'Etiopía', FIN: 'Finlandia', FIJ: 'Fiyi', FRA: 'Francia', FWC: 'FIFA World Cup',
  GAB: 'Gabón', GEO: 'Georgia', GER: 'Alemania', GHA: 'Ghana', GRE: 'Grecia',
  GTM: 'Guatemala', GNB: 'Guinea-Bisáu', HND: 'Honduras', HRV: 'Croacia', HUN: 'Hungría',
  IDN: 'Indonesia', IND: 'India', IRL: 'Irlanda', IRN: 'Irán', IRQ: 'Irak',
  ISL: 'Islandia', ISR: 'Israel', ITA: 'Italia', JAM: 'Jamaica', JOR: 'Jordania',
  JPN: 'Japón', KAZ: 'Kazajistán', KEN: 'Kenia', KOR: 'Corea del Sur', KSA: 'Arabia Saudita',
  KUW: 'Kuwait', LBN: 'Líbano', LBY: 'Libia', LIE: 'Liechtenstein', LTU: 'Lituania',
  LUX: 'Luxemburgo', MAR: 'Marruecos', MDA: 'Moldavia', MEX: 'México', MKD: 'Macedonia del Norte',
  MLI: 'Malí', MLT: 'Malta', MNE: 'Montenegro', MOZ: 'Mozambique', MRT: 'Mauritania',
  NED: 'Países Bajos', NGA: 'Nigeria', NOR: 'Noruega', NZL: 'Nueva Zelanda', OMN: 'Omán',
  PAK: 'Pakistán', PAN: 'Panamá', PER: 'Perú', POL: 'Polonia', POR: 'Portugal',
  PRK: 'Corea del Norte', PRY: 'Paraguay', QAT: 'Catar', ROU: 'Rumanía', RSA: 'Sudáfrica',
  RUS: 'Rusia', SAL: 'El Salvador', SCO: 'Escocia', SEN: 'Senegal', SLE: 'Sierra Leona',
  SLO: 'Eslovenia', SMR: 'San Marino', SRB: 'Serbia', SUI: 'Suiza', SUR: 'Surinam',
  SVK: 'Eslovaquia', SWE: 'Suecia', SYR: 'Siria', TAN: 'Tanzania', THA: 'Tailandia',
  TUN: 'Túnez', TUR: 'Turquía', UAE: 'Emiratos Árabes', UKR: 'Ucrania', URU: 'Uruguay',
  USA: 'Estados Unidos', UZB: 'Uzbekistán', VEN: 'Venezuela', WAL: 'Gales', YEM: 'Yemen',
  ZAM: 'Zambia', ZIM: 'Zimbabue',
}

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
    const fullName = COUNTRY_NAMES[code]
    const label = fullName
      ? (emoji ? `${fullName} (${code}) ${emoji}` : `${fullName} (${code})`)
      : (emoji ? `${code} ${emoji}` : code)
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
