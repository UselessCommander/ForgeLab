import type { Metadata } from 'next'
import LegalDocumentLayout from '@/components/LegalDocumentLayout'

export const metadata: Metadata = {
  title: 'Brugervilkår | ForgeLab',
  description: 'Vilkår for brug af ForgeLab som offentlig SaaS — ansvar, immaterielle rettigheder og misbrug.',
}

const UPDATED = '14. april 2026'

export default function VilkarPage() {
  return (
    <LegalDocumentLayout title="Brugervilkår" lastUpdated={UPDATED}>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Aftaleparter og accept</h2>
        <p>
          Ved at oprette konto eller bruge ForgeLab accepterer du disse vilkår. Er du virksomhed, er det den enhed, du
          repræsenterer, der indgår aftalen. Hvis du ikke accepterer vilkårene, må du ikke bruge tjenesten.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">2. Beskrivelse af tjenesten</h2>
        <p>
          ForgeLab leverer digitale værktøjer og relaterede funktioner &quot;som de er&quot; og efter løbende
          udvikling. Funktioner kan ændres, tilføjes eller udgå med rimelig varsel, hvor det er muligt.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">3. Konto, adgang og sikkerhed</h2>
        <p>
          Du er ansvarlig for at opbevare loginoplysninger fortroligt og for al aktivitet på din konto. Underret os
          hurtigst muligt ved mistanke om uautoriseret adgang.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">4. Acceptable use</h2>
        <p>Du må ikke bruge ForgeLab til ulovlige formål, til at krænke tredjemands rettigheder, eller til at:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>forsøge at omgå sikkerhed, rate limits eller adgangskontrol;</li>
          <li>distribuere malware, spamme eller overbelaste systemet;</li>
          <li>indsamle persondata om andre uden gyldigt grundlag.</li>
        </ul>
        <p>Vi kan suspendere eller ophøre adgang ved væsentlige brud.</p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">5. Intellektuelle rettigheder</h2>
        <p>
          ForgeLab og dets branding, software og dokumentation er beskyttet af ophavsret og andre rettigheder. Du
          beholder rettighederne til det indhold, du selv tilfører. Du giver os en begrænset licens til at hoste,
          behandle og vise dit indhold for at levere tjenesten.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">6. Betaling og abonnement</h2>
        <p>
          Betalte planer faktureres via Stripe. Opsigelse, fornyelse og refusion følger de betingelser, der fremgår ved
          køb og i Stripe-flowet. Manglende betaling kan medføre nedsat adgang.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">7. Ansvarsbegrænsning</h2>
        <p>
          I det omfang dansk ret tillader det, er vi ikke ansvarlige for indirekte tab (fx driftstab, tab af data eller
          goodwill). Vi stræber efter høj tilgængelighed men garanterer ikke uafbrudt drift. Du er ansvarlig for egne
          backup-rutiner af kritiske data.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">8. Opsigelse</h2>
        <p>
          Du kan til enhver tid stoppe med at bruge tjenesten og anmode om sletning af konto jf. privatlivspolitikken.
          Vi kan opsige eller ændre tjenesten med varsel, hvor det er rimeligt.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">9. Lovvalg og værneting</h2>
        <p>
          Aftalen er underlagt dansk ret. Eventuelle tvister søges løst i mindelighed; kan det ikke lade sig gøre, er
          værneting domstolene i Danmark (medmindre ufravigelig forbrugerlovgivning andet foreskriver).
        </p>
      </section>
    </LegalDocumentLayout>
  )
}
