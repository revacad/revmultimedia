/**
 * Reads data/shs-tvet-school-names.txt and writes
 * supabase/migrations/033_seed_senior_high_schools.sql
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = join(root, 'data', 'shs-tvet-school-names.txt')
const outPath = join(root, 'supabase', 'migrations', '033_seed_senior_high_schools.sql')

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function schoolType(name) {
  const u = name.toUpperCase()
  if (
    /\bTECH\b|TECHNICAL|TCHNICAL|\/TECH|SNR\.?\s*HIGH\/TECH|VOC\b|VET\b/.test(u)
  ) {
    return 'technical'
  }
  return 'shs'
}

function sqlEscape(s) {
  return s.replace(/'/g, "''")
}

const raw = readFileSync(sourcePath, 'utf8')
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter(Boolean)

const seen = new Set()
const schools = []

for (const name of lines) {
  const name_norm = normalizeName(name)
  if (!name_norm || seen.has(name_norm)) continue
  seen.add(name_norm)
  schools.push({
    name,
    name_norm,
    school_type: schoolType(name),
  })
}

schools.sort((a, b) => a.name_norm.localeCompare(b.name_norm))

const CHUNK = 80
const chunks = []
for (let i = 0; i < schools.length; i += CHUNK) {
  chunks.push(schools.slice(i, i + CHUNK))
}

const inserts = chunks
  .map((chunk) => {
    const values = chunk
      .map(
        (s) =>
          `  ('${sqlEscape(s.name)}', '${sqlEscape(s.name_norm)}', '${s.school_type}', NULL)`,
      )
      .join(',\n')
    return `INSERT INTO senior_high_schools (name, name_norm, school_type, region)\nVALUES\n${values}\nON CONFLICT (name_norm) DO NOTHING;`
  })
  .join('\n\n')

const sql = `-- Seed Ghana SHS / TVET schools (${schools.length} unique names from SHSTVET_school_names.txt)
-- Source: data/shs-tvet-school-names.txt

${inserts}
`

writeFileSync(outPath, sql, 'utf8')

const jsonPath = join(root, 'data', 'shs-schools.json')
writeFileSync(
  jsonPath,
  JSON.stringify(
    schools.map((s) => ({ name: s.name, name_norm: s.name_norm, school_type: s.school_type })),
  ),
  'utf8',
)

console.log(`Wrote ${schools.length} schools to ${outPath} (${chunks.length} batches)`)
console.log(`Wrote ${schools.length} schools to ${jsonPath}`)
