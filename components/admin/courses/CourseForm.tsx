'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import {
  AdminFormCard,
  AdminFormSection,
  AdminLabel,
  AdminFieldGrid,
  AdminToggle,
  adminFieldClassName,
} from '@/components/admin/AdminFormPrimitives'
import { createCourse, updateCourse } from '@/actions/course'
import { presignCourseMediaForPreview } from '@/actions/course-media'
import { curriculumHtml, isVideoIntroUrl } from '@/lib/courses/curriculum'
import { getCourseThumbnailSrc } from '@/lib/courses/thumbnail'
import { getInstructorPhotoSrc } from '@/lib/courses/instructor-photo'
import { COURSE_CATEGORIES } from '@/lib/courses/categories'
import type { Course } from '@/lib/courses/types'

interface CourseFormProps {
  course?: Course
}

const FORM_ID = 'course-form'

function blurNumberInputOnWheel(e: React.WheelEvent<HTMLInputElement>) {
  e.currentTarget.blur()
}

function CourseSaveButton({
  isEditing,
  isSubmitting,
  disabled,
  label,
}: {
  isEditing: boolean
  isSubmitting: boolean
  disabled: boolean
  label?: string
}) {
  const buttonLabel =
    label ??
    (isSubmitting
      ? isEditing
        ? 'Saving...'
        : 'Creating...'
      : isEditing
        ? 'Save course'
        : 'Create Course')

  return (
    <button
      type="submit"
      form={FORM_ID}
      disabled={disabled}
      style={{
        backgroundColor: isSubmitting ? '#9E3068' : '#C74A86',
        color: 'white',
        border: 'none',
        padding: '14px 32px',
        borderRadius: '9999px',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '15px',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: isSubmitting ? 0.8 : 1,
        transition: 'all 0.2s ease',
        width: 'fit-content',
        flexShrink: 0,
      }}
    >
      {isSubmitting && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
      {isSubmitting
        ? isEditing
          ? label?.includes('Update')
            ? 'Updating...'
            : 'Saving...'
          : 'Creating...'
        : buttonLabel}
    </button>
  )
}

export default function CourseForm({ course }: CourseFormProps) {
  const router = useRouter()
  const params = useParams()
  const isEditing = Boolean(course)
  const courseId =
    course?.id ?? (typeof params?.id === 'string' ? params.id : undefined)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [curriculumHtmlValue, setCurriculumHtmlValue] = useState(() =>
    curriculumHtml(course?.curriculum ?? null),
  )
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null)
  const [thumbnailKey, setThumbnailKey] = useState(course?.thumbnail_r2_key ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(() =>
    course ? getCourseThumbnailSrc(course) : null,
  )
  const [thumbnailError, setThumbnailError] = useState<string | null>(null)
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false)
  const instructorPhotoInputRef = useRef<HTMLInputElement>(null)
  const [instructorPhotoKey, setInstructorPhotoKey] = useState(
    course?.instructor_photo_r2_key ?? '',
  )
  const [instructorPhotoUrl, setInstructorPhotoUrl] = useState<string | null>(() =>
    course ? getInstructorPhotoSrc(course) : null,
  )
  const [instructorPhotoError, setInstructorPhotoError] = useState<string | null>(null)
  const [isUploadingInstructorPhoto, setIsUploadingInstructorPhoto] = useState(false)

  const canUploadCurriculumImages = Boolean(courseId)
  const canUploadInstructorPhoto = Boolean(courseId)

  useEffect(() => {
    if (!successMessage) return
    const timer = window.setTimeout(() => setSuccessMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [successMessage])

  async function handleCurriculumImageUpload(file: File): Promise<string> {
    if (!courseId) {
      throw new Error('Save the course first')
    }
    const res = await fetch('/api/r2/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadContext: 'course_content',
        courseId,
      }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? 'Upload failed')
    }
    const { key, publicUrl } = (await res.json()) as {
      key: string
      publicUrl: string
    }
    const { uploadFileToR2ViaServer } = await import('@/lib/r2/client-upload')
    await uploadFileToR2ViaServer(file, key, {
      type: 'course_content',
      courseId,
    })
    return publicUrl
  }

  const handleThumbnailClick = () => {
    thumbnailInputRef.current?.click()
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setThumbnailError('Please upload a JPG, PNG or WebP image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setThumbnailError('Image must be under 5MB')
      return
    }

    setIsUploadingThumbnail(true)
    setThumbnailError(null)

    try {
      const presignRes = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadContext: 'course_thumbnail',
          ...(courseId ? { courseId } : {}),
        }),
      })

      if (!presignRes.ok) {
        const data = (await presignRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }

      const { key } = (await presignRes.json()) as { key: string }

      const { uploadFileToR2ViaServer } = await import('@/lib/r2/client-upload')
      await uploadFileToR2ViaServer(file, key, {
        type: 'course_thumbnail',
        ...(courseId ? { courseId } : {}),
      })

      const preview = await presignCourseMediaForPreview(key)
      setThumbnailUrl(
        preview && 'url' in preview ? preview.url : URL.createObjectURL(file),
      )
      setThumbnailKey(key)
    } catch {
      setThumbnailError('Upload failed. Please try again.')
    } finally {
      setIsUploadingThumbnail(false)
      e.target.value = ''
    }
  }

  const handleInstructorPhotoClick = () => {
    instructorPhotoInputRef.current?.click()
  }

  const handleInstructorPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !courseId) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setInstructorPhotoError('Please upload a JPG, PNG or WebP image')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setInstructorPhotoError('Image must be under 5MB')
      return
    }

    setIsUploadingInstructorPhoto(true)
    setInstructorPhotoError(null)

    try {
      const presignRes = await fetch('/api/r2/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadContext: 'course_instructor_photo',
          courseId,
        }),
      })

      if (!presignRes.ok) {
        const data = (await presignRes.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? 'Upload failed')
      }

      const { key } = (await presignRes.json()) as { key: string }

      const { uploadFileToR2ViaServer } = await import('@/lib/r2/client-upload')
      await uploadFileToR2ViaServer(file, key, {
        type: 'course_instructor_photo',
        courseId,
      })

      const preview = await presignCourseMediaForPreview(key)
      setInstructorPhotoUrl(
        preview && 'url' in preview ? preview.url : URL.createObjectURL(file),
      )
      setInstructorPhotoKey(key)
    } catch {
      setInstructorPhotoError('Upload failed. Please try again.')
    } finally {
      setIsUploadingInstructorPhoto(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    const formData = new FormData(e.currentTarget)
    formData.set('curriculum_html', curriculumHtmlValue)
    formData.set('thumbnail_r2_key', thumbnailKey)
    formData.set('instructor_photo_r2_key', instructorPhotoKey)

    try {
      const result = course
        ? await updateCourse(course.id, formData)
        : await createCourse(formData)

      if (!result.success) {
        setError(result.error)
        return
      }

      if (course) {
        setSuccessMessage('Course saved successfully.')
        router.refresh()
      } else if (result.data?.id) {
        router.push(`/admin/courses/${result.data.id}`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitDisabled = isSubmitting || Boolean(videoUrlError)

  return (
    <>
      {isEditing && course ? (
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="mb-2 font-display text-3xl font-bold text-dark">Edit course</h1>
            <p className="text-sm text-gray-600">{course.title}</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {successMessage && (
              <p
                role="status"
                className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
              >
                {successMessage}
              </p>
            )}
            {error && (
              <p
                role="alert"
                className="max-w-sm rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
              >
                {error}
              </p>
            )}
            <CourseSaveButton
              isEditing={isEditing}
              isSubmitting={isSubmitting}
              disabled={submitDisabled}
              label="Save course"
            />
          </div>
        </div>
      ) : null}

      <AdminFormCard>
      <form id={FORM_ID} onSubmit={(e) => void handleSubmit(e)} className="flex flex-col">
        {!isEditing && error && (
          <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <AdminFormSection title="Basic Information">
          <div className="flex flex-col gap-5">
            <div>
              <AdminLabel htmlFor="title">Title</AdminLabel>
              <input
                id="title"
                name="title"
                className={adminFieldClassName}
                defaultValue={course?.title}
                required
              />
            </div>
            <div>
              <AdminLabel htmlFor="slug">Slug</AdminLabel>
              <input
                id="slug"
                name="slug"
                className={adminFieldClassName}
                defaultValue={course?.slug}
                placeholder="auto-generated-from-title if empty"
              />
            </div>
            <div>
              <AdminLabel htmlFor="description">Description</AdminLabel>
              <textarea
                id="description"
                name="description"
                rows={4}
                className={adminFieldClassName}
                defaultValue={course?.description ?? ''}
              />
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Course Details">
          <div className="flex flex-col gap-5">
            <AdminFieldGrid>
              <div>
                <AdminLabel htmlFor="category">Category</AdminLabel>
                <select
                  id="category"
                  name="category"
                  className={adminFieldClassName}
                  defaultValue={course?.category ?? 'design'}
                  required
                >
                  {Object.entries(COURSE_CATEGORIES).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <AdminLabel htmlFor="mode">Mode</AdminLabel>
                <select
                  id="mode"
                  name="mode"
                  className={adminFieldClassName}
                  defaultValue={course?.mode ?? 'online'}
                  required
                >
                  <option value="online">Online</option>
                  <option value="in_person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </AdminFieldGrid>
            <div>
              <AdminLabel
                htmlFor="curriculum"
                helper="Full curriculum shown on the public course page."
              >
                Curriculum
              </AdminLabel>
              <div
                style={{
                  maxHeight: '500px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <RichTextEditor
                  content={curriculumHtmlValue}
                  onChange={setCurriculumHtmlValue}
                  onImageUpload={
                    canUploadCurriculumImages ? handleCurriculumImageUpload : undefined
                  }
                  placeholder="Describe the course curriculum..."
                  minHeight={200}
                />
              </div>
              {!canUploadCurriculumImages && (
                <p className="mt-2 font-body text-xs text-[#9898B8]">
                  Save the course first to enable image uploads in the curriculum editor.
                </p>
              )}
            </div>
            <div>
              <AdminLabel
                htmlFor="video_intro_url"
                helper="YouTube or Vimeo URL. Shown on the course page."
              >
                Intro Video URL (optional)
              </AdminLabel>
              <input
                id="video_intro_url"
                name="video_intro_url"
                type="url"
                className={adminFieldClassName}
                defaultValue={course?.video_intro_url ?? ''}
                placeholder="https://www.youtube.com/watch?v=..."
                onBlur={(ev) => {
                  const v = ev.target.value.trim()
                  if (v && !isVideoIntroUrl(v)) {
                    setVideoUrlError('Enter a valid YouTube or Vimeo URL')
                  } else {
                    setVideoUrlError(null)
                  }
                }}
              />
              {videoUrlError && (
                <p className="mt-1 font-body text-xs text-red-600">{videoUrlError}</p>
              )}
            </div>
            <div>
              <AdminLabel>Course thumbnail</AdminLabel>
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(ev) => void handleThumbnailChange(ev)}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={handleThumbnailClick}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault()
                    handleThumbnailClick()
                  }
                }}
                style={{
                  border: '2px dashed #D8D8E8',
                  borderRadius: '14px',
                  padding: '40px',
                  textAlign: 'center',
                  backgroundColor: '#F7F8FC',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(ev) => {
                  ev.currentTarget.style.borderColor = '#C74A86'
                  ev.currentTarget.style.backgroundColor = '#FDF0F6'
                }}
                onMouseLeave={(ev) => {
                  ev.currentTarget.style.borderColor = '#D8D8E8'
                  ev.currentTarget.style.backgroundColor = '#F7F8FC'
                }}
              >
                {isUploadingThumbnail ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #EFEFF5',
                        borderTop: '2px solid #C74A86',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '14px',
                        color: '#9898B8',
                      }}
                    >
                      Uploading...
                    </span>
                  </div>
                ) : thumbnailUrl ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnailUrl}
                      alt="Course thumbnail"
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        marginBottom: '12px',
                      }}
                    />
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#9898B8',
                      }}
                    >
                      Click to change thumbnail
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9898B8"
                      strokeWidth="1.5"
                      style={{ margin: '0 auto 12px', display: 'block' }}
                      aria-hidden
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#1A1A2E',
                        marginBottom: '4px',
                      }}
                    >
                      Click to upload thumbnail
                    </p>
                    <p
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '13px',
                        color: '#9898B8',
                      }}
                    >
                      JPG, PNG or WebP · Max 5MB
                    </p>
                  </div>
                )}
              </div>
              {thumbnailError && (
                <p
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '12px',
                    color: '#E84A4A',
                    marginTop: '6px',
                  }}
                >
                  {thumbnailError}
                </p>
              )}
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Instructor">
          <div className="flex flex-col gap-5">
            <AdminFieldGrid>
              <div>
                <AdminLabel htmlFor="instructor_name">Name</AdminLabel>
                <input
                  id="instructor_name"
                  name="instructor_name"
                  className={adminFieldClassName}
                  defaultValue={course?.instructor_name ?? ''}
                  placeholder="e.g. Godfred Ferdinand Appiah"
                />
              </div>
              <div>
                <AdminLabel htmlFor="instructor_title">Title</AdminLabel>
                <input
                  id="instructor_title"
                  name="instructor_title"
                  className={adminFieldClassName}
                  defaultValue={course?.instructor_title ?? ''}
                  placeholder="e.g. Lead Instructor"
                />
              </div>
            </AdminFieldGrid>
            <div>
              <AdminLabel htmlFor="instructor_bio">Bio</AdminLabel>
              <textarea
                id="instructor_bio"
                name="instructor_bio"
                rows={4}
                className={adminFieldClassName}
                defaultValue={course?.instructor_bio ?? ''}
                placeholder="Short bio shown on the public course page"
              />
            </div>
            <div>
              <AdminLabel>Instructor photo</AdminLabel>
              <input
                ref={instructorPhotoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(ev) => void handleInstructorPhotoChange(ev)}
              />
              {canUploadInstructorPhoto ? (
                <button
                  type="button"
                  onClick={handleInstructorPhotoClick}
                  disabled={isUploadingInstructorPhoto}
                  className="rounded-[10px] border border-dashed border-[#D8D8E8] bg-[#F7F8FC] px-4 py-3 font-body text-sm font-semibold text-[#5A5A7A] hover:border-primary disabled:opacity-50"
                >
                  {isUploadingInstructorPhoto
                    ? 'Uploading…'
                    : instructorPhotoUrl
                      ? 'Change instructor photo'
                      : 'Upload instructor photo'}
                </button>
              ) : (
                <p className="font-body text-xs text-[#9898B8]">
                  Save the course first to upload an instructor photo.
                </p>
              )}
              {instructorPhotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={instructorPhotoUrl}
                  alt="Instructor"
                  className="mt-3 h-24 w-24 rounded-full object-cover"
                />
              )}
              {instructorPhotoError && (
                <p className="mt-1 font-body text-xs text-red-600">{instructorPhotoError}</p>
              )}
            </div>
            <p className="font-body text-xs text-[#9898B8]">
              The instructor block on public course pages is hidden when name is empty.
            </p>
          </div>
        </AdminFormSection>

        <AdminFormSection title="Pricing & Capacity">
          <AdminFieldGrid>
            <div>
              <AdminLabel htmlFor="tuition_fee_ghs">Tuition (GHS)</AdminLabel>
              <input
                id="tuition_fee_ghs"
                name="tuition_fee_ghs"
                type="number"
                min="0"
                step="0.01"
                className={adminFieldClassName}
                defaultValue={course?.tuition_fee_ghs ?? ''}
                onWheel={blurNumberInputOnWheel}
                required
              />
            </div>
            <div>
              <AdminLabel htmlFor="max_slots">Max slots</AdminLabel>
              <input
                id="max_slots"
                name="max_slots"
                type="number"
                min="1"
                className={adminFieldClassName}
                defaultValue={course?.max_slots ?? 20}
                onWheel={blurNumberInputOnWheel}
                required
              />
            </div>
          </AdminFieldGrid>
        </AdminFormSection>

        <AdminFormSection title="Visibility" isLast>
          <AdminToggle
            name="is_published"
            defaultChecked={course?.is_published ?? false}
            label="Published"
            helper="Visible on the public courses page"
          />
        </AdminFormSection>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          {isEditing && successMessage && (
            <p
              role="status"
              className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700"
            >
              {successMessage}
            </p>
          )}
          {isEditing && error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600"
            >
              {error}
            </p>
          )}
          <CourseSaveButton
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            disabled={submitDisabled}
            label={isEditing ? 'Update Course' : 'Create Course'}
          />
        </div>
      </form>
    </AdminFormCard>
    </>
  )
}
