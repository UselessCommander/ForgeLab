import Link from 'next/link'
import { getCurrentUserId } from '@/lib/auth'
import {
  ArrowRight, Sparkles, LogIn, CheckCircle2, Users, Zap,
  Target, Heart, Globe, Shield, Lightbulb, Star,
} from 'lucide-react'
import ForgeLabLogo from '@/components/ForgeLabLogo'

export default async function OmPage() {
  const userId = await getCurrentUserId()

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fu  { animation: fadeUp 0.6s ease both }
        .fu1 { animation: fadeUp 0.6s 0.1s ease both }
        .fu2 { animation: fadeUp 0.6s 0.2s ease both }
        .fu3 { animation: fadeUp 0.6s 0.3s ease both }
        .ch { transition: transform 0.2s ease, box-shadow 0.2s ease }
        .ch:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.08) }
        .section-dark { background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%) }
      `}</style>

      {/* BG */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#e8e8e8_1px,transparent_1px),linear-gradient(to_bottom,#e8e8e8_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-white via-amber-50/20 to-violet-50/10 pointer-events-none" />

      <div className="relative z-10">
        {/* NAV */}
        <nav className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white shadow-sm shadow-amber-500/30 select-none">
                <ForgeLabLogo size={16} className="text-white" />
              </span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">ForgeLab</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {([['/', 'Hjem'], ['/features', 'Features'], ['/workflow', 'Workflow'], ['/pricing', 'Priser'], ['/om', 'Om os']] as [string, string][]).map(([h, l]) => (
                <Link key={h} href={h} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${h === '/om' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>{l}</Link>
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
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="fu inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Skabt af FlowEffekt
          </div>
          <h1 className="fu1 text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-[1.05] max-w-4xl mx-auto">
            Bygget af designere<br />
            <span className="text-amber-500">der savnede et bedre værktøj.</span>
          </h1>
          <p className="fu2 text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
            Vi studerede Multimediedesign og Digital Konceptudvikling — og oplevede gang på gang, at der ikke fandtes ét samlet sted til de modeller og metoder vi brugte i vores designprocesser.
          </p>
        </section>

        {/* STORY */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] rounded-3xl overflow-hidden shadow-2xl">
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-12 md:p-16 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-6 w-fit">
                  <Lightbulb className="w-3.5 h-3.5" /> Vores historie
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 leading-tight">
                  Fra studie-frustration<br />til komplet platform
                </h2>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Under vores studier i Multimediedesign og Digital Konceptudvikling arbejdede vi konstant med procesmodeller som Double Diamond, Design Thinking og Google Design Sprint. Men vi havde intet sted hvor vi faktisk kunne <em>bruge</em> dem — kun teorien.
                </p>
                <p className="text-gray-400 leading-relaxed">
                  Vi ville have et workspace der ikke bare kendte til disse metoder, men aktivt guidede os igennem dem — med de rigtige tools på det rigtige tidspunkt i processen. Så vi byggede det selv.
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-12 md:p-16 flex flex-col justify-center gap-6">
                {[
                  { icon: '🎓', event: 'Uddannelsen', desc: 'Multimediedesign og Digital Konceptudvikling. Masser af gode modeller — men ingen samlet toolbox til at bruge dem i praksis.' },
                  { icon: '💡', event: 'Idéen opstår', desc: 'Frustrationen over at skifte mellem Trello, Miro, Figma og Notion sætter gang i tanken om ForgeLab.' },
                  { icon: '🚀', event: 'FlowEffekt bygger', desc: 'Vi tre fra holdet sætter os ned og bygger den platform vi selv altid har manglet som designstuderende.' },
                  { icon: '✅', event: '25+ integrerede tools', desc: 'Et komplet workspace med procesmodeller, Kanban, live canvas, AI-assistent og meget mere — alt i ét.' },
                ].map(({ icon, event, desc }) => (
                  <div key={event} className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">
                      {icon}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{event}</p>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PROCESMODELLER */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-4 uppercase tracking-wide">Kernen i ForgeLab</div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Procesmodeller integreret i dit arbejde</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Som studerende lærte vi disse modeller — men brugte dem aldrig i praksis, fordi ingen tools understøttede dem. Det ændrer ForgeLab på.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                label: 'Double Diamond',
                color: 'amber',
                phases: ['Discover', 'Define', 'Develop', 'Deliver'],
                desc: 'Strukturér dit projekt i de fire faser fra åben research til konkret løsning. ForgeLab guider dig med de rette tools i hver fase — fra empati-interviews til prototyping.',
              },
              {
                label: 'Design Thinking',
                color: 'violet',
                phases: ['Empathize', 'Define', 'Ideate', 'Prototype', 'Test'],
                desc: 'Arbejd brugercentreret fra start. ForgeLab samler interviews, personas, idégenereringstools og testresultater ét sted — koblet direkte til din process.',
              },
              {
                label: 'Google Design Sprint',
                color: 'emerald',
                phases: ['Map', 'Sketch', 'Decide', 'Prototype', 'Test'],
                desc: 'Kom fra problem til valideret prototype på 5 dage. ForgeLabs sprint-board holder dit team synkroniseret og sikrer at ingen fase springer over.',
              },
            ].map(({ label, color, phases, desc }) => (
              <div key={label} className="ch bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5 ${
                  color === 'amber' ? 'bg-amber-100 text-amber-700' :
                  color === 'violet' ? 'bg-violet-100 text-violet-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {label}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {phases.map((phase, i) => (
                    <span key={phase} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      color === 'amber' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                      color === 'violet' ? 'border-violet-200 text-violet-600 bg-violet-50' :
                      'border-emerald-200 text-emerald-600 bg-emerald-50'
                    }`}>
                      {i + 1}. {phase}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-6 text-center">
            <p className="text-gray-600 text-sm leading-relaxed max-w-2xl mx-auto">
              <strong className="text-gray-900">Visionen:</strong> At enhver model du kender fra din uddannelse kan bruges direkte i ForgeLab — ikke som teori, men som et aktivt, levende workspace der tilpasser sig din fase i processen.
            </p>
          </div>
        </section>

        {/* TEAM */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-4 uppercase tracking-wide">Holdet bag</div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Tre designere. Én fælles vision.</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Vi er tre fra <Link href="https://www.floweffekt.dk/" target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-semibold">FlowEffekt</Link> med baggrund i Multimediedesign og Digital Konceptudvikling — der byggede det workspace vi altid savnede som studerende.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                name: 'Hasti Amang',
                initials: 'HA',
                role: 'Multimediedesign · Digital Konceptudvikling',
                bio: 'Med en skarp sans for brugeroplevelse og visuel kommunikation sikrer Hasti at ForgeLab ikke bare er funktionelt — men at det føles rigtigt at bruge.',
                color: 'violet',
              },
              {
                name: 'Gabriel Lausten',
                initials: 'GL',
                role: 'Multimediedesign · Digital Konceptudvikling',
                bio: 'Drivkraften bag ForgeLabs tekniske fundament. Gabriel kombinerer stærk udviklingserfaring med dyb forståelse for de procesmodeller platformen er bygget på.',
                color: 'amber',
              },
              {
                name: 'Lucas Schuldt',
                initials: 'LS',
                role: 'Multimediedesign · Digital Konceptudvikling',
                bio: 'Lucas bringer den strategiske tænkning og konceptuelle skarphed der sikrer at ForgeLab løser et reelt problem — ikke bare et teknisk et.',
                color: 'emerald',
              },
            ].map(({ name, initials, role, bio, color }) => (
              <div key={name} className="ch bg-white border border-gray-200 rounded-3xl p-8 shadow-sm text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-extrabold mx-auto mb-5 ${
                  color === 'amber' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                  color === 'violet' ? 'bg-gradient-to-br from-violet-400 to-purple-600' :
                  'bg-gradient-to-br from-emerald-400 to-teal-600'
                }`}>
                  {initials}
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg mb-1">{name}</h3>
                <p className={`text-xs font-semibold mb-4 ${
                  color === 'amber' ? 'text-amber-600' : color === 'violet' ? 'text-violet-600' : 'text-emerald-600'
                }`}>{role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gray-900 text-white rounded-2xl text-sm font-semibold">
              <span className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
                <ForgeLabLogo size={12} className="text-white" />
              </span>
              ForgeLab er et produkt fra <Link href="https://www.floweffekt.dk/" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 ml-1">FlowEffekt</Link>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="section-dark py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="max-w-5xl mx-auto px-6 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-white mb-3">ForgeLab i tal</h2>
              <p className="text-gray-400">Det vi har bygget</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { num: '25+', label: 'Integrerede tools', color: 'amber' },
                { num: '3', label: 'Procesmodeller', color: 'violet' },
                { num: '100%', label: 'EU-hosting', color: 'blue' },
                { num: '0 kr', label: 'For at starte', color: 'emerald' },
              ].map(({ num, label, color }) => (
                <div key={label} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className={`text-4xl font-extrabold mb-2 ${
                    color === 'amber' ? 'text-amber-400' : color === 'blue' ? 'text-blue-400' :
                    color === 'emerald' ? 'text-emerald-400' : 'text-violet-400'
                  }`}>{num}</div>
                  <div className="text-gray-400 text-sm font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VÆRDIER */}
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold mb-4 uppercase tracking-wide">Vores værdier</div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Det vi tror på</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Vores værdier er ikke et slogan — de afspejler de beslutninger vi tager hver dag.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Users, color: 'amber',
                title: 'Processen i centrum',
                desc: 'Vi er vokset op med Double Diamond og Design Thinking. ForgeLab er bygget til at understøtte designprocessen — ikke at erstatte den.',
              },
              {
                icon: Zap, color: 'violet',
                title: 'Simpelhed som standard',
                desc: 'Kraftfulde tools behøver ikke være komplekse. Vi designer alt til at føles intuitivt fra dag ét — ligesom vi selv ville have det som studerende.',
              },
              {
                icon: Shield, color: 'blue',
                title: 'Privatliv og tillid',
                desc: 'GDPR er ikke en checkbox for os — det er en grundlæggende rettighed. Dine data forbliver dine, på EU-servere, altid.',
              },
              {
                icon: Globe, color: 'emerald',
                title: 'Dansk rødder',
                desc: 'ForgeLab er bygget i Danmark af et dansk team. Vi tror på at de bedste produkter kommer fra folk der forstår konteksten de bygger til.',
              },
              {
                icon: Heart, color: 'rose',
                title: 'Bygget med omhu',
                desc: 'Hvert UI-element, hvert API-kald og hver feature er gennemtænkt. Vi ved hvad det kræver at lave noget man er stolt af.',
              },
              {
                icon: Target, color: 'orange',
                title: 'Fokus på resultat',
                desc: 'Vi måler succes på om teams faktisk lykkes med deres projekter — og om designere kan bruge de modeller de har lært i praksis.',
              },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="ch bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 ${
                  color === 'amber' ? 'bg-amber-100' : color === 'violet' ? 'bg-violet-100' :
                  color === 'blue' ? 'bg-blue-100' : color === 'emerald' ? 'bg-emerald-100' :
                  color === 'rose' ? 'bg-rose-100' : 'bg-orange-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    color === 'amber' ? 'text-amber-600' : color === 'violet' ? 'text-violet-600' :
                    color === 'blue' ? 'text-blue-600' : color === 'emerald' ? 'text-emerald-600' :
                    color === 'rose' ? 'text-rose-600' : 'text-orange-600'
                  }`} />
                </div>
                <h3 className="font-extrabold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
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
              <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">Bliv en del af historien</h2>
              <p className="text-amber-100 text-lg mb-10 max-w-lg mx-auto">
                Opret en gratis konto og oplev selv hvorfor teams skifter til ForgeLab.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-amber-600 rounded-2xl font-extrabold hover:bg-amber-50 transition-all shadow-lg hover:-translate-y-0.5 text-base">
                  Opret gratis konto <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/features" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/15 border-2 border-white/30 text-white rounded-2xl font-semibold hover:bg-white/25 transition-all text-base">
                  Se alle features
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
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-white select-none">
                    <ForgeLabLogo size={12} className="text-white" />
                  </span>
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
