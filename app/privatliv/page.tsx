import type { Metadata } from 'next'
import Link from 'next/link'
import LegalDocumentLayout from '@/components/LegalDocumentLayout'

export const metadata: Metadata = {
  title: 'Privatlivspolitik | ForgeLab',
  description: 'Sådan behandler ForgeLab personoplysninger — formål, retsgrundlag, opbevaring og dine rettigheder.',
}

const UPDATED = '14. april 2026'

export default function PrivatlivPage() {
  return (
    <LegalDocumentLayout title="Privatlivspolitik" lastUpdated={UPDATED}>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Introduktion</h2>
        <p>
          Denne privatlivspolitik beskriver, hvordan ForgeLab (&quot;vi&quot;, &quot;os&quot;) behandler
          personoplysninger, når du besøger vores website, opretter konto, bruger værktøjer og — hvis relevant —
          køber abonnement. ForgeLab drives som en digital værktøjssuite (SaaS) med fokus på danske og europæiske
          brugere.
        </p>
        <p>
          <strong>Dataansvarlig:</strong> den juridiske enhed, der står bag ForgeLab (operatør). For henvendelser om
          persondata: brug den kontaktvej, der er angivet på websitet eller i din profil efter login. Har du ikke
          konto, kan du skrive til den e-mail, der fremgår af jeres officielle kontaktoplysninger (fx på forsiden /
          virksomhedsregistrering).
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">2. Hvilke oplysninger vi behandler</h2>
        <p>Afhængigt af hvordan du bruger ForgeLab, kan vi behandle:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Konto:</strong> fx brugernavn/e-mail, krypteret adgangskode, unikt bruger-ID, tidsstempler for
            oprettelse og seneste login.
          </li>
          <li>
            <strong>Projekter og indhold:</strong> data, du gemmer i projekter og værktøjer (fx tavler, tekst, svar i
            undersøgelser, QR-indstillinger), herunder metadata som opdateringstidspunkt.
          </li>
          <li>
            <strong>Drift og sikkerhed:</strong> tekniske logs (fx fejl, IP i begrænset omfang hvor det er påkrævet til
            sikkerhed eller misbrugsforebyggelse), sessionscookies til login.
          </li>
          <li>
            <strong>QR- og sporingsdata:</strong> hvis du bruger sporingsfunktioner, kan der registreres hændelser som
            scanningstidspunkt og tekniske metadata (fx user agent), i det omfang det er nødvendigt for funktionen.
          </li>
          <li>
            <strong>Betaling:</strong> ved køb af betalte planer behandler betalingsudbyder (Stripe) betalingsoplysninger
            efter deres vilkår. Vi kan gemme abonnementsstatus, Stripe-kunde-ID og relaterede felter hos os.
          </li>
          <li>
            <strong>AI-funktioner:</strong> prompts og kontekst, du sender til AI, kan behandles af den valgte
            model-udbyder for at generere svar. Indhold bør ikke indeholde særlige kategorier af persondata, medmindre
            du har et selvstændigt grundlag for det.
          </li>
          <li>
            <strong>E-mail:</strong> hvis vi sender transaktionsmails (fx bekræftelse), behandles modtager og
            relevante metadata hos e-mail-leverandør (fx Resend), jf. databehandleraftale.
          </li>
        </ul>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">3. Formål og retsgrundlag (GDPR art. 6)</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50/80">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-3 font-semibold text-gray-900">Formål</th>
                <th className="p-3 font-semibold text-gray-900">Typisk retsgrundlag</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="p-3">Levere og administrere din konto og projekter</td>
                <td className="p-3">Kontraktopfyldelse (6(1)(b))</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Fakturering og abonnement (Pro)</td>
                <td className="p-3">Kontraktopfyldelse / retlig forpligtelse (6(1)(b)/(c))</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Sikkerhed, misbrugsforebyggelse, fejlretning</td>
                <td className="p-3">Berettiget interesse (6(1)(f)) — afbalanceret mod dine interesser</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">Produktforbedring og aggregeret statistik (førsteparts)</td>
                <td className="p-3">Berettiget interesse og/eller samtykke til cookies (6(1)(f) / 6(1)(a))</td>
              </tr>
              <tr>
                <td className="p-3">Marketing (hvis I tilføjer det senere)</td>
                <td className="p-3">Samtykke (6(1)(a))</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">4. Opbevaring og sletning</h2>
        <p>
          Vi opbevarer personoplysninger, så længe det er nødvendigt for de formål, de er indsamlet til: fx så længe din
          konto er aktiv, i en rimelig periode derefter (backup/økonomi), eller længere hvis lovgivningen kræver det.
          Indhold i projekter slettes eller anonymiseres i overensstemmelse med jeres produktindstillinger og
          databehandleraftaler.
        </p>
        <p>
          <strong>Sletning af konto:</strong> Når du anmoder om sletning, sletter eller anonymiserer vi persondata,
          medmindre vi er forpligtet til at opbevare visse oplysninger (fx bogføringsmateriale).
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">5. Modtagere og overførsler</h2>
        <p>
          Vi kan bruge databehandlere, der hjælper os med hosting, database, e-mail, betaling og AI. De må kun behandle
          data efter instruks og under passende sikkerhedsforanstaltninger. Hvis data overføres uden for EU/EØS, sker
          det på grundlag af EU-Kommissionens standardkontraktbestemmelser eller andet gyldigt overførselsgrundlag.
        </p>
        <p>Eksempler på kategorier af leverandører: database/hosting (fx Supabase), betaling (Stripe), e-mail (Resend).</p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">6. Dine rettigheder</h2>
        <p>Under GDPR har du bl.a. følgende rettigheder (med forbehold for undtagelser i loven):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Ret til indsigt i de oplysninger, vi behandler om dig</li>
          <li>Ret til berigtigelse af urigtige oplysninger</li>
          <li>Ret til sletning (&quot;retten til at blive glemt&quot;)</li>
          <li>Ret til begrænsning af behandling</li>
          <li>Ret til dataportabilitet (hvor behandlingen er baseret på kontrakt og er automatiseret)</li>
          <li>Ret til at trække samtykke tilbage (hvor behandlingen er baseret på samtykke)</li>
          <li>Ret til at gøre indsigelse mod behandling, der er baseret på berettiget interesse</li>
        </ul>
        <p>Du kan også klage til Datatilsynet (www.datatilsynet.dk).</p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">7. Cookies</h2>
        <p>
          Vi bruger cookies og tilsvarende teknologier i overensstemmelse med cookiebekendtgørelsen og GDPR. Læs mere i{' '}
          <Link href="/cookies" className="text-amber-700 font-medium hover:underline">
            cookiepolitikken
          </Link>
          , og styr valg via cookie-banneret på websitet.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">8. Ændringer</h2>
        <p>
          Vi kan opdatere denne politik ved ændringer i produktet eller lovgivningen. Datoen øverst viser seneste
          revision. Ved væsentlige ændringer bør I give brugerne besked (fx e-mail eller banner efter login).
        </p>
      </section>
    </LegalDocumentLayout>
  )
}
