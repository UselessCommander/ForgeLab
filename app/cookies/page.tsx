import type { Metadata } from 'next'
import Link from 'next/link'
import LegalDocumentLayout from '@/components/LegalDocumentLayout'

export const metadata: Metadata = {
  title: 'Cookiepolitik | ForgeLab',
  description: 'Hvilke cookies ForgeLab bruger, til hvilket formål, og hvordan du styrer samtykke.',
}

const UPDATED = '14. april 2026'

export default function CookiesPage() {
  return (
    <LegalDocumentLayout title="Cookiepolitik" lastUpdated={UPDATED}>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">1. Hvad er cookies?</h2>
        <p>
          Cookies er små tekstfiler, der lagres på din enhed, når du besøger et website. Vi skelner mellem{' '}
          <strong>strengt nødvendige</strong> cookies (kræves for fx login og sikkerhed) og — hvis du giver samtykke —{' '}
          <strong>ikke-nødvendige</strong> cookies (fx til udvidet førsteparts-statistik).
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">2. Hvilke cookies bruger ForgeLab?</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-gray-50/80">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="p-3 font-semibold text-gray-900">Navn / type</th>
                <th className="p-3 font-semibold text-gray-900">Formål</th>
                <th className="p-3 font-semibold text-gray-900">Varighed</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              <tr className="border-b border-gray-100">
                <td className="p-3">
                  Session / auth (fx <code className="text-xs bg-white px-1 rounded">forgelab_session</code>)
                </td>
                <td className="p-3">Holde dig logget sikkert ind (nødvendig)</td>
                <td className="p-3">Session / indtil logout eller udløb</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="p-3">
                  Samtykke (<code className="text-xs bg-white px-1 rounded">forgelab_consent_v1</code>)
                </td>
                <td className="p-3">Huske dit cookievalg (nødvendig for at respektere valget)</td>
                <td className="p-3">Op til 12 måneder (typisk)</td>
              </tr>
              <tr>
                <td className="p-3">Valgfri analytics (førsteparts)</td>
                <td className="p-3">Kun hvis du vælger &quot;Accepter alle&quot; eller slår det til under Indstillinger</td>
                <td className="p-3">Som angivet ved implementering</td>
              </tr>
              <tr>
                <td className="p-3">Valgfri browser-lagring (localStorage m.m.)</td>
                <td className="p-3">
                  Tema, demo-projekter, gæste-værktøjsdata, &quot;Husk mig&quot;, AI-præferencer — kun med samtykke
                </td>
                <td className="p-3">Indtil du ændrer valg eller sletter data</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          Tredjeparts marketing-cookies bør kun tilføjes efter udtrykkeligt samtykke og med opdateret liste her.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">3. Samtykke og trækning tilbage</h2>
        <p>
          Første gang du besøger ForgeLab, vises et cookie-banner. Du kan vælge <strong>Kun nødvendige</strong> eller{' '}
          <strong>Accepter alle</strong>. Du kan til enhver tid ændre præferencer ved at rydde site-data for ForgeLab
          eller — når vi tilbyder det — åbne &quot;Cookie-indstillinger&quot; fra banneret igen (sletning af
          samtykke-cookie får banneret til at vises igen).
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">4. Browser-indstillinger</h2>
        <p>
          Du kan også blokere eller slette cookies i din browser. Bemærk, at strengt nødvendige cookies ofte er
          påkrævet for login og kerne-funktioner.
        </p>
      </section>

      <section className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-gray-900">5. Mere om persondata</h2>
        <p>
          Læs vores{' '}
          <Link href="/privatliv" className="text-amber-700 font-medium hover:underline">
            privatlivspolitik
          </Link>{' '}
          for behandling af personoplysninger ud over cookies.
        </p>
      </section>
    </LegalDocumentLayout>
  )
}
