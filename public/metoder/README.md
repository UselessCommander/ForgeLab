# Metodebilleder

Upload billeder til metodesiderne i mappen for den pågældende metode.

## Struktur

```
public/metoder/
  business-model-canvas/
  persona-canvas/
  swot-generator/
  …
```

Hver undermappe matcher metodens **slug** (samme navn som i URL: `/metoder/[slug]`).

## Filnavne (anbefalet)

| Fil | Brug |
|-----|------|
| `hero.png` eller `hero.webp` | Hovedillustration øverst på metodesiden |
| `{sektions-id}.png` | Billede til en bestemt tekstsektion (fx `what.png`, `when.png`) |
| `overview.png` | Valgfrit overbliksbillede |

### Business Model Canvas (Airbnb-case)

Filer som `BMC-Overview.webp`, `BMC-Key-Partnerships.webp` osv. bruges i **Airbnb-eksemplet** under sektionen «Eksempler» — ikke som generelle metodeillustrationer.

Sektions-id findes i `lib/method-content.ts` under `sections[].id` for hver metode.

## Tekniske noter

- Billeder i `public/` kan refereres som `/metoder/[slug]/hero.png` i kode.
- Brug helst **WebP** eller **PNG**; hold filstørrelser rimelige (fx under 500 KB til hero).
- Efter upload skal metodesiden kodes til at vise billederne (kommer i næste skridt).

## Metoder med mappe

ab-test · affinity-diagram · aaker-identity-model · brainstorming · brugerrejse · business-model-canvas · card-sorting · dikw-pyramiden · empathy-map · five-whys · gantt-chart · gallup-kompasrose · hmw · kanban · persona-canvas · pestel · pirate-funnel · porters-five-forces · scamper · service-blueprint · smuk-model · survey-template · swot-generator · tows-matrix · value-proposition-canvas
