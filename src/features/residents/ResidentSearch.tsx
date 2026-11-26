import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, Search, UserRound, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { errorMessage, http } from '../../lib/http'

type Resident = { id: number; name: string; email: string; phone: string | null; zone: string | null; is_active: boolean }
type Page<T> = { data: T[]; meta: { current_page: number; last_page: number; total: number } }

export function ResidentSearch({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [term, setTerm] = useState('')
  const [focused, setFocused] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setTerm(search.trim()), 300); return () => window.clearTimeout(timer) }, [search])
  const results = useQuery({ queryKey: ['residents', 'search', term], queryFn: async ({ signal }) => (await http.get<Page<Resident>>('/residents', { params: { search: term }, signal })).data, enabled: term.length >= 2, staleTime: 30_000 })
  const openResident = (id: number) => { setFocused(false); setSearch(''); navigate({ to: '/moderacao/moradores/$id', params: { id: String(id) } }) }
  const submit = (event: FormEvent) => { event.preventDefault(); if (results.data?.data[0]) openResident(results.data.data[0].id) }
  return <div className={compact ? 'resident-search compact' : 'resident-search'} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}><form onSubmit={submit} role="search"><Search size={18} aria-hidden /><input aria-label="Pesquisar moradores" placeholder="Pesquisar moradores por nome, e-mail ou telefone" value={search} onChange={event => setSearch(event.target.value)} onFocus={() => setFocused(true)} onKeyDown={event => { if (event.key === 'Escape') setFocused(false) }} />{search && <button type="button" className="resident-search-clear" aria-label="Limpar filtros" title="Limpar filtros" onClick={() => { setSearch(''); setTerm(''); setFocused(false) }}><X size={16} aria-hidden /></button>}<span className="sr-only">Introduza pelo menos dois caracteres</span></form>
    {focused && term.length >= 2 && <div className="resident-search-results" role="status">{results.isPending ? <p>A pesquisar…</p> : results.isError ? <p>{errorMessage(results.error)}</p> : results.data.data.length === 0 ? <p>Nenhum morador encontrado.</p> : <>{results.data.data.map(item => <button key={item.id} onMouseDown={event => event.preventDefault()} onClick={() => openResident(item.id)}><span className="resident-result-avatar"><UserRound size={17} aria-hidden /></span><span><strong>{item.name}</strong><small>{item.email} · {item.zone || 'Sem zona'}</small></span><ArrowRight size={16} aria-hidden /></button>)}{results.data.meta.total > 10 && <Link to="/moderacao/moradores" search={{ search: term }} onClick={() => setFocused(false)}>Ver todos os resultados</Link>}</>}</div>}
  </div>
}

