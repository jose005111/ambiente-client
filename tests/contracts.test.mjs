import assert from 'node:assert/strict'
import test from 'node:test'
import { can } from '../src/lib/permissions.ts'
import { homeSchema } from '../src/features/landing/schema.ts'

const resident = { role: { name: 'residente' } }
const moderator = { role: { name: 'moderador' } }
const admin = { role: { name: 'administrador' } }

test('permissões protegem as áreas do administrador e moderador', () => {
  assert.equal(can('site:edit', resident), false)
  assert.equal(can('site:edit', moderator), false)
  assert.equal(can('site:edit', admin), true)
  assert.equal(can('reports:moderate', resident), false)
  assert.equal(can('reports:moderate', moderator), true)
})

test('contrato da página inicial aceita a configuração vazia e blocos calculados da API', () => {
  const payload = {
    hero: { title: '', subtitle: '', image_url: null, image_alt: null, video_url: null, primary_cta: { label: '', href: '' }, secondary_cta: { label: '', href: '' } },
    stats: { reports_resolved: 0, activities_completed: 0, events_held: 0, residents: 0 },
    categories: [], featured_contents: [], upcoming_events: [], open_activities: [], resolved_reports: [], tips: [], how_it_works: [],
    settings: { site_name: '', contact_email: null, social: [], footer_text: null },
  }
  assert.equal(homeSchema.parse(payload).stats.residents, 0)
  assert.equal(homeSchema.safeParse({ ...payload, stats: { ...payload.stats, residents: '0' } }).success, false)
})
