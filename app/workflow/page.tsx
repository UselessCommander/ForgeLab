import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import {
  ArrowRight, CheckCircle2, Sparkles, LogIn,
  PenTool, LayoutDashboard, Users, Share2,
  ChevronRight, Kanban, GitBranch, MessageSquare,
  FileText, ScanLine, Target, Zap, Globe,
} from 'lucide-react'

export default async function WorkflowPage() {
  const userId = await getCurrentUserId()

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes lineGrow { from{height:0;opacity:0} to{opacity:1} }
        .fu  { animation: fadeUp 0.6s ease both }
        .fu1 { animation: fadeUp 0.6s 0.1s ease both }
        .fu2 { animation: fadeUp 0.6s 0.2s ease both }
        .ch  { transition: transform 0.2s ease, box-shadow 0.2s ease }
        .ch:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08) }
        .fl  { animation: float 5s ease-in-out infinite }
        .section-dark { background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%) }
        .line-grow { animation: lineGrow 1s 0.5s ease both }
      `}</style>

      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ebebeb_1px,transparent_1px),linear-gradient(to_bottom,#ebebeb_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-white via-emerald-50/10 to-violet-50/10 pointer-events-none" />

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
                <Link key={h} href={h} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${h === '/workflow' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>{l}</Link>
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
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="fu inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Fra idé til levering
          </div>
          <h1 className="fu1 text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            Dit projekt. <span className="text-emerald-500">Dit workflow.</span><br />Ét sted.
          </h1>
          <p className="fu2 text-xl text-gray-500 max-w-2xl mx-auto mb-12">
            ForgeLab er bygget rundt om din arbejdsproces — ikke omvendt. Fra første idé til lancering følger platformen dit team hvert skridt.
          </p>
        </section>

        {/* STEPS — vertical timeline */}
        <section className="max-w-4xl mx-auto px-6 pb-32">
          <div className="relative">
            {/* vertical line */}
            <div className="hidden md:block absolute left-[27px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-amber-300 via-violet-400 to-emerald-400 line-grow" />

            <div className="space-y-6">
              {[
                {
                  step: '01', icon: PenTool, color: 'from-amber-500 to-orange-500',
                  iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
                  title: 'Opret dit projekt',
                  desc: 'Start et nyt projekt på under 60 sekunder. Inviter teammedlemmer via email, tildel roller (Owner, Editor, Viewer) og vælg de værktøjer der passer til jeres workflow.',
                  tools: ['Projektoversigt', 'Team-invitationer', 'Rollestyring', 'Værktøjsvalg'],
                  accent: 'border-amber-200 bg-amber-50/50',
                },
                {
                  step: '02', icon: LayoutDashboard, color: 'from-violet-500 to-indigo-600',
                  iconBg: 'bg-violet-50', iconColor: 'text-violet-600',
                  title: 'Kortlæg & planlæg',
                  desc: 'Brug det visuelle board til at kortlægge idéen med sticky notes og sektioner. Byg et flowchart over arkitekturen, lav SWOT-analyse og læg sprints i Gantt-diagrammet.',
                  tools: ['Canvas board', 'Flowchart builder', 'SWOT-analyse', 'Gantt-diagram', 'Brainstorming'],
                  accent: 'border-violet-200 bg-violet-50/50',
                },
                {
                  step: '03', icon: Users, color: 'from-emerald-500 to-teal-500',
                  iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
                  title: 'Samarbejd i realtid',
                  desc: 'Live-cursors viser præcis hvad alle teammedlemmer arbejder på. Brug Kanban-boardet til at styre opgaver, chat-funktionen til kommunikation og board-kommentarer til feedback direkte på canvas.',
                  tools: ['Live-cursors', 'Kanban board', 'Team chat', '@Mentions', 'Board-kommentarer', 'Emoji-reaktioner'],
                  accent: 'border-emerald-200 bg-emerald-50/50',
                },
                {
                  step: '04', icon: FileText, color: 'from-sky-500 to-blue-600',
                  iconBg: 'bg-sky-50', iconColor: 'text-sky-600',
                  title: 'Test & validér',
                  desc: 'Byg surveys direkte i projektet og send dem til brugere via link. Brug card sorting til at teste informationsarkitektur og empathy maps til at forstå brugerbehov.',
                  tools: ['Survey builder', 'Card Sorting', 'Empathy Map', 'Response analytics'],
                  accent: 'border-sky-200 bg-sky-50/50',
                },
                {
                  step: '05', icon: Share2, color: 'from-rose-500 to-pink-600',
                  iconBg: 'bg-rose-50', iconColor: 'text-rose-600',
                  title: 'Del & lancér',
                  desc: 'Eksporter boardet som PDF, generer trackede QR-koder til marketing og del slides med stakeholders. Se live scanningsdata og analytics efter lanceringen.',
                  tools: ['QR-kode generator', 'Scan-analytics', 'Slide eksport', 'PDF eksport', 'Del via link'],
                  accent: 'border-rose-200 bg-rose-50/50',
                },
              ].map(({ step, icon: Icon, iconBg, iconColor, title, desc, tools, accent }, i) => (
                <div key={step} className="flex gap-6">
                  {/* step circle */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm border border-gray-200/60 z-10 relative`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  </div>
                  {/* content */}
                  <div className={`ch flex-1 rounded-3xl border p-8 shadow-sm ${accent} mb-2`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-extrabold text-gray-400 uppercase tracking-widest">Trin {step}</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-3">{title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">{desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {tools.map(t => (
                        <span key={t} className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full shadow-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* USE CASES */}
        <section className="section-dark py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-emerald-500/8 blur-3xl rounded-full" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">Til alle slags teams</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">ForgeLab passer til startup, bureau, designteam eller intern produktafdeling.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  emoji: '🚀', title: 'Startups', color: 'border-amber-500/30 bg-amber-500/5',
                  desc: 'Fra MVP-idé til launch. Brug board, Gantt, surveys og QR-koder til at validere og lancere hurtigt.',
                  steps: ['Board til ideation', 'Gantt til sprint-plan', 'Surveys til user testing', 'QR til lancering'],
                },
                {
                  emoji: '🎨', title: 'Design bureauer', color: 'border-violet-500/30 bg-violet-500/5',
                  desc: 'Håndter klientprojekter med flowcharts, præsentér med slides og sam-arbejd live på canvas.',
                  steps: ['Flowchart til arkitektur', 'Live-cursor review', 'Slides til præsentation', 'Eksport til klient'],
                },
                {
                  emoji: '🏢', title: 'Produktteams', color: 'border-emerald-500/30 bg-emerald-500/5',
                  desc: 'Kanban til backlog, Gantt til roadmap, SWOT til strategi og analytics til performance.',
                  steps: ['Kanban backlog', 'SWOT-analyse', 'Gantt roadmap', 'Analytics dashboard'],
                },
              ].map(({ emoji, title, color, desc, steps }) => (
                <div key={title} className={`ch rounded-3xl p-8 border ${color}`}>
                  <div className="text-4xl mb-5">{emoji}</div>
                  <h3 className="text-xl font-extrabold text-white mb-3">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">{desc}</p>
                  <div className="space-y-2">
                    {steps.map((s, i) => (
                      <div key={s} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">{i + 1}</div>
                        <span className="text-sm text-gray-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight mb-5">Start dit workflow i dag</h2>
          <p className="text-gray-500 text-lg mb-10">Gratis konto. Klar på 2 minutter. Ingen kreditkort.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">
              Opret gratis konto <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all">
              Se alle features
            </Link>
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
