import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type SchoolSearchResult = {
  id: string | null
  name: string
  region: string | null
  school_type: string | null
}

type StaticSchool = { name: string; name_norm: string }

let staticDirectory: StaticSchool[] | null = null

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadStaticDirectory(): StaticSchool[] {
  if (staticDirectory) return staticDirectory
  try {
    const raw = readFileSync(join(process.cwd(), 'data', 'shs-tvet-school-names.txt'), 'utf8')
    const seen = new Set<string>()
    const schools: StaticSchool[] = []
    for (const line of raw.split(/\r?\n/)) {
      const name = line.trim()
      if (!name) continue
      const name_norm = normalizeName(name)
      if (!name_norm || seen.has(name_norm)) continue
      seen.add(name_norm)
      schools.push({ name, name_norm })
    }
    staticDirectory = schools
    return schools
  } catch (err) {
    console.error('[schools] static load failed:', err)
    staticDirectory = []
    return []
  }
}

async function fetchSchoolsFromDb(): Promise<SchoolSearchResult[] | null> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('senior_high_schools')
      .select('id, name, region, school_type')
      .eq('is_active', true)
      .order('name')
    if (error) {
      console.error('[schools] DB fetch failed:', error.message)
      return null
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      region: row.region ?? null,
      school_type: row.school_type ?? null,
    }))
  } catch (err) {
    console.error('[schools] DB fetch error:', err)
    return null
  }
}

const getCachedDbSchools = unstable_cache(fetchSchoolsFromDb, ['senior-high-schools-directory'], {
  revalidate: 3600,
})

function searchStaticDirectory(query: string, limit: number): SchoolSearchResult[] {
  const q = query.toLowerCase()
  const results: SchoolSearchResult[] = []
  for (const school of loadStaticDirectory()) {
    if (!school.name_norm.includes(q) && !school.name.toLowerCase().includes(q)) continue
    results.push({ id: null, name: school.name, region: null, school_type: null })
    if (results.length >= limit) break
  }
  return results
}

function searchInMemory(schools: SchoolSearchResult[], query: string, limit: number) {
  const q = query.toLowerCase()
  const results: SchoolSearchResult[] = []
  for (const school of schools) {
    if (!school.name.toLowerCase().includes(q)) continue
    results.push(school)
    if (results.length >= limit) break
  }
  return results
}

export async function searchSeniorHighSchools(query: string, limit = 15) {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  const dbSchools = await getCachedDbSchools()
  if (dbSchools && dbSchools.length > 0) {
    return searchInMemory(dbSchools, q, limit)
  }
  return searchStaticDirectory(q, limit)
}
