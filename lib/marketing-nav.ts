/** Public marketing header nav (landing + features). Excludes pricing, workflow, om os. */
export const MARKETING_HEADER_LINKS: ReadonlyArray<readonly [href: string, label: string]> = [
  ['/', 'Hjem'],
  ['/features', 'Features'],
]

/** Landing page header — logo is home, so only link to features. */
export const LANDING_HEADER_LINKS: ReadonlyArray<readonly [href: string, label: string]> = [
  ['/features', 'Features'],
]

/** Footer platform column on public marketing pages. */
export const MARKETING_FOOTER_PLATFORM_LINKS: ReadonlyArray<readonly [href: string, label: string]> = [
  ['/features', 'Features'],
  ['/vaerktoejer-oversigt', 'Alle værktøjer'],
]
