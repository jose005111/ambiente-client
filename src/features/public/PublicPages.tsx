import { Link, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, CalendarDays, MapPinned, RotateCcw, Search } from 'lucide-react'
import { useRef, useState } from 'react'
import { errorMessage, getToken, http } from '../../lib/http'
import { homeQueryOptions } from '../landing/api'
import { meQueryOptions } from '../auth/api'

export type ListKind = 'contents' | 'activities' | 'events' | 'reports/public'
export type ListSearch = { page: number; search: string; category: string }
type Item = { id: number; slug?: string; title: string; summary?: string; description?: string; type?: string; cover_image?: string | null; location?: string; starts_at?: string | null; status_label?: string; zone?: { name: string } | null; category?: { name: string } | null; photos?: { id: number; url: string }[] }
type Page = { data: Item[]; meta: { current_page: number; last_page: number; total: number } }
const mediaUrl = (path: string) => path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/') ? path : `/storage/${path}`

const settings: Record<ListKind, { title: string; eyebrow: string; intro: string; path: '/aprender/$slug' | '/actividades/$slug' | '/eventos/$slug' | null }> = {
  contents: { title: 'Aprender', eyebrow: 'Conhecimento para todos', intro: 'Explora conteúdos sobre o ambiente e encontra ideias para aplicar no dia a dia.', path: '/aprender/$slug' },
  activities: { title: 'Actividades', eyebrow: 'Põe as mãos à obra', intro: 'Descobre actividades abertas e participa com a comunidade.', path: '/actividades/$slug' },
  events: { title: 'Eventos', eyebrow: 'Agenda do bairro', intro: 'Encontra os próximos encontros e campanhas.', path: '/eventos/$slug' },
  'reports/public': { title: 'Casos resolvidos', eyebrow: 'Mudanças que se vêem', intro: 'Acompanha os problemas ambientais já resolvidos no bairro.', path: null },
}

export function ListingPage({ kind, filters, routePath }: { kind: ListKind; filters: ListSearch; routePath: '/aprender' | '/actividades' | '/eventos' | '/casos' }) {
  const navigate = useNavigate()
  const { data: home, isError: homeError } = useQuery(homeQueryOptions)
  const categoryId = home?.categories.find(category => category.slug === filters.category)?.id
  const searchTimer = useRef<number | null>(null)
  const [clearVersion, setClearVersion] = useState(0)
  const changeSearch = (value: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(() => navigate({ to: routePath, search: { ...filters, search: value, page: 1 } }), 300)
  }
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [kind, 'list', filters],
    queryFn: async ({ signal }) => (await http.get<Page>(`/${kind}`, { params: { page: filters.page, search: filters.search || undefined, 'filter[category]': categoryId }, signal })).data,
    enabled: !filters.category || !!home,
    placeholderData: keepPreviousData,
  })
  const config = settings[kind]
  return <div className="container inner-page"><div className="page-intro"><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p>{config.intro}</p></div>
    <div className="filters"><label className="search-field"><Search size={19} aria-hidden /><span className="sr-only">Pesquisar</span><input key={`${filters.search}-${clearVersion}`} defaultValue={filters.search} onChange={event => changeSearch(event.target.value)} placeholder="Pesquisar" /></label><button type="button" className="button button-outline button-small" onClick={() => { if (searchTimer.current) window.clearTimeout(searchTimer.current); setClearVersion(value => value + 1); navigate({ to: routePath, search: { page: 1, search: '', category: '' } }) }}><RotateCcw size={16} aria-hidden /> Limpar filtros</button></div>
    {filters.category && homeError ? <div className="state-panel"><h2>Não foi possível carregar os temas</h2><p>Verifique a sua ligação e tente novamente.</p></div> : filters.category && home && !categoryId ? <div className="state-panel"><h2>Tema não encontrado</h2></div> : isPending ? <div className="skeleton skeleton-row" role="status">A carregar resultados…</div> : isError ? <div className="state-panel"><h2>Não foi possível carregar</h2><p>Verifique a sua ligação.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.data.length === 0 ? <div className="state-panel"><h2>Nenhum resultado encontrado</h2><p>Tente outra pesquisa ou volte mais tarde.</p></div> : <><div className="cards-grid">{data.data.map(item => config.path && item.slug ? <Link key={item.id} to={config.path} params={{ slug: item.slug }} className="card content-card"><div className="card-image">{item.cover_image ? <img src={mediaUrl(item.cover_image)} alt={`Capa de ${item.title}`} loading="lazy" /> : <span className="image-fallback" aria-hidden="true" />}</div><div className="card-body"><span className="pill">{item.category?.name || item.type || item.status_label || item.location || 'Conteúdo'}</span><h2>{item.title}</h2><p>{item.summary || item.description}</p><span className="card-link">Ver detalhes <ArrowUpRight size={17} aria-hidden /></span></div></Link> : <article key={item.id} className="card content-card"><div className="card-body"><span className="pill"><MapPinned size={15} aria-hidden /> {item.zone?.name || 'Bairro'}</span><h2>{item.title}</h2><p>{item.description}</p></div></article>)}</div><div className="pagination"><span>Página {data.meta.current_page} de {data.meta.last_page} · {data.meta.total} resultados</span><div><button className="button button-outline button-small" disabled={filters.page <= 1} onClick={() => navigate({ to: routePath, search: { ...filters, page: filters.page - 1 } })}>Anterior</button><button className="button button-small" disabled={filters.page >= data.meta.last_page} onClick={() => navigate({ to: routePath, search: { ...filters, page: filters.page + 1 } })}>Seguinte</button></div></div></>}
  </div>
}

