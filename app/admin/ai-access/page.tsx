import { redirect } from 'next/navigation'
import { getCurrentUserId } from '@/lib/auth'
import { isAdminUserId } from '@/lib/admin'
import AiAccessAdminClient from './ui-client'

export default async function AdminAiAccessPage() {
  const userId = await getCurrentUserId()
  if (!userId || !(await isAdminUserId(userId))) {
    redirect('/dashboard')
  }

  return <AiAccessAdminClient />
}

