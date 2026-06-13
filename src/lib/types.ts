export type ListingStatus = 'ACTIVE' | 'CLOSED' | 'HIDDEN' | 'EXPIRED'
export type StickerStatus = 'AVAILABLE' | 'TRADED' | 'SOLD'
export type ListingMode = 'TRADE_ONLY' | 'SELL_ONLY' | 'BOTH'
export type ContactType = 'whatsapp' | 'instagram'
export type PriceType = 'PER_STICKER' | 'PER_LOT' | 'NEGOTIABLE' | 'NOT_APPLICABLE'

export interface Sticker {
  id: string
  listing_id: string
  category_code: string
  category_label: string
  sticker_number: number
  status: StickerStatus
  price_cop: number | null
  created_at: string
  updated_at: string
}

export interface WantedSticker {
  id: string
  listing_id: string
  category_code: string
  category_label: string
  sticker_number: number
  created_at: string
}

export interface Listing {
  id: string
  display_name: string
  contact_type: ContactType
  contact_value: string
  city: string | null
  neighborhood: string | null
  accepts_shipping: boolean
  listing_mode: ListingMode
  price_type: PriceType
  price_cop: number | null
  notes: string | null
  status: ListingStatus
  created_at: string
  updated_at: string
  expires_at: string
  offered_stickers?: Sticker[]
  wanted_stickers?: WantedSticker[]
}

export interface ParsedCategory {
  code: string
  label: string
  numbers: number[]
}

export interface ParseResult {
  categories: ParsedCategory[]
  totalCount: number
  errors: string[]
}

export interface StickerEntry {
  category_code: string
  category_label: string
  sticker_number: number
}

export interface CreateListingPayload {
  display_name: string
  contact_type: ContactType
  contact_value: string
  city: string
  neighborhood: string
  accepts_shipping: boolean
  listing_mode: ListingMode
  price_type: PriceType
  price_cop: number | null
  notes: string
  offered_stickers: StickerEntry[]
  wanted_stickers: StickerEntry[]
  honeypot: string
}

export interface ManageListing extends Listing {
  offered_stickers: Sticker[]
  wanted_stickers: WantedSticker[]
}

export interface PublicStickerCard {
  sticker_id: string
  listing_id: string
  category_code: string
  category_label: string
  sticker_number: number
  display_name: string
  contact_type: ContactType
  contact_value: string
  city: string | null
  neighborhood: string | null
  accepts_shipping: boolean
  listing_mode: ListingMode
  price_type: PriceType
  price_cop: number | null
  notes: string | null
  expires_at: string
}
