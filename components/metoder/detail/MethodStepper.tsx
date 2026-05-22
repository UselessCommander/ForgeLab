import type { MethodAccentTheme, MethodStep } from '@/lib/method-page-ui'
import MethodBodyText from '@/components/metoder/detail/MethodBodyText'

const GENERIC_STEPS: MethodStep[] = [
  {
    title: 'Forbered',
    description: 'Definér formål, scope og de beslutninger, metoden skal understøtte.',
  },
  {
    title: 'Indsaml',
    description: 'Saml relevant viden fra research, data, interviews eller eksisterende dokumentation.',
  },
  {
    title: 'Analysér',
    description: 'Strukturér indsigterne med metodens ramme og dokumentér antagelser tydeligt.',
  },
  {
    title: 'Fortolk',
    description: 'Vurder mønstre, afhængigheder og implikationer for strategi eller design.',
  },
  {
    title: 'Handl',
    description: 'Oversæt konklusioner til konkrete næste skridt i projektet eller organisationen.',
  },
]

type MethodStepperProps = {
  steps: MethodStep[]
  accent: MethodAccentTheme
  /** Fuldt procesafsnit vises stadig i sektionskort — stepperen supplerer visuelt */
  showGenericFallback?: boolean
}

export default function MethodStepper({
  steps,
  accent,
  showGenericFallback = true,
}: MethodStepperProps) {
  const displaySteps = steps.length > 0 ? steps : showGenericFallback ? GENERIC_STEPS : []
  if (displaySteps.length === 0) return null

  const isGeneric = steps.length === 0

  return (
    <section
      id="sadan-bruger-du"
      className="scroll-mt-28 mb-8 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm md:p-6"
    >
      <h2 className="mb-1 text-xs font-extrabold uppercase tracking-wide text-gray-400">
        Sådan bruger du metoden
      </h2>
      {isGeneric && (
        <p className="mb-5 text-xs text-gray-500">
          Typisk arbejdsgang — tilpas trinene til jeres kontekst og det fulde indhold nedenfor.
        </p>
      )}
      {!isGeneric && <div className="mb-5" />}
      <ol className="relative space-y-0">
        {displaySteps.map((step, index) => (
          <li key={`${step.title}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
            {index < displaySteps.length - 1 && (
              <span
                className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200"
                aria-hidden
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                index === 0
                  ? `${accent.stepActive} ${accent.iconText}`
                  : 'border-gray-200 bg-gray-50 text-gray-600'
              }`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-sm font-extrabold text-gray-900">{step.title}</h3>
              <div className="mt-1.5">
                <MethodBodyText body={step.description} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
