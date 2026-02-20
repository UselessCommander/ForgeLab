'use client'

/** Wraps page content with landing-style background (grid + gradient). Use on all internal pages. */
export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-hidden">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f1f3_1px,transparent_1px),linear-gradient(to_bottom,#f0f1f3_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-white/80 via-transparent to-amber-50/30 pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
