interface UploadProgressBarProps {
  percent: number
}

export default function UploadProgressBar({ percent }: UploadProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="mx-auto mt-4 w-full max-w-xs">
      <div className="h-1.5 overflow-hidden rounded-full bg-[#E8E8F0]">
        <div
          className="h-full rounded-full bg-[#2DBFB8] transition-[width] duration-150 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <p className="mt-2 text-sm font-medium text-dark">{clamped}%</p>
    </div>
  )
}
