import { getCurrentUserId } from '@/lib/auth'
import MarketingShell from '@/components/marketing/MarketingShell'
import AboutPage from '@/components/marketing/about/AboutPage'

export const metadata = {
  title: 'Om ForgeLab | ForgeLab',
  description:
    'ForgeLab er et digitalt arbejdsrum til konceptudvikling — interaktive metoder, struktur og output til rapporter, workshops og præsentationer.',
}

export default async function OmPage() {
  const userId = await getCurrentUserId()

  return (
    <MarketingShell activeHref="/om" userId={userId}>
      <AboutPage />
    </MarketingShell>
  )
}
