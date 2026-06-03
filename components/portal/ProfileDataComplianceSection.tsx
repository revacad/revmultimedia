'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { requestAccountDeletion } from '@/actions/account-deletion'
import { exportMyData } from '@/actions/data-export'

type ProfileDataComplianceSectionProps = {
  hasPendingDeletionRequest: boolean
}

export default function ProfileDataComplianceSection({
  hasPendingDeletionRequest,
}: ProfileDataComplianceSectionProps) {
  const router = useRouter()
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    if (!showDeleteModal) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowDeleteModal(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showDeleteModal])

  async function handleExport() {
    setExportLoading(true)
    setExportError(null)

    try {
      const response = await fetch('/api/portal/export-my-data', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        setExportError(
          body?.error ??
            (response.status === 429
              ? 'You can export your data once per hour. Please try again later.'
              : 'Export failed. Please try again.'),
        )
        return
      }

      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="([^"]+)"/)
      const filename =
        filenameMatch?.[1] ??
        `my-rev-data-${new Date().toISOString().slice(0, 10)}.json`

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      const result = await exportMyData()
      if (!result.success) {
        setExportError(result.error)
        return
      }

      const blob = new Blob([result.json], { type: result.contentType })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = result.filename
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  async function handleRequestDeletion() {
    if (confirmText !== 'DELETE') return

    setDeleteLoading(true)
    setDeleteError(null)

    const result = await requestAccountDeletion()
    setDeleteLoading(false)

    if ('error' in result && result.error) {
      setDeleteError(result.error)
      return
    }

    setDeleteSuccess(true)
    setShowDeleteModal(false)
    setConfirmText('')
    router.refresh()
  }

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="font-body text-lg font-semibold text-[#1A1A2E]">
          Your data
        </h2>
        <p className="mt-2 font-body text-sm text-[#5A5A7A]">
          Download a copy of all personal data we hold about you, in JSON format.
        </p>
        {exportError ? (
          <p className="mt-3 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 font-body text-sm text-red-600">
            {exportError}
          </p>
        ) : null}
        <div className="mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? 'Preparing export…' : 'Export my data'}
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-red-300 bg-red-50/40 p-6 shadow-card">
        <h2 className="font-body text-lg font-semibold text-red-800">
          Delete my account
        </h2>
        <p className="mt-2 font-body text-sm text-red-900/90">
          This will permanently delete your account and all associated data
          including your application, documents, invoices, and enrollment records.
          This cannot be undone.
        </p>
        {hasPendingDeletionRequest || deleteSuccess ? (
          <p className="mt-4 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 font-body text-sm text-amber-900">
            Your deletion request has been received. We will process it within 30
            days and email you when it is complete.
          </p>
        ) : (
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => {
                setDeleteError(null)
                setShowDeleteModal(true)
              }}
            >
              Request account deletion
            </Button>
          </div>
        )}
      </section>

      {showDeleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A2E]/40 p-4"
          role="presentation"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-xl border border-red-200 bg-white p-5 shadow-card sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-account-title"
              className="font-display text-xl font-semibold text-red-800"
            >
              Request account deletion?
            </h2>
            <p className="mt-2 font-body text-sm text-[#5A5A7A]">
              Type <strong className="text-[#1A1A2E]">DELETE</strong> below to
              confirm. We will process your request within 30 days.
            </p>
            <label className="mt-4 block">
              <span className="sr-only">Confirmation</span>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="mt-1 w-full rounded-[10px] border border-[#EFEFF5] px-4 py-2.5 font-mono text-sm text-[#1A1A2E] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </label>

            {deleteError ? (
              <p className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {deleteError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                disabled={confirmText !== 'DELETE' || deleteLoading}
                onClick={handleRequestDeletion}
              >
                {deleteLoading ? 'Submitting…' : 'Confirm request'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
