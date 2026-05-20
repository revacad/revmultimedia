import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { s3Client } from '@/lib/r2/client'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.EXPORT_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const timestamp = new Date().toISOString().split('T')[0]

  try {
    const [
      applications,
      students,
      enrollments,
      invoices,
      installments,
      courses,
      intakes,
    ] = await Promise.all([
      supabase.from('applications').select('*'),
      supabase.from('students').select('*'),
      supabase.from('enrollments').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('installments').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('intakes').select('*'),
    ])

    const exportData = {
      exportedAt: new Date().toISOString(),
      tables: {
        applications: applications.data ?? [],
        students: students.data ?? [],
        enrollments: enrollments.data ?? [],
        invoices: invoices.data ?? [],
        installments: installments.data ?? [],
        courses: courses.data ?? [],
        intakes: intakes.data ?? [],
      },
      counts: {
        applications: applications.data?.length ?? 0,
        students: students.data?.length ?? 0,
        enrollments: enrollments.data?.length ?? 0,
        invoices: invoices.data?.length ?? 0,
      },
    }

    const key = `exports/db-backup-${timestamp}.json`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
        Key: key,
        Body: JSON.stringify(exportData, null, 2),
        ContentType: 'application/json',
      }),
    )

    return NextResponse.json({
      success: true,
      key,
      counts: exportData.counts,
      exportedAt: exportData.exportedAt,
    })
  } catch (error) {
    console.error('Export failed:', error)
    return NextResponse.json(
      { error: 'Export failed', details: String(error) },
      { status: 500 },
    )
  }
}
