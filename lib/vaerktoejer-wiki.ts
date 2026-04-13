import type { Vaerktoej } from '@/lib/vaerktoejer-data'

/** Gruppér værktøjer efter første bogstav (dansk sortering); cifre under «#». */
export function groupVaerktoejerByFirstLetter(tools: Vaerktoej[]) {
  const sorted = [...tools].sort((a, b) =>
    a.title.localeCompare(b.title, 'da', { sensitivity: 'base' })
  )
  const groups: { letter: string; items: Vaerktoej[] }[] = []
  for (const t of sorted) {
    const raw = t.title.trim().charAt(0)
    const letter = /[0-9]/.test(raw) ? '#' : raw.toLocaleUpperCase('da-DK')
    const last = groups[groups.length - 1]
    if (last?.letter === letter) last.items.push(t)
    else groups.push({ letter, items: [t] })
  }
  return groups
}
