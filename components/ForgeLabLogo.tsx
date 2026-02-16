interface ForgeLabLogoProps {
  size?: number
  className?: string
}

export default function ForgeLabLogo({ size = 40, className = '' }: ForgeLabLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g fill="#F97316">
        <rect x="30" y="20" width="40" height="15" />
        <rect x="30" y="42.5" width="40" height="15" />
        <rect x="30" y="65" width="40" height="15" />
      </g>
    </svg>
  )
}
