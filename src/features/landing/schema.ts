import { z } from 'zod'

const categorySchema = z.object({ id: z.number(), name: z.string(), slug: z.string(), description: z.string().nullable().optional() })
const ctaSchema = z.object({ label: z.string(), href: z.string() })
const contentCardSchema = z.object({ slug: z.string(), title: z.string(), summary: z.string(), type: z.string(), cover_url: z.string().nullable(), category: categorySchema.nullable().optional() })

export const siteSchema = z.object({
  hero: z.object({ title: z.string(), subtitle: z.string(), image_url: z.string().nullable(), image_alt: z.string().nullable(), video_url: z.string().nullable(), primary_cta: ctaSchema, secondary_cta: ctaSchema }),
  how_it_works: z.array(z.object({ title: z.string(), text: z.string(), icon: z.string() })),
  settings: z.object({ site_name: z.string(), contact_email: z.string().nullable(), social: z.array(z.object({ label: z.string(), url: z.string() })), footer_text: z.string().nullable() }),
})

export const homeSchema = siteSchema.extend({
  stats: z.object({ reports_resolved: z.number(), activities_completed: z.number(), events_held: z.number(), residents: z.number() }),
  categories: z.array(categorySchema),
  featured_contents: z.array(contentCardSchema),
  upcoming_events: z.array(z.object({ slug: z.string(), title: z.string(), location: z.string(), starts_at: z.string().nullable(), cover_url: z.string().nullable(), capacity: z.number().nullable(), remaining_places: z.number().nullable() })),
  open_activities: z.array(z.object({ slug: z.string(), title: z.string(), summary: z.string(), ends_on: z.string().nullable(), category: categorySchema.nullable().optional() })),
  resolved_reports: z.array(z.object({ id: z.number(), title: z.string(), description: z.string(), zone: z.object({ id: z.number(), name: z.string() }).nullable().optional(), photos: z.array(z.object({ id: z.number(), url: z.string() })).optional() })),
  tips: z.array(contentCardSchema),
})

export type Home = z.infer<typeof homeSchema>
export type Site = z.infer<typeof siteSchema> & { featured_content_ids: number[] }
