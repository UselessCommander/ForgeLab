'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Menu, AlertTriangle } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

type ProjectInviteNotification = {
  id: string
  projectId: string
  projectName: string
  role: 'editor' | 'viewer'
  invitedAt: string
  readAt: string | null
  invitedByName: string
}

type ProjectMentionNotification = {
  id: string
  projectId: string
  projectName: string
  sourceType: 'comment' | 'board'
  sourceId: string
  mentionedAt: string
  readAt: string | null
  mentionedByName: string
  mentionText: string
  mentionContext: string
}

type AppTopBarProps = {
  onOpenMobileNav?: () => void
  showOfflineBadge?: boolean
}

export default function AppTopBar({ onOpenMobileNav, showOfflineBadge }: AppTopBarProps) {
  const [username, setUsername] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [inviteNotifications, setInviteNotifications] = useState<ProjectInviteNotification[]>([])
  const [mentionNotifications, setMentionNotifications] = useState<ProjectMentionNotification[]>([])

  useEffect(() => {
    void loadCurrentUser()
    void loadInviteNotifications()
    void loadMentionNotifications()
    const refresh = () => {
      void loadInviteNotifications()
      void loadMentionNotifications()
    }
    const interval = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const loadCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (!res.ok) return
      const payload = await res.json()
      if (typeof payload?.username === 'string' && payload.username.trim()) {
        setUsername(payload.username.trim())
      }
    } catch {
      /* ignore */
    }
  }

  const loadInviteNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/project-invites', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) return
      const payload = await res.json()
      setInviteNotifications(Array.isArray(payload?.items) ? payload.items : [])
    } catch {
      /* ignore */
    }
  }

  const loadMentionNotifications = async () => {
    try {
      const res = await fetch('/api/notifications/project-mentions', { credentials: 'include', cache: 'no-store' })
      if (!res.ok) return
      const payload = await res.json()
      setMentionNotifications(Array.isArray(payload?.items) ? payload.items : [])
    } catch {
      /* ignore */
    }
  }

  const unreadInviteCount = inviteNotifications.filter((p) => !p.readAt).length
  const unreadMentionCount = mentionNotifications.filter((m) => !m.readAt).length
  const unreadNotificationCount = unreadInviteCount + unreadMentionCount

  const markInvitesAsSeen = async (ids?: string[]) => {
    if (unreadInviteCount === 0) return
    try {
      await fetch('/api/notifications/project-invites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ids && ids.length > 0 ? { ids } : { markAll: true }),
      })
      setInviteNotifications((prev) =>
        prev.map((invite) =>
          !invite.readAt && (!ids || ids.length === 0 || ids.includes(invite.id))
            ? { ...invite, readAt: new Date().toISOString() }
            : invite
        )
      )
    } catch {
      /* ignore */
    }
  }

  const markMentionsAsSeen = async (ids?: string[]) => {
    if (unreadMentionCount === 0) return
    try {
      await fetch('/api/notifications/project-mentions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(ids && ids.length > 0 ? { ids } : { markAll: true }),
      })
      setMentionNotifications((prev) =>
        prev.map((mention) =>
          !mention.readAt && (!ids || ids.length === 0 || ids.includes(mention.id))
            ? { ...mention, readAt: new Date().toISOString() }
            : mention
        )
      )
    } catch {
      /* ignore */
    }
  }

  const openNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev
      if (!prev && next) {
        if (unreadInviteCount > 0) void markInvitesAsSeen()
        if (unreadMentionCount > 0) void markMentionsAsSeen()
      }
      return next
    })
  }

  const inviteProjects = [...inviteNotifications].sort(
    (a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime()
  )
  const mentionProjects = [...mentionNotifications].sort(
    (a, b) => new Date(b.mentionedAt).getTime() - new Date(a.mentionedAt).getTime()
  )

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200/60 bg-white/90 px-4 backdrop-blur-xl md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 lg:hidden"
            aria-label="Åbn menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <span className="text-sm font-semibold text-gray-900 truncate lg:hidden">ForgeLab</span>
      </div>

      <div className="flex items-center gap-2">
        {showOfflineBadge && (
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
            <AlertTriangle size={11} strokeWidth={2.5} />
            Demo-tilstand
          </span>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={openNotifications}
            className="relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            aria-label="Notifikationer"
          >
            <Bell size={15} strokeWidth={2.2} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-center text-[9px] font-bold leading-4 text-white">
                {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Notifikationer</p>
                <span className="text-xs text-gray-400">{inviteProjects.length + mentionProjects.length}</span>
              </div>
              <div className="max-h-80 divide-y divide-gray-50 overflow-y-auto">
                {inviteProjects.length === 0 && mentionProjects.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">Ingen notifikationer endnu.</div>
                ) : (
                  <>
                    {mentionProjects.map((mention) => {
                      const isUnread = !mention.readAt
                      const preview = (mention.mentionContext || mention.mentionText || '').trim()
                      return (
                        <Link
                          key={mention.id}
                          href={`/dashboard/projects/${mention.projectId}`}
                          onClick={() => {
                            void markMentionsAsSeen([mention.id])
                            setShowNotifications(false)
                          }}
                          className={`block px-4 py-3 transition-colors ${isUnread ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          <p className="truncate text-sm font-semibold text-gray-900">{mention.projectName}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {mention.mentionedByName} nævnte dig i{' '}
                            {mention.sourceType === 'comment' ? 'en kommentar' : 'board-tekst'}.
                          </p>
                          {preview && <p className="mt-1 truncate text-xs text-gray-400">{preview}</p>}
                        </Link>
                      )
                    })}
                    {inviteProjects.map((project) => {
                      const isUnread = !project.readAt
                      return (
                        <Link
                          key={project.id}
                          href={`/dashboard/projects/${project.projectId}`}
                          onClick={() => {
                            void markInvitesAsSeen([project.id])
                            setShowNotifications(false)
                          }}
                          className={`block px-4 py-3 transition-colors ${isUnread ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-gray-50'}`}
                        >
                          <p className="truncate text-sm font-semibold text-gray-900">{project.projectName}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {project.invitedByName} inviterede dig som{' '}
                            {project.role === 'viewer' ? 'viewer' : 'editor'}.
                          </p>
                        </Link>
                      )
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <Link
          href="/indstillinger"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-bold uppercase text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {username ? username[0] : 'U'}
        </Link>
        <LogoutButton />
      </div>
    </header>
  )
}
