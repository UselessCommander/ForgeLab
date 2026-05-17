import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import { MARKETING_FOOTER_PLATFORM_LINKS, MARKETING_HEADER_LINKS } from '@/lib/marketing-nav'
import {
  ArrowRight, Kanban, GitBranch, BarChart3, MessageSquare,
  FileText, ScanLine, Target, Users, Zap, Lock,
  CheckCircle2, Sparkles, LogIn, MousePointer2, Layout,
  PresentationIcon, ClipboardList, Globe, Workflow,
} from 'lucide-react'

export default async function FeaturesPage() {
  const userId = await getCurrentUserId()

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }
        .fu  { animation: fadeUp 0.6s ease both }
        .fu1 { animation: fadeUp 0.6s 0.1s ease both }
        .fu2 { animation: fadeUp 0.6s 0.2s ease both }
        .fu3 { animation: fadeUp 0.6s 0.3s ease both }
        .ch { transition: transform 0.2s ease, box-shadow 0.2s ease }
        .ch:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.09) }
        .fl { animation: float 5s ease-in-out infinite }
        .section-dark { background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%) }
        .tool-chip { display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;border:1px solid rgba(0,0,0,0.06);background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.05) }
      `}</style>

      {/* BG */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e8e8e8_1px,transparent_1px),linear-gradient(to_bottom,#e8e8e8_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-white via-amber-50/20 to-violet-50/10 pointer-events-none" />

      <div className="relative z-10">
        {/* NAV */}
        <nav className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white text-xs font-extrabold shadow-sm shadow-amber-500/30 select-none">F</span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">ForgeLab</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {MARKETING_HEADER_LINKS.map(([h, l]) => (
                <Link key={h} href={h} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${h === '/features' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>{l}</Link>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/register" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Opret konto</Link>
              <Link href={userId ? '/dashboard' : '/login'} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm">
                <LogIn className="w-4 h-4" />{userId ? 'Dashboard' : 'Log Ind'}
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="fu inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            25+ integrerede features — ét workspace
          </div>
          <h1 className="fu1 text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05] max-w-5xl mx-auto">
            Alt hvad dit team<br />behøver.{' '}
            <span className="relative">
              <span className="text-amber-500">Samlet ét sted.</span>
            </span>
          </h1>
          <p className="fu2 text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            ForgeLab erstatter Trello, Figma, Notion, Slack og Google Forms — med ét samlet workspace der følger dit projekt fra idé til levering.
          </p>
          <div className="fu2 flex flex-wrap gap-3 justify-center mb-10">
            {[['Gratis at starte','emerald'],['Ingen kreditkort','emerald'],['Klar på 2 min','emerald'],['GDPR-compliant','blue']].map(([t, c]) => (
              <span key={t} className={`inline-flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2 rounded-full text-sm font-medium shadow-sm text-gray-700`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${c === 'blue' ? 'text-blue-500' : 'text-emerald-500'}`} />{t}
              </span>
            ))}
          </div>
          <div className="fu3 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 text-sm">
              Prøv gratis nu <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all text-sm">
              Se priser
            </Link>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ['25+', 'Integrerede tools', 'amber'],
              ['100%', 'Dansk/EU hosting', 'blue'],
              ['∞', 'Projekter & boards', 'emerald'],
              ['0 kr', 'For at komme i gang', 'violet'],
            ].map(([num, label, color]) => (
              <div key={label} className="ch bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                <div className={`text-3xl font-extrabold mb-1 ${color === 'amber' ? 'text-amber-500' : color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-500' : 'text-violet-500'}`}>{num}</div>
                <div className="text-sm text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* BENTO GRID — CORE FEATURES */}
        <section className="max-w-7xl mx-auto px-6 pb-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-4 uppercase tracking-wide">Kernefunktioner</div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Bygget til hele projekcyklen</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Fra første brainstorm til levering — ForgeLab har et tool til hvert trin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

            {/* Board — stor */}
            <div className="ch md:col-span-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-10 text-white relative overflow-hidden shadow-xl shadow-amber-500/20">
              <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4" />
              <Kanban className="w-11 h-11 mb-5 opacity-90" />
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">⭐ Kernefunktion</div>
              <h2 className="text-3xl font-extrabold mb-3">Visuelt Projektboard</h2>
              <p className="text-amber-100 text-base leading-relaxed mb-8 max-w-lg">
                Ubegrænset canvas med sticky notes, flowchart-noder, fri tekst og sektioner. Alle teammedlemmer ser hinandens cursors og ændringer live — uden reload.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['🖱 Live-cursors', 'Realtid museposition for alle'],
                  ['📌 Sticky notes', 'Farvekodet med @mentions'],
                  ['📐 Sektioner', 'Organiser boardet i zoner'],
                  ['✍️ Fri tekst', 'Tilpasseligt tekstfelt overalt'],
                  ['🔗 Flowchart', 'Noder med pile og labels'],
                  ['💬 Kommentarer', 'Direkte på canvas-elementet'],
                ].map(([title, desc]) => (
                  <div key={title} className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
                    <div className="font-bold text-sm mb-1">{title}</div>
                    <div className="text-amber-100 text-xs leading-relaxed">{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR */}
            <div className="ch md:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-50 rounded-full" />
              <ScanLine className="w-10 h-10 text-sky-600 mb-5 relative z-10" />
              <div className="inline-block bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full mb-4">Marketing</div>
              <h2 className="text-xl font-extrabold mb-3">QR-koder & Tracking</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">Generer trackede QR-koder og se live scanningsdata med lokation og tidspunkter direkte i projektet.</p>
              <div className="space-y-2.5">
                {['Ubegrænsede QR-koder', 'Live scan-statistik', 'PNG/SVG/PDF download', 'Geolocation tracking', 'Link-redirect styling'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat */}
            <div className="ch md:col-span-3 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-violet-50 rounded-full" />
              <MessageSquare className="w-10 h-10 text-violet-600 mb-5 relative z-10" />
              <div className="inline-block bg-violet-50 text-violet-700 text-xs font-bold px-3 py-1 rounded-full mb-4">Kommunikation</div>
              <h2 className="text-xl font-extrabold mb-3">Live Team Chat</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">Projekt-chat der lever direkte i boardet — med billeder, filer, emoji-reaktioner og nestet replies.</p>
              <div className="grid grid-cols-2 gap-2">
                {['Emoji-reaktioner', 'Fil- & billedupload', 'Board-kommentarer', 'Nestet replies', 'Live online-status', 'Realtid broadcast'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>

            {/* Flowchart + Gantt */}
            <div className="ch md:col-span-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-emerald-500/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3" />
              <GitBranch className="w-10 h-10 mb-5 opacity-90" />
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Planlægning</div>
              <h2 className="text-xl font-extrabold mb-3">Flowcharts & Gantt</h2>
              <p className="text-emerald-100 text-sm leading-relaxed mb-5">Byg proceskort og tidslinjer i ét interface. Drag-and-drop opgavekort med deadlines, tildeling og sprint-forløb.</p>
              <div className="grid grid-cols-2 gap-2">
                {['Drag-and-drop noder', 'Gantt-tidslinjer', 'Sprint-planlægning', 'Opgavekort', 'Milestone-tracking', 'Tildeling til bruger'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-sm text-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />{f}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* TOOLS ROW */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

            {/* Analyse */}
            <div className="ch bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-8 text-white shadow-lg shadow-rose-500/20">
              <Target className="w-9 h-9 mb-4 opacity-90" />
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Analyse</div>
              <h2 className="text-lg font-extrabold mb-2">Analyse-templates</h2>
              <p className="text-rose-100 text-sm leading-relaxed mb-4">Strukturerede skabeloner til strategi og brugerindsigt — klar til brug med ét klik.</p>
              <div className="flex flex-wrap gap-2">
                {['SWOT', 'Empathy Map', 'Card Sorting', 'Brainstorm', 'Retrospektiv', 'Brugerrejse'].map(f => (
                  <span key={f} className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>

            {/* Surveys */}
            <div className="ch bg-gradient-to-br from-indigo-500 to-violet-700 rounded-3xl p-8 text-white shadow-lg shadow-indigo-500/20">
              <FileText className="w-9 h-9 mb-4 opacity-90" />
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">Forskning</div>
              <h2 className="text-lg font-extrabold mb-2">Surveys & Slides</h2>
              <p className="text-indigo-100 text-sm leading-relaxed mb-4">Byg og del surveys og præsentationer direkte fra projektet — og se svar med det samme.</p>
              <div className="flex flex-wrap gap-2">
                {['Survey builder', 'Slide editor', 'Del via link', 'Eksport PDF', 'Response analytics', 'Offentlig URL'].map(f => (
                  <span key={f} className="bg-white/15 text-white text-xs font-semibold px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div className="ch bg-white border border-gray-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute -top-8 -right-8 w-36 h-36 bg-sky-50 rounded-full" />
              <BarChart3 className="w-9 h-9 text-sky-600 mb-4 relative z-10" />
              <div className="inline-block bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full mb-4">Indsigt</div>
              <h2 className="text-lg font-extrabold mb-2">Analytics Dashboard</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">Real-time statistik for projekter, QR-koder og surveys. Se KPI'er, aktivitet og teamperformance samlet.</p>
              <div className="flex flex-wrap gap-2">
                {['Projekt-aktivitet', 'QR scan-data', 'Survey-svar', 'Tidslinjer', 'Teamperformance'].map(f => (
                  <span key={f} className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">{f}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SPOTLIGHT 1 — AI */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-12 md:p-16 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 text-xs font-bold mb-6 w-fit">
                  <Sparkles className="w-3.5 h-3.5" /> AI-assistent
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">Din personlige<br />projektassistent</h2>
                <p className="text-gray-400 leading-relaxed mb-8">
                  Den indbyggede AI kender hele dit projekt — tools, data og kontekst. Spørg om alt fra SWOT-analyse til sprintplanlægning og få svar direkte i workspacet.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    ['Kontekst-bevidst', 'AI kender dine tools, projektnavn og rolle'],
                    ['Multi-model', 'GPT-4o, Claude, Gemini og open-source modeller'],
                    ['Handlingsorienteret', 'Kan foreslå og tilføje tools automatisk'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <span className="text-white font-semibold text-sm">{title} </span>
                        <span className="text-gray-400 text-sm">— {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#0a0f1e] md:rounded-r-3xl p-8 md:p-10 flex flex-col justify-center gap-3">
                {[
                  { from: true, text: 'Kan du hjælpe mig med at strukturere vores SWOT-analyse for Q3?' },
                  { from: false, text: 'Selvfølgelig! Baseret på dit Double Diamond framework anbefaler jeg at fokusere på disse 4 styrker...' },
                  { from: true, text: 'Tilføj også et Gantt-diagram til sprint-planlægning' },
                  { from: false, text: '✅ Gantt-diagrammet er tilføjet til dit projekt. Du finder det under Planlægning.' },
                ].map((m, i) => (
                  <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.from ? 'self-end bg-violet-600 text-white' : 'self-start bg-white/8 text-gray-200 border border-white/8'}`}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURE SPOTLIGHT 2 — Samarbejde */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-5 border border-amber-200">
                <Users className="w-3.5 h-3.5" /> Realtid samarbejde
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-5 leading-tight">Se dit team arbejde.<br /><span className="text-amber-500">Live.</span></h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Alle ændringer på boardet synkroniseres øjeblikkeligt for alle projektmedlemmer. Se hinandens cursors, vælgbare elementer og kommentarer uden at genindlæse siden.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: MousePointer2, label: 'Live-cursors', desc: 'Se alle brugeres position', color: 'amber' },
                  { icon: MessageSquare, label: 'Realtid chat', desc: 'Broadcast via Supabase', color: 'violet' },
                  { icon: Users, label: 'Tilstedeværelse', desc: 'Online-status for teamet', color: 'emerald' },
                  { icon: Zap, label: 'Instant sync', desc: 'Ingen manual reload', color: 'sky' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div key={label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${color === 'amber' ? 'bg-amber-100' : color === 'violet' ? 'bg-violet-100' : color === 'emerald' ? 'bg-emerald-100' : 'bg-sky-100'}`}>
                      <Icon className={`w-4 h-4 ${color === 'amber' ? 'text-amber-600' : color === 'violet' ? 'text-violet-600' : color === 'emerald' ? 'text-emerald-600' : 'text-sky-600'}`} />
                    </div>
                    <div className="font-bold text-sm text-gray-900 mb-0.5">{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/60 rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-200 text-xs font-bold text-gray-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />3 online
              </div>
              <div className="mt-10 space-y-3">
                {[
                  { name: 'Mads', color: '#F59E0B', x: '20%', action: 'redigerer sticky note' },
                  { name: 'Sara', color: '#8B5CF6', x: '55%', action: 'tilføjer kommentar' },
                  { name: 'Dig', color: '#10B981', x: '75%', action: 'ser dette nu' },
                ].map(u => (
                  <div key={u.name} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: u.color }}>
                      {u.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-gray-900">{u.name}</span>
                      <span className="text-gray-400 text-xs ml-2">{u.action}</span>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                ))}
              </div>
              <div className="mt-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold">S</div>
                  <span className="text-xs font-bold text-gray-700">Sara</span>
                  <span className="text-xs text-gray-400 ml-auto">lige nu</span>
                </div>
                <p className="text-xs text-gray-600">Skal vi flytte user testing til næste sprint? 🤔</p>
                <div className="flex gap-1 mt-2">
                  {['👍 2', '🔥 1'].map(r => <span key={r} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">{r}</span>)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY + GDPR */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-white border border-gray-200 rounded-3xl p-10 md:p-14 shadow-sm">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-5 border border-blue-200">
                  <Lock className="w-3.5 h-3.5" /> Sikkerhed & Compliance
                </div>
                <h2 className="text-3xl font-extrabold mb-5 tracking-tight">Bygget med privatliv<br />som fundament</h2>
                <p className="text-gray-500 leading-relaxed mb-8">Vi opbevarer data i EU, overholder GDPR og giver dit team fuld kontrol over adgange og data.</p>
                <div className="space-y-3">
                  {[
                    ['EU-hosting', 'Alle data gemmes på EU-servere via Supabase'],
                    ['GDPR-compliant', 'Cookie-samtykke, data-eksport og sletning'],
                    ['Rollebaseret adgang', 'Owner, Editor og Viewer roller per projekt'],
                    ['Sikker autentificering', 'Session-baseret login med server-side validering'],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-gray-900">{title}</span>
                        <span className="text-gray-500 text-sm"> — {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'GDPR', sub: 'EU Article 25', color: 'blue', icon: Lock },
                  { label: 'EU Hosting', sub: 'Supabase EU', color: 'emerald', icon: Globe },
                  { label: 'Rolle-adgang', sub: 'Owner · Editor · Viewer', color: 'violet', icon: Users },
                  { label: 'SSL/TLS', sub: 'End-to-end krypteret', color: 'sky', icon: Zap },
                ].map(({ label, sub, color, icon: Icon }) => (
                  <div key={label} className={`rounded-2xl p-5 border ${color === 'blue' ? 'bg-blue-50 border-blue-100' : color === 'emerald' ? 'bg-emerald-50 border-emerald-100' : color === 'violet' ? 'bg-violet-50 border-violet-100' : 'bg-sky-50 border-sky-100'}`}>
                    <Icon className={`w-7 h-7 mb-3 ${color === 'blue' ? 'text-blue-500' : color === 'emerald' ? 'text-emerald-500' : color === 'violet' ? 'text-violet-500' : 'text-sky-500'}`} />
                    <div className="font-extrabold text-base text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SAMMENLIGNING */}
        <section className="section-dark py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-gray-300 text-xs font-bold mb-4 uppercase tracking-wide">Sammenligning</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">ForgeLab vs. resten</h2>
              <p className="text-gray-400 text-lg">Stop med at betale for 5 separate abonnementer</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-4 px-5 text-gray-400 font-medium w-1/3">Feature</th>
                      <th className="py-4 px-4 font-extrabold text-center">
                        <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs">ForgeLab</span>
                      </th>
                      <th className="py-4 px-4 text-gray-500 font-medium text-center text-xs">Trello</th>
                      <th className="py-4 px-4 text-gray-500 font-medium text-center text-xs">Notion</th>
                      <th className="py-4 px-4 text-gray-500 font-medium text-center text-xs">Figma</th>
                      <th className="py-4 px-4 text-gray-500 font-medium text-center text-xs">Miro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Kanban board', true, true, true, false, false],
                      ['Live canvas board', true, false, false, true, true],
                      ['Team chat + reaktioner', true, false, false, false, false],
                      ['QR-koder + tracking', true, false, false, false, false],
                      ['Surveys & slides', true, false, true, false, false],
                      ['Gantt & Flowchart', true, false, false, false, true],
                      ['SWOT & analyse-tools', true, false, false, false, false],
                      ['Live-cursor samarbejde', true, false, false, true, true],
                      ['Brugerrejse-tool', true, false, false, false, true],
                      ['AI-assistent integreret', true, false, false, false, false],
                      ['GDPR · EU-hosting', true, false, false, false, false],
                      ['Gratis at starte', true, true, true, false, false],
                    ].map(([label, ...vals], i) => (
                      <tr key={i} className={`border-b border-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-white/2'}`}>
                        <td className="py-3.5 px-5 text-gray-300 font-medium text-sm">{label as string}</td>
                        {(vals as boolean[]).map((v, j) => (
                          <td key={j} className="py-3.5 px-4 text-center">
                            {v
                              ? <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${j === 0 ? 'bg-amber-500/20 text-amber-400' : 'text-emerald-500'}`}>{j === 0 ? '✓' : '✓'}</span>
                              : <span className="text-gray-700 text-base">–</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-center text-gray-600 text-xs mt-4">Baseret på offentlig tilgængelighed af features. Opdateret 2025.</p>
          </div>
        </section>


        {/* CTA */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-amber-500/30">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm font-bold px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" /> Gratis at starte — ingen kreditkort
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">Klar til at prøve det?</h2>
              <p className="text-amber-100 text-lg mb-10 max-w-lg mx-auto">Opret en gratis konto og få adgang til alle features med det samme. Ingen kreditkort krævet.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-amber-600 rounded-2xl font-extrabold hover:bg-amber-50 transition-all shadow-lg hover:-translate-y-0.5 text-base">
                  Opret gratis konto <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/pricing" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/15 border-2 border-white/30 text-white rounded-2xl font-semibold hover:bg-white/25 transition-all text-base">
                  Se priser
                </Link>
              </div>
              <p className="text-amber-200 text-sm mt-6">Klar på under 2 minutter · GDPR-compliant · EU-hosting</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
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
                {MARKETING_FOOTER_PLATFORM_LINKS.map(([h, l]) => (
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
