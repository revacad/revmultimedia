'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AdminLabel, adminFieldClassName } from '@/components/admin/AdminFormPrimitives'
import { deleteResource, getAdminResourceUrl, uploadResource } from '@/actions/resources'
import { formatFileSize } from '@/lib/apply/upload'
import { formatDate } from '@/lib/utils'

export type ResourceListRow = {
  id: string
  title: string
  description: string | null
  file_name: string
  file_type: 'pdf' | 'image'
  file_size: number | null
  visibility: 'all_students' | 'course_specific' | 'intake_specific'
  created_at: string
  courses: { title: string } | null
  intakes: { name: string } | null
  admins: { full_name: string } | null
}

type CourseOption = { id: string; title: string }
type IntakeOption = { id: string; name: string; course_id: string }

interface ResourcesPageClientProps {
  resources: ResourceListRow[]
  courses: CourseOption[]
  intakes: IntakeOption[]
}

type FileFilter = 'all' | 'pdf' | 'image'

function visibilityLabel(v: ResourceListRow['visibility']): string {
  if (v === 'all_students') return 'All students'
  if (v === 'course_specific') return 'Course-specific'
  return 'Intake-specific'
}

function FileTypeIcon({ type }: { type: 'pdf' | 'image' }) {
  if (type === 'pdf') {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FEF2F2] text-[#DC2626]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      </div>
    )
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EBF9F8] text-[#1E9990]">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </div>
  )
}

function fileTypeFromMime(mime: string): 'pdf' | 'image' | null {
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  return null
}

