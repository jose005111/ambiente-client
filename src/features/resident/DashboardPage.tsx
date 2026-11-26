import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowUpRight, CalendarDays, CircleHelp, Leaf, MapPinned } from 'lucide-react'
import type { ReactNode } from 'react'
import { meQueryOptions } from '../auth/api'
import { errorMessage, http } from '../../lib/http'

type Page<T> = { data: T[]; meta: { total: number } }
type Registration = { id: number; status: string; event?: { slug: string; title: string; starts_at: string | null; location: string } }
type Report = { id: number; title: string; status_label: string; updated_at: string | null }
type Participation = { id: number; status_label: string; activity?: { slug: string; title: string } }
type Quiz = { id: number; title: string; questions_count: number; category?: { name: string } }

const dateLabel = (value: string) => new Intl.DateTimeFormat('pt-PT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

function Panel({ title, icon, action, loading, error, retry, empty, children }: { title: string; icon: ReactNode; action: ReactNode; loading: boolean; error?: string; retry: () => void; empty: string; children: ReactNode }) {
  return <section className="resident-dashboard-panel"><div className="resident-dashboard-panel-head"><span className="resident-dashboard-panel-icon">{icon}</span><h2>{title}</h2>{action}</div>
    {loading ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : error ? <div className="resident-dashboard-empty"><p>{error}</p><button className="button button-outline button-small" onClick={retry}>Tentar de novo</button></div> : children || <p className="resident-dashboard-empty">{empty}</p>}
  </section>
}

export function ResidentDashboardPage() {
  const { data: user } = useQuery(meQueryOptions)
  const events = useQuery({ queryKey: ['dashboard', 'my-upcoming-events'], queryFn: async ({ signal }) => {
    const response = (await http.get<Page<Registration>>('/me/registrations', { params: { per_page: 50, 'filter[status]': 'inscrito' }, signal })).data
    const now = Date.now()
    return response.data.filter(item => item.event?.starts_at && new Date(item.event.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.event!.starts_at!).getTime() - new Date(b.event!.starts_at!).getTime()).slice(0, 3)
  }, staleTime: 30_000 })
  const reports = useQuery({ queryKey: ['dashboard', 'my-open-reports'], queryFn: async ({ signal }) => (await http.get<Page<Report>>('/me/reports', { params: { per_page: 3, 'filter[status]': 'recebido,em_analise', sort: '-updated_at' }, signal })).data, staleTime: 30_000 })
  const activities = useQuery({ queryKey: ['dashboard', 'my-activities'], queryFn: async ({ signal }) => (await http.get<Page<Participation>>('/me/participations', { params: { per_page: 3, 'filter[status]': 'inscrito,submetido' }, signal })).data, staleTime: 30_000 })
  const quizzes = useQuery({ queryKey: ['dashboard', 'quizzes'], queryFn: async ({ signal }) => (await http.get<Page<Quiz>>('/quizzes', { params: { per_page: 3 }, signal })).data, staleTime: 60_000 })
  const upcoming = events.data || []

  return <div className="dashboard resident-dashboard"><div className="resident-dashboard-intro"><p className="eyebrow">Área pessoal</p><h1>Bem-vindo, {user?.name || 'morador'}</h1><p>Acompanhe as suas participações e encontre uma próxima acção para o bairro.</p></div>
    <div className="resident-dashboard-grid">
      <Panel title="Próximos eventos" icon={<CalendarDays size={22} aria-hidden />} action={<Link to="/app/eventos" className="text-link">Ver inscrições <ArrowUpRight size={16} aria-hidden /></Link>} loading={events.isPending} error={events.isError ? errorMessage(events.error) : undefined} retry={() => events.refetch()} empty="Não tem eventos próximos.">
        {upcoming.length > 0 && <ul className="resident-dashboard-list">{upcoming.map(item => <li key={item.id}><Link to="/eventos/$slug" params={{ slug: item.event!.slug }}><strong>{item.event!.title}</strong><span>{dateLabel(item.event!.starts_at!)} · {item.event!.location}</span></Link></li>)}</ul>}
      </Panel>
      <Panel title="Reportes em curso" icon={<MapPinned size={22} aria-hidden />} action={<Link to="/app/reportes" className="text-link">Ver reportes <ArrowUpRight size={16} aria-hidden /></Link>} loading={reports.isPending} error={reports.isError ? errorMessage(reports.error) : undefined} retry={() => reports.refetch()} empty="Não há reportes em curso.">
        {reports.data?.data.length ? <ul className="resident-dashboard-list">{reports.data.data.map(item => <li key={item.id}><Link to="/app/reportes/$id" params={{ id: String(item.id) }}><strong>{item.title}</strong><span>{item.status_label}</span></Link></li>)}</ul> : null}
      </Panel>
      <Panel title="As minhas actividades" icon={<Leaf size={22} aria-hidden />} action={<Link to="/app/actividades" className="text-link">Ver actividades <ArrowUpRight size={16} aria-hidden /></Link>} loading={activities.isPending} error={activities.isError ? errorMessage(activities.error) : undefined} retry={() => activities.refetch()} empty="Ainda não participa em actividades.">
        {activities.data?.data.length ? <ul className="resident-dashboard-list">{activities.data.data.map(item => <li key={item.id}>{item.activity ? <Link to="/actividades/$slug" params={{ slug: item.activity.slug }}><strong>{item.activity.title}</strong><span>{item.status_label}</span></Link> : <span>Actividade · {item.status_label}</span>}</li>)}</ul> : null}
      </Panel>
      <Panel title="Quizzes para explorar" icon={<CircleHelp size={22} aria-hidden />} action={<Link to="/app/quizzes" className="text-link">Ver quizzes <ArrowUpRight size={16} aria-hidden /></Link>} loading={quizzes.isPending} error={quizzes.isError ? errorMessage(quizzes.error) : undefined} retry={() => quizzes.refetch()} empty="Ainda não há quizzes publicados.">
        {quizzes.data?.data.length ? <ul className="resident-dashboard-list">{quizzes.data.data.map(item => <li key={item.id}><Link to="/app/quizzes/$id" params={{ id: String(item.id) }}><strong>{item.title}</strong><span>{item.category?.name || 'Educação ambiental'} · {item.questions_count} perguntas</span></Link></li>)}</ul> : null}
      </Panel>
    </div>
  </div>
}
