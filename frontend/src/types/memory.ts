// Core memory domain types shared across the entire frontend

export type Era = 'childhood' | 'young-adult' | 'family' | 'recent'

export interface Memory {
  id: string
  personId: string
  photoUrl: string
  thumbnailUrl?: string
  caption: string
  date: string       // ISO date string, e.g. "1974-05-03"
  year: number
  era: Era
  tags?: string[]
  location?: string
  createdAt: string  // Firestore serverTimestamp as ISO string
}

export interface Person {
  id: string
  name: string
  voiceId?: string   // ElevenLabs voice ID after cloning
  birthYear?: number
  coverPhotoUrl?: string
}

// Era metadata for display / layout
export const ERA_META: Record<Era, {
  label: string
  yearRange: string
  color: string           // Tailwind text color
  bgColor: string         // CSS rgba for glass card tint
  borderColor: string     // CSS rgba for card border
  zDepth: number          // meters for spatial mode, px multiplier for fallback
}> = {
  childhood: {
    label: 'Childhood',
    yearRange: '1950s – 1970s',
    color: 'text-blue-300',
    bgColor: 'rgba(29, 78, 216, 0.15)',
    borderColor: 'rgba(147, 197, 253, 0.25)',
    zDepth: -3,
  },
  'young-adult': {
    label: 'Young Adult',
    yearRange: '1970s – 1990s',
    color: 'text-purple-300',
    bgColor: 'rgba(109, 40, 217, 0.15)',
    borderColor: 'rgba(196, 181, 253, 0.25)',
    zDepth: -2,
  },
  family: {
    label: 'Family',
    yearRange: '1990s – 2010s',
    color: 'text-green-300',
    bgColor: 'rgba(21, 128, 61, 0.15)',
    borderColor: 'rgba(134, 239, 172, 0.25)',
    zDepth: -1,
  },
  recent: {
    label: 'Recent',
    yearRange: '2010s – Present',
    color: 'text-yellow-300',
    bgColor: 'rgba(161, 98, 7, 0.18)',
    borderColor: 'rgba(253, 224, 71, 0.25)',
    zDepth: 0,
  },
}

// Derive era from year — heuristic, can be overridden per person
export function deriveEra(year: number): Era {
  if (year < 1975) return 'childhood'
  if (year < 1995) return 'young-adult'
  if (year < 2015) return 'family'
  return 'recent'
}
