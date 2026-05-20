export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="page-container-outer">
      <div className={`page-container-inner ${className ?? ''}`}>{children}</div>
    </div>
  )
}
