'use client'

export default function AuthGraphic() {
  return (
    <div className="absolute inset-0 min-h-[400px] overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-amber-950">
      {/* Soft ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500/20 blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-fuchsia-500/25 blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-orange-400/15 blur-[50px] animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Floating isometric cubes - creative building blocks */}
      <div className="absolute top-[20%] left-[15%] w-16 h-16 animate-[float_5s_ease-in-out_infinite]">
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="cube1-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="cube1-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="100%" stopColor="#c2410c" />
            </linearGradient>
            <linearGradient id="cube1-left" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#dc2626" />
            </linearGradient>
          </defs>
          <path d="M 50 20 L 85 45 L 85 105 L 50 120 L 15 105 L 15 45 Z" fill="url(#cube1-top)" />
          <path d="M 50 20 L 50 80 L 15 105 L 15 45 Z" fill="url(#cube1-left)" opacity="0.85" />
          <path d="M 50 20 L 85 45 L 50 80 L 15 45 Z" fill="url(#cube1-right)" opacity="0.7" />
        </svg>
      </div>

      <div className="absolute top-[35%] right-[20%] w-12 h-12 animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: '-1s' }}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg opacity-90">
          <path d="M 50 25 L 82 47 L 82 97 L 50 115 L 18 97 L 18 47 Z" fill="#c084fc" />
          <path d="M 50 25 L 50 80 L 18 97 L 18 47 Z" fill="#a855f7" opacity="0.85" />
          <path d="M 50 25 L 82 47 L 50 80 L 18 47 Z" fill="#7c3aed" opacity="0.7" />
        </svg>
      </div>

      <div className="absolute bottom-[40%] left-[25%] w-14 h-14 animate-[float_4.5s_ease-in-out_infinite]" style={{ animationDelay: '-2.5s' }}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg opacity-95">
          <path d="M 50 30 L 80 50 L 80 95 L 50 110 L 20 95 L 20 50 Z" fill="#fb923c" />
          <path d="M 50 30 L 50 80 L 20 95 L 20 50 Z" fill="#f97316" opacity="0.85" />
          <path d="M 50 30 L 80 50 L 50 80 L 20 50 Z" fill="#ea580c" opacity="0.7" />
        </svg>
      </div>

      <div className="absolute bottom-[25%] right-[30%] w-10 h-10 animate-[float_5.5s_ease-in-out_infinite]" style={{ animationDelay: '-0.5s' }}>
        <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-lg opacity-80">
          <path d="M 50 20 L 85 45 L 85 100 L 50 115 L 15 100 L 15 45 Z" fill="#e879f9" />
          <path d="M 50 20 L 50 80 L 15 100 L 15 45 Z" fill="#d946ef" opacity="0.85" />
          <path d="M 50 20 L 85 45 L 50 80 L 15 45 Z" fill="#a21caf" opacity="0.7" />
        </svg>
      </div>

      {/* Floating diamond/rhombus shapes */}
      <div className="absolute top-[55%] left-[10%] w-8 h-8 animate-[float_4s_ease-in-out_infinite]" style={{ animationDelay: '-1.5s' }}>
        <svg viewBox="0 0 60 80" className="w-full h-full opacity-75">
          <path d="M 30 0 L 60 40 L 30 80 L 0 40 Z" fill="none" stroke="#fbbf24" strokeWidth="3" strokeOpacity="0.9" />
        </svg>
      </div>
      <div className="absolute top-[25%] right-[8%] w-6 h-6 animate-[float_5s_ease-in-out_infinite]" style={{ animationDelay: '-3s' }}>
        <svg viewBox="0 0 60 80" className="w-full h-full opacity-60">
          <path d="M 30 0 L 60 40 L 30 80 L 0 40 Z" fill="rgba(251,191,36,0.4)" />
        </svg>
      </div>

      {/* Connection lines - idea flow */}
      <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
        <path
          d="M 10 30 Q 30 50 20 70 T 40 90"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="animate-pulse"
        />
        <path
          d="M 90 40 Q 70 60 80 85"
          fill="none"
          stroke="#c084fc"
          strokeWidth="1"
          strokeDasharray="3 5"
          className="animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
      </svg>

      {/* Abstract organic blob at bottom */}
      <svg
        className="absolute bottom-0 left-0 w-full h-[45%] opacity-90"
        viewBox="0 0 800 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="blobGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M 0 400 Q 100 250 200 300 Q 350 200 400 280 Q 500 180 600 320 Q 700 250 800 350 L 800 400 L 0 400 Z"
          fill="url(#blobGrad)"
        />
        <path
          d="M 0 400 Q 150 300 300 350 Q 450 250 550 320 Q 650 280 800 380 L 800 400 L 0 400 Z"
          fill="rgba(124, 58, 237, 0.2)"
        />
      </svg>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ForgeLab watermark */}
      <div className="absolute bottom-4 right-4 text-white/10 font-bold text-4xl tracking-tight select-none pointer-events-none">
        ForgeLab
      </div>
    </div>
  )
}
