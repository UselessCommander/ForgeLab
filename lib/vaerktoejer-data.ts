export interface Vaerktoej {
  slug: string
  title: string
  shortDescription: string
  longSeoContent: string
}

export const VAERKTOEJER: Vaerktoej[] = [
  {
    slug: 'qr-generator',
    title: 'QR Code Generator',
    shortDescription: 'Generer professionelle QR-koder med tracking. Følg scanninger og download som PNG.',
    longSeoContent: `
QR Code Generator fra ForgeLab giver dig mulighed for at oprette professionelle QR-koder til links, tekster og URLs. Værktøjet understøtter tracking, så du kan følge antal scanninger og tidspunkter direkte i Analytics Dashboard. Du kan tilpasse farver, størrelse og fejlkorrektion, og downloade QR-koder som PNG til print eller digitale medier. Perfekt til kampagner, menukort, visitkort og events. Uden login kan du prøve en simpel version uden tracking på Prøv QR-generator-siden; for fuld funktionalitet og gemte koder skal du logge ind.

Hvad er en QR-kode og hvornår bruger man den? En QR-kode (Quick Response) er en todimensionel stregkode, som smartphones og kameraer nemt kan læse. Du bruger QR Code Generator når du vil linke fra fysiske materialer — plakater, emballage, visitkort — til en hjemmeside, en PDF eller en landing page. Med tracking får du indsigt i hvor mange der scanner og hvornår, hvilket giver værdi til markedsføring og events. ForgeLab tilbyder både en gratis prøveversion uden login og en fuld version med gemte koder og statistik for loggede brugere.

Sådan kommer du i gang: Besøg "Prøv QR-generator" for at lave en enkelt QR-kode uden konto. For tracking, flere designmuligheder og en oversigt over alle dine koder, opret en bruger og brug QR Code Generator fra dashboardet. Alle QR-koder kan downloades som PNG i høj kvalitet til print.
    `.trim(),
  },
  {
    slug: 'swot-generator',
    title: 'SWOT Generator',
    shortDescription: 'Analysér styrker, svagheder, muligheder og trusler i et struktureret SWOT-analyse værktøj.',
    longSeoContent: `
SWOT-analyser bruges til strategisk planlægning i virksomheder, projekter og personlig udvikling. ForgeLabs SWOT Generator giver dig et digitalt canvas til at udfylde de fire felter: Styrker (Strengths), Svagheder (Weaknesses), Muligheder (Opportunities) og Trusler (Threats). Ved at samle indsigt i alle fire områder får du et overblik, der understøtter beslutninger om strategi, markedsføring og ressourceallokering. Værktøjet er velegnet til workshops, team-møder og selvstændig analyse. Brug det til at forberede strategidage, business cases eller evaluering af konkurrenter. Log ind for at bruge SWOT Generator fra dit dashboard.

Hvad er en SWOT-analyse? SWOT står for Strengths, Weaknesses, Opportunities og Threats. Modellen bruges globalt til at kortlægge en virksomheds eller et projekts indre styrker og svagheder samt de ydre muligheder og trusler. Resultatet bruges til strategi, prioritering og risikostyring. En god SWOT-analyse er konkret og baseret på fakta og feedback fra markedet.

Hvornår skal du lave en SWOT? Brug SWOT Generator ved strategiplanlægning, før lancering af nye produkter, ved årlige planlægningsmøder eller når du vurderer konkurrenter og markedsmuligheder. ForgeLab gør det nemt at udfylde og gemme din analyse og at dele den med teamet. Log ind og find SWOT under "Flere værktøjer" i dit dashboard.
    `.trim(),
  },
  {
    slug: 'business-model-canvas',
    title: 'Business Model Canvas',
    shortDescription: 'Udarbejd og visualisér din forretningsmodel med de ni byggesten fra Osterwalder.',
    longSeoContent: `
Business Model Canvas er et anerkendt rammeværk til at beskrive, designe og justere forretningsmodeller. ForgeLabs udgave dækker de ni byggesten: Nøglepartnere, Nøgleaktiviteter, Nøgleressourcer, Værditilbud, Kunderelationer, Kanaler, Kundesegmenter, Omkostningsstruktur og Indtægtsstrømme. Værktøjet er ideelt til startups, iværksættere og etablerede virksomheder, der vil skitsere eller revidere deres model. Du får et overblik på én side og kan arbejde struktureret med teamet. Perfekt til pitch-forberedelse, strategiworkshops og innovation. Log ind for at åbne Business Model Canvas fra værktøjsoversigten.

Hvad er Business Model Canvas? Modellen er udviklet af Alexander Osterwalder og bruges til at beskrive hvordan en virksomhed skaber, leverer og fanger værdi. De ni felter dækker partnere, aktiviteter, ressourcer, værditilbud, kunderelationer, kanaler, kundesegmenter, omkostninger og indtægter. Ved at udfylde canvaset får du et kompakt overblik som grundlag for diskussion og beslutninger.

Hvornår bruger man Business Model Canvas? Brug værktøjet ved opstart af nye virksomheder, ved pivoting eller nye forretningsområder, til investorpitch og til interne strategiworkshops. ForgeLab samler Business Model Canvas med resten af værktøjerne — SWOT, Gantt, Kompasrose osv. — så du har alt samlet ét sted. Log ind og vælg Business Model Canvas under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'gantt-chart',
    title: 'Gantt-diagram',
    shortDescription: 'Planlæg projekter med tidslinjer, opgaver og fremskridt i et Gantt-diagram.',
    longSeoContent: `
Et Gantt-diagram viser projektopgaver på en tidslinje og gør det nemt at se varighed, overlap og afhængigheder. ForgeLabs Gantt Chart-værktøj lader dig tilføje opgaver med start- og slutdatoer samt fremskridt i procent. Det er velegnet til projektledere, teamledere og alle, der skal planlægge og kommunikere tidsplaner. Brug det til projekter, produktlanceringer, events eller interne milestones. Ingen kompleks projektsoftware nødvendig — kom i gang med det samme fra dit dashboard efter login.

Hvad er et Gantt-diagram? Gantt-diagrammet er opkaldt efter Henry Gantt og viser opgaver som søjler på en tidsakse. Du kan se hvad der sker parallelt, hvad der er forsinket og hvor lang tid hver opgave tager. Det bruges i projektledelse, produktudvikling og ressourceplanlægning overalt i verden.

Hvornår giver Gantt mening? Brug ForgeLabs Gantt Chart når du skal planlægge et projekt med flere faser, koordinere et team eller rapportere fremskridt til ledelse eller kunder. Værktøjet er let at bruge uden kurser — tilføj opgaver, sæt datoer og opdater fremskridt. Find det under Flere værktøjer efter login.
    `.trim(),
  },
  {
    slug: 'gallup-kompasrose',
    title: 'Gallup Kompasrose',
    shortDescription: 'Visualisér kultur og værdier med Kompasrosen — moderne, traditionelle og fællesskabsorienterede dimensioner.',
    longSeoContent: `
Kompasrosen (Compass Rose) er et værktøj til at kortlægge kulturelle værdier og orienteringer — fx moderne mod traditionelle og individorienterede mod fællesskabsorienterede. ForgeLabs Gallup Kompasrose giver dig en radarvisning, hvor du kan plotte scores på otte dimensioner og sammenligne to profiler (fx "nu" vs "ønsket"). Værktøjet bruges i organisationsudvikling, strategi og teamworkshops for at skabe fælles sprog om værdier og kultur. Log ind for at bruge Kompasrosen fra værktøjsmenuen.

Hvad er Kompasrosen? Kompasrosen bruges til at visualisere hvor en organisation eller et team placerer sig på dimensioner som tradition/modernitet og individ/fællesskab. De otte udgør en "rose" og giver et billede af den nuværende og ønskede kultur. Det understøtter dialog om værdier og strategi uden at kræve dyre konsulenter.

Hvornår bruger man Gallup Kompasrose? Brug værktøjet ved kultur- og strategiworkshops, ved mergers eller reorganiseringer, eller når I vil aligne teamet om fælles værdier. ForgeLab tilbyder Kompasrosen sammen med SWOT, Business Model Canvas og andre værktøjer — log ind og åbn den under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'tows-matrix',
    title: 'TOWS Matrix',
    shortDescription: 'Kombinér SWOT med strategi: Trusler, Muligheder, Svagheder og Styrker i en TOWS-matrix.',
    longSeoContent: `
TOWS-matrixen bygger videre på SWOT ved at koble indre faktorer (styrker og svagheder) med ydre (muligheder og trusler) og udlede konkrete strategier. ForgeLabs TOWS Matrix hjælper dig med at udfylde felterne og tænke strategier som SO (styrke-mulighed), WO (svaghed-mulighed), ST (styrke-trussel) og WT (svaghed-trussel). Ideelt til strategiplanlægning, konkurrenceanalyse og risikohåndtering. Log ind for at åbne TOWS Matrix fra Flere værktøjer.

Hvad er TOWS? TOWS (eller TOWS Matrix) er en udvidelse af SWOT, hvor man systematisk kombinerer indre og ydre faktorer for at formulere strategier: udnyt styrker til muligheder (SO), reducer svagheder ved hjælp af muligheder (WO), brug styrker mod trusler (ST) og minimér svagheder og trusler (WT). Det gør SWOT mere handlingsorienteret.

Hvornår bruger man TOWS Matrix? Brug værktøjet når du allerede har lavet en SWOT og nu vil oversætte den til konkrete strategiske valg. ForgeLab samler TOWS med SWOT, Porters Five Forces og andre strategiværktøjer — log ind og find TOWS under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'porters-five-forces',
    title: 'Porters Five Forces',
    shortDescription: 'Analysér brancheattraktivitet med Porters fem kræfter: konkurrence, nye spillere, substitutter, leverandører og kunder.',
    longSeoContent: `
Porters Five Forces er en klassisk model til at vurdere konkurrencemæssig dynamik i en branche. De fem kræfter er: rivalitet blandt eksisterende konkurrenter, trussel fra nye indtrædere, trussel fra substitutter, forhandlingsstyrke hos leverandører og forhandlingsstyrke hos kunder. ForgeLabs værktøj giver dig et struktureret framework til at score og diskutere hver kraft og dermed vurdere branchens attraktivitet og egen position. Velegnet til strategi, due diligence og markedsanalyse. Tilgængelig efter login under Flere værktøjer.

Hvad er Porters Five Forces? Modellen er udviklet af Michael Porter og bruges til at analysere hvor attraktiv og konkurrencepræget en branche er. Jo stærkere de fem kræfter er, jo mindre attraktiv er branchen typisk. Analysen bruges til strategi, investeringsbeslutninger og forståelse af konkurrencelandskabet.

Hvornår bruger man Porters Five Forces? Brug værktøjet ved markedsvurdering, M&A, business cases eller når du skal forklare konkurrencesituationen for ledelse eller investorer. ForgeLab giver dig et klart framework uden at kræve ekstern konsulent — log ind og åbn Porters Five Forces under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'value-proposition-canvas',
    title: 'Value Proposition Canvas',
    shortDescription: 'Matche kundeprofil og værditilbud med Value Proposition Canvas.',
    longSeoContent: `
Value Proposition Canvas hjælper med at sikre, at dit værditilbud matcher kundens jobs, smerter og gevinster. Værktøjet kombinerer en kundeprofil (jobs, pains, gains) med et værditilbud (produkter/tjenester, pain relievers, gain creators). ForgeLabs udgave gør det nemt at udfylde og justere begge sider, så produktudvikling og markedsføring bliver bedre aligned med kundebehov. Perfekt til innovation, go-to-market og pitch. Log ind for at bruge Value Proposition Canvas.

Hvad er Value Proposition Canvas? Canvaset er designet til at matche kundeprofilen med værditilbuddet. Kundeprofilen beskriver hvad kunden prøver at opnå (jobs), hvad der frustrerer dem (pains) og hvad de ønsker (gains). Værditilbuddet beskriver hvordan dit produkt adresserer netop det. Når de to passer sammen, er chancen for kundetilfredshed større.

Hvornår bruger man Value Proposition Canvas? Brug det ved produktudvikling, segmentering, pitch til investorer eller når du vil skærpe budskabet til kunder. ForgeLab har Value Proposition Canvas sammen med Business Model Canvas og Empathy Map — log ind og find det under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'empathy-map',
    title: 'Empathy Map',
    shortDescription: 'Sæt dig ind i brugeren med en Empathy Map: ser, tænker, føler, gør og smerter/gevinster.',
    longSeoContent: `
En Empathy Map (empatikort) bruges til at forstå brugeren eller kunden dybere ved at udfylde felter som: Hvad ser de? Hvad tænker og føler de? Hvad siger og gør de? Hvad er deres smerter og gevinster? ForgeLabs Empathy Map giver et struktureret canvas til workshops og brugerresearch, så teams får et fælles billede af målgruppen. Velegnet til UX, produktudvikling og markedsføring. Log ind for at åbne Empathy Map under Flere værktøjer.

Hvad er en Empathy Map? Et empatikort er et visuelt værktøj der hjælper teams med at sætte sig ind i brugerens eller kundens perspektiv. Ved at udfylde "ser, tænker, føler, siger, gør" samt smerter og gevinster opnår I en fælles forståelse som grundlag for design og kommunikation.

Hvornår bruger man Empathy Map? Brug værktøjet i brugerresearch, design sprints, persona-arbejde eller når I skal aligne teamet om målgruppen. ForgeLab tilbyder Empathy Map sammen med Value Proposition Canvas og andre værktøjer — log ind og åbn den under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'card-sorting',
    title: 'Card Sorting',
    shortDescription: 'Strukturér indhold og information med card sorting til informationsarkitektur og navigation.',
    longSeoContent: `
Card sorting er en metode til at finde ud af, hvordan brugere grupperer og navngiver indhold — fx til menustruktur eller informationsarkitektur. ForgeLabs Card Sorting-værktøj understøtter denne proces digitalt, så du kan designe navigation og kategorisering baseret på brugerens mental model. Ideelt til webdesign, intranets og app-struktur. Log ind for at bruge Card Sorting fra værktøjsoversigten.

Hvad er card sorting? I card sorting får deltagerne kort med begreber eller indholdselementer og bedes gruppere og evt. navngive kategorier. Resultatet viser hvordan brugere forventer at finde indhold og bruges til at designe menuer, sitemaps og informationsarkitektur.

Hvornår bruger man Card Sorting? Brug værktøjet når du bygger eller omstrukturerer en hjemmeside, intranet eller app og vil basere strukturen på brugerens forståelse. ForgeLab samler Card Sorting med resten af værktøjerne — log ind og find det under Flere værktøjer.
    `.trim(),
  },
  {
    slug: 'maslow-model',
    title: 'Maslows behovspyramide',
    shortDescription: 'Visualisér og arbejd med Maslows behovshierarki i strategi og brugerforståelse.',
    longSeoContent: `
Maslows behovspyramide beskriver et hierarki af behov: fysiologiske, sikkerhed, socialt tilhør, anerkendelse og selvrealisering. ForgeLabs Maslow Model giver et visuelt værktøj til at diskutere motivation, målgrupper og værditilbud i forhold til disse lag. Brug det i strategi, markedsføring og produktudvikling for at sikre, at tilbud matcher brugerens behovsniveau. Tilgængelig efter login under Flere værktøjer.

Hvad er Maslows behovspyramide? Abraham Maslow beskrev et behovshierarki fra grundlæggende (mad, sikkerhed) til højere (tilhør, anerkendelse, selvrealisering). Modellen bruges til at forstå motivation og til at placere produkter og budskaber i forhold til brugerens behov.

Hvornår bruger man Maslow Model? Brug værktøjet ved segmentering, positionering eller når I diskuterer hvem I skaber værdi for og på hvilket niveau. ForgeLab tilbyder Maslow Model sammen med SWOT, Kompasrose og andre strategi- og bruger-værktøjer — log ind og åbn den under Flere værktøjer.
    `.trim(),
  },
]

export function getVaerktoejBySlug(slug: string): Vaerktoej | undefined {
  return VAERKTOEJER.find((v) => v.slug === slug)
}

export function getAllSlugs(): string[] {
  return VAERKTOEJER.map((v) => v.slug)
}
