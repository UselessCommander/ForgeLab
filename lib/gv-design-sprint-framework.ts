import type { GoogleDesignSprintPhase } from '@/lib/frameworks'
import { getMethodPageHref } from '@/lib/method-catalog'
import { getVaerktoejBySlug } from '@/lib/vaerktoejer-data'

export type FrameworkActivityType = 'guide' | 'tool' | 'decision' | 'workshop' | 'test'

export type FrameworkActivity = {
  id: string
  title: string
  description: string
  linkedToolIds?: string[]
  isInteractiveTool?: boolean
  activityType: FrameworkActivityType
}

export type FrameworkDay = {
  /** Matcher GoogleDesignSprintPhase for bagudkompatibilitet. */
  id: GoogleDesignSprintPhase
  title: string
  dayLabel: string
  goal: string
  activities: FrameworkActivity[]
}

export type GvDesignSprintFramework = {
  id: 'gv-design-sprint'
  title: string
  description: string
  days: FrameworkDay[]
  followUp?: {
    title: string
    description: string
    note: string
    optionalToolIds: string[]
  }
}

const ACTIVITY_TYPE_LABELS: Record<FrameworkActivityType, string> = {
  guide: 'Guide',
  tool: 'Værktøj',
  decision: 'Beslutning',
  workshop: 'Workshop',
  test: 'Test',
}

export function getFrameworkActivityTypeLabel(type: FrameworkActivityType): string {
  return ACTIVITY_TYPE_LABELS[type]
}

