import { getMethodCatalogEntry, type MethodCatalogEntry } from '@/lib/method-catalog'
import { BMC_AIRBNB_CASE_STUDY } from '@/lib/method-examples/bmc-airbnb'

export type MethodContentSectionVariant = 'default' | 'highlight' | 'example' | 'caution'

export type MethodCaseStudyBlock = {
  id: string
  title: string
  body: string
  imageSrc?: string
  imageAlt?: string
}

export type MethodCaseStudy = {
  id: string
  title: string
  intro: string
  /** Fuld canvas eller overbliksbillede til casen (fx Airbnb) */
  overviewImageSrc?: string
  overviewImageAlt?: string
  blocks: MethodCaseStudyBlock[]
  summary?: string
}

export type MethodContentSection = {
  id: string
  title: string
  body: string
  variant?: MethodContentSectionVariant
  /** Uddybende case studies med dropdown og accordions (fx BMC Airbnb) */
  caseStudies?: MethodCaseStudy[]
}

export type MethodRelatedMethod = {
  /** Vises hvis slug ikke findes i kataloget */
  label: string
  slug?: string
}

export type MethodPageContent = {
  /** Uddybende intro under sidetitel (valgfri) */
  summary?: string
  sections: MethodContentSection[]
  relatedMethods?: MethodRelatedMethod[]
}

