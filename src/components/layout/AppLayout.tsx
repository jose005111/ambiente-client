import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, CalendarDays, ChevronDown, ChevronRight, CircleHelp, ClipboardList, ExternalLink, FolderKanban, LayoutDashboard, Leaf, LogOut, MapPinned, Menu, Moon, PanelLeftClose, PanelLeftOpen, Shield, Sun, UserRound, Users, X } from 'lucide-react'
import { useState, type ComponentType } from 'react'
import { authKeys, logout, meQueryOptions } from '../../features/auth/api'
import { can } from '../../lib/permissions'
import { ResidentSearch } from '../../features/residents/ResidentSearch'

type NavIcon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
type Item = { label: string; to: string; icon: NavIcon }
const personal: Item[] = [
  { label: 'Início', to: '/app', icon: LayoutDashboard },
  { label: 'Quizzes', to: '/app/quizzes', icon: CircleHelp },
  { label: 'Histórico', to: '/app/historico', icon: ClipboardList },
  { label: 'Reportes', to: '/app/reportes', icon: MapPinned },
  { label: 'Actividades', to: '/app/actividades', icon: Leaf },
  { label: 'Eventos', to: '/app/eventos', icon: CalendarDays },
]
const moderation: Item[] = [
  { label: 'Visão geral', to: '/moderacao', icon: LayoutDashboard },
  { label: 'Moradores', to: '/moderacao/moradores', icon: Users },
  { label: 'Reportes', to: '/moderacao/reportes', icon: MapPinned },
  { label: 'Provas', to: '/moderacao/provas', icon: ClipboardList },
  { label: 'Quizzes', to: '/moderacao/quizzes', icon: CircleHelp },
  { label: 'Conteúdos', to: '/moderacao/conteudos', icon: BookOpen },
  { label: 'Actividades', to: '/moderacao/actividades', icon: Leaf },
  { label: 'Eventos', to: '/moderacao/eventos', icon: CalendarDays },
]
const administration: Item[] = [
  { label: 'Site', to: '/admin/site', icon: FolderKanban },
  { label: 'Utilizadores', to: '/admin/utilizadores', icon: Users },
  { label: 'Zonas', to: '/admin/zonas', icon: MapPinned },
  { label: 'Categorias', to: '/admin/categorias', icon: Leaf },
]

function NavGroup({ label, icon: Icon, items, path, onNavigate, collapsed, onExpand }: { label: string; icon: NavIcon; items: Item[]; path: string; onNavigate: () => void; collapsed: boolean; onExpand: () => void }) {
  const containsActive = items.some(item => path === item.to || (item.to !== '/app' && path.startsWith(item.to + '/')))
  return <details className="sidebar-group" key={`${label}-${collapsed}-${path}`} open={collapsed ? undefined : containsActive || undefined}>
    <summary onClick={collapsed ? event => { event.preventDefault(); onExpand() } : undefined} title={label}><Icon size={19} aria-hidden /><span>{label}</span><ChevronRight className="group-chevron" size={16} aria-hidden /></summary>
    <div className="sidebar-group-items">{items.map(item => { const active = path === item.to || (item.to !== '/app' && path.startsWith(item.to + '/')); const ItemIcon = item.icon; return <Link key={item.to} to={item.to} onClick={onNavigate} className={active ? 'sidebar-link active' : 'sidebar-link'} aria-current={active ? 'page' : undefined} title={collapsed ? item.label : undefined}><ItemIcon size={18} aria-hidden /><span>{item.label}</span></Link> })}</div>
  </details>
}

