import { getCurrentUserId } from '@/lib/auth'
import MarketingShell from '@/components/marketing/MarketingShell'
import DemoPage from '@/components/marketing/demo/DemoPage'

export const metadata = {
  title: 'Demo | ForgeLab',
  description:
    'Se hvordan ForgeLab fungerer — boards, metoder, research, AI-sparring og rapportklar output i ét projekt.',
}

export default async function DemoMarketingPage() {
  const userId = await getCurrentUserId()

  return (
    <MarketingShell activeHref="/demo" userId={userId}>
      <div className="bg-[#fffbeb]">
        <DemoPage />
      </div>
    </MarketingShell>
  )
}
