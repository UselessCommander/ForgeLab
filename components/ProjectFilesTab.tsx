'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type ProjectFile = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  uploadedByUserId: string
  downloadUrl: string | null
}

interface ProjectFilesTabProps {
  projectId: string
  canEdit: boolean
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ProjectFilesTab({ projectId, canEdit }: ProjectFilesTabProps) {
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFiles = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: 'GET',
        credentials: 'include',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Kunne ikke hente filer')
      }
      setFiles(Array.isArray(data.files) ? data.files : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ukendt fejl')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadFiles()
  }, [loadFiles])

  const totalBytes = useMemo(() => files.reduce((sum, f) => sum + f.sizeBytes, 0), [files])

  const handleUpload = useCallback(
    async (file: File | null) => {
      if (!file) return
      setError(null)
      if (file.type !== 'application/pdf') {
        setError('Kun PDF-filer er tilladt')
        return
      }

      try {
        setUploading(true)
        const fd = new FormData()
        fd.append('file', file)

        const res = await fetch(`/api/projects/${projectId}/files`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || 'Kunne ikke uploade fil')
        }
        await loadFiles()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ukendt fejl')
      } finally {
        setUploading(false)
      }
    },
    [projectId, loadFiles]
  )

  const handleDelete = useCallback(
    async (fileId: string) => {
      setError(null)
      try {
        const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(data.error || 'Kunne ikke slette fil')
        }
        setFiles((prev) => prev.filter((f) => f.id !== fileId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ukendt fejl')
      }
    },
    [projectId]
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#EEF2F7',
        overflow: 'auto',
        padding: '28px 32px 40px',
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: '0 auto',
          background: '#fff',
          border: '1px solid #E5E7EB',
          borderRadius: 14,
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.06)',
          padding: 20,
          display: 'grid',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#111827' }}>Projektfiler (PDF)</h2>
            <p style={{ margin: '6px 0 0', color: '#6B7280', fontSize: 13 }}>
              {files.length} fil{files.length === 1 ? '' : 'er'} · {formatBytes(totalBytes)}
            </p>
          </div>
          {canEdit && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: uploading ? '#9CA3AF' : '#111827',
                color: '#fff',
                borderRadius: 10,
                padding: '9px 12px',
                fontSize: 13,
                fontWeight: 700,
                cursor: uploading ? 'wait' : 'pointer',
              }}
            >
              {uploading ? 'Uploader...' : '+ Upload PDF'}
              <input
                type="file"
                accept="application/pdf,.pdf"
                disabled={uploading}
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null
                  void handleUpload(selected)
                  e.currentTarget.value = ''
                }}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        {error && (
          <div
            style={{
              border: '1px solid #FECACA',
              background: '#FEF2F2',
              color: '#991B1B',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>Henter filer...</p>
        ) : files.length === 0 ? (
          <div
            style={{
              border: '1px dashed #D1D5DB',
              borderRadius: 12,
              padding: 18,
              color: '#6B7280',
              fontSize: 14,
            }}
          >
            Ingen PDF-filer endnu. Upload jeres første fil for at gemme den på projektet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.filename}
                  </p>
                  <p style={{ margin: '4px 0 0', color: '#6B7280', fontSize: 12 }}>
                    {formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleString('da-DK')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {file.downloadUrl ? (
                    <a
                      href={file.downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        border: '1px solid #D1D5DB',
                        borderRadius: 9,
                        padding: '7px 10px',
                        textDecoration: 'none',
                        color: '#1F2937',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Åbn
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      style={{
                        border: '1px solid #E5E7EB',
                        borderRadius: 9,
                        padding: '7px 10px',
                        color: '#9CA3AF',
                        background: '#F9FAFB',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      Ikke tilgængelig
                    </button>
                  )}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        void handleDelete(file.id)
                      }}
                      style={{
                        border: '1px solid #FECACA',
                        borderRadius: 9,
                        padding: '7px 10px',
                        background: '#FEF2F2',
                        color: '#B91C1C',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Slet
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
