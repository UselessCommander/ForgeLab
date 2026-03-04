import { notFound } from 'next/navigation'
import { getAbTestByMagicSlug } from '@/lib/ab-test'
import AbTestVoteClient from './AbTestVoteClient'

interface PageProps {
  params: Promise<{ magicSlug: string }>
}

export default async function AbTestVotePage({ params }: PageProps) {
  const { magicSlug } = await params
  const data = await getAbTestByMagicSlug(magicSlug)
  if (!data || !data.variants.length) notFound()

  return (
    <div className="min-h-screen bg-[#fafbfc] py-8 px-4">
      <AbTestVoteClient testId={data.test.id} title={data.test.title} variants={data.variants} />
    </div>
  )
}