export function AppLayout() {
  const { data: user } = useQuery(meQueryOptions)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches))
  const groups = [
    { label: 'Área pessoal', icon: UserRound, items: user?.role.name === 'moderador' ? [personal[0], { label: 'Perfil', to: '/app/perfil', icon: UserRound }] : [...personal, { label: 'Perfil', to: '/app/perfil', icon: UserRound }] },
    ...(can('reports:moderate', user) ? [{ label: 'Moderação', icon: Shield, items: moderation }] : []),
    ...(can('site:edit', user) ? [{ label: 'Administração', icon: FolderKanban, items: administration }] : []),
  ]
  const current = groups.flatMap(group => group.items).filter(item => location.pathname === item.to || (item.to !== '/app' && location.pathname.startsWith(item.to + '/'))).sort((a, b) => b.to.length - a.to.length)[0]
  const signOut = async () => { await logout(); queryClient.removeQueries({ queryKey: authKeys.me }); await navigate({ to: '/' }) }
  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light' }
  return <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
    <a className="skip-link" href="#main">Saltar para o conteúdo</a>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setMobileOpen(false)} />}
    <aside className="app-sidebar" aria-label="Navegação da aplicação">
      <div className="sidebar-brand"><Link to="/app" className="brand" onClick={() => setMobileOpen(false)}><span className="brand-icon"><Leaf size={22} aria-hidden /></span><span className="brand-name">Ambiente<small>Plataforma comunitária</small></span></Link><button className="sidebar-mobile-close" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}><X size={20} aria-hidden /></button></div>
      <nav className="sidebar-nav" aria-label="Áreas da aplicação">{groups.map(group => <NavGroup key={group.label} {...group} path={location.pathname} collapsed={collapsed} onExpand={() => setCollapsed(false)} onNavigate={() => setMobileOpen(false)} />)}</nav>
      <div className="sidebar-bottom"><Link to="/" className="sidebar-link" title="Ver site" onClick={() => setMobileOpen(false)}><ExternalLink size={18} aria-hidden /><span>Ver site</span></Link><button className="sidebar-link sidebar-logout" onClick={signOut} title="Sair"><LogOut size={18} aria-hidden /><span>Sair</span></button></div>
    </aside>
    <div className="app-main"><header className="app-topbar"><div className="topbar-leading"><button className="topbar-icon sidebar-desktop-trigger" aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={20} aria-hidden /> : <PanelLeftClose size={20} aria-hidden />}</button><button className="topbar-icon sidebar-mobile-trigger" aria-label="Abrir menu lateral" onClick={() => setMobileOpen(true)}><Menu size={20} aria-hidden /></button><span className="topbar-divider" /><div className="topbar-location"><span>{groups.find(group => group.items.some(item => item.to === current?.to))?.label || 'Área pessoal'}</span><ChevronRight size={14} aria-hidden /><strong>{current?.label || 'Início'}</strong></div></div><div className="topbar-actions">{can('reports:moderate', user) && <ResidentSearch compact />}<button className="topbar-icon" onClick={toggleTheme} aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'} title={dark ? 'Usar tema claro' : 'Usar tema escuro'}>{dark ? <Sun size={19} aria-hidden /> : <Moon size={19} aria-hidden />}</button><details className="topbar-user"><summary aria-label="Menu da conta"><span className="user-avatar">{user?.name?.slice(0, 1).toUpperCase() || 'U'}</span><span className="user-summary"><strong>{user?.name}</strong><small>{user?.role.label}</small></span><ChevronDown size={16} aria-hidden /></summary><div className="user-menu"><span className="user-menu-email">{user?.email}</span><Link to="/app/perfil"><UserRound size={17} aria-hidden /> Perfil</Link><Link to="/"><ExternalLink size={17} aria-hidden /> Ver site</Link><button onClick={signOut}><LogOut size={17} aria-hidden /> Sair</button></div></details></div></header><main id="main" className="app-content"><Outlet /></main></div>
  </div>
}

export function Dashboard() {
  const { data: user } = useQuery(meQueryOptions)
  if (user?.role.name === 'moderador') return <div className="container dashboard"><p className="eyebrow">Área de moderação</p><h1>Bem-vindo, {user.name}</h1><p>Acompanhe os reportes e as provas da comunidade.</p><div className="dashboard-links"><Link to="/moderacao/reportes" className="topic-card"><h2>Reportes</h2><p>Ver e actualizar estados.</p></Link><Link to="/moderacao/provas" className="topic-card"><h2>Provas</h2><p>Rever actividades submetidas.</p></Link></div></div>
  return <div className="container dashboard"><p className="eyebrow">Área pessoal</p><h1>Bem-vindo, {user?.name}</h1><p>Acompanhe a comunidade e escolha como participar.</p><div className="dashboard-links"><Link to="/aprender" search={{ page: 1, search: "", category: "" }} className="topic-card"><h2>Aprender</h2><p>Descubra os conteúdos disponíveis.</p></Link><Link to="/actividades" search={{ page: 1, search: "", category: "" }} className="topic-card"><h2>Participar</h2><p>Veja as actividades abertas.</p></Link><Link to="/eventos" search={{ page: 1, search: "", category: "" }} className="topic-card"><h2>Eventos</h2><p>Consulte a agenda comunitária.</p></Link></div></div>
}

export function ForbiddenPage() { return <div className="container state-panel"><h1>Acesso não permitido</h1><p>A sua conta não tem permissão para abrir esta página.</p><Link to="/app" className="button">Voltar à minha área</Link></div> }
