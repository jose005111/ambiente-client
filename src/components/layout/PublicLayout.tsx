import { Link, Outlet } from '@tanstack/react-router'
import { Leaf, Menu, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getToken } from '../../lib/http'
import { homeQueryOptions } from '../../features/landing/api'

export function PublicLayout() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('ambiente:theme') === 'dark')
  const { data } = useQuery(homeQueryOptions)
  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem('ambiente:theme', next ? 'dark' : 'light')
    document.documentElement.dataset.theme = next ? 'dark' : 'light'
  }
  return <>
    <a className="skip-link" href="#main">Saltar para o conteúdo</a>
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}><span className="brand-icon"><Leaf size={23} aria-hidden /></span><span>{data?.settings.site_name || 'Ambiente'}</span></Link>
        <button className="icon-button menu-toggle" aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open} onClick={() => setOpen(!open)}><Menu aria-hidden /></button>
        <nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Navegação principal">
          <Link to="/aprender" search={{ page: 1, search: "", category: "" }} onClick={() => setOpen(false)}>Aprender</Link>
          <Link to="/actividades" search={{ page: 1, search: "", category: "" }} onClick={() => setOpen(false)}>Actividades</Link>
          <Link to="/eventos" search={{ page: 1, search: "", category: "" }} onClick={() => setOpen(false)}>Eventos</Link>
          <Link to="/casos" search={{ page: 1, search: "", category: "" }} onClick={() => setOpen(false)}>Casos resolvidos</Link>
          <button className="icon-button" onClick={toggleTheme} aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}>{dark ? <Sun aria-hidden /> : <Moon aria-hidden />}</button>
          {getToken() ? <Link to="/app" className="button button-small">A minha área</Link> : <><Link to="/entrar" search={{ redirect: "/app" }}>Entrar</Link><Link to="/registar" search={{ redirect: "/app" }} className="button button-small">Criar conta</Link></>}
        </nav>
      </div>
    </header>
    <main id="main"><Outlet /></main>
    <footer className="site-footer"><div className="container footer-inner"><span>{data?.settings.site_name || 'Ambiente'}</span><span>{data?.settings.footer_text || 'Uma comunidade que cuida do seu bairro.'}</span>{data?.settings.contact_email && <a href={`mailto:${data.settings.contact_email}`}>{data.settings.contact_email}</a>}{data?.settings.social.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>)}</div></footer>
  </>
}
