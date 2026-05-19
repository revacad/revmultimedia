import PublicLayoutShell from '@/components/public/PublicLayoutShell'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PublicLayoutShell>{children}</PublicLayoutShell>
}
