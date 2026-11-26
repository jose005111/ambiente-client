import { Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleHelp, Droplets, Leaf, MapPinned, Mountain, Recycle, Trash2, Waves } from 'lucide-react'
import { m } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { homeQueryOptions } from './api'
import type { Home } from './schema'

function categoryIcon(value: string) {
  const name = value.toLowerCase()
  if (name.includes('lixo') || name.includes('residuo') || name.includes('resíduo')) return Trash2
  if (name.includes('saneamento')) return Waves
  if (name.includes('agua') || name.includes('água')) return Droplets
  if (name.includes('erosao') || name.includes('erosão')) return Mountain
  if (name.includes('recicla')) return Recycle
  return Leaf
}

function Section({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: ReactNode; action?: ReactNode }) {
  return <m.section className="home-section container" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
    <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{action}</div>{children}
  </m.section>
}

function Picture({ src, alt, eager = false }: { src: string | null | undefined; alt: string; eager?: boolean }) {
  return src ? <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} /> : <div className="image-fallback" aria-hidden="true"><Leaf size={38} /></div>
}

function ContentCards({ items }: { items: Home['featured_contents'] }) {
  return <div className="cards-grid">{items.map(item => <Link key={item.slug} to="/aprender/$slug" params={{ slug: item.slug }} className="content-card card">
    <div className="card-image"><Picture src={item.cover_url} alt={`Capa de ${item.title}`} /></div>
    <div className="card-body"><span className="pill">{item.category?.name || item.type}</span><h3>{item.title}</h3><p>{item.summary}</p><span className="card-link">Ler conteúdo <ArrowUpRight size={17} aria-hidden /></span></div>
  </Link>)}</div>
}

function ActivityPhotos({ activity }: { activity: Home['open_activities'][number] }) {
  const [index, setIndex] = useState(0)
  const photos = activity.photos
  const current = photos[index]
  const move = (direction: number) => setIndex(previous => (previous + direction + photos.length) % photos.length)

  return <div className="compact-card-image">
    <Picture src={current?.url || activity.cover_url} alt={`Fotografia ${index + 1} de ${photos.length} de ${activity.title}`} />
    {photos.length > 1 && <div className="activity-carousel-controls">
      <button type="button" onClick={() => move(-1)} aria-label={`Fotografia anterior de ${activity.title}`}><ChevronLeft size={18} aria-hidden /></button>
      <span aria-live="polite">{index + 1}/{photos.length}</span>
      <button type="button" onClick={() => move(1)} aria-label={`Fotografia seguinte de ${activity.title}`}><ChevronRight size={18} aria-hidden /></button>
    </div>}
  </div>
}

