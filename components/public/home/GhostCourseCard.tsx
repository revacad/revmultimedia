import { cn } from '@/lib/utils'

interface GhostCourseCardProps {
  title: string
  accent: 'secondary' | 'accent'
  icon: 'play' | 'cut'
  className?: string
}

export default function GhostCourseCard({ title, accent, icon, className }: GhostCourseCardProps) {
  const gradient =
    accent === 'secondary'
      ? 'from-secondary/20 to-secondary/[0.03]'
      : 'from-accent/20 to-accent/[0.03]'
  const iconColor = accent === 'secondary' ? 'text-secondary/30' : 'text-accent/30'
  const badgeBg =
    accent === 'secondary' ? 'bg-secondary-light text-secondary' : 'bg-accent-light text-accent-hover'

  return (
    <article
      className={cn(
        'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-dashed border-brand-gray-200 bg-surface-2 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover',
        className,
      )}
    >
      <div
        className={cn(
          'relative flex h-[220px] flex-col items-center justify-center bg-gradient-to-br',
          gradient,
        )}
      >
        {icon === 'play' ? (
          <svg className={cn('mb-2 h-8 w-8', iconColor)} fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className={cn('mb-2 h-8 w-8', iconColor)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-5.758-5.758 3 3 0 005.758 5.758z"
            />
          </svg>
        )}
        <p className="font-display text-lg text-brand-gray-400">{title}</p>
        <span className={cn('mt-3 rounded-full px-3 py-1 text-xs font-semibold', badgeBg)}>
          Coming Soon
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="font-display text-lg font-semibold text-brand-gray-400">{title}</p>
        <p className="mt-1 text-sm text-brand-gray-500">Opening soon</p>
      </div>
    </article>
  )
}
