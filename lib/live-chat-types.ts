export type ChatReaction = {
  emoji: string
  userId: string
  username: string
  createdAt: number
}

export type ChatAttachment = {
  url: string
  name: string
  size: number
  mime: string
  isImage: boolean
}

export type LiveChatMessagePayload = {
  id: string
  userId: string
  username: string
  avatarUrl?: string | null
  color?: string
  text: string
  createdAt: number
  reactions?: ChatReaction[]
  attachments?: ChatAttachment[]
}

export type LiveChatMessage = LiveChatMessagePayload & {
  isMine: boolean
}

export type LiveChatOnlineMember = {
  user_id: string
  username?: string
  email?: string | null
  avatar_url?: string | null
}
