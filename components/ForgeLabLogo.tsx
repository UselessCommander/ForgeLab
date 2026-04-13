interface ForgeLabLogoProps {
  size?: number
  className?: string
  /** Til skærmlæsere når logoet står alene uden synlig tekst */
  'aria-label'?: string
}

export default function ForgeLabLogo({
  size = 40,
  className = '',
  'aria-label': ariaLabel,
}: ForgeLabLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`.trim()}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )
}
