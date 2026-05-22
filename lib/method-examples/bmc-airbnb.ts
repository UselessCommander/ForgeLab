import type { MethodCaseStudy } from '@/lib/method-content'
import { BUSINESS_MODEL_CANVAS_IMAGES } from '@/lib/method-images'

const airbnbCanvasAlt = (felt: string) => `Airbnb — ${felt} i Business Model Canvas`

/** Fuldt Airbnb-eksempel til Business Model Canvas — metodesiden under Eksempler */
export const BMC_AIRBNB_CASE_STUDY: MethodCaseStudy = {
  id: 'airbnb',
  title: 'Airbnb',
  overviewImageSrc: BUSINESS_MODEL_CANVAS_IMAGES.overview,
  overviewImageAlt: airbnbCanvasAlt('overblik'),
  intro: `Airbnb er et godt eksempel på Business Model Canvas, fordi virksomheden ikke kun sælger et enkelt produkt. Den driver en digital platform, hvor to forskellige brugergrupper skal skabe værdi for hinanden: værter og gæster. Airbnb beskriver selv sin model som en global platform for ophold, oplevelser og services, hvor markedspladsen forbinder værter og gæster online eller via mobile enheder.

Det gør Airbnb interessant, fordi forretningsmodellen ikke handler om at eje hoteller eller ferieboliger. Den handler om at skabe en infrastruktur, hvor andre kan udbyde boliger, og hvor gæster kan finde, booke og betale for dem. Airbnb skriver også, at virksomheden ikke kontrollerer retten til at bruge boligerne, ikke leverer selve overnatningen, ikke bærer inventory risk og ikke fastsætter priserne. Deres indtægt præsenteres derfor som service fees for at facilitere opholdet.`,
  blocks: [
    {
      id: 'segments',
      title: 'Kundesegmenter',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.customerSegments,
      imageAlt: airbnbCanvasAlt('kundesegmenter'),
      body: `Det første felt i Business Model Canvas handler om, hvem virksomheden skaber værdi for. Hos Airbnb er det særligt vigtigt, fordi virksomheden arbejder med en tosidet markedsplads. Det betyder, at Airbnb har mindst to centrale kundesegmenter: gæster og værter.

Gæsterne er personer, der søger et sted at bo i forbindelse med ferie, arbejde, weekendture, længere ophold eller særlige oplevelser. De kan være solo-rejsende, par, familier, grupper, digitale nomader eller personer, der ønsker et alternativ til klassiske hoteller. Nogle bruger Airbnb, fordi de vil finde noget billigere. Andre bruger det, fordi de ønsker noget mere lokalt, personligt eller anderledes end en standardiseret hoteloplevelse.

Værterne er den anden vigtige målgruppe. Det kan være private personer, der udlejer et værelse, en lejlighed eller et sommerhus. Det kan også være professionelle udlejere, property managers eller virksomheder, der administrerer flere boliger. For Airbnb er værterne ikke bare leverandører. De er også kunder, fordi de bruger platformen til at få adgang til efterspørgsel, betalingssystemer, synlighed og bookingværktøjer.

Det centrale ved Airbnb er derfor, at forretningsmodellen kun fungerer, hvis begge sider oplever værdi. Hvis der ikke er nok gode boliger, kommer gæsterne ikke. Hvis der ikke er nok gæster, gider værterne ikke bruge platformen. Customer Segments-feltet viser dermed, at Airbnb ikke bare skal forstå én målgruppe, men balancere behovene hos både udbud og efterspørgsel.`,
    },
    {
      id: 'value',
      title: 'Værditilbud',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.valueProposition,
      imageAlt: airbnbCanvasAlt('værditilbud'),
      body: `Value Proposition handler om, hvilken værdi virksomheden tilbyder sine kundesegmenter. Hos Airbnb er værditilbuddet forskelligt for gæster og værter.

For gæster er værdien først og fremmest adgang til et stort udvalg af overnatningsmuligheder på tværs af lokationer, priser og boligtyper. Gæsten kan finde alt fra et enkelt værelse til en hel bolig, en hytte, en villa eller et længerevarende ophold. Det giver brugeren fleksibilitet og mulighed for at vælge en oplevelse, der passer bedre til rejsens formål end et almindeligt hotel måske gør.

Derudover tilbyder Airbnb en digital bookingoplevelse, hvor søgning, filtrering, anmeldelser, betaling og kommunikation med værten er samlet ét sted. Det reducerer friktion. Brugeren skal ikke selv finde en privat udlejer, forhandle betaling, vurdere troværdighed fra bunden og koordinere alt manuelt. Platformen pakker kaosset ind i et mere overskueligt flow.

For værter er værdien, at de kan tjene penge på en bolig, et værelse eller en ejendom, som de allerede ejer eller råder over. Airbnb giver dem adgang til en global efterspørgsel uden, at de selv skal bygge en hjemmeside, drive marketing, håndtere betalingsinfrastruktur eller skabe et bookingsystem fra bunden. Platformen tilbyder også værktøjer til kalenderstyring, beskrivelse af boligen, billeder, prissætning, kommunikation og anmeldelser.

Den vigtigste værdi for begge sider er tillid. Gæster skal turde booke hos fremmede, og værter skal turde lukke fremmede ind i deres bolig. Derfor er anmeldelser, profiler, beskeder, betaling, support og beskyttelsesordninger centrale dele af Airbnbs værditilbud. Uden tillid falder hele platformsslottet sammen som vådt pap.`,
    },
    {
      id: 'channels',
      title: 'Kanaler',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.channels,
      imageAlt: airbnbCanvasAlt('kanaler'),
      body: `Channels beskriver, hvordan virksomheden når sine kunder, og hvordan værdien leveres. Hos Airbnb er de vigtigste kanaler digitale.

Den primære kanal er Airbnbs platform, især website og app. Her søger gæster efter boliger, ser billeder, læser beskrivelser, sammenligner priser, kontakter værter, booker ophold og betaler. Det er også her, værter opretter opslag, administrerer kalender, svarer gæster og håndterer bookinger.

Airbnb bruger også indirekte kanaler til at tiltrække brugere. Det kan være søgemaskiner, sociale medier, e-mail, app-notifikationer, referral-programmer, PR, brandkampagner og mund-til-mund-anbefalinger. For en platform som Airbnb er organisk synlighed ekstremt vigtig, fordi mange brugere starter med et behov som “overnatning i Barcelona” eller “sommerhus i Italien” og først derefter vælger platform.

For værter er der også specifikke hosting-kanaler. Airbnb har sider og ressourcer målrettet personer, der overvejer at blive værter, og platformen har support- og community-funktioner omkring hosting. Airbnbs egen hjemmeside viser blandt andet adgang til “Airbnb your home”, “Airbnb your experience” og “Airbnb your service”, hvilket understøtter, at virksomheden kommunikerer til flere typer udbydere på platformen.

Airbnbs channels er derfor ikke bare markedsføringskanaler. De er også selve distributionssystemet. Platformen er både butikken, betalingskassen, kundeservicepunktet og relationen mellem kunde og udbyder.`,
    },
    {
      id: 'relationships',
      title: 'Kunderelationer',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.customerRelationships,
      imageAlt: airbnbCanvasAlt('kunderelationer'),
      body: `Customer Relationships handler om, hvordan virksomheden skaber og vedligeholder relationer til sine kunder. Hos Airbnb er relationen primært digital, selvbetjent og platformbaseret.

For gæster bygger relationen på en kombination af automatiseret service og tillidsskabende elementer. Brugeren kan selv søge, booke og betale uden personlig kontakt med Airbnb. Men samtidig skal brugeren føle, at platformen kan hjælpe, hvis noget går galt. Derfor er kundesupport, anmeldelser, værtsprofiler, beskedsystemer og tryghedsforanstaltninger vigtige dele af relationen.

For værter handler relationen om at gøre det nemt og attraktivt at udbyde sin bolig. Airbnb skal give værten følelsen af kontrol, synlighed og sikkerhed. Værten skal kunne styre kalender, priser, husregler, kommunikation og godkendelse af gæster. Samtidig skal værten opleve, at Airbnb hjælper med tillid, betaling og eventuel konflikthåndtering.

Airbnb tilbyder også beskyttelsesordninger som en del af relationen til værter. I sin finansielle rapportering beskriver Airbnb blandt andet Host Damage Protection og forsikringsdækninger relateret til ansvar ved ophold.

Kunderelationen er derfor ikke varm og personlig på samme måde som hos en lokal rejserådgiver. Den er mere systemisk. Airbnb bygger relationen gennem funktionalitet, tryghed, tilgængelighed og gentagen brug. Jo mere brugeren stoler på platformen, jo mindre behøver Airbnb at forklare sig hver gang.`,
    },
    {
      id: 'revenue',
      title: 'Indtægtsstrømme',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.revenueStreams,
      imageAlt: airbnbCanvasAlt('indtægtsstrømme'),
      body: `Revenue Streams handler om, hvordan virksomheden tjener penge. Hos Airbnb kommer indtægten primært fra service fees i forbindelse med bookinger.

Airbnb skriver, at virksomheden genererer stort set al sin omsætning ved at facilitere gæsteophold i boliger udbudt af værter på platformen. Service fees opkræves som betaling for aktiviteter som platformbrug, kundesupport og betalingsbehandling.

Traditionelt har Airbnb brugt en split-fee-model, hvor både værter og gæster betalte servicegebyrer som en procentdel af bookingbeløbet. I oktober 2025 begyndte virksomheden ifølge egen rapportering at overgå til en single-fee-struktur, hvor kun værten betaler service fee for visse bookinger, mens nogle bookinger stadig kan være under split-fee-modellen.

Det vigtige i BMC-sammenhæng er ikke den præcise procent. Det vigtige er mekanikken: Airbnb tjener penge, når der sker en booking. Det betyder, at forretningsmodellen afhænger af bookingvolumen, tillid, konvertering, udbud af attraktive boliger og evnen til at fastholde både gæster og værter.

Airbnb er derfor ikke en klassisk hotelvirksomhed med værelsesindtægter. Det er en platform, der tager betaling for at facilitere forbindelsen, transaktionen og infrastrukturen mellem to parter.`,
    },
    {
      id: 'resources',
      title: 'Nøgleressourcer',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.keyResources,
      imageAlt: airbnbCanvasAlt('nøgleressourcer'),
      body: `Key Resources handler om de vigtigste ressourcer, virksomheden skal have for at kunne levere sit værditilbud. Hos Airbnb er de vigtigste ressourcer ikke hoteller eller fysiske bygninger. Det er platformen, brandet, netværket og dataen.

Den digitale platform er en kerneressource. Website, app, søgefunktion, bookingsystem, betalingsflow, beskedsystem, kalender, anmeldelser og supportinfrastruktur skal fungere stabilt. Hvis platformen er langsom, utryg eller forvirrende, rammer det både gæster og værter direkte.

En anden central ressource er netværket af værter og gæster. Airbnb bliver mere værdifuld, jo flere relevante værter og gæster der bruger platformen. Det er klassisk netværkseffekt: flere boliger gør platformen mere attraktiv for gæster, og flere gæster gør platformen mere attraktiv for værter.

Brand og tillid er også kritiske ressourcer. Når brugere booker et sted, de ikke har set fysisk, hos en person de ikke kender, er tillid ikke pynt. Det er selve fundamentet. Anmeldelser, verificering, support, betalingssystemer og brandgenkendelse fungerer som tillidsarkitektur.

Endelig er data en vigtig ressource. Airbnb kan bruge data om søgninger, priser, efterspørgsel, lokationer, anmeldelser, sæsonudsving og brugeradfærd til at forbedre platformen og hjælpe både gæster og værter med bedre beslutninger.`,
    },
    {
      id: 'activities',
      title: 'Nøgleaktiviteter',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.keyActivities,
      imageAlt: airbnbCanvasAlt('nøgleaktiviteter'),
      body: `Key Activities handler om, hvilke aktiviteter virksomheden skal være god til for at få forretningsmodellen til at fungere. Hos Airbnb handler det især om drift og udvikling af platformen, vækst af markedspladsen og opbygning af tillid.

En vigtig aktivitet er produktudvikling. Airbnb skal konstant forbedre søgning, booking, onboarding, betaling, sikkerhed, support og brugeroplevelse. Virksomheden beskriver også produktudviklingsomkostninger som udgifter forbundet med udvikling af platformen, nye produkter og forbedring af eksisterende produkter.

En anden vigtig aktivitet er at tiltrække og fastholde både værter og gæster. Det kræver marketing, lokal tilpasning, onboarding, kommunikation og værktøjer, der gør det attraktivt at blive på platformen.

Trust and safety er også en kerneaktivitet. Airbnb skal reducere risikoen for svindel, dårlige oplevelser, falske opslag, utryghed og konflikter. Hvis platformen mister tillid, mister den sin vigtigste valuta.

Derudover skal Airbnb håndtere betalinger, kundeservice og konflikter. Virksomheden beskriver operations- og supportomkostninger som blandt andet personale og tredjepartsudbydere forbundet med support via telefon, e-mail og chat, kundetilfredshed, refunds og host protection-programmer.

Endelig er regulatorisk håndtering en vigtig aktivitet. Airbnb opererer i mange lande og byer, hvor lokale regler, skatter, tilladelser og boligpolitik kan påvirke forretningsmodellen. Det betyder, at juridisk og politisk navigation er en del af maskinrummet.`,
    },
    {
      id: 'partners',
      title: 'Nøglepartnere',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.keyPartnerships,
      imageAlt: airbnbCanvasAlt('nøglepartnere'),
      body: `Key Partners handler om de aktører, virksomheden er afhængig af for at kunne levere sin værdi. Hos Airbnb er den vigtigste partnergruppe værterne. Uden værter er der ingen boliger, og uden boliger er der ingen platform.

Værter fungerer både som leverandører og kunder. De stiller boliger, oplevelser eller services til rådighed, men de bruger samtidig Airbnb som salgskanal, betalingssystem og administrationsværktøj. Det gør partnerrelationen mere kompleks end i en klassisk leverandørkæde.

Betalingsudbydere er også vigtige partnere, fordi betalinger mellem gæster, Airbnb og værter skal fungere sikkert og effektivt. Airbnb håndterer betaling fra gæster og udbetaling til værter efter check-in, hvilket gør betalingsinfrastrukturen central for hele modellen.

Teknologipartnere og hostinginfrastruktur er også relevante. Platformen skal kunne håndtere store mængder trafik, billeder, søgninger, beskeder, betalinger og data. Airbnb nævner blandt andet tredjepartsdatacentre som en del af cost of revenue.

Forsikringspartnere og juridiske partnere spiller også en rolle, især fordi Airbnb skal håndtere risiko, skader, ansvar og lokale regler. Derudover er lokale myndigheder og skatteorganer en indirekte, men vigtig interessentgruppe, fordi regulering og skatter kan påvirke platformens drift.`,
    },
    {
      id: 'cost',
      title: 'Omkostningsstruktur',
      imageSrc: BUSINESS_MODEL_CANVAS_IMAGES.costStructure,
      imageAlt: airbnbCanvasAlt('omkostningsstruktur'),
      body: `Cost Structure handler om, hvilke omkostninger der er nødvendige for at drive forretningsmodellen. Hos Airbnb ligger de største omkostninger ikke i at købe ejendomme, men i teknologi, drift, support, marketing, produktudvikling og regulering.

En central omkostning er drift af platformen. Airbnb beskriver cost of revenue som blandt andet betalingsbehandlingsgebyrer, merchant fees, chargebacks, tredjepartsdatacentre til hosting af platformen samt afskrivning på internt udviklet software og erhvervet teknologi.

Produktudvikling er også en stor omkostning. Platformen skal hele tiden forbedres, både for at øge konvertering, mindske friktion, forbedre sikkerhed og understøtte nye produkter. Det kræver udviklere, designere, datafolk, produktteams og teknisk infrastruktur.

Operations og support er en anden væsentlig omkostning. Airbnb skal kunne hjælpe både gæster og værter, når bookinger går galt, betalinger fejler, boliger ikke lever op til forventninger, eller der opstår konflikter. Den slags support er ikke bare service. Det er en nødvendig omkostning for at bevare tillid.

Sales and marketing er også vigtigt, fordi Airbnb både skal tiltrække nye gæster og nye værter. Platformen skal have nok udbud og nok efterspørgsel på samme tid. Det er den tosidede markedsplads’ evige balancekunst.

Endelig har Airbnb betydelige juridiske og regulatoriske omkostninger. Virksomheden beskriver flere forhold omkring lodging taxes, transactional taxes, withholding tax og regulatoriske sager, som kan påvirke virksomheden økonomisk og operationelt.`,
    },
  ],
  summary: `Airbnbs Business Model Canvas viser en platformforretning, hvor værdien ikke skabes gennem ejerskab af fysiske aktiver, men gennem forbindelsen mellem to brugergrupper. Airbnb ejer ikke nødvendigvis boligerne, men ejer infrastrukturen, relationen, brandet, dataen og transaktionsflowet.

Det stærke ved modellen er skalerbarheden. Når platformen fungerer, kan Airbnb vokse uden at skulle eje hvert nyt overnatningssted. Det gør forretningsmodellen mere fleksibel end en klassisk hotelkæde. Til gengæld er modellen meget afhængig af tillid, regulering, kvalitet og balancen mellem værter og gæster.`,
}
