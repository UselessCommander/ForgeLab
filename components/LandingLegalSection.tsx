import Link from 'next/link'
import { FileText, Scale, Shield } from 'lucide-react'

/**
 * Kort GDPR-orienteret overblik på forsiden (før login).
 * Fuld dokumentation: /privatliv, /vilkar, /cookies.
 */
export default function LandingLegalSection() {
  return (
    <section className="container mx-auto px-6 py-16 md:py-20 border-t border-gray-200/80" aria-labelledby="legal-heading">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-10">
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Shield className="w-6 h-6" aria-hidden />
          </div>
          <div>
            <h2 id="legal-heading" className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
              Databeskyttelse, cookies og gennemsigtighed
            </h2>
            <p className="text-gray-600 text-sm md:text-base max-w-3xl leading-relaxed">
              ForgeLab er bygget som en offentlig SaaS: vi behandler kun de personoplysninger, der er nødvendige for at
              levere tjenesten, og vi er tydelige om formål, retsgrundlag og opbevaring. Nedenfor får du et kort
              overblik — den fulde privatlivspolitik og cookiepolitik finder du via linkene.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <Scale className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden />
              Retsgrundlag og formål (uddrag)
            </div>
            <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <li>
                <span className="font-medium text-gray-900">Konto og aftale:</span> Når du opretter konto og bruger
                ForgeLab, behandler vi fx e-mail og bruger-ID med{' '}
                <span className="font-medium">udøvelse af kontrakten</span> (GDPR art. 6(1)(b)).
              </li>
              <li>
                <span className="font-medium text-gray-900">Betaling (Pro):</span> Stripe håndterer betalingsdata; vi
                gemmer abonnementsstatus hos os — kontraktopfyldelse og berettiget interesse i fakturering.
              </li>
              <li>
                <span className="font-medium text-gray-900">QR-tracking og analytics:</span> Tekniske hændelser (fx
                scanningstidspunkt) kan logges til drift og statistik — typisk{' '}
                <span className="font-medium">berettiget interesse</span> eller kontraktopfyldelse, afhængigt af
                opsætning; hvor vi bruger ikke-nødvendige cookies, indhentes{' '}
                <span className="font-medium">samtykke</span> (art. 6(1)(a)).
              </li>
              <li>
                <span className="font-medium text-gray-900">AI-funktioner:</span> Når du sender prompts til AI, kan
                indhold behandles af den valgte udbyder under den pågældende aftale — se privatlivspolitikken.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200/90 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
              <FileText className="w-5 h-5 text-amber-600 flex-shrink-0" aria-hidden />
              Opbevaring og dine rettigheder
            </div>
            <ul className="space-y-3 text-sm text-gray-700 leading-relaxed">
              <li>
                <span className="font-medium text-gray-900">Opbevaring:</span> Vi opbevarer data så længe, det er
                nødvendigt for formålet (fx aktiv konto, lovpligtige forpligtelser eller indtil du sletter / trækker
                samtykke tilbage). Konkrete perioder er beskrevet i privatlivspolitikken.
              </li>
              <li>
                <span className="font-medium text-gray-900">Rettigheder:</span> Du har bl.a. ret til indsigt,
                berigtigelse, sletning, begrænsning, dataportabilitet og til at gøre indsigelse — kontakt os via de
                kanaler, der er angivet i privatlivspolitikken.
              </li>
              <li>
                <span className="font-medium text-gray-900">Cookies:</span> Du kan til enhver tid ændre valg via
                cookie-banneret (&quot;Kun nødvendige&quot; / &quot;Accepter alle&quot;) eller læse mere under Cookies.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/privatliv"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-sm font-semibold hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            Privatlivspolitik
          </Link>
          <Link
            href="/vilkar"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-sm font-semibold hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            Brugervilkår
          </Link>
          <Link
            href="/cookies"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-gray-800 text-sm font-semibold hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
          >
            Cookiepolitik
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Juridiske tekster er skrevet som et praktisk udgangspunkt for en dansk SaaS. Ved regulatoriske krav eller
          særlig risiko bør de gennemgås af juridisk rådgiver og tilpasses jeres konkrete databehandleraftaler.
        </p>
      </div>
    </section>
  )
}
