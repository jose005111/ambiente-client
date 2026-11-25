import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Leaf, LogOut, Shield, UserRound } from 'lucide-react'
import { authKeys, logout, meQueryOptions } from '../../features/auth/api'
import { can } from '../../lib/permissions'

export function AppLayout() {
  const { data: user } = useQuery(meQueryOptions)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signOut = async () => { await logout(); queryClient.removeQueries({ queryKey: authKeys.me }); await navigate({ to: '/' }) }
  return <div className="app-layout"><aside className="app-sidebar"><Link to="/" className="brand"><span className="brand-icon"><Leaf size={22} aria-hidden /></span> Ambiente</Link><div className="sidebar-nav"><Link to="/app"><UserRound size={19} aria-hidden /> A minha área</Link>{can('reports:moderate', user) && <Link to="/moderacao"><Shield size={19} aria-hidden /> Moderação</Link>}{can('site:edit', user) && <Link to="/admin/site"><Leaf size={19} aria-hidden /> Site</Link>}</div><button className="sidebar-logout" onClick={signOut}><LogOut size={19} aria-hidden /> Sair</button></aside><div className="app-main"><header className="app-topbar"><span>Olá, {user?.name}</span><Link to="/" className="text-link">Ver site</Link></header><main id="main" className="app-content"><Outlet /></main></div></div>
}

export function Dashboard() {
  const { data: user } = useQuery(meQueryOptions)
  return <div className="container dashboard"><p className="eyebrow">Área pessoal</p><h1>Bem-vindo, {user?.name}</h1><p>Acompanhe a comunidade e escolha como participar.</p><div className="dashboard-links"><Link to="/aprender" search={{ page: 1, search: "", category: "" }} className="topic-card"><h2>Aprender</h2><p>Descubra os conteúdos disponíveis.</p></Link><Link to="/actividades" search={{ page: 1, search: "", category: "" }} className="topic-card"><h2>Participar</h2><p>Veja as actividades abertas.</p></Link><Link to="/eventos" search={{ page: 1, search: "", category: "" }} className="topic-card"><h2>Eventos</h2><p>Consulte a agenda comunitária.</p></Link></div></div>
}

export function ForbiddenPage() { return <div className="container state-panel"><h1>Acesso não permitido</h1><p>A sua conta não tem permissão para abrir esta página.</p><Link to="/app" className="button">Voltar à minha área</Link></div> }
