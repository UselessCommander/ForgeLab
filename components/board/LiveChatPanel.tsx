'use client'

import { memo, useEffect, useRef, useState } from 'react'
import type {
  ChatAttachment,
  ChatReaction,
  LiveChatMessage,
  LiveChatOnlineMember,
} from '@/lib/live-chat-types'

export type LiveChatPanelProps = {
  messages: LiveChatMessage[]
  onlineMembers: LiveChatOnlineMember[]
  canEdit: boolean
  projectId: string
  currentUserId: string | null
  getUserColor: (userId: string) => string
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void | Promise<void>
  onSendReaction: (messageId: string, emoji: string) => void | Promise<void>
}

function LiveChatPanelInner({
  messages,
  onlineMembers,
  canEdit,
  projectId,
  currentUserId,
  getUserColor,
  onSendMessage,
  onSendReaction,
}: LiveChatPanelProps) {
  const [draft, setDraft] = useState('')
  const [uploading, setUploading] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const chatFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = () => {
    const text = draft.trim()
    if (!text) return
    void onSendMessage(text)
    setDraft('')
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !projectId || !canEdit) return
    setUploading(true)
    try {
      const attachments: ChatAttachment[] = []
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append('file', file)
        const res = await fetch(`/api/projects/${projectId}/chat-upload`, { method: 'POST', body: fd })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          alert(err?.error || 'Upload fejlede')
          continue
        }
        const data = (await res.json()) as ChatAttachment
        attachments.push(data)
      }
      if (attachments.length > 0) {
        await onSendMessage('', attachments)
      }
    } finally {
      setUploading(false)
      if (chatFileInputRef.current) chatFileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {onlineMembers.length > 0 && (
        <div
          style={{
            padding: '8px 14px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#FAFBFC',
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#94A3B8',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginRight: 2,
            }}
          >
            Online
          </span>
          {onlineMembers.map(m => {
            const label = m.username || m.email || m.user_id
            const initial = (label || '?').charAt(0).toUpperCase()
            const color = getUserColor(m.user_id)
            return (
              <div
                key={m.user_id}
                title={label}
                style={{
                  position: 'relative',
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: `2px solid ${color}`,
                  background: color,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={label}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  initial
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#22C55E',
                    border: '1.5px solid #fff',
                  }}
                />
              </div>
            )
          })}
        </div>
      )}

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.5 }}>
                Start samtalen her.
                <br />
                Beskeder vises live for alle i projektet.
              </p>
            </div>
          </div>
        ) : (
          messages.map(item => {
            const bubbleColor = item.isMine ? '#4F46E5' : item.color || getUserColor(item.userId)
            const senderInitial = (item.username || '?').charAt(0).toUpperCase()
            return (
              <div
                key={item.id}
                style={{
                  alignSelf: item.isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 2,
                    flexDirection: item.isMine ? 'row-reverse' : 'row',
                    marginLeft: item.isMine ? 0 : 2,
                    marginRight: item.isMine ? 2 : 0,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: bubbleColor,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                      boxShadow: '0 0 0 2px #fff',
                    }}
                  >
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.username}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      senderInitial
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: item.isMine ? '#6366F1' : bubbleColor,
                    }}
                  >
                    {item.username || 'Medlem'}
                  </span>
                </div>
                <div
                  style={{
                    borderRadius: item.isMine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    padding: '8px 12px',
                    background: item.isMine ? '#4F46E5' : '#F1F5F9',
                    color: item.isMine ? '#fff' : '#0F172A',
                    fontSize: 13,
                    lineHeight: 1.45,
                    boxShadow: item.isMine ? `0 2px 8px ${bubbleColor}40` : '0 1px 2px rgba(0,0,0,0.06)',
                    borderLeft: !item.isMine ? `3px solid ${bubbleColor}` : undefined,
                  }}
                  onMouseEnter={e => {
                    const picker = e.currentTarget.querySelector('[data-emoji-picker]') as HTMLElement | null
                    if (picker) {
                      picker.style.opacity = '1'
                      picker.style.maxHeight = '32px'
                    }
                  }}
                  onMouseLeave={e => {
                    const picker = e.currentTarget.querySelector('[data-emoji-picker]') as HTMLElement | null
                    if (picker) {
                      picker.style.opacity = '0'
                      picker.style.maxHeight = '0'
                    }
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'flex-end',
                      gap: 12,
                      marginBottom: item.text ? 2 : 0,
                    }}
                  >
                    <span style={{ fontSize: 10, opacity: 0.65, marginLeft: 'auto' }}>
                      {new Date(item.createdAt).toLocaleTimeString('da-DK', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {item.text ? <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.text}</p> : null}

                  {item.attachments && item.attachments.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        marginTop: item.text ? 6 : 0,
                      }}
                    >
                      {item.attachments.map((att, ai) =>
                        att.isImage ? (
                          <a key={ai} href={att.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={att.url}
                              alt={att.name}
                              style={{
                                maxWidth: '100%',
                                maxHeight: 180,
                                borderRadius: 8,
                                display: 'block',
                                objectFit: 'contain',
                                cursor: 'pointer',
                              }}
                            />
                          </a>
                        ) : (
                          <a
                            key={ai}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 8,
                              border: `1px solid ${item.isMine ? 'rgba(255,255,255,0.25)' : '#E2E8F0'}`,
                              background: item.isMine ? 'rgba(255,255,255,0.12)' : '#fff',
                              textDecoration: 'none',
                              color: item.isMine ? '#fff' : '#334155',
                            }}
                          >
                            <span style={{ fontSize: 16 }}>📎</span>
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {att.name}
                            </span>
                            <span style={{ fontSize: 10, opacity: 0.6, whiteSpace: 'nowrap' }}>
                              {att.size < 1024 * 1024
                                ? `${Math.round(att.size / 1024)} KB`
                                : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                            </span>
                          </a>
                        )
                      )}
                    </div>
                  )}

                  {item.reactions && item.reactions.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {Object.entries(
                        item.reactions.reduce(
                          (acc, reaction) => {
                            if (!acc[reaction.emoji]) acc[reaction.emoji] = []
                            acc[reaction.emoji].push(reaction)
                            return acc
                          },
                          {} as Record<string, ChatReaction[]>
                        )
                      ).map(([emoji, reactions]) => {
                        const hasMyReaction = reactions.some(r => r.userId === currentUserId)
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => void onSendReaction(item.id, emoji)}
                            title={reactions.map(r => r.username).join(', ')}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              padding: '1px 5px',
                              borderRadius: 10,
                              border: hasMyReaction
                                ? '1px solid rgba(255,255,255,0.6)'
                                : '1px solid rgba(0,0,0,0.1)',
                              background: hasMyReaction ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                              color: 'inherit',
                              fontSize: 11,
                              cursor: 'pointer',
                            }}
                          >
                            <span>{emoji}</span>
                            <span style={{ fontSize: 10, fontWeight: 600 }}>{reactions.length}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  <div
                    data-emoji-picker
                    style={{
                      display: 'flex',
                      gap: 1,
                      marginTop: 4,
                      opacity: 0,
                      maxHeight: 0,
                      overflow: 'hidden',
                      transition: 'opacity 0.15s, max-height 0.15s',
                    }}
                  >
                    {['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => void onSendReaction(item.id, emoji)}
                        style={{
                          padding: '2px 3px',
                          borderRadius: 4,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          fontSize: 13,
                          lineHeight: 1,
                        }}
                        title={`Reager med ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={chatScrollRef} />
      </div>

      <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 12px', background: '#fff' }}>
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSubmit()
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder="Skriv en besked..."
            maxLength={800}
            disabled={uploading}
            style={{
              flex: 1,
              minWidth: 0,
              borderRadius: 20,
              border: '1.5px solid #E2E8F0',
              padding: '8px 14px',
              fontSize: 13,
              outline: 'none',
              background: '#F8FAFC',
              color: '#0F172A',
            }}
          />
          <button
            type="button"
            disabled={!canEdit || uploading}
            onClick={() => chatFileInputRef.current?.click()}
            title={canEdit ? 'Vedhæft billede eller fil' : 'Kun redaktører og ejere kan vedhæfte filer'}
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              border: '1.5px solid #E2E8F0',
              borderRadius: '50%',
              background: '#F8FAFC',
              color: '#64748B',
              fontSize: 15,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {uploading ? '⏳' : '📎'}
          </button>
          <button
            type="submit"
            disabled={!draft.trim() || uploading}
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              border: 'none',
              borderRadius: '50%',
              background: draft.trim() && !uploading ? '#4F46E5' : '#E2E8F0',
              color: draft.trim() && !uploading ? '#fff' : '#94A3B8',
              fontSize: 15,
              cursor: draft.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            title="Send"
          >
            ➤
          </button>
          <input
            ref={chatFileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            style={{ display: 'none' }}
            onChange={e => void handleFileUpload(e.target.files)}
          />
        </form>
      </div>
    </div>
  )
}

const LiveChatPanel = memo(LiveChatPanelInner)
export default LiveChatPanel
