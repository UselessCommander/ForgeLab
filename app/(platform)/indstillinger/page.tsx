import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import ProfileSettings from '@/components/profile/ProfileSettings'

export const metadata = {
  title: 'Indstillinger | ForgeLab',
  description: 'Profil, tema og kontoindstillinger.',
}

export default async function IndstillingerPage() {
  const userId = await getCurrentUserId()
  if (!userId) redirect('/login')

  return <ProfileSettings embedded />
}
