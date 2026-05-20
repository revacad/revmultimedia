'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
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
import { curriculumHtml, isVideoIntroUrl } from '@/lib/courses/curriculum'
import type { Course } from '@/lib/courses/types'

interface CourseFormProps {
  course?: Course
}

export default function CourseForm({ course }: CourseFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [curriculumHtmlValue, setCurriculumHtmlValue] = useState(() =>
    curriculumHtml(course?.curriculum ?? null),
  )
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null)

  const canUploadImages = Boolean(course?.id)

  async function handleCurriculumImageUpload(file: File): Promise<string> {
    if (!course?.id) {
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
        courseId: course.id,
      }),
    })
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(data.error ?? 'Upload failed')
    }
    const { presignedUrl, publicUrl } = (await res.json()) as {
      presignedUrl: string
      publicUrl: string
    }
    const uploadRes = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) {
      throw new Error('Failed to upload image')
    }
    return publicUrl
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    formData.set('curriculum_html', curriculumHtmlValue)

    const result = course
      ? await updateCourse(course.id, formData)
      : await createCourse(formData)

    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    if (course) {
      router.refresh()
    } else if (result.data?.id) {
      router.push(`/admin/courses/${result.data.id}`)
    }
  }

  return (
    <AdminFormCard>
      <form action={handleSubmit} className="flex flex-col">
        {error && (
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
                  defaultValue={course?.category ?? 'graphic_design'}
                  required
                >
                  <option value="graphic_design">Graphic Design</option>
                  <option value="motion_graphics">Motion Graphics</option>
                  <option value="video_editing">Video Editing</option>
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
              <RichTextEditor
                content={curriculumHtmlValue}
                onChange={setCurriculumHtmlValue}
                onImageUpload={canUploadImages ? handleCurriculumImageUpload : undefined}
                placeholder="Describe weeks, modules, and learning outcomes…"
                minHeight={320}
              />
              {!canUploadImages && (
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
                onBlur={(e) => {
                  const v = e.target.value.trim()
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
              <button
                type="button"
                className="w-full cursor-pointer rounded-[14px] border-2 border-dashed border-[#D8D8E8] bg-[#F7F8FC] px-8 py-8 text-center transition-colors hover:border-[#C74A86] hover:bg-[#FDF0F6]"
              >
                <p className="font-body text-sm font-medium text-dark">Click to upload thumbnail</p>
                <p className="mt-1 font-body text-xs text-gray-400">JPG or PNG, max 2MB</p>
              </button>
            </div>
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

        <Button
          type="submit"
          variant="primary"
          disabled={loading || Boolean(videoUrlError)}
          className="mt-2 w-fit rounded-full px-8 py-3"
        >
          {loading ? 'Saving…' : course ? 'Update Course' : 'Create Course'}
        </Button>
      </form>
    </AdminFormCard>
  )
}
