import type { KeyboardEvent } from 'react'

/** Fjern række med Backspace/Delete når feltet er tomt (erstatter synlig slet-knap). */
export function deleteEmptyFieldRow(
  e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  value: string,
  canRemove: boolean,
  remove: () => void
): void {
  if (e.key !== 'Backspace' && e.key !== 'Delete') return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (value.trim() !== '') return
  if (!canRemove) return
  e.preventDefault()
  remove()
}
