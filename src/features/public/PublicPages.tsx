import { Link, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { ArrowUpRight, CalendarDays, MapPinned, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { errorMessage, getToken, http } from '../../lib/http'

export type ListKind = 'contents' | 'activities' | 'events' | 'reports/public'
export type ListSearch = { page: number; search: string; category: string }
type Item = { id: number; slug?: string; title: string; summary?: string; description?: string; type?: string; cover_image?: string | null; location?: string; starts_at?: string | null; status_label?: string; zone?: { name: string } | null }
type Page = { data: Item[]; meta: { current_page: number; last_page: number; total: number } }

const settings: Record<ListKind, { title: string; eyebrow: string; intro: string; path: '/aprender/$slug' | '/actividades/$slug' | '/eventos/$slug' | null }> = {
  contents: { title: 'Aprender', eyebrow: 'Conhecimento para todos', intro: 'Explora conteúdos sobre o ambiente e encontra ideias para aplicar no dia a dia.', path: '/aprender/$slug' },
  activities: { title: 'Actividades', eyebrow: 'Põe as mãos à obra', intro: 'Descobre actividades abertas e participa com a comunidade.', path: '/actividades/$slug' },
  events: { title: 'Eventos', eyebrow: 'Agenda do bairro', intro: 'Encontra os próximos encontros e campanhas.', path: '/eventos/$slug' },
  'reports/public': { title: 'Casos resolvidos', eyebrow: 'Mudanças que se vêem', intro: 'Acompanha os problemas ambientais já resolvidos no bairro.', path: null },
}

export function ListingPage({ kind, filters, routePath }: { kind: ListKind; filters: ListSearch; routePath: '/aprender' | '/actividades' | '/eventos' | '/casos' }) {
  const navigate = useNavigate()
  const [term, setTerm] = useState(filters.search)
  useEffect(() => setTerm(filters.search), [filters.search])
  useEffect(() => {
    if (term === filters.search) return
    const timer = window.setTimeout(() => navigate({ to: routePath, search: { ...filters, search: term, page: 1 } }), 300)
    return () => window.clearTimeout(timer)
  }, [term, filters, navigate, routePath])
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [kind, 'list', filters],
    queryFn: async ({ signal }) => (await http.get<Page>(`/${kind}`, { params: { page: filters.page, search: filters.search || undefined, 'filter[category]': filters.category || undefined }, signal })).data,
    placeholderData: keepPreviousData,
  })
  const config = settings[kind]
  return <div className="container inner-page"><div className="page-intro"><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p>{config.intro}</p></div>
    <div className="filters"><label className="search-field"><Search size={19} aria-hidden /><span className="sr-only">Pesquisar</span><input value={term} onChange={event => setTerm(event.target.value)} placeholder="Pesquisar" /></label><button className="button button-outline button-small" onClick={() => { setTerm(''); navigate({ to: routePath, search: { page: 1, search: '', category: '' } }) }}>Limpar filtros</button></div>
    {isPending ? <div className="skeleton skeleton-row" role="status">A carregar resultados…</div> : isError ? <div className="state-panel"><h2>Não foi possível carregar</h2><p>Verifique a sua ligação.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.data.length === 0 ? <div className="state-panel"><h2>Nenhum resultado encontrado</h2><p>Tente outra pesquisa ou volte mais tarde.</p></div> : <><div className="cards-grid">{data.data.map(item => config.path && item.slug ? <Link key={item.id} to={config.path} params={{ slug: item.slug }} className="card content-card"><div className="card-image">{item.cover_image ? <img src={item.cover_image} alt={`Capa de ${item.title}`} loading="lazy" /> : <span className="image-fallback" aria-hidden="true" />}</div><div className="card-body"><span className="pill">{item.type || item.status_label || item.location || 'Conteúdo'}</span><h2>{item.title}</h2><p>{item.summary || item.description}</p><span className="card-link">Ver detalhes <ArrowUpRight size={17} aria-hidden /></span></div></Link> : <article key={item.id} className="card content-card"><div className="card-body"><span className="pill"><MapPinned size={15} aria-hidden /> {item.zone?.name || 'Bairro'}</span><h2>{item.title}</h2><p>{item.description}</p></div></article>)}</div><div className="pagination"><span>Página {data.meta.current_page} de {data.meta.last_page} · {data.meta.total} resultados</span><div><button className="button button-outline button-small" disabled={filters.page <= 1} onClick={() => navigate({ to: routePath, search: { ...filters, page: filters.page - 1 } })}>Anterior</button><button className="button button-small" disabled={filters.page >= data.meta.last_page} onClick={() => navigate({ to: routePath, search: { ...filters, page: filters.page + 1 } })}>Seguinte</button></div></div></>}
  </div>
}

export function DetailPage({ kind, slug }: { kind: 'contents' | 'activities' | 'events'; slug: string }) {
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const { data, isPending, isError, refetch } = useQuery({ queryKey: [kind, 'detail', slug], queryFn: async ({ signal }) => (await http.get<{ data: Item & { body?: string; instructions?: string; id: number; vagas_livres?: number | null } }>(`/${kind}/${slug}`, { signal })).data.data })
  const action = useMutation({ mutationFn: async () => { if (!data) return; await http.post(`/${kind}/${data.id}/${kind === 'activities' ? 'join' : 'register'}`) }, onSuccess: () => setNotice('Inscrição realizada com sucesso.'), onError: error => setNotice(errorMessage(error)) })
  const back = kind === 'contents' ? '/aprender' : kind === 'activities' ? '/actividades' : '/eventos'
  return <div className="container inner-page detail-page"><Link to={back} search={{ page: 1, search: '', category: '' }} className="text-link">Voltar à lista</Link>{isPending ? <div className="skeleton skeleton-hero" role="status">A carregar…</div> : isError ? <div className="state-panel"><h1>Não foi possível carregar</h1><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : <article><div className="page-intro"><p className="eyebrow">{kind === 'contents' ? 'Aprender' : kind === 'activities' ? 'Actividade' : 'Evento'}</p><h1>{data.title}</h1><p>{data.summary || data.location}</p></div>{data.cover_image && <img className="detail-image" src={data.cover_image} alt={`Capa de ${data.title}`} />}{data.starts_at && <p className="detail-meta"><CalendarDays size={19} aria-hidden /> {new Intl.DateTimeFormat('pt', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(data.starts_at))}</p>}<div className="detail-copy">{data.body || data.instructions || data.description}</div>{kind !== 'contents' && <div className="detail-actions">{notice && <p role="status">{notice}</p>}<button className="button" disabled={action.isPending || (kind === 'events' && data.vagas_livres === 0)} onClick={() => getToken() ? action.mutate() : navigate({ to: '/entrar', search: { redirect: window.location.pathname } })}>{kind === 'activities' ? 'Participar' : data.vagas_livres === 0 ? 'Sem vagas' : 'Inscrever-me'}</button></div>}</article>}</div>
}
