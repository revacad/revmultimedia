'use client'

import { PageContainer } from '@/components/ui/PageContainer'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'

export default function PublicLayoutShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PageContainer>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </PageContainer>
  )
}
