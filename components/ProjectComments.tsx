'use client'

import { useState } from 'react'
import { MessageCircle, Reply, Edit2, Trash2, Send, Check, X, MapPin } from 'lucide-react'
import type { ProjectComment } from '@/lib/comments'
import {
  createProjectCommentApi,
  updateProjectCommentApi,
  deleteProjectCommentApi,
  resolveProjectCommentApi,
  unresolveProjectCommentApi,
} from '@/lib/comments-api'

interface ProjectCommentsProps {
  projectId: string
  userId: string
  /** Editors and owners may resolve/unresolve any thread comment (viewers: read-only). */
  canEditProject: boolean
  comments: ProjectComment[]
  onCommentsChange: () => void
}

interface CommentItemProps {
  comment: ProjectComment
  userId: string
  projectId: string
  canEditProject: boolean
  onCommentsChange: () => void
  level?: number
}

function CommentItem({
  comment,
  userId,
  projectId,
  canEditProject,
  onCommentsChange,
  level = 0,
}: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [editContent, setEditContent] = useState(comment.content)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReply = async () => {
    if (!replyContent.trim()) return

    setIsSubmitting(true)
    try {
      await createProjectCommentApi(projectId, replyContent.trim(), {
        parentId: comment.id,
      })
      setReplyContent('')
      setIsReplying(false)
      onCommentsChange()
    } catch (error) {
      console.error('Error creating reply:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return

    setIsSubmitting(true)
    try {
      await updateProjectCommentApi(projectId, comment.id, editContent.trim())
      setIsEditing(false)
      onCommentsChange()
    } catch (error) {
      console.error('Error updating comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Er du sikker på, du vil slette denne kommentar?')) return

    try {
      await deleteProjectCommentApi(projectId, comment.id)
      onCommentsChange()
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  const handleToggleResolve = async () => {
    try {
      if (comment.resolved) {
        await unresolveProjectCommentApi(projectId, comment.id)
      } else {
        await resolveProjectCommentApi(projectId, comment.id)
      }
      onCommentsChange()
    } catch (error) {
      console.error('Error toggling resolve:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('da-DK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="mb-4 group">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user?.username || 'Unknown'}
              </span>
              {comment.position_x !== null && comment.position_y !== null && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>På canvas</span>
                </div>
              )}
              {comment.resolved && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Løst
                </span>
              )}
              <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-400">(redigeret)</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Skriv din kommentar..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Gem
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent(comment.content)
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                  >
                    Annuller
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>

          {(canEditProject || comment.user_id === userId) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canEditProject && (
                <button
                  onClick={handleToggleResolve}
                  className={`p-1 hover:bg-gray-100 rounded ${comment.resolved ? 'text-green-600 hover:text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                  title={comment.resolved ? 'Genåbn kommentar' : 'Løs kommentar'}
                >
                  {comment.resolved ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                </button>
              )}
              {comment.user_id === userId && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Rediger"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Slet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!comment.resolved && (
          <div className="mt-2">
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Svar
            </button>
          </div>
        )}

        {isReplying && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Skriv dit svar..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={isSubmitting || !replyContent.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                Send svar
              </button>
              <button
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Annuller
              </button>
            </div>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                userId={userId}
                projectId={projectId}
                canEditProject={canEditProject}
                onCommentsChange={onCommentsChange}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectComments({
  projectId,
  userId,
  canEditProject,
  comments,
  onCommentsChange,
}: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateComment = async () => {
    if (!newComment.trim()) return

    setIsSubmitting(true)
    try {
      await createProjectCommentApi(projectId, newComment.trim())
      setNewComment('')
      onCommentsChange()
    } catch (error) {
      console.error('Error creating comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Kommentarer ({comments.length})</h3>
      </div>

      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Skriv en kommentar..."
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={handleCreateComment}
            disabled={isSubmitting || !newComment.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Sender...' : 'Send kommentar'}
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Ingen kommentarer endnu. Vær den første til at kommentere!
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="group">
              <CommentItem
                comment={comment}
                userId={userId}
                projectId={projectId}
                canEditProject={canEditProject}
                onCommentsChange={onCommentsChange}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
