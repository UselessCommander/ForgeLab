'use client'

import { useState, useEffect } from 'react'
import { getProjectCommentsWithReplies, createProjectComment, type ProjectComment } from '@/lib/comments'

export default function TestCommentsPage() {
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userId, setUserId] = useState('test-user')
  const [projectId, setProjectId] = useState('test-project-id')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadComments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const commentsData = await getProjectCommentsWithReplies(projectId)
      setComments(commentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateComment = async () => {
    if (!newComment.trim()) return
    
    setIsLoading(true)
    setError(null)
    try {
      await createProjectComment(projectId, userId, newComment.trim())
      setNewComment('')
      await loadComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadComments()
  }, [projectId])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Comments System</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project ID:
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID:
              </label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Comment</h2>
          <div className="space-y-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <button
              onClick={handleCreateComment}
              disabled={isLoading || !newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Comment'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
            <button
              onClick={loadComments}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {isLoading && comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} userId={userId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CommentItem({ comment, userId, level = 0 }: { comment: ProjectComment; userId: string; level?: number }) {
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleReply = async () => {
    if (!replyContent.trim()) return
    
    setIsLoading(true)
    try {
      await createProjectComment(comment.project_id, userId, replyContent.trim(), {
      parentId: comment.id
    })
      setReplyContent('')
      setIsReplying(false)
      // Force page reload to show new reply
      window.location.reload()
    } catch (err) {
      console.error('Error creating reply:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('da-DK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const marginLeft = level > 0 ? `${level * 24}px` : '0'

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm text-gray-900">
                {comment.user?.username || 'Unknown'}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(comment.created_at)}
              </span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-gray-400">(edited)</span>
              )}
            </div>
            <p className="text-gray-800 whitespace-pre-wrap">{comment.content}</p>
          </div>
        </div>
        
        <div className="mt-2">
          <button
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            Reply
          </button>
        </div>

        {isReplying && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Write your reply..."
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleReply}
                disabled={isLoading || !replyContent.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                onClick={() => {
                  setIsReplying(false)
                  setReplyContent('')
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                Cancel
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
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
