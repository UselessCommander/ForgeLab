'use client'

type Props = {
  children: React.ReactNode
  className?: string
}

/** Åbner cookie-banneret (fx fra footer) så brugeren kan ændre samtykke. */
export default function CookieConsentOpenButton({ children, className }: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent('forgelab:cookie-consent', { detail: { open: true } }))
      }}
    >
      {children}
    </button>
  )
}
