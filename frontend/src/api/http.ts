const BASE = '/api'

export async function fetchFormats(): Promise<Format[]> {
  const res = await fetch(`${BASE}/formats/`)
  if (!res.ok) throw new Error('Failed to fetch formats')
  return res.json()
}

export interface Format {
  id: number
  name: string
  description: string
  deck_min_size: number
  deck_max_size: number | null
  sideboard_size: number
}
