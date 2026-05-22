/** Renderer fuld brødtekst med bedre visuel opdeling — ingen tekst fjernes eller forkortes. */

function splitParagraphs(body: string): string[] {
  if (!body.includes('\n\n')) {
    return [body]
  }
  return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
}

function isListBlock(paragraph: string): boolean {
  const lines = paragraph.split('\n').filter((l) => l.trim())
  if (lines.length < 2) return false
  return lines.every((l) => /^[-•—]|\w+:\s/.test(l.trim()) || /^[A-Z]{1,3}\s*[–—-]/.test(l.trim()))
}

function renderListBlock(paragraph: string) {
  const lines = paragraph.split('\n').filter((l) => l.trim())
  return (
    <ul className="my-4 space-y-2 border-l-2 border-gray-200/80 pl-4">
      {lines.map((line, i) => (
        <li key={i} className="text-sm leading-relaxed text-gray-600 md:text-[15px] md:leading-7">
          {line.trim()}
        </li>
      ))}
    </ul>
  )
}

type MethodBodyTextProps = {
  body: string
  className?: string
}

export default function MethodBodyText({ body, className = '' }: MethodBodyTextProps) {
  const paragraphs = splitParagraphs(body)

  return (
    <div className={`method-body-text ${className}`}>
      {paragraphs.map((paragraph, index) => {
        if (isListBlock(paragraph)) {
          return <div key={index}>{renderListBlock(paragraph)}</div>
        }
        const lines = paragraph.split('\n').filter((l) => l.trim())
        if (lines.length > 1 && lines.every((l) => l.length < 120)) {
          return (
            <div key={index} className="my-4 space-y-2">
              {lines.map((line, li) => (
                <p
                  key={li}
                  className="text-sm leading-relaxed text-gray-600 md:text-[15px] md:leading-7"
                >
                  {line}
                </p>
              ))}
            </div>
          )
        }
        return (
          <p
            key={index}
            className="mb-4 text-sm leading-relaxed text-gray-600 last:mb-0 md:text-[15px] md:leading-7"
          >
            {paragraph}
          </p>
        )
      })}
    </div>
  )
}
