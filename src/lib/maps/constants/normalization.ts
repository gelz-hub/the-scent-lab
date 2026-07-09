// Geoapify/OSM return inconsistent naming for Cambodian administrative divisions
// (municipality suffixes, "Krong"/"Khan" prefixes, alternate romanizations). This
// table centralizes every known variant so callers never do ad-hoc string surgery.

export const PROVINCE_NORMALIZATION: Record<string, string> = {
  'phnom penh municipality': 'Phnom Penh',
  'phnom penh capital': 'Phnom Penh',
  'krong preah sihanouk': 'Preah Sihanouk',
  'sihanoukville': 'Preah Sihanouk',
  'krong siem reap': 'Siem Reap',
  'krong battambang': 'Battambang',
  'krong kampot': 'Kampot',
  'krong poi pet': 'Poipet',
  'krong pailin': 'Pailin',
  'krong ta khmau': 'Kandal',
  'ratanak kiri': 'Ratanakiri',
  'rattanakkiri': 'Ratanakiri',
  'rotanak kiri': 'Ratanakiri',
  'mondul kiri': 'Mondulkiri',
  'otdar meanchey': 'Oddar Meanchey',
  'ta keo': 'Takeo',
  'kampong som': 'Preah Sihanouk',
}

export const DISTRICT_NORMALIZATION: Record<string, string> = {
  'khan sen sok': 'Sen Sok',
  'khan chbar ampov': 'Chbar Ampov',
  'khan chamkar mon': 'Chamkar Mon',
  'khan doun penh': 'Doun Penh',
  'khan tuol kouk': 'Tuol Kouk',
  'khan dangkao': 'Dangkao',
  'khan mean chey': 'Mean Chey',
  'khan russey keo': 'Russey Keo',
  'khan pou senchey': 'Pou Senchey',
  'khan por sen chey': 'Pou Senchey',
  'khan chroy changvar': 'Chroy Changvar',
  'khan prek pnov': 'Prek Pnov',
  'khan boeng keng kang': 'Boeng Keng Kang',
  'khan kambol': 'Kambol',
  'khan prampir meakkakra': 'Prampir Meakkakra',
  'khan 7 makara': 'Prampir Meakkakra',
  'krong serei saophoan': 'Serei Saophoan',
  'krong paoy paet': 'Paoy Paet',
  'poi pet': 'Paoy Paet',
  'krong battambang district': 'Battambang',
  'krong kampong cham': 'Kampong Cham',
  'krong ta khmau': 'Ta Khmau',
  'krong kracheh': 'Kracheh',
  'krong stueng saen': 'Stueng Saen',
  'krong chbar mon': 'Chbar Mon',
  'krong pursat': 'Pursat',
  'krong siem reap district': 'Siem Reap',
  'krong sihanoukville': 'Sihanoukville',
  'krong preah vihear': 'Tbeng Meanchey',
  'krong samraong': 'Samraong',
  'krong ban lung': 'Ban Lung',
  'krong saen monourom': 'Saen Monourom',
  'krong doun kaev': 'Doun Kaev',
  'krong svay rieng': 'Svay Rieng',
  'krong prey veng': 'Prey Veng',
  'krong kampong thom': 'Kampong Thom',
  'krong stung treng': 'Stung Treng',
  'krong kep': 'Kep',
  'krong pailin district': 'Pailin',
}

function normalize(value: string, table: Record<string, string>): string {
  const key = value.trim().toLowerCase()
  return table[key] ?? value.trim()
}

export function normalizeProvinceName(raw: string): string {
  return normalize(raw, PROVINCE_NORMALIZATION)
}

export function normalizeDistrictName(raw: string): string {
  return normalize(raw, DISTRICT_NORMALIZATION)
}
