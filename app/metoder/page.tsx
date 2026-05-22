import { getCurrentUserId } from '@/lib/auth'
import MarketingShell from '@/components/marketing/MarketingShell'
import MethodsMarketingPage from '@/components/marketing/methods/MethodsMarketingPage'

export const metadata = {
  title: 'Metoder | ForgeLab',
  description:
    'Interaktive metoder og frameworks til konceptudvikling, UX, strategi, research og marketing — samlet i ForgeLab.',
}

export default async function MetoderMarketingPage() {
  const userId = await getCurrentUserId()

  return (
    <MarketingShell activeHref="/metoder" userId={userId}>
      <MethodsMarketingPage />
    </MarketingShell>
  )
}
