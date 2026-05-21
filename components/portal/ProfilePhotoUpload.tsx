'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getProfilePhotoUrl, updateProfilePhoto } from '@/actions/student'
import { getInitials } from '@/lib/applications/format'
import { uploadViaPresign } from '@/lib/portal/upload'

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024

interface ProfilePhotoUploadProps {
  studentDbId: string
  fullName: string
  currentPhotoKey?: string | null
}

export default function ProfilePhotoUpload({
  studentDbId,
  fullName,
  currentPhotoKey,
}: ProfilePhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photoKey, setPhotoKey] = useState(currentPhotoKey ?? '')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadPhotoUrl = useCallback(async (key: string) => {
    if (!key) {
      setPhotoUrl(null)
      return
    }
    const url = await getProfilePhotoUrl(key)
    setPhotoUrl(url)
  }, [])

  useEffect(() => {
    void loadPhotoUrl(photoKey)
  }, [photoKey, loadPhotoUrl])

  const openPicker = () => inputRef.current?.click()

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(false)

    if (!ACCEPT.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be 2MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const key = await uploadViaPresign(file, {
        type: 'profile_photo',
        studentId: studentDbId,
      })

      const result = await updateProfilePhoto(studentDbId, key)
      if (result.error) {
        setError('Upload failed. Please try again.')
        return
      }

      setPhotoKey(key)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full text-white disabled:opacity-70"
        style={{
          background: photoUrl
            ? undefined
            : 'linear-gradient(135deg, #C74A86, #F18F3B)',
        }}
        aria-label="Update profile photo"
      >
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <span className="font-body text-2xl font-bold">{getInitials(fullName)}</span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </span>
        )}
      </button>

      <div>
        <button
          type="button"
          onClick={openPicker}
          disabled={uploading}
          className="rounded-full border border-[#D8D8E8] px-4 py-2 font-body text-sm font-semibold text-[#5A5A7A] hover:border-[#C74A86] hover:text-[#C74A86] disabled:opacity-50"
        >
          Update profile photo
        </button>
        {success && (
          <p className="mt-2 font-body text-sm font-medium text-[#1E9990]">Profile photo updated</p>
        )}
        {error && (
          <p className="mt-2 font-body text-sm text-[#E84A4A]">{error}</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
