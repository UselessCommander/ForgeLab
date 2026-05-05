import { Fragment } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import {
  ArrowRight, CheckCircle2, Sparkles, LogIn,
  ChevronRight, Zap, Shield, Users, Star, Globe,
} from 'lucide-react'

export default async function PricingPage() {
  const userId = await getCurrentUserId()
  redirect(userId ? '/dashboard' : '/')

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} 50%{box-shadow:0 0 32px 8px rgba(245,158,11,0.2)} }
        .fu  { animation: fadeUp 0.6s ease both }
        .fu1 { animation: fadeUp 0.6s 0.1s ease both }
        .fu2 { animation: fadeUp 0.6s 0.2s ease both }
        .ch  { transition: transform 0.2s ease, box-shadow 0.2s ease }
        .ch:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08) }
        .pg  { animation: pulseGlow 3s ease-in-out infinite }
        .section-dark { background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%) }
      `}</style>

      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ebebeb_1px,transparent_1px),linear-gradient(to_bottom,#ebebeb_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-white via-amber-50/10 to-orange-50/10 pointer-events-none" />
      <div className="fixed top-0 right-0 w-[500px] h-[400px] bg-amber-400/6 blur-3xl rounded-full pointer-events-none -translate-y-1/4 translate-x-1/4" />

      <div className="relative z-10">
        {/* NAV */}
        <nav className="border-b border-gray-200/50 bg-white/75 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white text-xs font-extrabold shadow-sm shadow-amber-500/30 select-none">F</span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">ForgeLab</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {([['/', 'Hjem'], ['/features', 'Features'], ['/workflow', 'Workflow'], ['/pricing', 'Priser'], ['/om', 'Om os']] as [string, string][]).map(([h, l]) => (
                <Link key={h} href={h} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${h === '/pricing' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>{l}</Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/register" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">Opret konto</Link>
              <Link href={userId ? '/dashboard' : '/login'} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm">
                <LogIn className="w-4 h-4" />{userId ? 'Dashboard' : 'Log Ind'}
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="fu inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Simpel, gennemsigtig prissætning
          </div>
          <h1 className="fu1 text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Betal kun for<br /><span className="text-amber-500">det du bruger.</span>
          </h1>
          <p className="fu2 text-xl text-gray-500 max-w-2xl mx-auto">
            Start helt gratis. Opgrader når du er klar. Ingen skjulte gebyrer.
          </p>
        </section>

        {/* PLANS */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

            {/* FREE */}
            <div className="ch bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="mb-6">
                <div className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Gratis</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-gray-900">0 kr</span>
                </div>
                <div className="text-sm text-gray-500">for evigt · ingen kreditkort</div>
              </div>
              <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all mb-8">
                Start gratis <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Inkluderet</div>
              <div className="space-y-3">
                {[
                  '1 aktivt projekt',
                  'Op til 3 teammedlemmer',
                  'Canvas board + sticky notes',
                  'Kanban board',
                  'Team chat',
                  'QR-koder (5 pr. måned)',
                  'Community support',
                ].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRO — featured */}
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-amber-500 text-white text-xs font-extrabold px-5 py-1.5 rounded-full shadow-lg shadow-amber-500/30 whitespace-nowrap z-10">
                <Star className="w-3 h-3 fill-white" /> Mest populær
              </div>
              <div className="pg ch bg-gradient-to-b from-amber-500 to-orange-600 rounded-3xl p-8 shadow-2xl shadow-amber-500/25 text-white">
                <div className="mb-6">
                  <div className="text-sm font-bold uppercase tracking-widest text-amber-200 mb-2">Pro</div>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-5xl font-extrabold">149 kr</span>
                  </div>
                  <div className="text-sm text-amber-200">pr. måned · faktureret månedligt</div>
                </div>
                <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-white text-amber-600 rounded-2xl font-extrabold text-sm hover:bg-amber-50 transition-all mb-8 shadow-lg">
                  Kom i gang nu <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-xs font-bold uppercase tracking-widest text-amber-200 mb-4">Alt i Gratis, plus:</div>
                <div className="space-y-3">
                  {[
                    'Ubegrænset projekter',
                    'Op til 15 teammedlemmer',
                    'Alle analyse-tools (SWOT, Empathy Map m.fl.)',
                    'Flowchart builder',
                    'Gantt-diagram',
                    'Ubegrænsede QR-koder',
                    'Live scan-analytics',
                    'Surveys & slide editor',
                    'Live-cursor samarbejde',
                    'PDF/PNG eksport',
                    'Prioritets support',
                  ].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-amber-200 flex-shrink-0" />
                      <span className="text-sm text-amber-50">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TEAM */}
            <div className="ch bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
              <div className="mb-6">
                <div className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Team</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-extrabold text-gray-900">399 kr</span>
                </div>
                <div className="text-sm text-gray-500">pr. måned · op til 50 brugere</div>
              </div>
              <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-all mb-8">
                Kontakt os <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Alt i Pro, plus:</div>
              <div className="space-y-3">
                {[
                  'Op til 50 teammedlemmer',
                  'Advanced analytics & rapporter',
                  'Custom branding på QR-koder',
                  'SSO (Single Sign-On)',
                  'Admin & bruger-panel',
                  'Dedikeret account manager',
                  'SLA & oppetidsgaranti',
                ].map(f => (
                  <div key={f} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* trust badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-14 text-sm text-gray-500">
            {[
              { icon: Shield, text: 'GDPR-compliant · EU-hosting' },
              { icon: Zap, text: 'Klar på under 2 minutter' },
              { icon: Users, text: 'Cancel eller skift plan til enhver tid' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="inline-flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-full shadow-sm">
                <Icon className="w-4 h-4 text-amber-500" />{text}
              </div>
            ))}
          </div>
        </section>

        {/* FEATURE COMPARISON TABLE */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center tracking-tight">Detaljeret sammenligning</h2>
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-5 px-6 text-gray-500 font-semibold w-2/5">Feature</th>
                  <th className="py-5 px-4 text-center text-gray-700 font-bold">Gratis</th>
                  <th className="py-5 px-4 text-center text-amber-600 font-extrabold">Pro</th>
                  <th className="py-5 px-4 text-center text-gray-700 font-bold">Team</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: 'Projekter', rows: [
                    ['Antal projekter', '1', 'Ubegrænset', 'Ubegrænset'],
                    ['Teammedlemmer', '3', '15', '50'],
                  ]},
                  { cat: 'Boards & Planlægning', rows: [
                    ['Canvas board', '✓', '✓', '✓'],
                    ['Kanban board', '✓', '✓', '✓'],
                    ['Flowchart builder', '✕', '✓', '✓'],
                    ['Gantt-diagram', '✕', '✓', '✓'],
                    ['Live-cursor samarbejde', '✕', '✓', '✓'],
                  ]},
                  { cat: 'Analyse & Templates', rows: [
                    ['SWOT-analyse', '✕', '✓', '✓'],
                    ['Empathy Map', '✕', '✓', '✓'],
                    ['Card Sorting', '✕', '✓', '✓'],
                    ['Brainstorming', '✓', '✓', '✓'],
                    ['Retrospektiv', '✕', '✓', '✓'],
                  ]},
                  { cat: 'Kommunikation', rows: [
                    ['Team chat', '✓', '✓', '✓'],
                    ['Board-kommentarer', '✓', '✓', '✓'],
                    ['Emoji-reaktioner', '✓', '✓', '✓'],
                    ['@Mentions', '✕', '✓', '✓'],
                  ]},
                  { cat: 'QR & Analytics', rows: [
                    ['QR-koder', '5/mdr', 'Ubegrænset', 'Ubegrænset'],
                    ['Scan-analytics', 'Basis', 'Avanceret', 'Fuld'],
                    ['Custom branding', '✕', '✕', '✓'],
                  ]},
                  { cat: 'Surveys & Præsentation', rows: [
                    ['Survey builder', '✕', '✓', '✓'],
                    ['Slide editor', '✕', '✓', '✓'],
                    ['PDF/PNG eksport', '✕', '✓', '✓'],
                  ]},
                  { cat: 'Admin & Sikkerhed', rows: [
                    ['GDPR-compliant', '✓', '✓', '✓'],
                    ['SSO', '✕', '✕', '✓'],
                    ['Admin panel', '✕', '✕', '✓'],
                    ['SLA garanti', '✕', '✕', '✓'],
                  ]},
                ].map(({ cat, rows }) => (
                  <Fragment key={cat}>
                    <tr className="bg-gray-50/50 border-t border-gray-100">
                      <td colSpan={4} className="px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-gray-400">{cat}</td>
                    </tr>
                    {rows.map(([label, free, pro, team]) => (
                      <tr key={label} className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
                        <td className="py-4 px-6 text-gray-700 font-medium">{label}</td>
                        <td className="py-4 px-4 text-center text-gray-500">{free === '✓' ? <span className="text-emerald-500 text-base">✓</span> : free === '✕' ? <span className="text-gray-300 text-base">✕</span> : free}</td>
                        <td className="py-4 px-4 text-center text-amber-600 font-semibold">{pro === '✓' ? <span className="text-emerald-500 text-base">✓</span> : pro === '✕' ? <span className="text-gray-300 text-base">✕</span> : pro}</td>
                        <td className="py-4 px-4 text-center text-gray-600">{team === '✓' ? <span className="text-emerald-500 text-base">✓</span> : team === '✕' ? <span className="text-gray-300 text-base">✕</span> : team}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 pb-24">
          <h2 className="text-3xl font-extrabold tracking-tight text-center mb-10">Spørgsmål om priser</h2>
          <div className="space-y-3">
            {[
              { q: 'Kan jeg skifte plan når som helst?', a: 'Ja, du kan opgradere eller nedgradere din plan til enhver tid. Ændringer træder i kraft ved næste faktureringsperiode.' },
              { q: 'Er der en gratis prøveperiode på Pro?', a: 'Du kan starte gratis og opleve platformen. Vi planlægger en 14-dages Pro-prøveperiode — hold øje med platformen.' },
              { q: 'Hvad sker der med mine data hvis jeg canceller?', a: 'Dine data bevares i 30 dage efter du afmelder din plan. Du kan eksportere alt inden da.' },
              { q: 'Tilbyder I rabat til NGOer og studerende?', a: 'Ja! Kontakt os via vores support og bevis din status — vi giver 50% rabat til NGOer, skoler og studerende.' },
              { q: 'Hvad er betalingsmetoderne?', a: 'Vi accepterer alle større kreditkort (Visa, Mastercard) samt MobilePay. Betaling sker via Stripe.' },
            ].map(({ q, a }, i) => (
              <details key={i} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer font-semibold text-gray-900 text-sm list-none hover:bg-amber-50/50 transition-colors">
                  {q}
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-90 transition-transform duration-200" />
                </summary>
                <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">{a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="section-dark relative overflow-hidden rounded-3xl p-14 md:p-20 text-center shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-amber-500/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
                Start gratis i dag.<br /><span className="text-amber-400">Opgrader når du er klar.</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">Ingen kreditkort. Ingen binding. Fuld adgang til Gratis-planen for evigt.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="pg inline-flex items-center justify-center gap-2 px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">
                  Opret gratis konto <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/features" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 text-white border border-white/15 rounded-2xl font-semibold hover:bg-white/20 transition-all">
                  Se alle features
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-gray-200/60 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-white text-[10px] font-extrabold select-none">F</span>
                  <span className="font-bold text-gray-900">ForgeLab</span>
                </div>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">Alt-i-ét projektplatform til moderne teams. Bygget i Danmark.</p>
                <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
                  <Globe className="w-3.5 h-3.5" /><span>Danmark · EU · GDPR</span>
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-4">Platform</div>
                {([['/', 'Hjem'], ['/features', 'Features'], ['/workflow', 'Workflow'], ['/pricing', 'Priser'], ['/om', 'Om os'], ['/vaerktoejer-oversigt', 'Alle værktøjer']] as [string, string][]).map(([h, l]) => (
                  <Link key={h} href={h} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">{l}</Link>
                ))}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-4">Konto</div>
                {([['/login', 'Log ind'], ['/register', 'Opret konto'], ['/dashboard', 'Dashboard']] as [string, string][]).map(([h, l]) => (
                  <Link key={h} href={h} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">{l}</Link>
                ))}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-4">Juridisk</div>
                {([['/privatliv', 'Privatlivspolitik'], ['/vilkar', 'Brugervilkår'], ['/cookies', 'Cookiepolitik']] as [string, string][]).map(([h, l]) => (
                  <Link key={h} href={h} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">{l}</Link>
                ))}
              </div>
            </div>
            <div className="pt-8 border-t border-gray-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm text-gray-400">© 2025 ForgeLab. Alle rettigheder forbeholdt.</span>
              <p className="text-sm text-gray-400">
                designed &amp; created by{' '}
                <Link href="https://www.floweffekt.dk/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 hover:underline underline-offset-2 transition-colors">FlowEffekt</Link>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