export function DetailPage({ kind, slug }: { kind: 'contents' | 'activities' | 'events'; slug: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notice, setNotice] = useState('')
  const { data: user } = useQuery(meQueryOptions)
  const { data, isPending, isError, refetch } = useQuery({ queryKey: [kind, 'detail', slug, user?.id || 'guest'], queryFn: async ({ signal }) => (await http.get<{ data: Item & { body?: string; instructions?: string; id: number; status?: string; vagas_livres?: number | null; my_participation_status?: string | null; my_registration_status?: string | null } }>(`/${kind}/${slug}`, { signal })).data.data, enabled: !getToken() || !!user })
  const action = useMutation({ mutationFn: async () => { if (!data) return; await http.post(`/${kind}/${data.id}/${kind === 'activities' ? 'join' : 'register'}`) }, onSuccess: () => { setNotice('Inscrição realizada com sucesso.'); queryClient.invalidateQueries({ queryKey: [kind, 'mine'] }); queryClient.invalidateQueries({ queryKey: [kind, 'detail', slug] }) }, onError: error => setNotice(errorMessage(error)) })
  const back = kind === 'contents' ? '/aprender' : kind === 'activities' ? '/actividades' : '/eventos'
  const alreadyJoined = kind === 'activities' ? !!data?.my_participation_status : data?.my_registration_status === 'inscrito' || data?.my_registration_status === 'presente'
  return <div className="container inner-page detail-page"><Link to={back} search={{ page: 1, search: '', category: '' }} className="text-link">Voltar à lista</Link>{isPending ? <div className="skeleton skeleton-hero" role="status">A carregar…</div> : isError ? <div className="state-panel"><h1>Não foi possível carregar</h1><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : <article><div className="page-intro"><p className="eyebrow">{kind === 'contents' ? 'Aprender' : kind === 'activities' ? 'Actividade' : 'Evento'}</p><h1>{data.title}</h1><p>{data.summary || data.location}</p>{data.category?.name && <span className="pill">{data.category.name}</span>}</div>{data.cover_image && <img className="detail-image" src={mediaUrl(data.cover_image)} alt={`Capa de ${data.title}`} />}{kind === 'activities' && data.photos && data.photos.length > 1 && <div className="activity-gallery">{data.photos.slice(1).map(photo => <img key={photo.id} src={mediaUrl(photo.url)} alt={`Fotografia de ${data.title}`} loading="lazy" />)}</div>}{data.starts_at && <p className="detail-meta"><CalendarDays size={19} aria-hidden /> {new Intl.DateTimeFormat('pt', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(data.starts_at))}</p>}<div className="detail-copy">{data.body || data.instructions || data.description}</div>{kind !== 'contents' && <div className="detail-actions">{notice && <p role="status">{notice}</p>}<button className="button" disabled={action.isPending || action.isSuccess || alreadyJoined || user?.role.name === 'moderador' || (kind === 'activities' && data.status !== 'aberta') || (kind === 'events' && data.vagas_livres === 0)} onClick={() => getToken() ? action.mutate() : navigate({ to: '/entrar', search: { redirect: window.location.pathname } })}>{alreadyJoined || action.isSuccess ? 'Já inscrito' : kind === 'activities' ? data.status !== 'aberta' ? 'Inscrições encerradas' : 'Participar' : data.vagas_livres === 0 ? 'Sem vagas' : 'Inscrever-me'}</button></div>}</article>}</div>
}
