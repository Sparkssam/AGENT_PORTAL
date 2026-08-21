export const CHANNEL_PARENT_TYPE = "Super Agent"
export const CHANNEL_PARENT_NAME = "16860-LOST"
export const CHANNEL_MANAGER_NAME = "16860-LOST"
export const CHANNEL_TIER = "Agent"
export const CHANNEL_MANAGER_TYPES = ["Super Agent", "Super Agent Outlet"] as const
export const ID_TYPES = ["National ID (NIDA)", "Driver's Licence", "Voter ID"] as const

export function isChannelManagerType(value: string | null | undefined) {
  return CHANNEL_MANAGER_TYPES.includes(value as (typeof CHANNEL_MANAGER_TYPES)[number])
}

export function isAllowedIdType(value: string | null | undefined) {
  return ID_TYPES.includes(value as (typeof ID_TYPES)[number])
}

export const BUSINESS_SECTORS = [
  { name: "All", code: "all" },
  { name: "Accommodation and meals", code: "accommodation_meals" },
  { name: "Administration support service", code: "administration_support" },
  { name: "Art, play, entertainment", code: "art_play_entertainment" },
  { name: "Education", code: "education" },
  { name: "Finance, banking, insurance", code: "finance_banking_insurance" },
  { name: "Medical", code: "medical" },
  { name: "Other services", code: "other_services" },
  { name: "Telecommunication", code: "telecommunication" },
] as const

export function sortBusinessSectors<T extends { code: string; name: string }>(sectors: T[]) {
  const order = new Map(BUSINESS_SECTORS.map((item, index) => [item.code, index]))
  return [...sectors].sort((a, b) => {
    const left = order.get(a.code) ?? 1000
    const right = order.get(b.code) ?? 1000
    if (left !== right) return left - right
    return a.name.localeCompare(b.name)
  })
}
