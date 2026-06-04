export const ADMIN_PAGE_SIZE = 15

export function parseAdminPage(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? '1', 10)
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

export function adminListRange(page: number, pageSize = ADMIN_PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

export function adminTotalPages(totalCount: number, pageSize = ADMIN_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(totalCount / pageSize))
}

export function formatAdminResultsSummary(
  page: number,
  totalCount: number,
  pageSize = ADMIN_PAGE_SIZE,
): string {
  if (totalCount === 0) return 'Showing 0 results'
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalCount)
  return `Showing ${from}-${to} of ${totalCount} results`
}

export function getVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 5,
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const half = Math.floor(maxVisible / 2)
  let start = Math.max(1, currentPage - half)
  let end = start + maxVisible - 1

  if (end > totalPages) {
    end = totalPages
    start = end - maxVisible + 1
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}