export function HomePage() {
  const { data, isPending, isError, refetch } = useQuery(homeQueryOptions)
  if (isPending) return <div className="container page-loading" role="status"><div className="skeleton skeleton-hero" /><div className="skeleton skeleton-row" /><span className="sr-only">A carregar página inicial</span></div>
  if (isError) return <div className="container state-panel"><h1>Não foi possível carregar a página</h1><p>Verifique a sua ligação e tente novamente.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div>
  const { hero, stats } = data
  return <>
    <section className="hero-section">
      {hero.image_url && <div className="hero-photo"><Picture src={hero.image_url} alt={hero.image_alt || 'Imagem de apresentação da comunidade'} eager /></div>}
      <div className="container hero-content"><p className="eyebrow">Bairro dos Navegantes · Educação ambiental</p><h1>{hero.title || 'A página inicial está a ser preparada'}</h1><p className="hero-subtitle">{hero.subtitle || 'Explore os conteúdos, actividades e eventos da comunidade.'}</p><div className="hero-actions">
        {hero.primary_cta.label && hero.primary_cta.href && <a className="button" href={hero.primary_cta.href}>{hero.primary_cta.label}</a>}
        {hero.secondary_cta.label && hero.secondary_cta.href && <a className="button button-outline" href={hero.secondary_cta.href}>{hero.secondary_cta.label}</a>}
      </div></div>
      <div className="hero-decoration" aria-hidden="true"><Leaf size={120} strokeWidth={0.7} /></div>
    </section>
    <div className="stats-band"><div className="container stats-grid">{[
      ['Reportes resolvidos', stats.reports_resolved], ['Actividades concluídas', stats.activities_completed], ['Eventos realizados', stats.events_held], ['Residentes inscritos', stats.residents],
    ].map(([label, value]) => <div className="stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></div>
    {data.categories.length > 0 && <Section eyebrow="Temas ambientais" title="Descobre por onde começar" action={<Link to="/aprender" search={{ page: 1, search: "", category: "" }} className="text-link">Ver conteúdos <ArrowUpRight size={17} /></Link>}><div className="topic-grid">{data.categories.map(category => { const Icon = categoryIcon(`${category.slug} ${category.name}`); return <Link key={category.id} to="/aprender" search={{ page: 1, search: "", category: category.slug }} className="topic-card"><span className="topic-icon"><Icon size={25} strokeWidth={1.75} aria-hidden /></span><h3>{category.name}</h3><p>{category.description}</p><span className="card-link">Explorar tema <ArrowUpRight size={17} aria-hidden /></span></Link> })}</div></Section>}
    {data.featured_contents.length > 0 && <Section eyebrow="Em destaque" title="Ideias para pôr em prática" action={<Link to="/aprender" search={{ page: 1, search: "", category: "" }} className="text-link">Ver todos <ArrowUpRight size={17} /></Link>}><ContentCards items={data.featured_contents} /></Section>}
    {data.how_it_works.length > 0 && <div className="steps-wrap"><Section eyebrow="Como funciona" title="Participar é simples"><div className="steps-grid">{data.how_it_works.map((step, index) => <div className="step" key={`${step.title}-${index}`}><span className="step-number">{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.text}</p></div>)}</div></Section></div>}
    {data.upcoming_events.length > 0 && <Section eyebrow="Agenda comunitária" title="Próximos eventos" action={<Link to="/eventos" search={{ page: 1, search: "", category: "" }} className="text-link">Ver agenda <ArrowUpRight size={17} /></Link>}><div className="cards-grid">{data.upcoming_events.map(event => <Link key={event.slug} to="/eventos/$slug" params={{ slug: event.slug }} className="card event-card"><div className="card-image"><Picture src={event.cover_url} alt={`Capa de ${event.title}`} /></div><div className="card-body"><span className="pill"><CalendarDays size={15} aria-hidden /> {event.starts_at ? new Intl.DateTimeFormat('pt', { day: 'numeric', month: 'long' }).format(new Date(event.starts_at)) : 'Data a confirmar'}</span><h3>{event.title}</h3><p>{event.location}</p><span className="card-link">Ver evento <ArrowUpRight size={17} aria-hidden /></span></div></Link>)}</div></Section>}
    {data.open_activities.length > 0 && <div className="soft-section"><Section eyebrow="Participa" title="Actividades abertas" action={<Link to="/actividades" search={{ page: 1, search: "", category: "" }} className="text-link">Ver actividades <ArrowUpRight size={17} /></Link>}><div className="compact-grid">{data.open_activities.map(activity => <article key={activity.slug} className="compact-card"><ActivityPhotos activity={activity} /><Link to="/actividades/$slug" params={{ slug: activity.slug }} className="compact-card-content"><div><span className="pill">{activity.category?.name || 'Actividade'}</span><h3>{activity.title}</h3><p>{activity.summary}</p></div><ArrowUpRight size={20} aria-hidden /></Link></article>)}</div></Section></div>}
    {data.resolved_reports.length > 0 && <Section eyebrow="Impacto no bairro" title="Casos resolvidos" action={<Link to="/casos" search={{ page: 1, search: "", category: "" }} className="text-link">Ver casos <ArrowUpRight size={17} /></Link>}><div className="cards-grid">{data.resolved_reports.map(report => <article key={report.id} className="card"><div className="card-image"><Picture src={report.photos?.[0]?.url} alt={`Fotografia do reporte ${report.title}`} /></div><div className="card-body"><span className="pill"><MapPinned size={15} aria-hidden /> {report.zone?.name || 'Bairro'}</span><h3>{report.title}</h3><p>{report.description}</p></div></article>)}</div></Section>}
    {data.tips.length > 0 && <div className="tips-wrap"><Section eyebrow="Dicas rápidas" title="Pequenos gestos, todos os dias"><ContentCards items={data.tips} /></Section></div>}
    <section className="join-section"><div className="container join-inner"><CircleHelp size={32} aria-hidden /><div><p className="eyebrow">Faz parte da mudança</p><h2>Junta-te ao bairro</h2></div><Link to="/registar" search={{ redirect: "/app" }} className="button button-light">Criar conta</Link></div></section>
  </>
}
