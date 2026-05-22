'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import ToolLayout from '@/components/ToolLayout'
import { useProjectToolData } from '@/lib/useProjectToolData'
import {
  SEO_PYRAMIDE_LEVELS,
  defaultSeoPyramideData,
  getPyramidLayerGeometry,
  normalizeSeoPyramideData,
  type SeoPyramideData,
} from '@/lib/seo-pyramide-levels'
import styles from './seo-pyramide.module.css'

function autoResizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

function PyramidLevelRow({
  index,
  level,
  value,
  onChange,
}: {
  index: number
  level: (typeof SEO_PYRAMIDE_LEVELS)[number]
  value: string
  onChange: (value: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { widthPercent, heightUnits, clipPath } = getPyramidLayerGeometry(index)
  const isTop = level.id === 'level6'
  const alignmentClass = isTop ? 'justify-end pb-6 md:pb-8 pt-20' : 'justify-center pt-8 pb-5'
  const titleFontSize = isTop ? 'text-sm md:text-lg lg:text-xl' : 'text-sm md:text-xl'
  const inputFontSize = isTop ? 'text-[10px] md:text-xs lg:text-sm' : 'text-xs md:text-sm'

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    autoResizeTextarea(el)
  }, [value])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const onResize = () => autoResizeTextarea(el)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      className={`${styles.pyramidRow} group relative flex flex-col items-center ${alignmentClass}`}
      style={{
        width: `${widthPercent}%`,
        height: `calc(${heightUnits} * var(--pyramid-level-height))`,
        ['--clip' as string]: clipPath,
        ['--layer-color' as string]: level.color,
        ['--layer-border' as string]: level.borderColor,
        ['--content-color' as string]: level.textColor,
      }}
    >
      <div className={`${styles.pyramidLayer} absolute inset-0 z-0`} />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-[2px] bg-white/80" />
      <div
        className={`${styles.pyramidContent} relative z-20 flex w-full flex-col items-center px-4 ${level.textWidth}`}
      >
        <h2
          className={`mb-1.5 select-none text-center font-black uppercase leading-tight tracking-wider ${titleFontSize}`}
        >
          {level.title}
        </h2>
        <textarea
          ref={textareaRef}
          id={level.id}
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            autoResizeTextarea(e.target)
          }}
          className={`${styles.ghostInput} font-medium transition-all focus:placeholder-white/20 ${inputFontSize}`}
          placeholder={level.placeholder}
          rows={1}
        />
      </div>
    </div>
  )
}

function SeoPyramideContent() {
  const [data, setDataState] = useState<SeoPyramideData>(defaultSeoPyramideData)
  const setData = useCallback(
    (next: SeoPyramideData) => setDataState(normalizeSeoPyramideData(next)),
    [],
  )

  useProjectToolData<SeoPyramideData>('seo-pyramide', data, setData)

  const updateLevel = (id: string, value: string) => {
    setData({ ...data, [id]: value })
  }

  return (
    <div className={`${styles.root} w-full bg-transparent`}>
      <main className="mx-auto flex w-full max-w-5xl items-center justify-center bg-transparent py-4 md:py-8">
        <div className={`${styles.pyramidShell} w-full bg-transparent`}>
          <div className="relative z-10 flex w-full min-w-[320px] flex-col items-center gap-[5px] bg-transparent md:min-w-[750px]">
            {SEO_PYRAMIDE_LEVELS.map((level, index) => (
              <PyramidLevelRow
                key={level.id}
                index={index}
                level={level}
                value={data[level.id] ?? ''}
                onChange={(value) => updateLevel(level.id, value)}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SeoPyramidePage() {
  return (
    <ToolLayout
      title="SEO-pyramiden"
      description="Prioritér SEO-arbejdet fra crawlability til featured snippets — bygget som en visuel hierarkipyramide."
      backHref="/dashboard"
      backLabel="Tilbage til Dashboard"
      embedTransparent
    >
      <SeoPyramideContent />
    </ToolLayout>
  )
}