export const GV_DESIGN_SPRINT_FRAMEWORK: GvDesignSprintFramework = {
  id: 'gv-design-sprint',
  title: 'GV Design Sprint',
  description:
    'GV Design Sprint er et femdages innovationsforløb, hvor et team afklarer et problem, udvikler løsningsforslag, vælger en retning, bygger en realistisk prototype og tester den med fem brugere. Frameworket består af både metoder, workshopøvelser og beslutningspunkter. Ikke alle trin kræver et digitalt værktøj.',
  days: [
    {
      id: 'understand',
      title: 'Map',
      dayLabel: 'Mandag',
      goal: 'Forstå problemet, sætte retning og vælge et konkret fokus for sprinten.',
      activities: [
        {
          id: 'start-at-the-end',
          title: 'Start at the end',
          description:
            'Sæt et langsigtet mål for projektet og definer, hvad sprinten skal hjælpe med at afklare.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'sprint-questions',
          title: 'Sprint questions',
          description:
            'Formuler de vigtigste usikkerheder som spørgsmål, sprinten skal forsøge at besvare.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'map',
          title: 'Map',
          description:
            'Kortlæg brugerens rejse eller den centrale proces fra start til slut, så teamet får et fælles billede af problemet.',
          activityType: 'tool',
          linkedToolIds: ['brugerrejse'],
          isInteractiveTool: true,
        },
        {
          id: 'ask-the-experts',
          title: 'Ask the experts / Expert interviews',
          description:
            'Interview interne eller eksterne eksperter for at få viden, risici og indsigter frem.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'hmw',
          title: 'How Might We',
          description:
            'Omsæt vigtige indsigter og problemer til HMW-spørgsmål, der kan bruges som mulighedsrum.',
          activityType: 'tool',
          linkedToolIds: ['hmw'],
          isInteractiveTool: true,
        },
        {
          id: 'target',
          title: 'Target',
          description:
            'Afslut dagen med at beslutningstageren vælger én specifik målgruppe og ét kritisk øjeblik på kortet, som resten af sprinten skal fokusere på.',
          activityType: 'decision',
          isInteractiveTool: false,
        },
      ],
    },
    {
      id: 'sketch',
      title: 'Sketch',
      dayLabel: 'Tirsdag',
      goal: 'Udvikle individuelle løsningsforslag uden gruppetænkning.',
      activities: [
        {
          id: 'lightning-demos',
          title: 'Lightning demos',
          description:
            'Find inspiration fra eksisterende løsninger, konkurrenter eller andre brancher, og noter konkrete idéer teamet kan lære af.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'notes',
          title: 'Notes',
          description:
            'Brug cirka 20 minutter på at samle noter fra mandagens materiale, kortet, HMW-spørgsmål og lightning demos.',
          activityType: 'guide',
          isInteractiveTool: false,
        },
        {
          id: 'ideas-doodles',
          title: 'Ideas / Doodles',
          description:
            'Brug cirka 20 minutter på grove idéer, skitser og mulige retninger uden krav om færdige løsninger.',
          activityType: 'guide',
          isInteractiveTool: false,
        },
        {
          id: 'crazy-8s',
          title: "Crazy 8's",
          description:
            'Skitser otte hurtige variationer af en idé på kort tid for at udforske flere løsningsretninger.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'solution-sketch',
          title: 'Solution sketch',
          description:
            'Lav en selvforklarende løsningsskitse, der viser en mulig løsning i få trin. Skitsen skal kunne vurderes uden mundtlig forklaring.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
      ],
    },
    {
      id: 'decide',
      title: 'Decide',
      dayLabel: 'Onsdag',
      goal: 'Vælge den stærkeste løsning og gøre den klar til prototype.',
      activities: [
        {
          id: 'art-museum',
          title: 'Art Museum',
          description: 'Hæng alle solution sketches op, så teamet kan gennemgå dem anonymt og samlet.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'heat-map-voting',
          title: 'Heat map voting',
          description: 'Teamet markerer de mest interessante dele af skitserne uden diskussion.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'speed-critique',
          title: 'Speed critique',
          description: 'Gennemgå hver skitse hurtigt, diskuter styrker, spørgsmål og vigtige detaljer.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'straw-poll',
          title: 'Straw poll',
          description: 'Teamet stemmer på den løsning, de mener har størst potentiale.',
          activityType: 'decision',
          isInteractiveTool: false,
        },
        {
          id: 'supervote',
          title: 'Supervote',
          description:
            'Beslutningstageren vælger den løsning eller de dele, der skal arbejdes videre med.',
          activityType: 'decision',
          isInteractiveTool: false,
        },
        {
          id: 'rumble-decision',
          title: 'Rumble decision',
          description:
            'Vurder om de vindende idéer kan samles i én prototype, eller om sprintet skal teste 2–3 konkurrerende prototyper mod hinanden.',
          activityType: 'decision',
          isInteractiveTool: false,
        },
        {
          id: 'storyboard',
          title: 'Storyboard',
          description:
            'Lav et trin-for-trin storyboard, der viser præcis, hvad prototypen skal indeholde, og hvordan brugeren møder løsningen.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
      ],
    },
    {
      id: 'prototype',
      title: 'Prototype',
      dayLabel: 'Torsdag',
      goal: 'Bygge en realistisk facade, der er god nok til at teste med brugere fredag.',
      activities: [
        {
          id: 'build-prototype',
          title: 'Build prototype',
          description:
            'Byg en realistisk prototype baseret på storyboardet. Det kan være en klikbar mockup, landing page, Keynote-præsentation, service flow eller anden facade.',
          activityType: 'tool',
          linkedToolIds: ['templates', 'workspaces'],
          isInteractiveTool: false,
        },
        {
          id: 'assign-prototype-roles',
          title: 'Assign prototype roles',
          description:
            'Fordel arbejdet, fx maker, stitcher, writer, asset collector og interviewer, så prototypen kan bygges hurtigt.',
          activityType: 'workshop',
          isInteractiveTool: false,
        },
        {
          id: 'trial-run',
          title: 'Trial run',
          description:
            'Omkring kl. 15 gennemgår teamet hele prototypen for at finde fejl, sikre sammenhæng og tjekke at den matcher storyboardet.',
          activityType: 'test',
          isInteractiveTool: false,
        },
      ],
    },
    {
      id: 'test',
      title: 'Test',
      dayLabel: 'Fredag',
      goal: 'Teste prototypen kvalitativt med fem brugere og finde mønstre i deres reaktioner.',
      activities: [
        {
          id: 'five-act-interview',
          title: 'Five-Act Interview',
          description:
            'Gennemfør brugerinterviews efter en fast struktur: velkomst, kontekstspørgsmål, introduktion til prototypen, opgaver/interaktion og afsluttende spørgsmål.',
          activityType: 'test',
          isInteractiveTool: false,
        },
        {
          id: 'five-user-interviews',
          title: '5 user interviews',
          description:
            'Test prototypen med fem brugere én ad gangen. Formålet er at finde kvalitative mønstre, ikke statistisk signifikans — small data / qualitative learning.',
          activityType: 'test',
          isInteractiveTool: false,
        },
        {
          id: 'watch-together',
          title: 'Watch together, learn together',
          description:
            'Resten af teamet ser med, tager noter og leder efter mønstre, mens intervieweren taler med brugeren.',
          activityType: 'test',
          isInteractiveTool: false,
        },
        {
          id: 'learn',
          title: 'Learn',
          description:
            'Saml læring fra interviewene, find mønstre og vurder, om sprint-spørgsmålene er blevet besvaret.',
          activityType: 'test',
          isInteractiveTool: false,
        },
      ],
    },
  ],
  followUp: {
    title: 'After sprint / follow-up validation',
    description:
      'Efter sprinten kan I supplere med kvantitative eller strukturerede metoder — men de er ikke en del af den klassiske GV fredag.',
    note: 'Small data / qualitative learning er kernen i fredagens interviews. Survey og A/B-test bruges bedst som opfølgning.',
    optionalToolIds: ['survey-template', 'ab-test', 'affinity-diagram'],
  },
}

export function getGvDesignSprintDay(phase: GoogleDesignSprintPhase): FrameworkDay | undefined {
  return GV_DESIGN_SPRINT_FRAMEWORK.days.find((d) => d.id === phase)
}

export function getGvDesignSprintDays(): FrameworkDay[] {
  return GV_DESIGN_SPRINT_FRAMEWORK.days
}

/** Alle ForgeLab-tool-slugs linket til en given sprintdag (unikke). */
export function getLinkedToolSlugsForSprintDay(phase: GoogleDesignSprintPhase): string[] {
  const day = getGvDesignSprintDay(phase)
  if (!day) return []
  const slugs = new Set<string>()
  for (const activity of day.activities) {
    for (const id of activity.linkedToolIds ?? []) {
      if (id === 'templates' || id === 'workspaces') continue
      slugs.add(id)
    }
  }
  return Array.from(slugs)
}

export function methodSlugLinkedInSprintDay(slug: string, phase: GoogleDesignSprintPhase): boolean {
  return getLinkedToolSlugsForSprintDay(phase).includes(slug)
}

export type ResolvedLinkedTool = {
  id: string
  title: string
  href: string
  isMethod: boolean
  exists: boolean
}

export function resolveLinkedTools(ids: string[] | undefined): ResolvedLinkedTool[] {
  if (!ids?.length) return []
  return ids.map((id) => {
    if (id === 'templates') {
      return {
        id,
        title: 'Templates',
        href: '/templates',
        isMethod: false,
        exists: true,
      }
    }
    if (id === 'workspaces') {
      return {
        id,
        title: 'Workspaces',
        href: '/workspaces',
        isMethod: false,
        exists: true,
      }
    }
    const tool = getVaerktoejBySlug(id)
    return {
      id,
      title: tool?.title ?? id,
      href: getMethodPageHref(id),
      isMethod: true,
      exists: !!tool,
    }
  })
}