const METHOD_PAGE_CONTENT: Partial<Record<string, MethodPageContent>> = {
  'ab-test': {
    summary:
      'A/B/N Test er en eksperimentel metode, hvor to eller flere varianter af en løsning sammenlignes for at undersøge, hvilken variant der skaber den bedste effekt. Metoden bruges især inden for UX, digital produktudvikling og marketing, hvor beslutninger kan baseres på faktisk brugeradfærd frem for mavefornemmelser.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'En A/B/N Test går ud på at teste flere versioner af det samme element mod hinanden. Det kan for eksempel være forskellige overskrifter, knapper, layouts, billeder, onboarding-flows eller landingssider. Brugerne fordeles mellem varianterne, og deres adfærd måles ud fra et på forhånd defineret mål, for eksempel klikrate, tilmelding, køb, scroll-dybde eller gennemførelse af en handling.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt til at optimere digitale løsninger, kampagner og brugeroplevelser. Hvor en klassisk A/B-test sammenligner to varianter, giver en A/B/N Test mulighed for at teste flere alternativer på samme tid. Det gør metoden relevant, når der er flere mulige design- eller kommunikationsretninger, og man ønsker at finde den løsning, der performer bedst i praksis.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'A/B/N Test giver mening, når man har en eksisterende løsning eller prototype, hvor konkrete elementer kan varieres og måles. Metoden er især brugbar i de senere faser af en designproces, hvor man ikke længere kun undersøger behov, men vil validere og optimere specifikke løsningsforslag.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvilken variant der skaber den ønskede brugeradfærd. Den kan bruges til at teste, om en bestemt formulering skaber flere klik, om et andet visuelt udtryk fastholder brugeren længere, eller om et ændret flow får flere til at gennemføre en handling.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først formuleres en hypotese, for eksempel: "En mere handlingsorienteret CTA vil øge antallet af tilmeldinger." Derefter udvikles flere varianter, som adskiller sig på en kontrolleret måde. Brugerne eksponeres for de forskellige versioner, og resultaterne analyseres ud fra den valgte måleparameter. Til sidst vurderes det, om én variant performer tydeligt bedre end de andre.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et datadrevet beslutningsgrundlag, der viser, hvilken variant der bedst understøtter det ønskede mål. Resultatet kan bruges til at vælge en endelig løsning, justere et design eller danne grundlag for nye tests.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'A/B/N Test gør det muligt at træffe beslutninger på baggrund af faktisk adfærd. Metoden reducerer interne diskussioner om smag og subjektive præferencer, fordi man kan måle, hvad brugerne faktisk gør. Den er særligt stærk til optimering af digitale kontaktpunkter, hvor små ændringer kan have stor effekt.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Metoden kræver et tydeligt mål og nok brugere til, at resultaterne er troværdige. Hvis man tester for mange ting på én gang, kan det være svært at vide, hvad der faktisk skabte forskellen. En anden faldgrube er at fokusere for snævert på kortsigtede målinger, for eksempel klik, uden at vurdere om løsningen også skaber reel værdi for brugeren.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'En museumsplatform vil teste, hvordan flere brugere får lyst til at se en video om restaureringsarbejde. De laver tre versioner af samme sektion: én med en informativ overskrift, én med en mere sanselig overskrift og én med et før/efter-billede som blikfang. Ved at måle klik og videostart kan teamet se, hvilken variant der bedst aktiverer brugeren.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Brugertest' },
      { label: 'Analytics Review' },
      { label: 'Survey', slug: 'survey-template' },
      { label: 'Prototype-test' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
    ],
  },
  'swot-generator': {
    summary:
      'SWOT er en strategisk analysemetode, der bruges til at skabe overblik over en organisations, et projekts eller et koncepts interne styrker og svagheder samt eksterne muligheder og trusler. Metoden bruges ofte i konceptudvikling, forretningsudvikling og strategisk planlægning, fordi den hurtigt kan synliggøre, hvor et projekt står stærkt, og hvor der er risiko for blindgyder.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'SWOT står for Strengths, Weaknesses, Opportunities and Threats. På dansk oversættes det typisk til styrker, svagheder, muligheder og trusler. De to første handler om interne forhold, altså det man selv kan påvirke. De to sidste handler om eksterne forhold, altså markedet, målgruppen, konkurrenter, teknologi, trends eller andre faktorer uden for ens direkte kontrol.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'SWOT bruges traditionelt til at vurdere en virksomheds, institutions eller løsnings strategiske position. I UX og digital konceptudvikling kan metoden bruges til at analysere et eksisterende produkt, en ny idé, en konkurrent, en digital platform eller en kampagne. Den fungerer især godt som en opsamlende metode, hvor research, data og observationer samles i et overskueligt beslutningsgrundlag.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'SWOT giver mening, når man skal forstå en situation hurtigt og struktureret. Den er særligt relevant tidligt i en proces, hvor man skal identificere udfordringer og potentialer, men den kan også bruges senere til at evaluere et koncept, før man går videre med udvikling eller implementering.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvad der taler for og imod et koncept eller en organisation. Den kan vise, hvilke interne ressourcer der kan udnyttes, hvilke svagheder der skal håndteres, hvilke muligheder der findes i omverdenen, og hvilke trusler der kan påvirke projektets succes.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres det, hvad analysen handler om, for eksempel en virksomhed, et koncept eller en digital løsning. Derefter indsamles relevante indsigter fra research, interviews, desk research, konkurrentanalyse eller brugerdata. Indsigterne placeres i de fire felter: styrker, svagheder, muligheder og trusler. Til sidst vurderes sammenhængene mellem felterne, så analysen ikke bare bliver en liste, men et grundlag for strategiske valg.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et strategisk overblik, der viser de vigtigste interne og eksterne faktorer omkring et projekt eller en organisation. Det kan bruges til at prioritere indsatsområder, formulere en problemstilling, udvikle en strategi eller vurdere, om et koncept er realistisk og relevant.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'SWOT er enkel, fleksibel og nem at kommunikere. Den gør komplekse situationer lettere at overskue og kan skabe fælles forståelse i et team. Metoden er især stærk, når den bygger på reel research og ikke kun på antagelser.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at SWOT ofte bliver for overfladisk. Hvis punkterne bare skrives som løse stikord uden dokumentation, bliver analysen hurtigt en pyntet brainstorm i fire bokse. En anden svaghed er, at metoden ikke i sig selv prioriterer, hvilke faktorer der er vigtigst. Derfor bør SWOT ofte efterfølges af en vurdering, hvor man udvælger de mest kritiske indsigter og omsætter dem til konkrete strategiske handlinger.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et museum vil udvikle et digitalt univers under en restaureringsperiode. En SWOT-analyse kan vise, at museet har en stærk visuel identitet og høj troværdighed som styrker, men at den fysiske adgang til museet er begrænset som svaghed. Samtidig kan der være mulighed for at engagere brugere digitalt gennem restaureringsfortællinger, mens truslen kan være, at målgruppen mister interessen, hvis kommunikationen opleves som for informativ og ikke sanselig nok.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'PESTEL', slug: 'pestel' },
      { label: 'Konkurrentanalyse' },
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Stakeholder map' },
      { label: 'Repositioneringskort', slug: 'gallup-kompasrose' },
    ],
  },
  'gantt-chart': {
    summary:
      'Et Gantt-diagram er en planlægningsmetode, der bruges til at visualisere aktiviteter, deadlines, afhængigheder og tidsforløb i et projekt. Metoden gør det lettere at se, hvad der skal laves, hvornår det skal laves, og hvordan forskellige opgaver hænger sammen over tid.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Et Gantt-diagram består typisk af en liste med opgaver på den ene akse og en tidslinje på den anden. Hver opgave vises som en vandret bjælke, der markerer, hvornår opgaven starter og slutter. På den måde kan man hurtigt få overblik over projektets struktur, varighed og rækkefølge.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Gantt-diagrammer bruges traditionelt i projektledelse til at planlægge og styre projekter. Metoden anvendes ofte i større projekter, hvor mange aktiviteter skal koordineres, og hvor det er vigtigt at holde styr på deadlines, ansvar og afhængigheder. Inden for digital konceptudvikling kan Gantt bruges til at planlægge research, analyse, design, prototyping, test og aflevering.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Gantt giver mening, når et projekt har flere faser, opgaver eller deadlines, som skal koordineres. Det er især relevant, når man arbejder i teams, hvor forskellige personer har ansvar for forskellige dele af processen. Metoden er også brugbar, når man skal sikre, at projektet er realistisk i forhold til tid og ressourcer.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at skabe overblik over projektets tidsplan. Den kan vise, hvilke opgaver der skal løses først, hvilke opgaver der overlapper, hvor der kan opstå flaskehalse, og hvilke deadlines der er kritiske. Den hjælper også med at gøre projektplanen mere konkret, så arbejdet ikke bare eksisterer som løse intentioner.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres projektets vigtigste faser og leverancer. Derefter brydes projektet ned i konkrete opgaver. Hver opgave får en startdato, en slutdato og eventuelt en ansvarlig person. Herefter placeres opgaverne på en tidslinje, så man kan se rækkefølge og overlap. Til sidst justeres planen, hvis nogle opgaver afhænger af hinanden, eller hvis tidsplanen viser sig at være urealistisk.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en visuel projektplan, der viser projektets opgaver, tidsforløb, deadlines og eventuelle afhængigheder. Diagrammet kan bruges som styringsværktøj gennem hele projektet og som fælles referencepunkt for teamet.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Gantt-diagrammet gør projektplanlægning konkret og visuelt overskueligt. Det er stærkt til at skabe fælles forståelse for, hvad der skal ske hvornår. Metoden gør det også lettere at opdage tidsmæssige problemer tidligt, for eksempel hvis for mange opgaver ligger oven i hinanden, eller hvis en vigtig opgave starter for sent.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at et Gantt-diagram kan give en falsk følelse af kontrol. Projekter ændrer sig ofte, og hvis planen ikke opdateres, bliver diagrammet hurtigt en pyntet tidslinje uden reel værdi. En anden begrænsning er, at metoden viser tid og struktur, men ikke nødvendigvis kvalitet, prioritering eller kompleksitet. Derfor bør Gantt ofte kombineres med metoder som Kanban, MoSCoW eller en prioriteringsmatrix.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team skal udvikle et digitalt koncept for et museum. De bruger et Gantt-diagram til at planlægge research i uge 1, analyse i uge 2, idéudvikling i uge 3, prototyping i uge 4 og brugertest i uge 5. Diagrammet viser samtidig, at tekstproduktion og visuel designudvikling kan foregå parallelt, mens brugertesten først kan gennemføres, når prototypen er klar.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Kanban', slug: 'kanban' },
      { label: 'Roadmap' },
      { label: 'MoSCoW' },
      { label: 'Prioriteringsmatrix' },
      { label: 'Sprint planning' },
      { label: 'Projektplan' },
      { label: 'WBS' },
    ],
  },
  'business-model-canvas': {
    summary:
      'Business Model Canvas er en strategisk metode, der bruges til at beskrive, analysere og udvikle en forretningsmodel på én samlet flade. Metoden hjælper med at skabe overblik over, hvordan en idé, virksomhed eller løsning skaber værdi, leverer værdi og tjener penge.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Business Model Canvas består af ni centrale byggesten: kundesegmenter, værditilbud, kanaler, kunderelationer, indtægtsstrømme, nøgleressourcer, nøgleaktiviteter, nøglepartnere og omkostningsstruktur. Tilsammen viser de, hvordan en forretning hænger sammen fra brugerbehov til økonomisk bæredygtighed.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i iværksætteri, forretningsudvikling, innovation og strategisk konceptudvikling. Den bruges ofte tidligt i en proces til at undersøge, om en idé har et realistisk forretningsmæssigt grundlag. I digital konceptudvikling kan den bruges til at vurdere, hvordan en digital løsning skaber værdi for brugeren, hvilke ressourcer den kræver, hvilke partnere der er nødvendige, og hvordan løsningen kan drives eller finansieres.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Business Model Canvas giver mening, når man skal forstå eller udvikle en forretningsmodel bag et koncept. Den er særlig relevant, når man har en idé, men endnu ikke har tydeligt overblik over målgruppe, værdi, indtjening, drift og ressourcer. Den kan også bruges til at analysere en eksisterende virksomhed eller platform for at se, hvor forretningsmodellen er stærk eller svag.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvem løsningen er til, hvilket problem den løser, hvordan værdien leveres, og hvordan konceptet kan blive økonomisk eller organisatorisk bæredygtigt. Den gør det lettere at se sammenhænge mellem brugerbehov, værdiskabelse og forretningslogik.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres det koncept, den virksomhed eller den løsning, der skal analyseres. Derefter udfyldes de ni felter med antagelser, research eller eksisterende viden. Man starter ofte med kundesegmenter og værditilbud, fordi de er centrale for resten af modellen. Herefter undersøges kanaler, relationer, ressourcer, aktiviteter, partnere, indtægter og omkostninger. Til sidst vurderes modellen kritisk for at finde huller, svage antagelser og områder, der kræver validering.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et samlet overblik over forretningsmodellen bag en idé eller organisation. Det kan bruges som beslutningsgrundlag, pitch-materiale, strategisk analyse eller som afsæt for videre konceptudvikling og validering.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Business Model Canvas gør komplekse forretningsmodeller lettere at forstå og kommunikere. Den samler bruger, værdi, drift og økonomi i én struktur, så man hurtigt kan se, om et koncept hænger sammen. Metoden er især stærk, når den bruges til at afsløre antagelser, som ellers kan være skjult i en idé.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at canvaset bliver udfyldt for hurtigt og for ukritisk. Hvis felterne kun bygger på gæt, kan modellen se stærk ud uden reelt at være valideret. En anden begrænsning er, at metoden giver et statisk øjebliksbillede, men ikke i sig selv viser udvikling over tid, konkurrencepres eller brugeradfærd i praksis. Derfor bør Business Model Canvas ofte kombineres med brugerresearch, konkurrentanalyse, Value Proposition Canvas og test af centrale antagelser.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempler',
        body: 'Et kort ForgeLab-eksempel: Et team udvikler en digital læringsplatform til studerende. I Business Model Canvas definerer de studerende og undervisere som kundesegmenter, interaktive metodeværktøjer som værditilbud og abonnement som mulig indtægtsstrøm. De identificerer samtidig, at platformen kræver teknisk drift, indholdsproduktion og samarbejde med uddannelsesinstitutioner. Canvaset viser dermed både potentialet og de områder, der skal valideres før løsningen kan skaleres.\n\nNedenfor kan du udfolde et dybdegående case-eksempel med alle ni byggesten.',
        variant: 'example',
        caseStudies: [BMC_AIRBNB_CASE_STUDY],
      },
    ],
    relatedMethods: [
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'PESTEL', slug: 'pestel' },
      { label: 'Lean Canvas' },
      { label: 'Stakeholder map' },
      { label: 'Konkurrentanalyse' },
      { label: 'Pirate Funnel', slug: 'pirate-funnel' },
    ],
  },
  kanban: {
    summary:
      'Et Kanban Board er en visuel projektstyringsmetode, der bruges til at skabe overblik over opgaver, arbejdsflow og fremdrift. Metoden gør det tydeligt, hvad der skal laves, hvad der er i gang, og hvad der er færdigt. Den bruges især i agile processer, produktudvikling, UX-arbejde og digitale projekter, hvor opgaver løbende ændrer sig.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Et Kanban Board består typisk af kolonner, der repræsenterer forskellige stadier i et arbejdsflow. Den klassiske struktur er To do, Doing og Done, men boardet kan tilpasses efter projektets behov. Opgaver placeres som kort på boardet og flyttes gennem kolonnerne, efterhånden som arbejdet skrider frem.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Kanban bruges traditionelt til at styre arbejde visuelt og forbedre flowet i et team. Metoden stammer fra lean production, men bruges i dag bredt inden for softwareudvikling, design, marketing og projektledelse. I digital konceptudvikling kan Kanban bruges til at koordinere research, idéudvikling, design, prototyping, test, tekstproduktion og teknisk udvikling.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Kanban giver mening, når et projekt består af mange opgaver, som skal prioriteres, fordeles og følges løbende. Metoden er særligt relevant i projekter, hvor arbejdet ikke nødvendigvis følger en helt fast plan, men hvor opgaver opstår, ændres eller justeres undervejs. Den fungerer godt i teams, fordi alle hurtigt kan se status på arbejdet.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at skabe transparens i arbejdsprocessen. Den viser, hvilke opgaver der mangler, hvem der arbejder på hvad, hvor der opstår flaskehalse, og hvilke opgaver der er færdige. Den hjælper også med at reducere kaos, fordi projektets opgaver bliver gjort synlige og håndterbare.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres de vigtigste arbejdsfaser, som boardet skal bestå af. Derefter oprettes opgaver som kort med en kort beskrivelse, ansvarlig person og eventuel deadline eller prioritet. Opgaverne placeres i den relevante kolonne og flyttes gennem boardet, efterhånden som de bliver bearbejdet. Undervejs kan teamet løbende justere prioriteringer, tilføje nye opgaver og identificere blokeringer.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et visuelt overblik over projektets opgaver og status. Boardet fungerer som et fælles arbejdsredskab, der gør det lettere at styre fremdrift, ansvar og prioritering gennem hele processen.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Kanban er enkelt, fleksibelt og let at forstå. Det gør usynligt arbejde synligt og skaber fælles overblik i teamet. Metoden er især stærk, når man arbejder iterativt, fordi opgaver kan tilpasses løbende uden at hele projektplanen skal bygges om. Den kan også hjælpe med at afsløre, hvis for mange opgaver er i gang på samme tid.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at boardet bliver en passiv opgaveliste i stedet for et aktivt styringsværktøj. Hvis opgaver ikke opdateres, prioriteres eller flyttes, mister metoden hurtigt værdi. En anden begrænsning er, at Kanban viser status på opgaver, men ikke nødvendigvis den strategiske retning, tidsplan eller kvaliteten af arbejdet. Derfor bør Kanban ofte kombineres med metoder som Gantt, roadmap, MoSCoW eller sprint planning.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team arbejder på et digitalt koncept for en kulturinstitution. De opretter et Kanban Board med kolonnerne Backlog, To do, In progress, Review og Done. Opgaver som "udarbejd interviewguide", "lav wireframes", "skriv koncepttekst" og "test prototype" placeres på boardet. Når arbejdet skrider frem, flyttes kortene gennem kolonnerne, så teamet hele tiden kan se, hvor projektet står.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Gantt-diagram', slug: 'gantt-chart' },
      { label: 'Roadmap' },
      { label: 'MoSCoW' },
      { label: 'Prioriteringsmatrix' },
      { label: 'Sprint planning' },
      { label: 'Backlog' },
      { label: 'User stories' },
    ],
  },
  'gallup-kompasrose': {
    summary:
      'Gallup Kompasrose er en segmenteringsmodel, der bruges til at forstå målgrupper ud fra værdier, livsstil, holdninger og samfundssyn. I stedet for kun at se på demografi som alder, køn og indkomst, hjælper modellen med at vurdere, hvordan forskellige mennesker tænker, prioriterer og orienterer sig i verden.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Gallup Kompasrose opdeler befolkningen i forskellige segmenter ud fra to overordnede akser: en akse mellem det moderne og det traditionelle, og en akse mellem det individorienterede og det fællesskabsorienterede. Segmenterne placeres i en kompasrose, så man kan se, hvilke værdimæssige retninger forskellige målgrupper bevæger sig i.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt inden for markedsføring, kommunikation, branding, politik, medieanalyse og strategisk målgruppearbejde. Den bruges til at forstå, hvordan forskellige segmenter kan reagere på budskaber, produkter, services eller kampagner. I digital konceptudvikling kan Gallup Kompasrose bruges til at kvalificere målgruppen og tilpasse tone of voice, visuelt udtryk, kanalvalg og værdifortælling.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Gallup Kompasrose giver mening, når man vil forstå målgruppen på et dybere niveau end klassiske demografiske data. Den er særligt relevant, hvis et koncept, brand eller digital løsning skal ramme bestemte værdier, behov eller livsstile. Metoden kan bruges tidligt i en proces, når man skal definere målgruppe og kommunikationsretning.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvad målgruppen motiveres af, hvilke værdier de identificerer sig med, og hvordan man kan kommunikere mere relevant til dem. Den kan også hjælpe med at vurdere, om et koncept taler til en moderne, traditionel, individorienteret eller fællesskabsorienteret målgruppe.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres den målgruppe, man ønsker at undersøge. Derefter vurderes målgruppen ud fra deres værdier, adfærd, interesser og holdninger. Herefter placeres målgruppen i kompasrosen for at identificere, hvilket segment eller hvilke segmenter de bedst matcher. Til sidst bruges segmenteringen til at træffe valg om koncept, kommunikation, kanaler, visuel stil og værdifortælling.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en værdibaseret målgruppeforståelse, der viser, hvilken type mennesker konceptet henvender sig til, og hvordan man bedst kan kommunikere med dem. Det kan bruges som grundlag for personaer, kommunikationsstrategi, kampagneudvikling, brandpositionering eller valg af digitale kontaktpunkter.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Gallup Kompasrose gør målgruppearbejde mere nuanceret end simple beskrivelser som "unge mellem 18 og 30 år". Den hjælper med at forstå, hvorfor mennesker handler, vælger og reagerer forskelligt. Metoden er især stærk, når man arbejder med kommunikation, kultur, branding og værdibaserede koncepter.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at bruge segmenterne for mekanisk. Mennesker passer sjældent perfekt ind i én kategori, og segmentering kan hurtigt blive forsimplet eller stereotyp. En anden begrænsning er, at modellen ikke alene fortæller, hvad brugerne konkret gør i en bestemt digital løsning. Derfor bør Gallup Kompasrose kombineres med brugerresearch, interviews, observationer eller data om faktisk adfærd.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et museum vil udvikle et digitalt univers om restaurering. Ved hjælp af Gallup Kompasrose kan teamet vurdere, om målgruppen primært motiveres af æstetik, kultur, fællesskab, fordybelse eller personlig inspiration. Hvis målgruppen placeres tæt på et moderne og fællesskabsorienteret segment, kan kommunikationen fokusere på kulturel deltagelse, fælles arv og adgang til museets transformation. Hvis målgruppen er mere individorienteret, kan oplevelsen i højere grad vægte personlig fordybelse, eksklusiv adgang og selvvalgte digitale spor.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Persona', slug: 'persona-canvas' },
      { label: 'SMUK-modellen', slug: 'smuk-model' },
      { label: 'Conzoom' },
      { label: 'Målgruppeanalyse' },
      { label: 'Kommunikationsstrategi' },
      { label: 'Positioneringskort' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
    ],
  },
  'tows-matrix': {
    summary:
      'TOWS Matrix er en strategisk metode, der bygger videre på SWOT-analysen. Hvor SWOT primært skaber overblik over styrker, svagheder, muligheder og trusler, bruges TOWS til at omsætte analysen til konkrete strategiske handlinger. Metoden hjælper med at koble interne forhold med eksterne forhold, så man ikke bare beskriver situationen, men også vurderer, hvad man bør gøre.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'TOWS Matrix tager udgangspunkt i de samme fire felter som SWOT: Strengths, Weaknesses, Opportunities og Threats. Forskellen er, at TOWS kombinerer felterne på tværs for at udvikle strategier. Man undersøger, hvordan styrker kan bruges til at udnytte muligheder, hvordan styrker kan beskytte mod trusler, hvordan svagheder kan forbedres gennem muligheder, og hvordan man kan reducere risikoen ved både svagheder og trusler.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i strategiudvikling, forretningsudvikling, organisationsanalyse og konceptudvikling. Den anvendes ofte efter en SWOT-analyse, når man skal bevæge sig fra analyse til beslutning. I digital konceptudvikling kan TOWS bruges til at vurdere, hvilke strategiske greb et koncept bør tage, hvilke risici der skal håndteres, og hvilke muligheder der er mest realistiske at forfølge.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'TOWS giver mening, når man allerede har identificeret styrker, svagheder, muligheder og trusler, men mangler at omsætte dem til en handlingsretning. Den er især relevant, når en SWOT-analyse føles som en passiv liste, og man har brug for at trække strategiske konklusioner ud af den.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at udvikle strategier på baggrund af en analyse. Den kan afklare, hvilke styrker man bør udnytte, hvilke svagheder der skal håndteres, hvilke eksterne muligheder der er mest interessante, og hvilke trusler der kræver en konkret respons. Den gør analysen mere handlingsorienteret og mindre dekorativ.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først udarbejdes en SWOT-analyse. Derefter placeres styrker, svagheder, muligheder og trusler i en TOWS Matrix. Herefter kombineres felterne strategisk:\n\nSO-strategier: Brug styrker til at udnytte muligheder.\nST-strategier: Brug styrker til at mindske eller håndtere trusler.\nWO-strategier: Brug muligheder til at forbedre eller kompensere for svagheder.\nWT-strategier: Reducér svagheder og undgå eller begræns trusler.\n\nTil sidst prioriteres de mest relevante strategier, så modellen bliver et grundlag for handling og ikke bare endnu en matrix i metode-zooen.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et sæt strategiske handlemuligheder, der viser, hvordan en organisation, et projekt eller et koncept kan reagere på sin situation. Det kan bruges som grundlag for konceptudvikling, kommunikationsstrategi, produktprioritering, risikohåndtering eller forretningsmæssige beslutninger.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'TOWS Matrix er stærk, fordi den tvinger analysen videre fra observation til strategi. Den gør det tydeligere, hvilke handlinger der faktisk følger af ens SWOT-analyse. Metoden er også god til at synliggøre sammenhænge mellem interne ressourcer og eksterne markedsforhold, hvilket gør den mere beslutningsorienteret end en klassisk SWOT.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at TOWS bliver mekanisk, hvis man bare kombinerer felterne uden kritisk vurdering. Ikke alle styrker passer til alle muligheder, og ikke alle trusler kræver en stor strategisk respons. En anden begrænsning er, at modellen er afhængig af kvaliteten af den oprindelige SWOT. Hvis SWOT-analysen bygger på løse antagelser, bliver TOWS-strategierne også svage. Skrald ind, skrald ud, bare med pænere bokse.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et museum skal kommunikere under en længere restaureringsperiode. En SWOT viser, at museet har en stærk æstetisk identitet som styrke, men at den fysiske adgang er begrænset som svaghed. Samtidig er der mulighed for digital kulturformidling, mens truslen er, at målgruppen mister interessen under lukkeperioden.\n\nI en TOWS Matrix kan en SO-strategi være at bruge museets visuelle identitet til at skabe sanseligt digitalt indhold om restaureringen. En WO-strategi kan være at kompensere for den manglende fysiske adgang ved at give brugerne digital adgang til backstage-processer. En ST-strategi kan være at bruge museets troværdighed til at fastholde relationen til publikum. En WT-strategi kan være at reducere risikoen for tabt opmærksomhed gennem løbende, korte formater i stedet for sjældne og tunge nyhedsopdateringer.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'PESTEL', slug: 'pestel' },
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Konkurrentanalyse' },
      { label: 'Stakeholder map' },
      { label: 'Risikomatrix' },
      { label: 'Positioneringskort' },
    ],
  },
  'porters-five-forces': {
    summary:
      'Porter\'s Five Forces er en strategisk analysemodel, der bruges til at vurdere konkurrencesituationen i en branche eller et marked. Metoden hjælper med at forstå, hvor attraktivt et marked er, hvor presset en virksomhed kan blive, og hvilke kræfter der påvirker muligheden for at skabe værdi og tjene penge.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Porter\'s Five Forces består af fem konkurrencekræfter: rivalisering mellem eksisterende konkurrenter, truslen fra nye indtrængere, truslen fra substituerende produkter, kundernes forhandlingsstyrke og leverandørernes forhandlingsstyrke. Tilsammen viser de, hvor hårdt konkurrencepresset er i et marked, og hvor svært det kan være at opnå en stærk position.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt inden for strategi, forretningsudvikling, markedsanalyse og konkurrentanalyse. Den anvendes ofte til at vurdere, om en virksomhed bør gå ind på et marked, hvordan en branche udvikler sig, eller hvor en organisation er mest sårbar over for pres udefra. I digital konceptudvikling kan modellen bruges til at analysere konkurrencesituationen omkring en platform, app, service eller digital forretningsmodel.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Porter\'s Five Forces giver mening, når man skal forstå markedet omkring et koncept eller en virksomhed. Den er særligt relevant, hvis man skal vurdere konkurrence, prisniveau, differentiering, adgangsbarrierer eller risikoen for, at brugere vælger alternative løsninger. Metoden passer godt i analysefasen, før man træffer større strategiske valg.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvor stærk konkurrencen er, hvor let nye aktører kan komme ind på markedet, hvor stor magt kunder og leverandører har, og om der findes alternativer, som kan erstatte løsningen. Den kan også vise, hvor et koncept skal differentiere sig for ikke bare at ende som endnu en spiller i den samme digitale mudderpøl.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres det marked eller den branche, der skal analyseres. Derefter undersøges hver af de fem konkurrencekræfter. Man vurderer, hvor mange konkurrenter der findes, hvor stærke de er, hvor let nye aktører kan komme ind, hvilke alternativer brugerne har, hvor meget kunderne kan presse pris eller kvalitet, og hvor afhængig virksomheden er af leverandører eller platforme. Til sidst samles analysen i en vurdering af markedets attraktivitet og de vigtigste strategiske udfordringer.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et strategisk overblik over konkurrencepresset i et marked. Analysen kan bruges til at vurdere markedsattraktivitet, finde risici, identificere differentieringsmuligheder og styrke beslutningsgrundlaget for et koncept eller en forretningsmodel.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Porter\'s Five Forces er stærk, fordi den flytter fokus fra kun at se på direkte konkurrenter til at se på hele markedets magtstruktur. Den hjælper med at forstå, hvorfor nogle markeder er svære at tjene penge i, selvom efterspørgslen virker høj. Modellen er især brugbar, når man skal vurdere, om et koncept har en realistisk strategisk position.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at bruge modellen for statisk. Digitale markeder ændrer sig hurtigt, og konkurrenter kan opstå fra helt andre brancher end forventet. En anden begrænsning er, at modellen primært fokuserer på konkurrence og markedspres, men ikke i sig selv forklarer brugerbehov, brandværdi eller intern kapacitet. Derfor bør den ofte kombineres med brugerresearch, SWOT, PESTEL og Business Model Canvas.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team vil udvikle en digital metodeplatform til studerende og undervisere. Med Porter\'s Five Forces kan de analysere, hvor mange eksisterende konkurrenter der findes, for eksempel Notion-templates, Miro, FigJam, Canva og læringsplatforme. De kan undersøge, om nye aktører let kan kopiere idéen, om brugerne kan vælge gratis alternativer, om uddannelsesinstitutioner har stor forhandlingsstyrke, og om platformen er afhængig af eksterne teknologier som hosting, AI-modeller eller betalingssystemer. Analysen kan vise, at platformen skal differentiere sig tydeligt på faglig metodeforståelse, ikke kun på digitale templates.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'TOWS Matrix', slug: 'tows-matrix' },
      { label: 'PESTEL', slug: 'pestel' },
      { label: 'Konkurrentanalyse' },
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Positioneringskort' },
    ],
  },
  'value-proposition-canvas': {
    summary:
      'Value Proposition Canvas er en metode, der bruges til at skabe sammenhæng mellem en målgruppes behov og det værditilbud, en løsning tilbyder. Metoden hjælper med at undersøge, om et produkt, en service eller et koncept faktisk løser et relevant problem for brugeren, eller om man bare har bygget noget, der ser smart ud i ens egen PowerPoint-hule.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Value Proposition Canvas består af to hoveddele: Customer Profile og Value Map.\n\nCustomer Profile beskriver brugeren gennem tre områder:\nJobs — det brugeren forsøger at opnå.\nPains — de problemer, frustrationer eller barrierer brugeren oplever.\nGains — de fordele, ønsker eller positive resultater brugeren håber på.\n\nValue Map beskriver løsningen gennem tre områder:\nProducts & Services — hvad løsningen konkret består af.\nPain Relievers — hvordan løsningen reducerer brugerens problemer.\nGain Creators — hvordan løsningen skaber ekstra værdi for brugeren.\n\nPointen er at skabe et tydeligt match mellem brugerens situation og løsningens værdi.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i forretningsudvikling, UX, innovation og konceptudvikling. Den bruges ofte som en uddybning af Business Model Canvas, fordi den går mere detaljeret ind i relationen mellem målgruppe og værditilbud. I digital konceptudvikling kan den bruges til at vurdere, om en app, platform, service eller digital kampagne faktisk adresserer et reelt brugerbehov.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Value Proposition Canvas giver mening, når man skal udvikle eller kvalificere et koncept, hvor brugerens behov og løsningens værdi endnu ikke er tydeligt koblet sammen. Den er især relevant tidligt i processen, når man arbejder med problemforståelse, målgruppe og konceptretning. Den kan også bruges senere til at teste, om en løsning stadig matcher brugernes behov efter research eller brugertest.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvad brugeren egentlig prøver at opnå, hvilke barrierer der står i vejen, og hvilken værdi løsningen skal skabe. Den kan også afsløre, om et koncept bygger på en stærk brugerindsigt eller bare på en intern antagelse om, hvad brugeren nok gerne vil have.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres den målgruppe eller brugergruppe, der skal arbejdes med. Derefter udfyldes brugerens jobs, pains og gains ud fra research, interviews, observationer eller eksisterende viden. Herefter beskrives løsningens produkter, services, pain relievers og gain creators. Til sidst vurderes fit\'et mellem de to sider: matcher løsningen faktisk brugerens vigtigste behov, eller løser den noget, der ikke er vigtigt nok?',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et tydeligt overblik over sammenhængen mellem brugerbehov og værditilbud. Det kan bruges til at skærpe et koncept, prioritere funktioner, formulere kommunikation, udvikle en pitch eller identificere antagelser, der skal valideres.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Value Proposition Canvas er stærk, fordi den tvinger teamet til at tænke fra brugerens perspektiv før løsningens perspektiv. Den gør det lettere at se, om en idé skaber reel værdi, og om de vigtigste funktioner faktisk hænger sammen med målgruppens behov. Metoden er især nyttig, når man skal forklare, hvorfor et koncept er relevant.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at udfylde canvaset med gæt i stedet for indsigter. Hvis pains og gains ikke bygger på research, kan modellen hurtigt blive en pæn samling ønsketænkning. En anden faldgrube er at skrive for generisk, for eksempel "brugeren vil spare tid" eller "brugeren vil have en god oplevelse", uden at forklare hvad det konkret betyder i konteksten. Metoden kræver præcision, ellers bliver den bare strategisk tapet.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team vil udvikle et digitalt restaureringsunivers for et museum. I Customer Profile kan brugerens jobs være at holde kontakt med museet under en lukkeperiode, finde kulturel inspiration og få en sanselig oplevelse digitalt. Pains kan være, at almindelige nyhedsopdateringer virker tørre, og at restaureringsarbejde kan føles fjernt eller teknisk. Gains kan være adgang til skjulte detaljer, æstetisk indhold og følelsen af at komme tættere på museets transformation.\n\nI Value Map kan løsningen bestå af korte videoer, før/efter-nedslag, lydfortællinger og visuelle restaureringsspor. Pain relievers kan være kurateret og let tilgængeligt indhold, mens gain creators kan være eksklusiv adgang til processer, brugeren normalt ikke ser. På den måde viser canvaset, om konceptet faktisk matcher målgruppens behov for nærvær, ro og kulturel fordybelse.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Persona', slug: 'persona-canvas' },
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'Interview' },
      { label: 'Survey', slug: 'survey-template' },
      { label: 'Brugerresearch' },
    ],
  },
  'card-sorting': {
    summary:
      'Card Sorting er en UX-researchmetode, der bruges til at forstå, hvordan brugere naturligt grupperer, kategoriserer og navngiver information. Metoden hjælper især med at skabe en mere intuitiv informationsarkitektur, så indhold, navigation og menustrukturer passer bedre til brugernes mentale modeller.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Card Sorting går ud på, at brugere får en række kort med ord, emner, funktioner eller indholdstyper, som de skal sortere i grupper. Kortene kan for eksempel være sider på et website, produktkategorier, metodeværktøjer, funktioner i en app eller begreber fra en digital service. Brugernes sortering viser, hvordan de selv forstår sammenhænge mellem information.\n\nDer findes typisk tre former:\n\nOpen Card Sorting — brugerne selv laver grupper og navngiver dem.\nClosed Card Sorting — brugerne sorterer kort ind i på forhånd definerede kategorier.\nHybrid Card Sorting — der findes nogle faste kategorier, men brugerne kan også oprette deres egne.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i UX-design, informationsarkitektur, webdesign og produktudvikling. Den er særligt relevant, når man skal strukturere indhold på en hjemmeside, app, platform eller digital service. Card Sorting bruges ofte til at forstå, om brugernes måde at organisere information på matcher den struktur, organisationen selv har tænkt.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Card Sorting giver mening, når man skal designe eller forbedre navigation, menustruktur, kategorier eller indholdsgruppering. Den er især nyttig, hvis brugerne har svært ved at finde information, eller hvis man er i tvivl om, hvilke ord og grupperinger der giver bedst mening for målgruppen.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvordan brugerne forventer, at information hænger sammen. Den kan vise, hvilke begreber der opleves som beslægtede, hvilke kategorier der er uklare, og hvilke navne brugerne selv ville give grupperne. Det er ret vigtigt, fordi organisationer ofte navngiver ting ud fra interne systemer, mens brugere leder efter mening med deres egen lille hverdagskompasnål.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først udvælges de kort, der skal sorteres. Det kan være eksisterende sider, funktioner, produkter, emner eller begreber. Derefter gennemfører brugerne sorteringen, enten fysisk med kort eller digitalt. Efterfølgende analyseres mønstrene: hvilke kort placeres ofte sammen, hvilke kategorier opstår, og hvor er der uenighed? Til sidst bruges indsigterne til at forbedre struktur, navigation eller kategorinavne.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en bedre forståelse af brugernes mentale model og et grundlag for informationsarkitektur. Det kan føre til nye menustrukturer, forbedrede kategorier, mere brugervenlige labels eller en tydeligere organisering af indhold.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Card Sorting er stærk, fordi den afslører, hvordan brugerne selv organiserer information, i stedet for hvordan teamet tror, de gør. Metoden er relativt enkel at gennemføre og kan give konkrete indsigter, der direkte kan omsættes til navigation, kategorier og struktur.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at tro, at Card Sorting alene giver den endelige navigation. Metoden viser mønstre og forventninger, men den fortæller ikke nødvendigvis alt om brugerens faktiske adfærd i en løsning. En anden begrænsning er, at resultaterne kan blive uklare, hvis kortene er dårligt formulerede, for brede eller for interne i sproget. Derfor bør metoden ofte kombineres med Tree Testing, brugertest eller analytics.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team udvikler et metodebibliotek til studerende. De vil finde ud af, hvordan metoder som SWOT, Persona, Service Blueprint, Kanban og A/B/N Test bedst skal grupperes. I en Card Sorting-session placerer brugerne måske SWOT og PESTEL sammen som analysemetoder, Persona og Empathy Map sammen som brugerforståelse, og Kanban og Gantt sammen som planlægning. Det kan hjælpe teamet med at strukturere metodebiblioteket efter brugernes logik frem for interne fagkasser.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Tree Testing' },
      { label: 'Informationsarkitektur' },
      { label: 'Brugertest' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'Survey', slug: 'survey-template' },
      { label: 'Interview' },
      { label: 'Sitemap' },
    ],
  },
  'smuk-model': {
    summary:
      'SMUK-modellen er en segmenterings- og vurderingsmodel, der bruges til at analysere, hvor attraktiv en målgruppe eller et markedssegment er. Metoden hjælper med at vurdere, om en målgruppe ikke bare er interessant, men også realistisk, værdifuld og strategisk relevant at arbejde med.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'SMUK står typisk for Størrelse og vækst, Muligheder for bearbejdning, Udgifter ved bearbejdning og Konkurrencesituation.\n\nModellen bruges til at vurdere forskellige segmenter ud fra fire centrale spørgsmål:\n\nStørrelse og vækst: Er målgruppen stor nok, og er den i udvikling?\nMuligheder for bearbejdning: Kan vi faktisk nå målgruppen gennem relevante kanaler og budskaber?\nUdgifter ved bearbejdning: Hvad koster det at nå, påvirke og fastholde målgruppen?\nKonkurrencesituation: Hvor hård er konkurrencen om målgruppens opmærksomhed, tid eller penge?\n\nTilsammen giver modellen et billede af, hvilke segmenter der er mest attraktive at prioritere.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'SMUK-modellen bruges traditionelt i marketing, strategi, kommunikation og forretningsudvikling. Den anvendes ofte efter en segmentering, hvor man har identificeret flere mulige målgrupper, men skal vælge, hvilke der er mest relevante at fokusere på. I digital konceptudvikling kan modellen bruges til at vurdere, hvilken brugergruppe et koncept bør målrettes mod, og om målgruppen er realistisk at aktivere.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'SMUK-modellen giver mening, når man har flere mulige målgrupper og skal prioritere mellem dem. Den er især relevant, hvis et team risikerer at sige "vores målgruppe er alle", hvilket næsten altid betyder "vi har ikke valgt endnu". Modellen tvinger projektet til at vurdere målgruppen strategisk frem for kun intuitivt.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvilken målgruppe der giver mest mening at arbejde med ud fra både potentiale, adgang, økonomi og konkurrence. Den kan vise, om en målgruppe er stor nok, om den kan nås gennem de rigtige kanaler, om den er for dyr at bearbejde, eller om konkurrencen gør den svær at vinde.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først identificeres de relevante segmenter, der skal vurderes. Derefter analyseres hvert segment ud fra de fire SMUK-kriterier. Ofte gives hvert kriterie en vurdering eller score, så segmenterne kan sammenlignes. Til sidst udvælges den eller de målgrupper, der samlet set fremstår mest attraktive og realistiske for konceptet.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en prioriteret vurdering af målgrupper eller segmenter. Modellen kan bruges som beslutningsgrundlag for valg af primær målgruppe, kommunikationsstrategi, kanalvalg, positionering eller videre konceptudvikling.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'SMUK-modellen er stærk, fordi den kombinerer målgruppens potentiale med projektets mulighed for faktisk at nå den. Den forhindrer, at man vælger en målgruppe, der lyder spændende, men er for lille, for dyr, for svær at nå eller allerede overmættet af konkurrenter. Den gør målgruppevalg mere strategisk og mindre fluffy.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at give segmenterne scores uden dokumentation. Hvis vurderingen kun bygger på mavefornemmelser, kan modellen hurtigt ligne analyse uden at være det. En anden begrænsning er, at SMUK primært vurderer segmentets attraktivitet, men ikke i sig selv forklarer brugerens behov, motivationer eller adfærd. Derfor bør modellen ofte kombineres med persona, interviews, Gallup Kompasrose, Conzoom eller Value Proposition Canvas.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team udvikler et digitalt metodebibliotek til konceptudvikling. De overvejer tre målgrupper: studerende, undervisere og små bureauer. Studerende er måske en stor og let tilgængelig målgruppe, men har lav betalingsvillighed. Undervisere er færre, men kan være stærke ambassadører og indgå i uddannelsesmiljøer. Små bureauer kan have højere betalingsvillighed, men møder allerede mange eksisterende værktøjer.\n\nMed SMUK-modellen kan teamet sammenligne segmenterne og vurdere, hvilken målgruppe der er mest strategisk at starte med. Det kan vise, at studerende er bedst til adoption og feedback, mens undervisere eller bureauer senere kan være mere relevante for skalering og betaling.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Segmentering' },
      { label: 'Persona', slug: 'persona-canvas' },
      { label: 'Gallup Kompasrose', slug: 'gallup-kompasrose' },
      { label: 'Conzoom' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Positioneringskort' },
    ],
  },
  'aaker-identity-model': {
    summary:
      'David Aakers Identitetsmodel er en branding- og strategimodel, der bruges til at analysere og udvikle en brands identitet. Modellen hjælper med at forstå, hvad et brand står for, hvordan det adskiller sig fra konkurrenter, og hvordan brandets værdier, personlighed og udtryk kan gøres tydelige for målgruppen.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Modellen ser brandidentitet som mere end logo, farver og visuel stil. Hos Aaker handler brandidentitet om de associationer, en organisation ønsker at skabe og fastholde hos målgruppen.\n\nModellen arbejder typisk med fire perspektiver på brandet:\n\nBrand som produkt: Hvad tilbyder brandet, og hvilke egenskaber forbindes med produktet eller servicen?\nBrand som organisation: Hvilke værdier, kultur og kompetencer står organisationen bag brandet for?\nBrand som person: Hvis brandet var en person, hvilken personlighed, tone og karakter ville det have?\nBrand som symbol: Hvilke visuelle, historiske eller kulturelle symboler forbindes med brandet?\n\nDerudover skelner Aaker ofte mellem kerneidentitet og udvidede identitet. Kerneidentiteten er det mest stabile og centrale ved brandet, mens den udvidede identitet rummer flere nuancer, udtryk og associationer.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt inden for branding, kommunikation, marketing og strategisk positionering. Den anvendes til at definere eller analysere et brand, så det ikke kun vurderes ud fra overfladiske elementer som navn og design, men ud fra den samlede betydning, brandet skal have i målgruppens bevidsthed.\n\nI digital konceptudvikling kan modellen bruges til at sikre, at en digital løsning, kampagne eller platform hænger sammen med afsenderens identitet. Det kan handle om tone of voice, visuel stil, brugeroplevelse, indhold, værdier og den relation, brandet ønsker at opbygge med brugeren.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'David Aakers Identitetsmodel giver mening, når man skal forstå, udvikle eller styrke et brands identitet. Den er især relevant, hvis et brand virker uklart, fragmenteret eller svært at differentiere fra konkurrenterne. Modellen kan også bruges, når en organisation skal lancere et nyt koncept og sikre, at konceptet passer til brandets grundfortælling.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvad brandet skal forbindes med, hvilke værdier det bygger på, hvilken personlighed det har, og hvordan det skal opleves af målgruppen. Den kan også bruges til at vurdere, om et nyt koncept styrker brandet eller trækker det i en uklar retning.\n\nDen er især nyttig, når man skal svare på spørgsmål som:\nHvad er brandets kerne?\nHvilke associationer ønsker vi at skabe?\nHvordan skal brandet tale, se ud og opføre sig?\nHvad gør brandet genkendeligt og troværdigt?\nHvordan adskiller brandet sig fra andre?',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først analyseres brandets nuværende situation, målgruppe, konkurrenter og interne styrker. Derefter undersøges brandet ud fra de fire perspektiver: produkt, organisation, person og symbol. Herefter defineres brandets kerneidentitet og udvidede identitet.\n\nTil sidst vurderes det, hvordan identiteten skal omsættes i praksis gennem kommunikation, design, indhold, brugeroplevelse og strategiske valg. Modellen bør ikke ende som et pænt branding-skema i en rapportskuffe. Den skal kunne mærkes i det, brugeren faktisk møder.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en klarere brandidentitet, der beskriver, hvad brandet står for, hvordan det ønsker at blive opfattet, og hvilke elementer der skal skabe genkendelighed og differentiering. Det kan bruges som grundlag for brandstrategi, visuel identitet, tone of voice, kampagneudvikling, positionering eller digital konceptudvikling.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'David Aakers Identitetsmodel er stærk, fordi den ser brandet som en helhed. Den kobler produkt, organisation, personlighed og symbolik, så brandet ikke reduceres til grafisk pynt. Modellen hjælper også med at skabe konsistens på tværs af kommunikation, design og brugeroplevelse.\n\nDen er særligt brugbar, når man skal forklare, hvorfor et koncept passer til en bestemt afsender. Hvis brandets identitet handler om ro, æstetik og fordybelse, skal konceptet ikke pludselig kommunikere som en larmende tilbudsavis med neonfeber.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at modellen bliver for abstrakt. Ord som "autentisk", "moderne" og "inspirerende" betyder meget lidt, hvis de ikke kobles til konkrete valg i design, indhold og brugeroplevelse. En anden begrænsning er, at modellen primært beskriver den ønskede identitet, men ikke nødvendigvis hvordan målgruppen faktisk oplever brandet. Derfor bør den kombineres med brugerresearch, brandanalyse, interviews, positioneringskort eller konkurrentanalyse.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et museum vil udvikle et digitalt univers under en restaureringsperiode. Med David Aakers Identitetsmodel kan teamet undersøge museets brand som produkt, organisation, person og symbol.\n\nSom produkt tilbyder museet kunst, arkitektur og kulturel fordybelse. Som organisation står det for bevaring, faglighed, æstetik og kulturarv. Som person kan brandet opleves som roligt, sanseligt, vidende og eftertænksomt. Som symbol forbindes brandet med bygningen, samlingerne, arkitekturen, materialerne og den særlige stemning.\n\nAnalysen kan vise, at et digitalt koncept ikke bør føles som en hurtig nyhedsplatform, men som et roligt og visuelt univers, der forlænger museets identitet digitalt. På den måde hjælper modellen med at sikre, at konceptet ikke bare fungerer teknisk, men også føles rigtigt for afsenderen.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Positioneringskort' },
      { label: 'Brandanalyse' },
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'Gallup Kompasrose', slug: 'gallup-kompasrose' },
      { label: 'Persona', slug: 'persona-canvas' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Kommunikationsstrategi' },
      { label: 'Tone of voice' },
    ],
  },
  'affinity-diagram': {
    summary:
      'Affinity Diagram er en analysemetode, der bruges til at organisere mange løse indsigter, observationer eller idéer i meningsfulde temaer. Metoden hjælper med at finde mønstre i komplekst materiale, særligt efter interviews, workshops, brugertests eller brainstorms, hvor man står med mange noter og ikke helt ved, hvor guldet gemmer sig.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Affinity Diagram handler om at samle beslægtede indsigter i grupper. Hver indsigt skrives typisk på en note, og noterne sorteres derefter efter ligheder, mønstre eller fælles temaer. Når grupperne er dannet, navngives de, så man kan se, hvilke overordnede problemstillinger, behov eller muligheder der går igen.\n\nMetoden bruges ikke til at bevise noget matematisk, men til at skabe kvalitativ mening i mange små datapunkter.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i UX-research, service design, design thinking, konceptudvikling og innovationsprocesser. Den anvendes ofte efter researchaktiviteter som interviews, observationer, surveys med åbne svar eller brugertests. I stedet for at analysere hver note isoleret hjælper Affinity Diagram med at se større mønstre på tværs af materialet.\n\nI digital konceptudvikling kan metoden bruges til at samle brugerudsagn, pains, behov, idéer, feedback og testresultater, så teamet kan identificere centrale temaer før idéudvikling eller konceptvalg.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Affinity Diagram giver mening, når man har meget kvalitativt materiale, som skal struktureres. Den er især relevant efter en researchfase, hvor man har mange citater, observationer eller noter, men endnu ikke har overblik over, hvad materialet egentlig peger på.\n\nMetoden passer godt i overgangen mellem research og analyse, hvor man skal bevæge sig fra "vi har hørt en masse" til "vi kan se disse mønstre".',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at finde temaer, sammenhænge og gentagelser i brugerdata. Den kan vise, hvilke problemer der fylder mest, hvilke behov der går igen, og hvilke idéer eller observationer der hænger sammen. Den hjælper også teamet med at skabe fælles forståelse, fordi analysen bliver visuel og konkret.\n\nDen er særligt god til at opdage mønstre, man ikke havde planlagt at lede efter. Det er lidt som at tømme en rodet skuffe og opdage, at halvdelen af kaosset faktisk tilhører samme mærkelige kategori.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først indsamles rå data fra research, for eksempel interviewcitater, observationer, testnoter eller workshopidéer. Derefter skrives hver vigtig indsigt på sin egen note. Noterne sorteres i grupper ud fra naturlige sammenhænge. Gruppenavne formuleres først efter sorteringen, så temaerne opstår ud fra materialet og ikke presses ned over det på forhånd.\n\nTil sidst analyseres grupperne for at finde de vigtigste mønstre, indsigter og muligheder. Resultatet kan derefter bruges til problemformulering, idéudvikling, personaer, brugerrejser eller konceptretning.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et visuelt overblik over centrale temaer, mønstre og indsigter. Det kan bruges som analysegrundlag, når man skal formulere designprincipper, definere brugerbehov, prioritere problemområder eller udvikle konceptidéer.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Affinity Diagram er stærk, fordi den gør komplekst og ustruktureret materiale håndterbart. Den hjælper med at skabe overblik uden at miste forbindelsen til de konkrete brugerindsigter. Metoden er også god i teams, fordi flere personer kan være med til at sortere og diskutere materialet, hvilket reducerer risikoen for, at én persons tolkning styrer hele analysen.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at gruppere for hurtigt ud fra egne antagelser i stedet for at lade mønstrene opstå fra materialet. Hvis teamet allerede har besluttet, hvad de vil finde, bliver metoden bare en pæn opslagstavle for bias. En anden begrænsning er, at metoden ikke i sig selv prioriterer, hvilke temaer der er vigtigst. Derfor bør den ofte efterfølges af en vurdering, hvor temaerne prioriteres efter relevans, hyppighed, alvor eller strategisk betydning.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team har interviewet unge museumsbrugere om deres forhold til digitale kulturtilbud. De står med mange citater om ro, æstetik, manglende tid, irritation over tung information, interesse for behind-the-scenes-indhold og behov for korte formater. Ved at bruge Affinity Diagram samler de citaterne i temaer som "sanselig digital oplevelse", "lav informationsfriktion", "nysgerrighed på skjulte processer" og "behov for fleksibel adgang".\n\nDet kan hjælpe teamet med at se, at konceptet ikke bare skal informere brugeren, men skabe en let, visuel og nærværende adgang til museets fortælling.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Interview' },
      { label: 'Observation' },
      { label: 'Brugertest' },
      { label: 'Persona', slug: 'persona-canvas' },
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'Service Blueprint', slug: 'service-blueprint' },
      { label: 'Tematisk analyse' },
      { label: 'How Might We', slug: 'hmw' },
    ],
  },
  scamper: {
    summary:
      'SCAMPER er en kreativ idéudviklingsmetode, der bruges til at videreudvikle eksisterende idéer, produkter, services eller koncepter. Metoden hjælper med at stille systematiske "hvad nu hvis?"-spørgsmål, så man kan udfordre vanetænkning og finde nye muligheder i noget, der allerede findes.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'SCAMPER er et akronym for syv kreative greb:\n\nS – Substitute: Hvad kan erstattes?\nC – Combine: Hvad kan kombineres?\nA – Adapt: Hvad kan tilpasses fra en anden kontekst?\nM – Modify / Magnify / Minify: Hvad kan ændres, forstørres eller forenkles?\nP – Put to another use: Kan løsningen bruges på en ny måde?\nE – Eliminate: Hvad kan fjernes?\nR – Reverse / Rearrange: Hvad kan vendes om eller omstruktureres?\n\nMetoden fungerer som en spørgeramme, hvor man undersøger et koncept fra flere kreative vinkler.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'SCAMPER bruges traditionelt i idéudvikling, innovation, produktudvikling, design thinking og konceptudvikling. Den anvendes ofte, når man vil forbedre eller gentænke en eksisterende løsning, men mangler nye perspektiver. I digital konceptudvikling kan metoden bruges til at videreudvikle en app, en service, en kampagne, en brugerrejse, en funktion eller et digitalt værktøj.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'SCAMPER giver mening, når man allerede har en idé eller løsning, men gerne vil udfordre den. Den er særligt relevant i udviklingsfasen, hvor man skal skabe flere konceptvarianter eller finde alternative måder at løse et problem på. Metoden er også god, hvis en idé føles for oplagt, flad eller låst fast i første tanke.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at skabe nye idéretninger ved at stille strukturerede spørgsmål til en eksisterende løsning. Den kan afklare, om noget kan gøres enklere, kombineres med noget andet, vendes på hovedet eller bruges i en ny kontekst. Den er god til at få idéudvikling ud af "vi brainstormer bare lidt"-tågen og ind i en mere målrettet kreativ proces.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først vælges den idé, funktion, service eller udfordring, der skal arbejdes med. Derefter gennemgås de syv SCAMPER-greb ét ad gangen. For hvert greb stilles spørgsmål til, hvordan løsningen kan ændres, udvides, forenkles eller omstruktureres. Idéerne samles løbende, og til sidst vurderes de mest lovende forslag ud fra relevans, brugerbehov, realisme og strategisk værdi.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en samling nye idéer, variationer eller forbedringsforslag til et eksisterende koncept. Det kan bruges som grundlag for konceptudvikling, prototyping, prioritering eller videre validering.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'SCAMPER er stærk, fordi den gør kreativitet mere konkret. I stedet for at vente på en genial idé fra loftets idéflagermus, giver metoden et sæt faste greb, der kan presse nye vinkler frem. Den er fleksibel, let at bruge i teams og fungerer godt, når man skal udvikle mange variationer hurtigt.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at bruge SCAMPER uden en tydelig problemstilling. Hvis man ikke ved, hvad man forsøger at forbedre, kan metoden skabe mange idéer uden retning. En anden begrænsning er, at metoden primært skaber muligheder, men ikke vurderer, om idéerne faktisk er relevante for brugeren. Derfor bør SCAMPER ofte kombineres med brugerresearch, Value Proposition Canvas, prioriteringsmatrix eller prototypetest.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team arbejder med et digitalt metodebibliotek til studerende. Med SCAMPER kan de spørge: Kan metodekortene kombineres med Double Diamond-faser? Kan en traditionel metodeliste tilpasses til en mere guidet "hvilken metode skal jeg bruge?"-funktion? Kan noget fjernes, så siden ikke bliver for tung? Kan rækkefølgen omstruktureres, så brugeren først vælger sit problem og derefter ser relevante metoder?\n\nPå den måde kan SCAMPER hjælpe teamet med at udvikle metodebiblioteket fra en statisk liste til et mere aktivt beslutningsværktøj.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Brainstorming', slug: 'brainstorming' },
      { label: 'How Might We', slug: 'hmw' },
      { label: 'Crazy 8s' },
      { label: 'Design Sprint' },
      { label: 'Prioriteringsmatrix' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Prototyping' },
      { label: 'Idéudvælgelse' },
    ],
  },
  hmw: {
    summary:
      'How Might We er en idéudviklingsmetode, der bruges til at omsætte indsigter, problemer eller brugerbehov til åbne designspørgsmål. Metoden hjælper med at formulere udfordringer på en måde, der inviterer til idéudvikling i stedet for at låse teamet fast i én bestemt løsning.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'HMW står for How Might We, på dansk ofte forstået som: Hvordan kan vi…?\n\nMetoden bruges til at formulere en problemstilling som et åbent, handlingsorienteret spørgsmål. Et godt HMW-spørgsmål er hverken for bredt eller for snævert. Det skal åbne for flere mulige løsninger, men stadig være konkret nok til at give retning.\n\nEksempel:\n\nFor bredt: Hvordan kan vi forbedre museet?\nFor snævert: Hvordan kan vi lave en video på forsiden?\nMere brugbart: Hvordan kan vi gøre restaureringsprocessen mere nærværende for unge brugere, mens museet er fysisk lukket?',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'How Might We bruges traditionelt i design thinking, UX, service design, innovation og konceptudvikling. Metoden placeres ofte efter research- og analysefasen, hvor teamet har fundet centrale indsigter, pains eller muligheder. HMW fungerer som en bro mellem problemforståelse og idéudvikling.\n\nI digital konceptudvikling kan HMW bruges til at omsætte interviewindsigter, brugerproblemer, journeys, empathy maps eller affinity diagrams til konkrete designudfordringer, som teamet kan ideudvikle på.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'HMW giver mening, når man har identificeret et problem eller en indsigt, men endnu ikke ved, hvilken løsning der er den rigtige. Den er især relevant, når teamet skal undgå at springe direkte fra problem til første idé. Metoden hjælper med at holde mulighedsrummet åbent lidt længere, så idéudviklingen ikke bliver en hurtig tur ned ad den første og mest larmende tankegang.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at formulere problemer som muligheder. Den kan gøre komplekse brugerbehov mere konkrete og brugbare i en kreativ proces. Den hjælper også teamet med at skabe fælles retning, fordi alle idéer efterfølgende kan vurderes ud fra det samme centrale spørgsmål.\n\nHMW kan især bruges til at afklare:\nHvilket problem forsøger vi egentlig at løse?\nHvem løser vi det for?\nHvilken mulighed ligger der i indsigten?\nHvordan kan vi åbne for flere løsninger i stedet for én fast idé?',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først identificeres en vigtig brugerindsigt, udfordring eller pain point. Derefter omskrives problemet til et åbent HMW-spørgsmål. Spørgsmålet bør indeholde både målgruppe, behov og kontekst, hvis det er relevant. Herefter bruges spørgsmålet som afsæt for brainstorming, SCAMPER, Crazy 8s, konceptudvikling eller prototyping.\n\nTil sidst vurderes idéerne ud fra, hvor godt de besvarer HMW-spørgsmålet, og om de faktisk adresserer den oprindelige indsigt.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et eller flere klare designspørgsmål, der kan bruges som afsæt for idéudvikling. HMW-spørgsmål kan også bruges som struktur i workshops, konceptpræsentationer, problemformuleringer eller som overgang mellem analyse og løsning.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'How Might We er stærk, fordi den gør problemer handlingsorienterede uden at lukke løsningsrummet for tidligt. Metoden er enkel, men den kan være ret effektiv, når man skal få et team fra "vi har en masse indsigter" til "hvad kan vi faktisk udvikle på baggrund af dem?". Den hjælper også med at holde fokus på brugeren i idéudviklingen.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at formulere HMW-spørgsmål, der enten er for brede eller for løsningsspecifikke. Hvis spørgsmålet er for bredt, bliver idéerne diffuse. Hvis det er for snævert, har man allerede valgt løsningen forklædt som et spørgsmål.\n\nEn anden faldgrube er at lave HMW-spørgsmål uden researchgrundlag. Så bliver metoden bare kreativ ordgymnastik. HMW bør bygge på reelle indsigter, ikke bare på det teamet håber er problemet.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team har interviewet unge brugere om Glyptoteket under en restaureringsperiode. Researchen viser, at målgruppen gerne vil have kulturelt indhold, men hurtigt mister interessen, hvis kommunikationen bliver for tung, teknisk eller institutionsagtig.\n\nEn dårlig HMW kunne være: Hvordan kan vi lave flere videoer?\n\nEn bedre HMW kunne være: Hvordan kan vi formidle restaureringsprocessen på en sanselig og let tilgængelig måde, så unge brugere får lyst til at følge med digitalt?\n\nDet spørgsmål åbner for flere mulige løsninger: korte videoer, lydfortællinger, før/efter-indhold, interaktive detaljer, visuelle nedslag eller en digital fortælling over tid.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Affinity Diagram', slug: 'affinity-diagram' },
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'SCAMPER', slug: 'scamper' },
      { label: 'Brainstorming', slug: 'brainstorming' },
      { label: 'Crazy 8s' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Prototyping' },
    ],
  },
  brugerrejse: {
    summary:
      'En brugerrejse er en UX- og service design-metode, der bruges til at kortlægge brugerens oplevelse før, under og efter mødet med et produkt, en service eller en organisation. Metoden hjælper med at forstå, hvilke trin brugeren går igennem, hvad brugeren tænker og føler undervejs, og hvor der opstår friktion, behov eller muligheder for forbedring.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'En brugerrejse visualiserer brugerens samlede forløb over tid. Den viser typisk brugerens handlinger, kontaktpunkter, tanker, følelser, pains og behov i de forskellige faser af oplevelsen. I stedet for kun at se på én skærm, én funktion eller ét øjeblik, ser metoden på hele sammenhængen omkring brugerens interaktion.\n\nEn brugerrejse kan både beskrive den nuværende oplevelse, altså as-is, eller den ønskede fremtidige oplevelse, altså to-be.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i UX-design, service design, konceptudvikling og kommunikation. Den anvendes ofte til at forstå, hvordan en bruger bevæger sig gennem en service, et website, en app, en købsproces, en kampagne eller en fysisk-digital oplevelse.\n\nI digital konceptudvikling bruges brugerrejsen til at identificere, hvor brugeren møder værdi, hvor der opstår barrierer, og hvor et digitalt koncept kan understøtte oplevelsen bedre.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Brugerrejser giver mening, når man skal forstå en oplevelse som et forløb og ikke kun som en enkelt handling. Metoden er især relevant, når der er flere kontaktpunkter, flere faser eller flere følelser involveret i brugerens oplevelse.\n\nDen er brugbar tidligt i processen til at forstå problemer og senere i processen til at beskrive, hvordan et nyt koncept forbedrer brugerens oplevelse.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvad brugeren gør, tænker og føler gennem hele forløbet. Den kan vise, hvor brugeren bliver forvirret, mister motivation, mangler information eller oplever værdi.\n\nDen hjælper også med at identificere muligheder for design, kommunikation og serviceforbedringer. Kort sagt: den viser, hvor brugeroplevelsen knirker, og hvor man kan smøre maskineriet uden bare at male det pænt.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres den brugergruppe og situation, rejsen skal handle om. Derefter opdeles oplevelsen i faser, for eksempel før, under og efter brug. For hver fase beskrives brugerens handlinger, behov, tanker, følelser, kontaktpunkter og udfordringer.\n\nIndsigterne bør helst bygge på research som interviews, observationer, surveys, analytics eller brugertests. Til sidst analyseres rejsen for at finde pain points, moments of truth og muligheder for forbedring.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et visuelt overblik over brugerens oplevelse fra start til slut. Det kan bruges som grundlag for problemformulering, idéudvikling, service blueprint, konceptudvikling, prioritering af funktioner eller forbedring af kommunikation.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Brugerrejsen er stærk, fordi den gør brugerens oplevelse konkret og helhedsorienteret. Den hjælper teams med at se sammenhænge mellem handlinger, følelser og kontaktpunkter. Metoden er især nyttig, når man skal forklare, hvorfor et problem opstår, og hvor i oplevelsen et koncept skal skabe værdi.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at lave en brugerrejse ud fra gæt i stedet for research. Hvis man bare forestiller sig brugerens oplevelse, kan rejsen hurtigt blive en pæn fortælling uden reel indsigt.\n\nEn anden faldgrube er at gøre rejsen for generisk. Hvis faserne hedder noget bredt som "opdager", "bruger" og "afslutter", uden konkrete handlinger og følelser, mister metoden sin analytiske værdi. En god brugerrejse skal vise specifikke friktioner og muligheder, ikke bare en glat tegneserie over et idealforløb.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team udvikler et digitalt univers for et museum under en restaureringsperiode. En as-is brugerrejse kan vise, at brugeren først opdager, at museet er lukket, derefter søger information online, men hurtigt mister interessen, fordi kommunikationen primært handler om praktiske forhold.\n\nEn to-be brugerrejse kan vise, hvordan brugeren i stedet møder en visuel fortælling om restaureringen, ser korte videoer, udforsker før/efter-indhold og løbende får lyst til at følge museets transformation digitalt. På den måde bliver lukkeperioden ikke kun et stop i oplevelsen, men et nyt kontaktpunkt mellem bruger og museum.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Service Blueprint', slug: 'service-blueprint' },
      { label: 'Persona', slug: 'persona-canvas' },
      { label: 'Interview' },
      { label: 'Observation' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Affinity Diagram', slug: 'affinity-diagram' },
      { label: 'How Might We', slug: 'hmw' },
    ],
  },
  'dikw-pyramiden': {
    summary:
      'DIKW-pyramiden er en analyse- og forståelsesmodel, der bruges til at forklare forskellen mellem data, information, viden og visdom. Modellen hjælper med at vise, hvordan rå data først får værdi, når den bliver fortolket, sat i kontekst og brugt til at træffe kvalificerede beslutninger.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'DIKW står for Data, Information, Knowledge og Wisdom. På dansk kan det forstås som data, information, viden og visdom.\n\nModellen er typisk opbygget som en pyramide med fire niveauer:\n\nData: Rå observationer, tal, målinger eller fakta uden fortolkning.\nInformation: Data sat i system eller kontekst, så det begynder at give mening.\nViden: Information fortolket og forstået, så man kan se mønstre, årsager og betydning.\nVisdom: Evnen til at bruge viden til at træffe gode, relevante og ansvarlige beslutninger.\n\nPointen er, at data i sig selv ikke nødvendigvis skaber indsigt. Først når data bearbejdes og forstås, kan den bruges strategisk.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'DIKW-pyramiden bruges traditionelt inden for informationsvidenskab, dataanalyse, strategi, vidensdeling, UX-research og beslutningsprocesser. Den anvendes til at forklare, hvordan organisationer kan gå fra indsamling af data til reel indsigt og handling.\n\nI digital konceptudvikling kan modellen bruges til at analysere brugerdata, researchfund, analytics, surveyresultater eller testdata. Den hjælper med at vurdere, om man bare har samlet data, eller om man faktisk har omsat materialet til viden, der kan bruges i konceptet.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'DIKW-pyramiden giver mening, når man arbejder med data, research eller indsigter og skal forklare, hvordan materialet bliver omsat til beslutninger. Den er særligt relevant, hvis et projekt har mange observationer, tal eller brugerudsagn, men mangler en tydelig analytisk konklusion.\n\nDen kan også bruges til at vise modenheden i en analyse: Er vi stadig på dataniveau, eller har vi faktisk skabt viden?',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at skelne mellem rå data og brugbar indsigt. Den kan gøre det tydeligt, hvorfor det ikke er nok at skrive "vi har lavet interviews" eller "vi har analytics-data". Man skal også vise, hvad dataen betyder, hvilke mønstre den peger på, og hvordan den påvirker de valg, man træffer.\n\nDen hjælper især med at undgå analyse-teater, hvor man har mange tal og citater, men ingen egentlig konklusion. Det er rapportens svar på en skuffe fuld af kabler: der er sikkert noget brugbart, men nogen skal lige finde forbindelsen.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først indsamles data, for eksempel klikrater, surveybesvarelser, interviewcitater eller observationer. Derefter struktureres dataen, så den bliver til information. Det kan være gennem kategorisering, visualisering eller sammenligning.\n\nHerefter fortolkes informationen for at skabe viden. Her ser man efter mønstre, årsager, behov eller problemer. Til sidst bruges denne viden til at træffe beslutninger, formulere strategier eller udvikle løsninger. Det øverste niveau handler derfor ikke bare om at vide noget, men om at bruge det klogt i den konkrete kontekst.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en tydelig forståelse af, hvordan data bliver omsat til indsigt og beslutning. Modellen kan bruges som analyseframework, refleksionsmodel eller som forklaring på, hvordan research og data har informeret et koncept.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'DIKW-pyramiden er stærk, fordi den gør forskellen mellem data og indsigt tydelig. Den hjælper med at kvalificere analysearbejde og viser, at værdi ikke ligger i mængden af data, men i evnen til at forstå og anvende den. Modellen er især nyttig i projekter, hvor man skal argumentere for, hvorfor bestemte design- eller strategivalg er truffet.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at bruge modellen for lineært. I praksis bevæger analysearbejde sig sjældent pænt fra data til visdom i én lige opstigning. Man går ofte frem og tilbage mellem observationer, fortolkning og nye spørgsmål.\n\nEn anden begrænsning er, at modellen kan blive meget abstrakt, hvis den ikke kobles til konkret materiale. Hvis man bare beskriver niveauerne uden at vise egne data, informationer, indsigter og beslutninger, bliver den hurtigt mere teori end analyse.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team arbejder med et digitalt restaureringsunivers for et museum.\n\nPå dataniveau har de interviewcitater, surveybesvarelser og analytics om brugernes digitale adfærd.\nPå informationsniveau organiserer de materialet og ser, at flere brugere efterspørger roligt, visuelt og let tilgængeligt indhold.\nPå vidensniveau fortolker de, at målgruppen ikke kun mangler information om restaureringen, men har behov for en sanselig og nærværende digital oplevelse.\nPå visdomsniveau beslutter de derfor, at konceptet ikke skal være en tung informationsside, men et kurateret digitalt univers med korte videoer, før/efter-nedslag og visuelle fortællinger.\n\nPå den måde viser DIKW-pyramiden, hvordan rå research bliver omsat til en konkret konceptretning.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Affinity Diagram', slug: 'affinity-diagram' },
      { label: 'Tematisk analyse' },
      { label: 'Interview' },
      { label: 'Survey', slug: 'survey-template' },
      { label: 'Analytics review' },
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'How Might We', slug: 'hmw' },
    ],
  },
  brainstorming: {
    summary:
      'Brainstorming er en kreativ idéudviklingsmetode, der bruges til at generere mange idéer på kort tid. Metoden hjælper teams med at åbne mulighedsrummet, udfordre vanetænkning og få flere løsningsforslag frem, før man begynder at vurdere og prioritere.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Brainstorming handler om at skabe et midlertidigt rum, hvor idéer kan udvikles frit uden at blive kritiseret for tidligt. Deltagerne bygger videre på hinandens forslag, kombinerer idéer og undersøger forskellige retninger. Pointen er ikke at finde den perfekte idé med det samme, men at skabe et bredt idéfelt, som senere kan analyseres, sorteres og videreudvikles.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i design thinking, innovation, UX, kommunikation, produktudvikling og konceptudvikling. Den anvendes ofte efter en research- eller analysefase, hvor man har identificeret et problem, en målgruppe eller en mulighed, men endnu ikke har besluttet, hvilken løsning der skal udvikles.\n\nI digital konceptudvikling kan brainstorming bruges til at udvikle funktioner, kampagneidéer, brugerflows, indholdsformater, serviceforbedringer eller alternative konceptretninger.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Brainstorming giver mening, når man har brug for mange mulige løsninger og vil undgå at låse sig fast på den første idé. Den er især relevant i starten af idéudviklingen, hvor målet er at undersøge flere retninger frem for at vælge én løsning for hurtigt.\n\nMetoden fungerer bedst, når der allerede findes en tydelig problemstilling eller et konkret designspørgsmål. Uden retning bliver brainstorming hurtigt til en løs idé-sump, hvor alt lyder muligt, men intet rigtig lander.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at skabe variation, volumen og nye perspektiver. Den kan bruges til at udfordre eksisterende løsninger, finde alternative veje og få flere faglige perspektiver i spil. Brainstorming kan også gøre et team mere åbent for uventede idéer, fordi deltagerne ikke kun arbejder ud fra deres egne første antagelser.\n\nDen hjælper især med at besvare spørgsmål som:\nHvilke løsninger kunne adressere problemet?\nHvordan kan vi skabe mere værdi for brugeren?\nHvilke alternative retninger findes der?\nHvad sker der, hvis vi tænker mindre sikkert og mere undersøgende?',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres en tydelig problemstilling eller et HMW-spørgsmål. Derefter genererer deltagerne idéer individuelt eller i grupper. I den første del af processen udsættes kritik og vurdering, så idéfeltet kan blive bredt nok. Efterfølgende grupperes, diskuteres og prioriteres idéerne ud fra relevans, brugerbehov, realisme og strategisk værdi.\n\nOfte kombineres brainstorming med metoder som Affinity Diagram, dot voting, prioriteringsmatrix eller SCAMPER for at sortere og kvalificere idéerne bagefter.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en samling idéer, muligheder eller konceptretninger, som kan bearbejdes videre. Det kan føre til skitser, prototyper, konceptbeskrivelser, feature-lister eller nye designspørgsmål.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Brainstorming er stærk, fordi den hurtigt kan skabe mange idéer og åbne for flere perspektiver. Den er enkel at bruge, kræver få ressourcer og kan engagere flere personer i udviklingsprocessen. Metoden er især brugbar, når man vil væk fra den mest oplagte løsning og undersøge, hvad der ellers kunne være muligt.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at brainstorming bliver for løs og ukritisk. Mange idéer betyder ikke nødvendigvis gode idéer. Hvis metoden ikke bygger på research eller en klar problemstilling, kan resultatet blive kreativt, men irrelevant.\n\nEn anden faldgrube er gruppedynamik. Nogle deltagere kan dominere, mens andre holder sig tilbage. Derfor kan det ofte være bedre at starte med individuel idéudvikling, før idéerne deles i gruppen. Brainstorming skal åbne muligheder, ikke bare give den mest højlydte idé en krone på hovedet.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team arbejder med et digitalt koncept for et museum under en restaureringsperiode. De har identificeret, at målgruppen ønsker mere sanseligt og visuelt indhold, men ikke gider tunge nyhedsopdateringer.\n\nTeamet formulerer derfor HMW-spørgsmålet: Hvordan kan vi gøre restaureringsprocessen interessant og nærværende for brugere, der ikke kan besøge museet fysisk?\n\nI brainstormingen udvikler de idéer som korte restaureringsvideoer, før/efter-fortællinger, lydspor fra bygningen, interaktive detaljer, materialefortællinger og en digital tidslinje over transformationen. Efterfølgende vurderer de idéerne ud fra brugerbehov, teknisk realisme og hvor godt de passer til museets identitet.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'How Might We', slug: 'hmw' },
      { label: 'SCAMPER', slug: 'scamper' },
      { label: 'Crazy 8s' },
      { label: 'Affinity Diagram', slug: 'affinity-diagram' },
      { label: 'Prioriteringsmatrix' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Prototyping' },
      { label: 'Design Sprint' },
    ],
  },
  pestel: {
    summary:
      'PESTEL er en strategisk analysemetode, der bruges til at undersøge de eksterne faktorer, som kan påvirke en organisation, et marked eller et koncept. Metoden hjælper med at se ud over brugeren og virksomheden selv og i stedet analysere den større omverden, som løsningen skal fungere i.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'PESTEL står for Political, Economic, Social, Technological, Environmental og Legal. På dansk kan det forstås som:\n\nPolitiske forhold: Lovgivning, regulering, støtteordninger, politiske prioriteringer eller offentlige beslutninger.\nØkonomiske forhold: Inflation, købekraft, budgetter, finansiering, priser, markedets økonomiske udvikling.\nSociale forhold: Kultur, livsstil, værdier, demografi, adfærd, normer og målgruppens forventninger.\nTeknologiske forhold: Nye teknologier, digitale platforme, automatisering, AI, data, infrastruktur og teknologiske trends.\nMiljømæssige forhold: Bæredygtighed, klima, ressourceforbrug, miljøkrav og grøn omstilling.\nJuridiske forhold: GDPR, ophavsret, arbejdsmiljø, forbrugerbeskyttelse, kontrakter og andre lovmæssige rammer.\n\nMetoden bruges til at skabe et struktureret overblik over de forhold, man ikke selv kontrollerer, men som stadig kan påvirke projektets succes.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'PESTEL bruges traditionelt i strategi, markedsanalyse, forretningsudvikling, organisationsanalyse og konceptudvikling. Den anvendes ofte tidligt i en proces, når man skal forstå den kontekst, en virksomhed eller løsning opererer i.\n\nI digital konceptudvikling kan PESTEL bruges til at analysere, hvordan teknologi, lovgivning, brugeradfærd, samfundstendenser eller økonomiske forhold kan påvirke et digitalt produkt, en platform, en kampagne eller en service.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'PESTEL giver mening, når man skal forstå eksterne muligheder og risici omkring et koncept. Den er især relevant, hvis projektet påvirkes af samfundsudvikling, teknologi, lovgivning, økonomi eller ændrede brugerforventninger.\n\nMetoden er god i analysefasen, før man træffer større strategiske valg. Den kan også bruges som forarbejde til SWOT, fordi PESTEL ofte identificerer de eksterne muligheder og trusler, som senere kan placeres i SWOT-analysen.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvilke omverdensfaktorer der kan påvirke projektet positivt eller negativt. Den kan vise, om der er teknologiske muligheder, juridiske begrænsninger, sociale trends eller økonomiske barrierer, som teamet skal tage højde for.\n\nPESTEL hjælper især med at undgå, at man udvikler et koncept i en lille intern boble, hvor alt ser muligt ud, indtil virkeligheden banker på døren med lovgivning, budgetter og brugeradfærd i hånden.',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres det marked, den organisation eller det koncept, der skal analyseres. Derefter undersøges hver af de seks PESTEL-kategorier. Her indsamles relevante tendenser, data, rapporter, lovkrav, teknologiske udviklinger eller samfundsmæssige forhold.\n\nNår faktorerne er identificeret, vurderes deres betydning for projektet. Ikke alle faktorer er lige vigtige. Derfor skal man prioritere de forhold, der har størst strategisk relevans. Til sidst omsættes analysen til konkrete indsigter, muligheder, risici eller beslutningspunkter.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et struktureret overblik over de vigtigste eksterne faktorer, der kan påvirke et koncept, marked eller en organisation. Analysen kan bruges som beslutningsgrundlag, risikovurdering, strategisk kontekst eller som input til SWOT, TOWS Matrix, Business Model Canvas eller konceptudvikling.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'PESTEL er stærk, fordi den tvinger teamet til at se bredere end produktet og målgruppen. Den skaber forståelse for den større kontekst og kan afsløre muligheder eller trusler, som ellers nemt overses. Metoden er især nyttig, når man arbejder med strategiske koncepter, digitale løsninger eller organisationer, der påvirkes af samfund, teknologi og lovgivning.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er, at PESTEL bliver en lang liste af generelle trends uden tydelig relevans. Det er ikke nok at skrive "AI er en teknologisk faktor" eller "GDPR er vigtigt". Man skal forklare, hvordan faktoren konkret påvirker projektet.\n\nEn anden begrænsning er, at metoden ikke i sig selv fortæller, hvad man skal gøre. Den skaber overblik, men kræver efterfølgende analyse og prioritering. Derfor bør PESTEL ofte kombineres med SWOT, TOWS Matrix eller strategiske anbefalinger, så den ikke bare bliver en flot omverdens-safari uden destination.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team udvikler et digitalt restaureringsunivers for et museum.\n\nI en PESTEL-analyse kan de undersøge, hvordan politiske forhold som kulturstøtte og offentlige museumsstrategier påvirker projektet. Økonomisk kan de vurdere, om budgetter og sponsorater har betydning for produktionen. Socialt kan de analysere, at målgruppen efterspørger mere sanselige og digitale kulturformater. Teknologisk kan de se på muligheder som korte videoformater, interaktive medier og personalisering. Miljømæssigt kan restaureringen kobles til bevaring og bæredygtig transformation. Juridisk skal de tage højde for ophavsret, samtykke, GDPR og brug af billeder eller video fra bygningen.\n\nPå den måde viser PESTEL, hvilke eksterne faktorer der kan styrke eller begrænse konceptets udvikling.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'SWOT', slug: 'swot-generator' },
      { label: 'TOWS Matrix', slug: 'tows-matrix' },
      { label: "Porter's Five Forces", slug: 'porters-five-forces' },
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Konkurrentanalyse' },
      { label: 'Stakeholder map' },
      { label: 'Trendanalyse' },
      { label: 'Risikomatrix' },
    ],
  },
  'persona-canvas': {
    summary:
      'Persona er en UX- og målgruppemetode, der bruges til at skabe en konkret repræsentation af en vigtig brugergruppe. Metoden hjælper med at gøre målgruppen mere forståelig, så teamet ikke designer til en abstrakt masse, men til en tydelig bruger med behov, motivationer, barrierer og adfærd.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'En persona er en fiktiv, men researchbaseret brugerprofil. Den beskriver typisk brugerens navn, alder, situation, mål, behov, frustrationer, digitale vaner og motivationer. Formålet er ikke at opfinde en tilfældig karakter, men at samle mønstre fra research i en brugbar profil, som kan guide design- og konceptvalg.\n\nEn persona skal derfor forstås som et strategisk arbejdsredskab, ikke som pynt i en rapport. Den skal hjælpe teamet med at stille spørgsmålet: "Ville denne løsning give mening for den bruger, vi faktisk prøver at hjælpe?"',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Personaer bruges traditionelt i UX-design, service design, marketing, kommunikation og konceptudvikling. De anvendes ofte efter brugerresearch, interviews, surveys eller dataanalyse, hvor man har identificeret forskellige brugergrupper eller adfærdsmønstre.\n\nI digital konceptudvikling kan personaer bruges til at udvikle brugerrejser, definere funktioner, prioritere indhold, vælge tone of voice og vurdere, om et koncept matcher målgruppens virkelighed.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Persona giver mening, når man skal forstå og kommunikere en målgruppe på en mere konkret måde. Den er især relevant, hvis projektet har flere mulige brugertyper, eller hvis teamet risikerer at tale for generelt om "brugeren".\n\nMetoden er særligt brugbar tidligt i processen, når man skal skabe fælles forståelse af målgruppen, men den kan også bruges senere som beslutningsfilter, når løsninger skal vurderes.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvem løsningen er til, hvad brugeren forsøger at opnå, hvilke udfordringer brugeren møder, og hvad der motiverer brugeren til at handle. Den kan også gøre det lettere at se, om en idé er relevant for målgruppen, eller om den primært giver mening for afsenderen selv.\n\nPersonaer hjælper især med at svare på spørgsmål som:\nHvem designer vi for?\nHvad har brugeren behov for?\nHvilke barrierer står i vejen?\nHvordan tænker, vælger og handler brugeren?\nHvilken tone og oplevelse vil føles relevant?',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først indsamles viden om målgruppen gennem research, for eksempel interviews, observationer, spørgeskemaer eller analytics. Derefter identificeres mønstre i materialet, såsom fælles behov, frustrationer, motivationer eller adfærd.\n\nPå baggrund af disse mønstre opbygges en eller flere personaer. Hver persona bør repræsentere en tydelig brugergruppe og indeholde information, der er relevant for projektets beslutninger. Til sidst bruges personaen aktivt i konceptudvikling, brugerrejser, prioritering og kommunikation.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er en eller flere brugerprofiler, der samler centrale indsigter om målgruppen. Personaen kan bruges som fælles referencepunkt i teamet og som grundlag for designvalg, indholdsstrategi, brugerrejser, Value Proposition Canvas eller prototyping.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Persona er stærk, fordi den gør brugerindsigter konkrete og nemme at arbejde med. Den hjælper teamet med at holde fokus på målgruppen og kan gøre abstrakte data mere menneskelige. Metoden er især nyttig, når mange interessenter skal forstå, hvem konceptet er rettet mod.\n\nEn god persona fungerer som en lille brugerkompasnål i projektet. Den peger ikke på alle svarene, men den hjælper med at opdage, når løsningen begynder at drive væk fra målgruppen.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at lave personaer uden research. Hvis personaen bygger på gæt, stereotyper eller interne forestillinger, kan den give en falsk følelse af brugerforståelse. En anden faldgrube er at fylde personaen med irrelevante detaljer, som ikke påvirker designbeslutningerne. Brugerens yndlingskaffe er kun vigtig, hvis projektet faktisk handler om kaffe.\n\nEn begrænsning er også, at personaer kan forsimple virkelige mennesker. Derfor bør de ses som arbejdsmodeller, ikke som endelige sandheder. De bør opdateres, hvis ny research viser noget andet.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team udvikler et digitalt restaureringsunivers for et museum. På baggrund af interviews skaber de personaen Sofie, 24 år, som er kulturinteresseret, visuelt orienteret og bruger digitale medier til inspiration i hverdagen. Hun vil gerne følge med i museets udvikling, men mister hurtigt interessen, hvis indholdet bliver for teknisk eller teksttungt.\n\nPersonaen viser, at konceptet bør prioritere korte visuelle fortællinger, roligt tempo, æstetisk udtryk og let adgang til restaureringens detaljer. På den måde bliver personaen et praktisk filter for valg af indhold, format og brugeroplevelse.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Interview' },
      { label: 'Survey', slug: 'survey-template' },
      { label: 'Gallup Kompasrose', slug: 'gallup-kompasrose' },
      { label: 'SMUK-modellen', slug: 'smuk-model' },
      { label: 'Affinity Diagram', slug: 'affinity-diagram' },
    ],
  },
  'pirate-funnel': {
    summary:
      'Pirate Funnel er en vækst- og analysemodel, der bruges til at forstå, hvor brugere kommer ind, hvor de falder fra, og hvor en digital løsning kan optimeres. Modellen bruges især i startups, marketing, UX og produktudvikling, fordi den opdeler brugerens vej fra første kontakt til loyal bruger eller kunde.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Pirate Funnel kaldes også AARRR, fordi den består af fem centrale trin:\n\nAcquisition: Hvordan opdager brugeren løsningen?\nActivation: Får brugeren en god første oplevelse?\nRetention: Kommer brugeren tilbage igen?\nRevenue: Skaber brugeren økonomisk værdi?\nReferral: Anbefaler brugeren løsningen til andre?\n\nModellen kaldes "Pirate Funnel", fordi AARRR lyder som en pirat, der knurrer over en skattekiste. Men selve metoden handler ikke om pirater. Den handler om at finde vækstflaskehalse i brugerrejsen.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Pirate Funnel bruges traditionelt i digital forretningsudvikling, growth hacking, SaaS, e-commerce, apps og platforme. Den bruges til at analysere, hvilke dele af brugerens rejse der fungerer, og hvor der opstår tab af brugere.\n\nI digital konceptudvikling kan modellen bruges til at vurdere, om et koncept ikke bare tiltrækker opmærksomhed, men også skaber engagement, gentagen brug, værdi og anbefalinger.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Pirate Funnel giver mening, når man arbejder med en digital løsning, hvor brugeradfærd kan måles over tid. Den er især relevant, hvis man vil forstå, hvorfor brugere ikke konverterer, ikke vender tilbage eller ikke anbefaler løsningen videre.\n\nMetoden er brugbar både tidligt i konceptudvikling, hvor man skal definere målepunkter, og senere i optimering, hvor man analyserer faktisk brugerdata.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at identificere, hvor i brugerforløbet problemet ligger. Hvis mange opdager løsningen, men få bliver aktive, er problemet måske activation. Hvis mange prøver løsningen én gang, men aldrig vender tilbage, er problemet retention. Hvis brugerne er glade, men ingen deler løsningen, er referral måske svag.\n\nPirate Funnel hjælper derfor med at gøre vækst mere konkret. Den skærer brugerrejsen op i målbare led, så man ikke bare siger "vi skal have flere brugere", men kan spørge: hvor i tragten lækker det?',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres den digitale løsning og dens vigtigste brugerhandlinger. Derefter beskrives hvert AARRR-trin i den konkrete kontekst. For hvert trin vælges relevante målepunkter, for eksempel besøgende, signup-rate, første succesfulde handling, tilbagevendende brugere, betalinger eller delinger.\n\nHerefter analyseres data eller antagelser for at finde de største frafald. Til sidst prioriteres forbedringer, der kan styrke det svageste trin i tragten.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et overblik over brugerens vej fra første kontakt til loyal bruger eller kunde. Modellen kan bruges til at definere KPI\'er, finde friktionspunkter, prioritere optimering og vurdere, hvor et digitalt koncept har størst vækstpotentiale.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Pirate Funnel er stærk, fordi den kobler brugeroplevelse, forretning og måling. Den gør det tydeligt, at succes ikke kun handler om trafik. En løsning kan få mange besøgende og stadig fejle, hvis brugerne ikke forstår værdien, ikke vender tilbage eller ikke konverterer.\n\nMetoden er især nyttig, fordi den hjælper teams med at fokusere på det rigtige problem frem for bare at skrue op for marketinghanen, mens produktet lækker som en digital si.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at reducere hele brugeroplevelsen til tal. Pirate Funnel viser, hvor brugere falder fra, men ikke altid hvorfor. Derfor bør modellen kombineres med kvalitativ research som interviews, brugertest eller surveys.\n\nEn anden faldgrube er at fokusere for meget på acquisition. Mange teams prøver at skaffe flere brugere, selvom det egentlige problem er, at den første oplevelse er uklar, eller at brugerne ikke har grund til at komme tilbage.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et team udvikler en digital metodeplatform til studerende.\n\nPå Acquisition måler de, hvordan studerende opdager platformen gennem undervisere, Google eller delte links.\nPå Activation undersøger de, om brugeren hurtigt finder en relevant metode og forstår værdien.\nPå Retention måler de, om brugeren vender tilbage til samme projekt eller metodebibliotek.\nPå Revenue vurderer de, om brugeren, underviseren eller institutionen kan skabe økonomisk værdi gennem abonnement eller licens.\nPå Referral undersøger de, om brugeren deler platformen med studiegruppen eller anbefaler den til andre hold.\n\nHvis mange besøger platformen, men få gemmer metoder eller opretter projekter, peger Pirate Funnel på, at problemet ikke nødvendigvis er synlighed, men activation.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'Business Model Canvas', slug: 'business-model-canvas' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'A/B/N Test', slug: 'ab-test' },
      { label: 'Analytics review' },
      { label: 'Funnelanalyse' },
      { label: 'KPI-framework' },
      { label: 'Brugerresearch' },
    ],
  },
  'service-blueprint': {
    summary:
      'Service Blueprint er en service design-metode, der bruges til at kortlægge, hvordan en service fungerer bag brugerens oplevelse. Hvor en brugerrejse fokuserer på, hvad brugeren oplever, viser Service Blueprint også de synlige og usynlige processer, medarbejdere, systemer og supportfunktioner, der skal få oplevelsen til at fungere.',
    sections: [
      {
        id: 'what',
        title: 'Hvad er metoden?',
        body: 'Et Service Blueprint visualiserer en service på flere lag. Øverst placeres brugerens handlinger og kontaktpunkter. Under dem vises det, brugeren kan se, for eksempel medarbejdere, interface, kommunikation eller fysiske elementer. Længere nede vises det, brugeren ikke ser, for eksempel interne arbejdsgange, tekniske systemer, data, koordinering og supportprocesser.\n\nModellen arbejder typisk med disse lag:\n\nBrugerhandlinger: Hvad brugeren gør gennem oplevelsen.\nTouchpoints: Hvor brugeren møder servicen, for eksempel website, app, mail, fysisk rum eller personale.\nFrontstage: Det synlige, som brugeren direkte interagerer med.\nBackstage: Det usynlige arbejde, der understøtter oplevelsen.\nSupportprocesser: Systemer, værktøjer, data, samarbejdspartnere eller interne funktioner, der gør servicen mulig.\n\nService Blueprint viser derfor ikke kun oplevelsen, men også maskinrummet bag oplevelsen.',
      },
      {
        id: 'traditional',
        title: 'Traditionel anvendelse',
        body: 'Metoden bruges traditionelt i service design, UX, organisationsudvikling og digital konceptudvikling. Den anvendes især til at forstå, hvordan en service leveres på tværs af mennesker, teknologi, kommunikation og interne processer.\n\nI digitale projekter bruges Service Blueprint til at analysere, hvordan brugerens oplevelse hænger sammen med CMS, data, kundeservice, automatisering, uploadflows, godkendelsesprocesser, notifikationer eller andre systemer bag kulissen.',
      },
      {
        id: 'when',
        title: 'Hvornår giver metoden mening?',
        body: 'Service Blueprint giver mening, når en brugeroplevelse afhænger af flere lag end selve brugerens handlinger. Den er særligt relevant, hvis en service involverer både digitale kontaktpunkter, interne arbejdsgange, medarbejdere, tekniske systemer eller eksterne partnere.\n\nMetoden er mindre relevant, hvis man kun arbejder med en meget simpel statisk side uden bagvedliggende processer. Men så snart noget skal opdateres, leveres, godkendes, koordineres eller vedligeholdes, begynder Service Blueprint at give mening.',
        variant: 'highlight',
      },
      {
        id: 'helps',
        title: 'Hvad hjælper metoden med?',
        body: 'Metoden hjælper med at afklare, hvad der skal ske bag scenen, for at brugerens oplevelse fungerer foran scenen. Den kan vise, hvor der opstår friktion, ventetid, ansvarshuller, tekniske afhængigheder eller uklare processer.\n\nDen hjælper især med at svare på spørgsmål som:\nHvem eller hvad skal understøtte brugerens oplevelse?\nHvilke systemer er nødvendige?\nHvor kan servicen fejle?\nHvilke interne processer påvirker brugeroplevelsen?\nHvilke dele af oplevelsen er synlige eller usynlige for brugeren?',
      },
      {
        id: 'process',
        title: 'Typisk proces',
        body: 'Først defineres den service eller brugerrejse, der skal kortlægges. Ofte tager man udgangspunkt i en eksisterende brugerrejse, fordi den viser brugerens forløb. Derefter tilføjes de bagvedliggende lag: frontstage, backstage og supportprocesser.\n\nFor hvert trin undersøges, hvad brugeren gør, hvad brugeren møder, hvad organisationen skal gøre, og hvilke systemer eller ressourcer der understøtter oplevelsen. Til sidst analyseres blueprintet for at finde svage led, flaskehalse og forbedringsmuligheder.',
      },
      {
        id: 'output',
        title: 'Output',
        body: 'Outputtet er et visuelt kort over hele servicen, både brugerens oplevelse og de bagvedliggende processer. Det kan bruges som grundlag for forbedring af serviceflow, ansvarsfordeling, teknisk udvikling, brugeroplevelse, drift eller implementering af et nyt koncept.',
        variant: 'highlight',
      },
      {
        id: 'strengths',
        title: 'Styrker',
        body: 'Service Blueprint er stærk, fordi den viser sammenhængen mellem brugeroplevelse og organisationens evne til at levere den. Den afslører, at en god brugeroplevelse ikke kun handler om flot interface eller god kommunikation, men også om processer, systemer og ansvar bagved.\n\nMetoden er især nyttig, når man skal gøre et koncept realistisk. Den tvinger teamet til at spørge: "Hvad kræver denne oplevelse faktisk for at fungere?" Det er dér, mange ellers pæne koncepter møder virkelighedens kabelskab.',
      },
      {
        id: 'limitations',
        title: 'Begrænsninger og faldgruber',
        body: 'Den største faldgrube er at lave et Service Blueprint, der bare ligner en lidt mere avanceret brugerrejse. Hvis man kun beskriver brugerens handlinger og følelser, mangler blueprintets vigtigste værdi: de bagvedliggende processer.\n\nEn anden faldgrube er at gøre modellen for detaljeret. Hvis alle små mikrohandlinger, systemer og interne trin skal med, kan blueprintet blive så tungt, at ingen bruger det. Det skal være detaljeret nok til at vise serviceleverancen, men ikke så detaljeret, at det bliver et teknisk monster med post-it-hud.',
        variant: 'caution',
      },
      {
        id: 'example',
        title: 'Eksempel',
        body: 'Et museum udvikler et digitalt restaureringsunivers, hvor brugere kan følge restaureringen gennem korte videoer, før/efter-indhold og visuelle fortællinger.\n\nI brugerens lag kan rejsen være, at brugeren opdager indholdet på sociale medier, klikker ind på websitet, ser en restaureringsvideo og gemmer eller deler indholdet.\n\nI frontstage-laget vises de synlige kontaktpunkter: SoMe-opslag, landingsside, videoafspiller, tekst, billeder og eventuelle notifikationer.\n\nI backstage-laget vises det arbejde, brugeren ikke ser: museets team planlægger indhold, producerer video, udvælger restaureringsnedslag, skriver tekster, kvalitetssikrer materialet og publicerer det.\n\nI supportprocesserne kan der ligge CMS, mediebibliotek, samtykkehåndtering, videohosting, analytics, redaktionel kalender og interne godkendelser.\n\nBlueprintet viser dermed, at konceptet ikke kun er "brugeren ser restaureringsindhold". Det viser også, hvad museet skal kunne organisatorisk og teknisk for at levere oplevelsen løbende.',
        variant: 'example',
      },
    ],
    relatedMethods: [
      { label: 'Customer Journey Map', slug: 'brugerrejse' },
      { label: 'Stakeholder map' },
      { label: 'Value Proposition Canvas', slug: 'value-proposition-canvas' },
      { label: 'Empathy Map', slug: 'empathy-map' },
      { label: 'Interview' },
      { label: 'Observation' },
      { label: 'System map' },
      { label: 'Proceskortlægning' },
    ],
  },
}