export default function ResourcesPageClient({
  resources,
  courses,
  intakes,
}: ResourcesPageClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<FileFilter>('all')
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState<ResourceListRow['visibility']>('all_students')
  const [courseId, setCourseId] = useState('')
  const [intakeId, setIntakeId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [viewPending, startViewTransition] = useTransition()

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (filter === 'pdf' && r.file_type !== 'pdf') return false
      if (filter === 'image' && r.file_type !== 'image') return false
      if (search.trim()) {
        return r.title.toLowerCase().includes(search.trim().toLowerCase())
      }
      return true
    })
  }, [resources, filter, search])

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }
    if (!selectedFile) {
      setError('Select a file to upload')
      return
    }
    const fileType = fileTypeFromMime(selectedFile.type)
    if (!fileType) {
      setError('File must be PDF or image (JPEG, PNG, WebP)')
      return
    }
    if (visibility === 'course_specific' && !courseId) {
      setError('Select a course')
      return
    }
    if (visibility === 'intake_specific' && !intakeId) {
      setError('Select an intake')
      return
    }

    startTransition(async () => {
      try {
        const presignRes = await fetch('/api/r2/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            fileSize: selectedFile.size,
            uploadContext: 'resource',
          }),
        })
        if (!presignRes.ok) {
          const data = (await presignRes.json().catch(() => ({}))) as { error?: string }
          setError(data.error ?? 'Failed to prepare upload')
          return
        }
        const { presignedUrl, key } = (await presignRes.json()) as {
          presignedUrl: string
          key: string
        }

        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: { 'Content-Type': selectedFile.type },
        })
        if (!uploadRes.ok) {
          setError('Upload to storage failed')
          return
        }

        const result = await uploadResource({
          title: title.trim(),
          description: description.trim() || undefined,
          r2Key: key,
          fileName: selectedFile.name,
          fileType,
          fileSize: selectedFile.size,
          visibility,
          courseId: visibility === 'course_specific' ? courseId : undefined,
          intakeId: visibility === 'intake_specific' ? intakeId : undefined,
        })

        if ('error' in result) {
          setError(result.error)
          return
        }

        setTitle('')
        setDescription('')
        setSelectedFile(null)
        setShowForm(false)
        router.refresh()
      } catch {
        setError('Upload failed')
      }
    })
  }

  function handleView(resourceId: string) {
    startViewTransition(async () => {
      try {
        const url = await getAdminResourceUrl(resourceId)
        window.open(url, '_blank', 'noopener,noreferrer')
      } catch {
        setError('Could not open file')
      }
    })
  }

  function handleDelete(resourceId: string, resourceTitle: string) {
    if (!window.confirm(`Delete "${resourceTitle}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteResource(resourceId)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  function onFileChange(file: File | null) {
    if (!file) {
      setSelectedFile(null)
      return
    }
    const ft = fileTypeFromMime(file.type)
    if (!ft) {
      setError('Only PDF and image files are allowed')
      return
    }
    const max = ft === 'pdf' ? 20 * 1024 * 1024 : 5 * 1024 * 1024
    if (file.size > max) {
      setError(ft === 'pdf' ? 'PDF max size is 20MB' : 'Image max size is 5MB')
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-[28px] font-semibold text-[#1A1A2E]">Resources</h1>
        <Button variant="primary" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancel' : 'Upload Resource'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleUpload}
          className="rounded-xl bg-white p-6 shadow-card"
        >
          {error && (
            <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-4">
            <div>
              <AdminLabel htmlFor="resource-title">Title</AdminLabel>
              <input
                id="resource-title"
                className={adminFieldClassName}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <AdminLabel htmlFor="resource-desc">Description (optional)</AdminLabel>
              <textarea
                id="resource-desc"
                rows={2}
                className={adminFieldClassName}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <AdminLabel>File</AdminLabel>
              <label
                className="flex cursor-pointer flex-col items-center justify-center rounded-[14px] border-2 border-dashed border-[#D8D8E8] bg-[#F7F8FC] px-6 py-10 text-center transition-colors hover:border-[#C74A86]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file) onFileChange(file)
                }}
              >
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                />
                {selectedFile ? (
                  <>
                    <p className="font-body text-sm font-medium text-[#1A1A2E]">{selectedFile.name}</p>
                    <p className="mt-1 font-body text-xs text-[#9898B8]">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-body text-sm font-medium text-[#1A1A2E]">
                      Drag and drop or click to browse
                    </p>
                    <p className="mt-1 font-body text-xs text-[#9898B8]">
                      PDF up to 20MB · images up to 5MB
                    </p>
                  </>
                )}
              </label>
            </div>
            <div>
              <AdminLabel htmlFor="visibility">Visibility</AdminLabel>
              <select
                id="visibility"
                className={adminFieldClassName}
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as ResourceListRow['visibility'])
                }
              >
                <option value="all_students">All active students</option>
                <option value="course_specific">Course-specific</option>
                <option value="intake_specific">Intake-specific</option>
              </select>
            </div>
            {visibility === 'course_specific' && (
              <div>
                <AdminLabel htmlFor="courseId">Course</AdminLabel>
                <select
                  id="courseId"
                  className={adminFieldClassName}
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {visibility === 'intake_specific' && (
              <div>
                <AdminLabel htmlFor="intakeId">Intake</AdminLabel>
                <select
                  id="intakeId"
                  className={adminFieldClassName}
                  value={intakeId}
                  onChange={(e) => setIntakeId(e.target.value)}
                >
                  <option value="">Select intake</option>
                  {intakes.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button type="submit" variant="primary" disabled={pending} className="w-fit">
              {pending ? 'Uploading…' : 'Upload Resource'}
            </Button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {(['all', 'pdf', 'image'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 font-body text-sm transition-colors ${
              filter === f
                ? 'bg-[#FDF0F6] font-semibold text-[#C74A86]'
                : 'bg-white text-[#5A5A7A] shadow-card'
            }`}
          >
            {f === 'all' ? 'All' : f === 'pdf' ? 'PDFs' : 'Images'}
          </button>
        ))}
        <input
          type="search"
          placeholder="Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${adminFieldClassName} ml-auto max-w-xs`}
        />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.length === 0 ? (
          <p className="rounded-xl bg-white p-6 font-body text-sm text-[#9898B8] shadow-card">
            No resources match your filters.
          </p>
        ) : (
          filtered.map((resource) => (
            <article
              key={resource.id}
              className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-card"
            >
              <FileTypeIcon type={resource.file_type} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-[15px] font-semibold text-[#1A1A2E]">{resource.title}</p>
                {resource.description && (
                  <p className="line-clamp-1 font-body text-[13px] text-[#9898B8]">
                    {resource.description}
                  </p>
                )}
                <p className="mt-1 font-body text-xs text-[#9898B8]">
                  <span className="rounded-full bg-[#F7F8FC] px-2 py-0.5">
                    {visibilityLabel(resource.visibility)}
                  </span>
                  {resource.courses?.title && ` · ${resource.courses.title}`}
                  {resource.intakes?.name && ` · ${resource.intakes.name}`}
                  {resource.file_size != null && ` · ${formatFileSize(resource.file_size)}`}
                  {` · ${formatDate(resource.created_at)}`}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={viewPending}
                  onClick={() => handleView(resource.id)}
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  disabled={pending}
                  onClick={() => handleDelete(resource.id, resource.title)}
                >
                  Delete
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
