'use client'

export default function AuthGraphic() {
  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900/90 to-orange-950/80">
      {/* Stars */}
      <div className="absolute inset-0">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 60}%`,
              opacity: 0.4 + Math.random() * 0.6,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Shooting stars */}
      <div className="absolute top-10 left-1/4 w-1 h-1 bg-sky-200 rounded-full animate-pulse" style={{ boxShadow: '0 0 6px 2px rgba(186,230,253,0.6)' }} />
      <div className="absolute top-20 right-1/3 w-0.5 h-0.5 bg-amber-200 rounded-full animate-pulse" style={{ boxShadow: '0 0 4px 1px rgba(253,230,138,0.5)' }} />

      {/* Clouds */}
      <div className="absolute top-[15%] left-[5%] w-24 h-8 rounded-full bg-purple-400/30 blur-md" />
      <div className="absolute top-[12%] left-[15%] w-16 h-6 rounded-full bg-pink-400/25 blur-md" />
      <div className="absolute top-[18%] right-[10%] w-20 h-7 rounded-full bg-sky-400/25 blur-md" />
      <div className="absolute top-[14%] right-[20%] w-14 h-5 rounded-full bg-amber-200/20 blur-md" />

      {/* Mountains - orange/purple gradient */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[55%]"
        viewBox="0 0 800 300"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#ea580c" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#c084fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="mountain3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path d="M 0 300 L 0 180 L 120 120 L 200 160 L 280 100 L 400 160 L 480 80 L 560 140 L 650 90 L 800 180 L 800 300 Z" fill="url(#mountain1)" />
        <path d="M 0 300 L 80 200 L 180 150 L 300 200 L 400 130 L 520 180 L 620 140 L 800 220 L 800 300 Z" fill="url(#mountain2)" />
        <path d="M 0 300 L 150 220 L 250 170 L 380 230 L 500 160 L 700 220 L 800 250 L 800 300 Z" fill="url(#mountain3)" />
      </svg>

      {/* Rocket */}
      <div className="absolute bottom-[32%] left-1/2 -translate-x-1/2 w-20 animate-[float_4s_ease-in-out_infinite]">
        <svg viewBox="0 0 80 120" className="w-full h-auto drop-shadow-lg">
          <defs>
            <linearGradient id="rocketNose" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>
            <linearGradient id="rocketBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          {/* Nose cone */}
          <ellipse cx="40" cy="25" rx="12" ry="20" fill="url(#rocketNose)" />
          <circle cx="40" cy="20" r="4" fill="#7c3aed" opacity="0.8" />
          {/* Body */}
          <rect x="28" y="35" width="24" height="50" rx="4" fill="url(#rocketBody)" />
          {/* Fins */}
          <path d="M 28 85 L 15 120 L 28 95 Z" fill="#7c3aed" />
          <path d="M 52 85 L 65 120 L 52 95 Z" fill="#7c3aed" />
          <path d="M 40 82 L 40 120 L 35 95 Z" fill="#6d28d9" />
          <path d="M 40 82 L 45 95 L 40 120 Z" fill="#6d28d9" />
        </svg>
      </div>

      {/* Exhaust / smoke */}
      <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 w-40 h-24">
        <div className="absolute inset-0 rounded-full bg-white/30 blur-xl animate-pulse" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 h-16 rounded-full bg-sky-200/40 blur-2xl" />
      </div>

      {/* ForgeLab watermark */}
      <div className="absolute bottom-4 right-4 text-white/10 font-bold text-4xl tracking-tight select-none pointer-events-none">
        ForgeLab
      </div>
    </div>
  )
}
