'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  ADMIN_PAGE_SIZE,
  adminTotalPages,
  formatAdminResultsSummary,
  getVisiblePageNumbers,
} from '@/lib/admin/pagination'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalCount: number
  pageSize?: number
  className?: string
}

function buildPageHref(pathname: string, searchParams: URLSearchParams, page: number): string {
  const params = new URLSearchParams(searchParams.toString())
  if (page <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(page))
  }
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function PaginationSummary({
  currentPage,
  totalCount,
  pageSize = ADMIN_PAGE_SIZE,
  className,
}: PaginationProps) {
  return (
    <p className={cn('font-body text-sm text-[#9898B8]', className)}>
      {formatAdminResultsSummary(currentPage, totalCount, pageSize)}
    </p>
  )
}

export default function Pagination({
  currentPage,
  totalCount,
  pageSize = ADMIN_PAGE_SIZE,
  className,
}: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const totalPages = adminTotalPages(totalCount, pageSize)

  if (totalCount <= pageSize) {
    return null
  }

  const pageNumbers = getVisiblePageNumbers(currentPage, totalPages)
  const prevPage = currentPage > 1 ? currentPage - 1 : null
  const nextPage = currentPage < totalPages ? currentPage + 1 : null

  const linkClass = (active: boolean) =>
    cn(
      'inline-flex min-w-[36px] items-center justify-center rounded-lg px-3 py-2 font-body text-sm font-semibold transition-colors',
      active
        ? 'bg-[#C74A86] text-white'
        : 'border border-[#EFEFF5] bg-white text-[#5A5A7A] hover:border-[#D8D8E8] hover:text-[#1A1A2E]',
    )

  return (
    <nav
      className={cn('flex flex-wrap items-center justify-center gap-2', className)}
      aria-label="Pagination"
    >
      {prevPage ? (
        <Link
          href={buildPageHref(pathname, searchParams, prevPage)}
          className={linkClass(false)}
        >
          Previous
        </Link>
      ) : (
        <span className={cn(linkClass(false), 'pointer-events-none opacity-40')}>Previous</span>
      )}

      {pageNumbers.map((page) => (
        <Link
          key={page}
          href={buildPageHref(pathname, searchParams, page)}
          className={linkClass(page === currentPage)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </Link>
      ))}

      {nextPage ? (
        <Link
          href={buildPageHref(pathname, searchParams, nextPage)}
          className={linkClass(false)}
        >
          Next
        </Link>
      ) : (
        <span className={cn(linkClass(false), 'pointer-events-none opacity-40')}>Next</span>
      )}
    </nav>
  )
}