function parsePlainTextBody(body: string): MethodPageContent {
  const blocks = body.split(/\n\n+/).filter(Boolean)
  const sections: MethodContentSection[] = []
  let summary: string | undefined

  for (const block of blocks) {
    const lines = block.split('\n')
    const firstLine = lines[0]?.trim() ?? ''
    const rest = lines.slice(1).join('\n').trim()

    if (firstLine === 'Kort beskrivelse' && rest) {
      summary = rest
      continue
    }

    if (firstLine === 'Relaterede metoder') {
      continue
    }

    if (rest) {
      sections.push({
        id: firstLine.toLowerCase().replace(/\s+/g, '-').slice(0, 40),
        title: firstLine,
        body: rest,
      })
    } else if (firstLine && !rest) {
      sections.push({
        id: 'section',
        title: 'Om metoden',
        body: firstLine,
      })
    }
  }

  return { summary, sections }
}

export function getMethodPageContent(method: MethodCatalogEntry): MethodPageContent {
  const structured = METHOD_PAGE_CONTENT[method.slug]
  if (structured) return structured

  const fromTool = method.longSeoContent?.trim()
  if (fromTool) return parsePlainTextBody(fromTool)

  return {
    summary: method.shortDescription,
    sections: [
      {
        id: 'placeholder',
        title: 'Om metoden',
        body: 'Uddybende beskrivelse af metoden kommer snart.',
      },
    ],
  }
}

export function resolveRelatedMethod(
  item: MethodRelatedMethod
): { label: string; slug: string; title: string } | { label: string; slug?: undefined } {
  if (item.slug) {
    const entry = getMethodCatalogEntry(item.slug)
    if (entry) return { label: item.label, slug: item.slug, title: entry.title }
  }
  return { label: item.label }
}
