import Link from 'next/link'
import { redirect } from 'next/navigation'
import CookieConsent from '@/components/CookieConsent'
import { getCurrentUserId } from '@/lib/auth'
import {
  LogIn, ArrowRight, Zap, Shield, Users, Rocket, CheckCircle2,
  Kanban, MessageSquare, GitBranch, BarChart3, FileText, Layers,
  Sparkles, Target, Play, ChevronRight, Clock, Globe,
  TrendingUp, Lock, Cpu, MousePointer2, PenTool, Share2,
  Bell, Workflow, LayoutDashboard, ScanLine,
} from 'lucide-react'

export default async function LandingPage() {
  const userId = await getCurrentUserId()
  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] text-gray-900 overflow-x-hidden">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatSlow { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-16px) rotate(1.5deg)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0)} 50%{box-shadow:0 0 32px 8px rgba(245,158,11,0.2)} }
        @keyframes shimmerText { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes barGrow { from{height:0} }
        @keyframes ping2 { 0%{transform:scale(1);opacity:1} 75%,100%{transform:scale(2.2);opacity:0} }
        @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }

        .fu  { animation: fadeUp 0.65s ease both }
        .fu1 { animation: fadeUp 0.65s 0.1s ease both }
        .fu2 { animation: fadeUp 0.65s 0.22s ease both }
        .fu3 { animation: fadeUp 0.65s 0.36s ease both }
        .fu4 { animation: fadeUp 0.65s 0.5s ease both }
        .fl  { animation: float 5s ease-in-out infinite }
        .fls { animation: floatSlow 7s ease-in-out infinite }
        .sr  { animation: slideRight 0.8s 0.25s ease both }
        .pg  { animation: pulseGlow 3s ease-in-out infinite }
        .mq  { animation: marquee 28s linear infinite }
        .bar1{ animation: barGrow 1s 0.5s ease both }
        .bar2{ animation: barGrow 1s 0.65s ease both }
        .bar3{ animation: barGrow 1s 0.8s ease both }
        .bar4{ animation: barGrow 1s 0.95s ease both }
        .bar5{ animation: barGrow 1s 1.1s ease both }

        .shimmer {
          background: linear-gradient(90deg,#92400e 0%,#f59e0b 40%,#d97706 60%,#92400e 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 3s linear infinite;
        }
        .ch { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .ch:hover { transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,0.09); }
        .ping2::after {
          content:''; position:absolute; inset:0; border-radius:9999px;
          background:rgba(245,158,11,0.4);
          animation: ping2 1.8s cubic-bezier(0,0,0.2,1) infinite;
        }
        .grad-animate {
          background: linear-gradient(135deg,#f59e0b,#ef4444,#8b5cf6,#f59e0b);
          background-size: 300% 300%;
          animation: gradientShift 6s ease infinite;
        }
        .section-dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
        }
      `}</style>

      {/* BG */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ebebeb_1px,transparent_1px),linear-gradient(to_bottom,#ebebeb_1px,transparent_1px)] bg-[size:40px_40px] opacity-30 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-white via-amber-50/15 to-orange-50/20 pointer-events-none" />
      <div className="fixed top-[-160px] right-[-100px] w-[560px] h-[560px] rounded-full bg-amber-400/8 blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full bg-violet-300/8 blur-3xl pointer-events-none" />

      <div className="relative z-10">

        {/* ── NAV ── */}
        <nav className="border-b border-gray-200/50 bg-white/75 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500 text-white text-xs font-extrabold shadow-sm shadow-amber-500/30 select-none">F</span>
              <span className="text-base font-extrabold text-gray-900 tracking-tight">ForgeLab</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {([['/features','Features'],['/workflow','Workflow'],['/pricing','Priser'],['/om','Om os']] as [string,string][]).map(([h,l])=>(
                <a key={h} href={h} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-50 transition-all">{l}</a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/register" className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">Opret konto</Link>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow">
                <LogIn className="w-4 h-4" />Log Ind
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="fu inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold mb-8">
                <Sparkles className="w-3.5 h-3.5" />
                Alt-i-ét projektplatform
              </div>
              <h1 className="fu1 text-5xl md:text-6xl lg:text-[68px] font-extrabold tracking-tight mb-6 leading-[1.04]">
                Byg bedre<br /><span className="shimmer">projekter.</span>
              </h1>
              <p className="fu2 text-lg md:text-xl text-gray-500 mb-10 max-w-lg leading-relaxed">
                ForgeLab samler boards, flowcharts, kanban, teamchat, QR-koder, surveys og meget mere — ét sted, ét login.
              </p>
              <div className="fu3 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                <Link href="/register" className="pg inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/30 hover:-translate-y-0.5">
                  Kom i gang gratis <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/features" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all">
                  <Play className="w-4 h-4" /> Se features
                </Link>
              </div>
              <div className="fu4 flex flex-wrap gap-5 justify-center lg:justify-start text-sm text-gray-500">
                {['Gratis at starte','Intet kreditkort','Klar på 2 min'].map(t=>(
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0"/>{t}
                  </span>
                ))}
              </div>
            </div>

            {/* dashboard mockup */}
            <div className="sr order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-[430px]">
                <div className="fls absolute -top-5 -left-8 w-52 h-32 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl border border-amber-200/60 shadow-lg opacity-70 z-0" />
                <div className="fl absolute -bottom-8 -right-6 w-44 h-28 bg-gradient-to-br from-violet-100 to-violet-50 rounded-2xl border border-violet-200/60 shadow-lg opacity-60 z-0" />
                <div className="relative z-10 bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-3.5 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"/><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"/><div className="w-2.5 h-2.5 rounded-full bg-green-400"/>
                    </div>
                    <div className="ml-2 flex-1 h-5 rounded bg-white/10 text-white/40 text-[10px] font-mono flex items-center px-2">forgelab.io/dashboard</div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Aktiv projekt</div>
                        <div className="font-bold text-gray-900 text-sm">Startup Kampagne Q2</div>
                      </div>
                      <div className="flex -space-x-2">
                        {['#F59E0B','#6366F1','#10B981','#EF4444'].map((c,i)=>(
                          <div key={i} style={{background:c}} className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">
                            {['G','M','L','A'][i]}
                          </div>
                        ))}
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-400 text-[8px] font-bold">+3</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        {icon:Kanban,label:'Board',bg:'bg-amber-50',c:'text-amber-600'},
                        {icon:GitBranch,label:'Flow',bg:'bg-violet-50',c:'text-violet-600'},
                        {icon:BarChart3,label:'Analytics',bg:'bg-sky-50',c:'text-sky-600'},
                        {icon:MessageSquare,label:'Chat',bg:'bg-emerald-50',c:'text-emerald-600'},
                        {icon:Target,label:'SWOT',bg:'bg-rose-50',c:'text-rose-500'},
                        {icon:FileText,label:'Survey',bg:'bg-orange-50',c:'text-orange-500'},
                        {icon:Layers,label:'Slides',bg:'bg-indigo-50',c:'text-indigo-600'},
                        {icon:ScanLine,label:'QR',bg:'bg-yellow-50',c:'text-yellow-600'},
                      ].map(({icon:Icon,label,bg,c})=>(
                        <div key={label} className={`${bg} rounded-xl p-2 flex flex-col items-center gap-1 ch cursor-default`}>
                          <Icon className={`w-4 h-4 ${c}`}/><span className="text-[8px] font-semibold text-gray-500">{label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Aktivitet · 7 dage</span>
                        <span className="text-[9px] text-emerald-600 font-bold">↑ 24%</span>
                      </div>
                      <div className="flex items-end gap-1 h-12">
                        {[35,58,42,80,52,70,90].map((h,i)=>(
                          <div key={i} className={`flex-1 rounded-t bg-gradient-to-t from-amber-500 to-amber-300 bar${i<5?i+1:5}`} style={{height:`${h}%`}}/>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        {t:'Landingsside design',done:true,c:'bg-emerald-500'},
                        {t:'User interviews',done:false,c:'bg-amber-400'},
                        {t:'API integration',done:false,c:'bg-violet-400'},
                      ].map(({t,done,c})=>(
                        <div key={t} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-50">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${done?c:'border-2 border-gray-300'}`}/>
                          <span className={`text-[11px] font-medium ${done?'line-through text-gray-400':'text-gray-700'}`}>{t}</span>
                          {!done&&<div className={`ml-auto w-1.5 h-1.5 rounded-full ${c}`}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="fl absolute -bottom-4 left-4 bg-white rounded-2xl border border-gray-200 shadow-xl px-4 py-2.5 flex items-center gap-2.5 z-20">
                  <div className="relative w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center ping2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 relative z-10"/>
                  </div>
                  <div><div className="text-[9px] text-gray-400">Live update</div><div className="text-xs font-bold text-gray-900">Sprint 3 done 🎉</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── MARQUEE ── */}
        <div className="py-5 border-y border-gray-200/50 bg-white/50 backdrop-blur-sm overflow-hidden">
          <div className="mq flex gap-6 w-max">
            {[...['Board','Flowchart','Kanban','Gantt','SWOT','Live Chat','QR-koder','Surveys','Slides','Analytics','Empathy Map','Card Sorting','Brainstorm','Retrospektiv','Backlog'],...['Board','Flowchart','Kanban','Gantt','SWOT','Live Chat','QR-koder','Surveys','Slides','Analytics','Empathy Map','Card Sorting','Brainstorm','Retrospektiv','Backlog']].map((t,i)=>(
              <span key={i} className="text-sm font-semibold text-gray-400 whitespace-nowrap px-4 py-1.5 rounded-full border border-gray-200/60 bg-white/60">{t}</span>
            ))}
          </div>
        </div>

        {/* ── STATS ── */}
        <section className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {num:'20+', label:'Integrerede værktøjer', icon:Cpu, color:'text-amber-500'},
              {num:'100%', label:'GDPR-compliant', icon:Shield, color:'text-emerald-500'},
              {num:'∞', label:'Projekter per konto', icon:Layers, color:'text-violet-500'},
              {num:'< 2 min', label:'Tid til første projekt', icon:Clock, color:'text-sky-500'},
            ].map(({num,label,icon:Icon,color})=>(
              <div key={label} className="ch bg-white border border-gray-200/80 rounded-2xl p-6 text-center shadow-sm">
                <Icon className={`w-6 h-6 ${color} mx-auto mb-3`}/>
                <div className={`text-3xl font-extrabold ${color} mb-1`}>{num}</div>
                <div className="text-xs text-gray-500 font-medium leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BENTO FEATURES ── */}
        <section className="max-w-7xl mx-auto px-6 py-10 pb-24">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full mb-4">Features</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Ét workspace.<br/>Alle værktøjer.</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Slut med at skifte mellem Figma, Notion, Trello og Slack. ForgeLab samler det hele.</p>
          </div>

          {/* bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 auto-rows-auto">

            {/* Big left — live board */}
            <div className="ch md:col-span-3 md:row-span-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-amber-500/20">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"/>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3"/>
              <Kanban className="w-10 h-10 mb-5 opacity-90"/>
              <h3 className="text-2xl font-extrabold mb-3">Visuelt Projektboard</h3>
              <p className="text-amber-100 text-sm leading-relaxed mb-6">Drag-and-drop board med sticky notes, flowcharts, sektioner og live-cursor samarbejde. Se hvem der arbejder på hvad — i realtid.</p>
              <div className="bg-white/15 rounded-2xl p-4 space-y-2.5">
                {['Design system','Backend API','User testing'].map((t,i)=>(
                  <div key={t} className="flex items-center gap-3 bg-white/10 rounded-xl px-3 py-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${['bg-emerald-300','bg-yellow-300','bg-red-300'][i]}`}/>
                    <span className="text-xs font-semibold text-white">{t}</span>
                    <div className="ml-auto flex -space-x-1">
                      {[0,1].map(j=>(
                        <div key={j} style={{background:['#fbbf24','#a78bfa','#34d399'][j]}} className="w-5 h-5 rounded-full border border-white/40"/>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR */}
            <div className="ch md:col-span-3 bg-white border border-gray-200/80 rounded-3xl p-7 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -translate-y-1/2 translate-x-1/3"/>
              <ScanLine className="w-9 h-9 text-sky-600 mb-4"/>
              <h3 className="text-xl font-bold text-gray-900 mb-2">QR-koder & Analytics</h3>
              <p className="text-sm text-gray-500 mb-5">Generer trackede QR-koder med live scanningsdata. Se lokation, tidspunkt og antal.</p>
              <div className="flex items-center gap-3 bg-sky-50 rounded-2xl p-4">
                <div className="grid grid-cols-4 gap-1 w-16 h-16 flex-shrink-0">
                  {Array.from({length:16}).map((_,i)=>(
                    <div key={i} className={`rounded-[2px] ${[0,1,4,5,8,10,11,14,15].includes(i)?'bg-sky-600':'bg-sky-100'}`}/>
                  ))}
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">kampagne-2024.dk</div>
                  <div className="text-xs text-gray-500 mt-0.5">1.247 scanninger · i dag</div>
                  <div className="flex items-center gap-1 mt-1"><TrendingUp className="w-3 h-3 text-emerald-500"/><span className="text-xs text-emerald-600 font-semibold">+18% fra igår</span></div>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="ch md:col-span-3 bg-white border border-gray-200/80 rounded-3xl p-7 shadow-sm relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-28 h-28 bg-violet-50 rounded-full translate-y-1/2 translate-x-1/3"/>
              <MessageSquare className="w-9 h-9 text-violet-600 mb-4"/>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Team Chat</h3>
              <p className="text-sm text-gray-500 mb-5">Emoji-reaktioner, @mentions og direkte board-kommentarer. Alt i kontekst af projektet.</p>
              <div className="space-y-2.5">
                {[
                  {name:'Mads',c:'#6366F1',msg:'@Gustav boardet ser 🔥 ud!',time:'nu'},
                  {name:'Gustav',c:'#F59E0B',msg:'Tak! Gantt er klar om 5 min',time:'1m'},
                  {name:'Louise',c:'#10B981',msg:'👍 Deploy klar klokken 14',time:'3m'},
                ].map(({name,c,msg,time})=>(
                  <div key={name} className="flex items-start gap-2.5">
                    <div style={{background:c}} className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold mt-0.5">{name[0]}</div>
                    <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-sm px-3 py-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-gray-700">{name}</span>
                        <span className="text-[9px] text-gray-400">{time}</span>
                      </div>
                      <span className="text-xs text-gray-600">{msg}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt */}
            <div className="ch md:col-span-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl p-7 text-white shadow-lg shadow-emerald-500/20">
              <GitBranch className="w-8 h-8 mb-4 opacity-90"/>
              <h3 className="text-lg font-extrabold mb-2">Gantt & Flowchart</h3>
              <p className="text-emerald-100 text-xs leading-relaxed">Sprint-planlægning med interaktivt Gantt og drag-and-drop flowchart builder.</p>
            </div>

            {/* SWOT */}
            <div className="ch md:col-span-2 bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl p-7 text-white shadow-lg shadow-rose-500/20">
              <Target className="w-8 h-8 mb-4 opacity-90"/>
              <h3 className="text-lg font-extrabold mb-2">SWOT & Brainstorm</h3>
              <p className="text-rose-100 text-xs leading-relaxed">Strukturerede analyse-templates: SWOT, empathy map, card sorting og retrospektiv.</p>
            </div>

            {/* Surveys */}
            <div className="ch md:col-span-2 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-7 text-white shadow-lg shadow-indigo-500/20">
              <FileText className="w-8 h-8 mb-4 opacity-90"/>
              <h3 className="text-lg font-extrabold mb-2">Surveys & Slides</h3>
              <p className="text-indigo-100 text-xs leading-relaxed">Byg surveys og præsentationer — del med teamet eller ekstern audience direkte fra projektet.</p>
            </div>

          </div>
        </section>

        {/* ── WORKFLOW SECTION ── */}
        <section className="section-dark py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"/>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-500/8 blur-3xl rounded-full"/>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full mb-4">Workflow</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4">Fra idé til levering.<br/><span className="text-amber-400">I ét flow.</span></h2>
              <p className="text-lg text-gray-400 max-w-xl mx-auto">ForgeLab følger din proces — ikke omvendt.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {step:'01', icon:PenTool, title:'Opret projekt', desc:'Opret et projekt og inviter dit team på sekunder. Vælg de tools der passer til jeres workflow.', color:'border-amber-500/30 bg-amber-500/5'},
                {step:'02', icon:LayoutDashboard, title:'Planlæg & design', desc:'Brug board, flowchart, SWOT og Gantt til at kortlægge idéen og planlægge sprints.', color:'border-violet-500/30 bg-violet-500/5'},
                {step:'03', icon:Users, title:'Samarbejd live', desc:'Live-cursors, chat, @mentions og board-kommentarer holder teamet i sync — uanset where.', color:'border-emerald-500/30 bg-emerald-500/5'},
                {step:'04', icon:Share2, title:'Del & track', desc:'Generer QR-koder, del surveys og eksporter slides til stakeholders. Track resultaterne live.', color:'border-sky-500/30 bg-sky-500/5'},
              ].map(({step,icon:Icon,title,desc,color},i)=>(
                <div key={step} className={`ch rounded-3xl p-7 border ${color} relative`}>
                  {i < 3 && <ChevronRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-600 z-10"/>}
                  <div className="text-5xl font-extrabold text-white/5 absolute top-4 right-6 select-none">{step}</div>
                  <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-white"/>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ── PRICING ── */}
        <section className="max-w-7xl mx-auto px-6 py-10 pb-24">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-full mb-4">Priser</span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Simpelt. Gennemsigtigt.</h2>
            <p className="text-gray-500 text-lg">Start gratis — opgrader når du er klar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name:'Gratis', price:'0', period:'for evigt', color:'bg-white border-gray-200',
                features:['1 projekt','Op til 3 teammedlemmer','Board, Kanban & Chat','QR-koder (5/mdr)','Community support'],
                cta:'Start gratis', ctaStyle:'bg-gray-900 text-white hover:bg-gray-800', popular:false,
              },
              {
                name:'Pro', price:'149', period:'pr. mdr.', color:'bg-gradient-to-b from-amber-500 to-orange-500 border-amber-400',
                features:['Ubegrænset projekter','Op til 15 teammedlemmer','Alle værktøjer inkl. Gantt & Slides','Ubegrænsede QR-koder + analytics','Live-cursor samarbejde','Prioritets support'],
                cta:'Kom i gang', ctaStyle:'bg-white text-amber-600 font-bold hover:bg-amber-50', popular:true,
              },
              {
                name:'Team', price:'399', period:'pr. mdr.', color:'bg-white border-gray-200',
                features:['Alt i Pro','Op til 50 teammedlemmer','Advanced analytics','Custom branding på QR','SSO & admin panel','Dedikeret support'],
                cta:'Kontakt os', ctaStyle:'bg-gray-900 text-white hover:bg-gray-800', popular:false,
              },
            ].map(({name,price,period,color,features,cta,ctaStyle,popular})=>(
              <div key={name} className={`ch relative rounded-3xl p-8 border shadow-sm ${color} ${popular?'shadow-xl shadow-amber-500/20 scale-105':''}`}>
                {popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-amber-600 text-xs font-bold px-4 py-1 rounded-full border border-amber-200 shadow-sm whitespace-nowrap">⭐ Mest populær</div>}
                <div className={`text-lg font-extrabold mb-4 ${popular?'text-white':'text-gray-900'}`}>{name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-5xl font-extrabold ${popular?'text-white':'text-gray-900'}`}>{price === '0' ? 'Gratis' : `${price} kr`}</span>
                </div>
                <div className={`text-sm mb-8 ${popular?'text-amber-100':'text-gray-500'}`}>{price === '0' ? '' : period}</div>
                <div className="space-y-3 mb-8">
                  {features.map(f=>(
                    <div key={f} className="flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${popular?'text-amber-100':'text-emerald-500'}`}/>
                      <span className={`text-sm ${popular?'text-amber-50':'text-gray-600'}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" className={`inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all ${ctaStyle}`}>
                  {cta} <ArrowRight className="w-4 h-4"/>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-3xl mx-auto px-6 py-10 pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Ofte stillede spørgsmål</h2>
            <p className="text-gray-500">Har du et spørgsmål der ikke er her? Skriv til os.</p>
          </div>
          <div className="space-y-4">
            {[
              {q:'Er ForgeLab gratis at starte?', a:'Ja, du kan oprette en konto og bruge platformen helt gratis. Ingen kreditkort kræves. Du kan opgradere til Pro når som helst.'},
              {q:'Kan jeg bruge ForgeLab uden at installere noget?', a:'Absolut. ForgeLab er 100% web-baseret. Åbn en browser, opret konto, og du er klar på under 2 minutter.'},
              {q:'Hvad er live-cursor samarbejde?', a:'Når flere teammedlemmer er inde i samme projekt-board, kan du se hvad de andre bevæger sig hen og hvad de arbejder på — i realtid, præcis som i Figma.'},
              {q:'Hvor gemmes mine data?', a:'Alle data gemmes på servere i EU og er GDPR-compliant. Vi deler aldrig dine data med tredjepart.'},
              {q:'Kan jeg eksportere mine projekter?', a:'Ja, du kan eksportere boards som PDF/billede og QR-koder som PNG. Surveys og slides kan deles via link.'},
            ].map(({q,a},i)=>(
              <details key={i} className="group bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm">
                <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer font-semibold text-gray-900 text-sm list-none hover:bg-gray-50 transition-colors">
                  {q}
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 group-open:rotate-90 transition-transform"/>
                </summary>
                <div className="px-6 pb-6 text-sm text-gray-600 leading-relaxed border-t border-gray-100">{a}</div>
              </details>
            ))}
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl section-dark p-14 md:p-20 text-white shadow-2xl text-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px]"/>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-amber-500/10 blur-3xl"/>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 mb-8">
                <Rocket className="w-8 h-8 text-amber-400"/>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-5 tracking-tight">
                Klar til at bygge<br/><span className="text-amber-400">noget fedt?</span>
              </h2>
              <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto">Opret din gratis konto og få adgang til alle 20+ værktøjer med det samme.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register" className="pg inline-flex items-center justify-center gap-2 px-10 py-4 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">
                  Opret gratis konto <ArrowRight className="w-4 h-4"/>
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/10 text-white border border-white/15 rounded-2xl font-semibold hover:bg-white/20 transition-all">
                  Log ind
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 justify-center mt-8 text-sm text-gray-500">
                {['Gratis for evigt','Ingen kreditkort','Cancel anytime'].map(t=>(
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500"/>{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-gray-200/60 bg-white/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-white text-[10px] font-extrabold select-none">F</span>
                  <span className="font-bold text-gray-900">ForgeLab</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Alt-i-ét projektplatform til moderne teams. Bygget i Danmark.</p>
                <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
                  <Globe className="w-3.5 h-3.5"/><span>Danmark · EU · GDPR</span>
                </div>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-4">Platform</div>
                {([['/features','Features'],['/workflow','Workflow'],['/pricing','Priser'],['/om','Om os'],['/vaerktoejer-oversigt','Alle værktøjer']] as [string,string][]).map(([h,l])=>(
                  <a key={h} href={h} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">{l}</a>
                ))}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-4">Konto</div>
                {[['/login','Log ind'],['/register','Opret konto'],['/dashboard','Dashboard']].map(([h,l])=>(
                  <Link key={h} href={h} className="block text-sm text-gray-500 hover:text-gray-900 transition-colors mb-2">{l}</Link>
                ))}
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm mb-4">Juridisk</div>
                {[['/privatliv','Privatlivspolitik'],['/vilkar','Brugervilkår'],['/cookies','Cookiepolitik']].map(([h,l])=>(
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

        <CookieConsent/>
      </div>
    </div>
  )
}
