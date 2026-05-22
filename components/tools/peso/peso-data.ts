export type PesoFieldId =
  | 'paid'
  | 'earned'
  | 'shared'
  | 'owned'
  | 'paidEarned'
  | 'earnedShared'
  | 'sharedOwned'
  | 'ownedPaid'
  | 'core'

export type PesoField = {
  id: PesoFieldId
  label: string
  title: string
  description: string
  examples: string[]
  color: string
}

export type PesoModelData = Record<PesoFieldId, PesoField>

export type PesoZoneShape =
  | { kind: 'circle'; cx: number; cy: number; r: number }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; rotate: number }

/** Geometri for PESO-SVG (viewBox 900×720) — matcher HTML-referencen. */
export const PESO_ZONES: Record<PesoFieldId, PesoZoneShape> = {
  earned: { kind: 'circle', cx: 450, cy: 210, r: 170 },
  paid: { kind: 'circle', cx: 280, cy: 360, r: 170 },
  shared: { kind: 'circle', cx: 620, cy: 360, r: 170 },
  owned: { kind: 'circle', cx: 450, cy: 510, r: 170 },
  paidEarned: { kind: 'ellipse', cx: 355, cy: 285, rx: 62, ry: 118, rotate: -45 },
  earnedShared: { kind: 'ellipse', cx: 545, cy: 285, rx: 62, ry: 118, rotate: 45 },
  sharedOwned: { kind: 'ellipse', cx: 545, cy: 435, rx: 62, ry: 118, rotate: -45 },
  ownedPaid: { kind: 'ellipse', cx: 355, cy: 435, rx: 62, ry: 118, rotate: 45 },
  core: { kind: 'circle', cx: 450, cy: 360, r: 66 },
}

/** Klikbare felter — samme rækkefølge som HTML (mellemfelter over hovedfelter). */
export const PESO_HIT_RENDER_ORDER: PesoFieldId[] = [
  'earned',
  'paid',
  'shared',
  'owned',
  'paidEarned',
  'earnedShared',
  'sharedOwned',
  'ownedPaid',
  'core',
]

export const PESO_FIELD_ORDER: PesoFieldId[] = [
  'paid',
  'earned',
  'shared',
  'owned',
  'paidEarned',
  'earnedShared',
  'sharedOwned',
  'ownedPaid',
  'core',
]

const DEFAULT_FIELDS: PesoModelData = {
  paid: {
    id: 'paid',
    label: 'Paid',
    title: 'Paid media',
    description: '',
    examples: ['Annoncer', 'Sponsoreret indhold', 'Influencer-kampagner (betalt)', 'Display og programmatic'],
    color: '#dc3f45',
  },
  earned: {
    id: 'earned',
    label: 'Earned',
    title: 'Earned media',
    description: '',
    examples: ['Presse og PR', 'Anmeldelser', 'Word of mouth', 'Medieomtale uden betaling'],
    color: '#7a3ea0',
  },
  shared: {
    id: 'shared',
    label: 'Shared',
    title: 'Shared media',
    description: '',
    examples: ['Sociale medier', 'Community og forums', 'Employee advocacy', 'Ko-kreation med brugere'],
    color: '#86cbd4',
  },
  owned: {
    id: 'owned',
    label: 'Owned',
    title: 'Owned media',
    description: '',
    examples: ['Website og blog', 'Nyhedsbrev', 'App og produkt', 'Egen database / CRM'],
    color: '#b7d94f',
  },
  paidEarned: {
    id: 'paidEarned',
    label: 'Paid + Earned',
    title: 'Paid × Earned',
    description: '',
    examples: ['Sponsoreret PR', 'Betalt amplification af presse', 'Partnerskaber med medier'],
    color: '#0d9488',
  },
  earnedShared: {
    id: 'earnedShared',
    label: 'Earned + Shared',
    title: 'Earned × Shared',
    description: '',
    examples: ['Viralt indhold', 'Deling af pressehistorier', 'Community der taler om jer'],
    color: '#4f46e5',
  },
  sharedOwned: {
    id: 'sharedOwned',
    label: 'Shared + Owned',
    title: 'Shared × Owned',
    description: '',
    examples: ['SoMe der driver trafik til site', 'Nyhedsbrev + sociale kanaler', 'Content hub'],
    color: '#c026d3',
  },
  ownedPaid: {
    id: 'ownedPaid',
    label: 'Owned + Paid',
    title: 'Owned × Paid',
    description: '',
    examples: ['Landing pages til kampagner', 'Retargeting mod egne lister', 'Paid trafik til eget indhold'],
    color: '#ea580c',
  },
  core: {
    id: 'core',
    label: 'Kernen',
    title: 'Integreret PESO',
    description: '',
    examples: [
      'Én fortælling på tværs af kanaler',
      'Klar rollefordeling mellem paid, earned, shared og owned',
      'Fælles mål og måling',
    ],
    color: '#03040a',
  },
}

export function createDefaultPesoData(): PesoModelData {
  return JSON.parse(JSON.stringify(DEFAULT_FIELDS)) as PesoModelData
}

export function normalizePesoData(raw: Partial<PesoModelData> | undefined): PesoModelData {
  const base = createDefaultPesoData()
  if (!raw) return base
  for (const id of PESO_FIELD_ORDER) {
    const patch = raw[id]
    if (!patch) continue
    base[id] = {
      ...base[id],
      title: typeof patch.title === 'string' ? patch.title : base[id].title,
      description: typeof patch.description === 'string' ? patch.description : base[id].description,
    }
  }
  return base
}
