import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CheckCircle2, Eye, Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ClearFiltersButton, ActionIcon, ConfirmDialog, ManagementTable, Modal, SearchField } from '../../components/ui/ManagementUI'
import { useDebouncedSearch } from '../../components/ui/useDebouncedSearch'
import { errorMessage, http } from '../../lib/http'
import { SelectField } from '../../components/ui/select'
import { ValidatedForm } from '../../components/ui/ValidatedForm'

type Page<T> = { data: T[] }
type User = { id: number; name: string; email: string; role: string; is_active: boolean }
type Reference = { id: number; name: string; description: string | null; slug?: string }

export function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const term = useDebouncedSearch(search)
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['admin', 'users', activeFilter, term], queryFn: async ({ signal }) => (await http.get<Page<User>>('/users', { params: { per_page: 50, search: term || undefined, 'filter[is_active]': activeFilter || undefined }, signal })).data.data })
  const [selected, setSelected] = useState<User | null>(null)
  const [viewing, setViewing] = useState<User | null>(null)
  const [notice, setNotice] = useState('')
  const update = useMutation({ mutationFn: async ({ id, active }: { id: number; active: boolean }) => http.patch(`/users/${id}`, { is_active: active }), onSuccess: () => { setNotice('Conta actualizada.'); setSelected(null); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }) } })
  return <div className="dashboard management-page"><p className="eyebrow">Administração</p><h1>Utilizadores</h1><p className="muted">Consulte e active ou desactive contas.</p>{notice && <p className="success-message" role="status">{notice}</p>}<div className="management-filters"><SelectField label="Estado" className="filter-select" value={activeFilter} onValueChange={setActiveFilter} emptyLabel="Todos" options={[{ value: '1', label: 'Activos' }, { value: '0', label: 'Inactivos' }]} /><SearchField value={search} onChange={setSearch} placeholder="Pesquisar utilizadores" /><ClearFiltersButton onClick={() => { setSearch(''); setActiveFilter('') }} disabled={!search && !activeFilter} /></div>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar os utilizadores.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><p>Não há utilizadores.</p></div> : <ManagementTable headers={['Utilizador', 'Papel', 'Estado', 'Ações']}>
    {data.map(user => <tr key={user.id}><td><span className="table-primary">{user.name}</span><span className="table-secondary">{user.email}</span></td><td>{user.role}</td><td><span className="pill">{user.is_active ? 'Activo' : 'Inactivo'}</span></td><td><div className="table-actions"><ActionIcon label="Ver detalhes" icon={Eye} onClick={() => setViewing(user)} /><ActionIcon label={user.is_active ? 'Desactivar conta' : 'Activar conta'} icon={user.is_active ? Power : CheckCircle2} onClick={() => setSelected(user)} tone={user.is_active ? 'danger' : 'success'} /></div></td></tr>)}
  </ManagementTable>}{viewing && <Modal title={`Detalhes de ${viewing.name}`} onClose={() => setViewing(null)}><div className="record-detail"><p><strong>E-mail:</strong> {viewing.email}</p><p><strong>Papel:</strong> {viewing.role}</p><p><strong>Estado:</strong> {viewing.is_active ? 'Activo' : 'Inactivo'}</p>{viewing.role === 'residente' && <Link to="/moderacao/moradores/$id" params={{ id: String(viewing.id) }} className="button button-outline" onClick={() => setViewing(null)}>Ver perfil completo</Link>}</div></Modal>}{selected && <ConfirmDialog title={selected.is_active ? 'Desactivar conta' : 'Activar conta'} message={`Confirma a alteração do estado da conta de ${selected.name}?`} onCancel={() => setSelected(null)} onConfirm={() => update.mutate({ id: selected.id, active: !selected.is_active })} pending={update.isPending} error={update.isError ? errorMessage(update.error) : undefined} danger={selected.is_active} />}{update.isError && <p className="form-error" role="alert">{errorMessage(update.error)}</p>}</div>
}

export function ReferencesPage({ kind }: { kind: 'zones' | 'categories' }) {
  const queryClient = useQueryClient()
  const title = kind === 'zones' ? 'Zonas' : 'Categorias'
  const key = ['admin', kind]
  const [search, setSearch] = useState('')
  const term = useDebouncedSearch(search)
  const { data, isPending, isError, refetch } = useQuery({ queryKey: [...key, term], queryFn: async ({ signal }) => (await http.get<Page<Reference>>(`/${kind}`, { params: { per_page: 50, search: term || undefined }, signal })).data.data })
  const [editing, setEditing] = useState<Reference | 'new' | null>(null)
  const [removing, setRemoving] = useState<Reference | null>(null)
  const [viewing, setViewing] = useState<Reference | null>(null)
  const [notice, setNotice] = useState('')
  const remove = useMutation({ mutationFn: async (id: number) => http.delete(`/${kind}/${id}`), onSuccess: () => { setRemoving(null); setNotice('Registo removido.'); queryClient.invalidateQueries({ queryKey: key }) } })
  return <div className="dashboard management-page"><div className="page-actions"><div><p className="eyebrow">Administração</p><h1>{title}</h1><p className="muted">Gira as opções usadas na plataforma.</p></div><button className="button" onClick={() => setEditing('new')}><Plus size={18} aria-hidden /> Adicionar</button></div>
    {notice && <p className="success-message" role="status">{notice}</p>}<div className="management-filters"><SearchField value={search} onChange={setSearch} placeholder={`Pesquisar ${title.toLowerCase()}`} /><ClearFiltersButton onClick={() => setSearch('')} disabled={!search} /></div>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar a lista.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><p>Ainda não há registos.</p></div> : <ManagementTable headers={['Nome', 'Descrição', 'Ações']}>
      {data.map(item => <tr key={item.id}><td className="table-primary">{item.name}</td><td>{item.description || '—'}</td><td><div className="table-actions"><ActionIcon label="Ver detalhes" icon={Eye} onClick={() => setViewing(item)} /><ActionIcon label="Editar" icon={Pencil} onClick={() => setEditing(item)} /><ActionIcon label="Apagar" icon={Trash2} tone="danger" onClick={() => setRemoving(item)} /></div></td></tr>)}
    </ManagementTable>}
    {viewing && <Modal title={`Detalhes de ${viewing.name}`} onClose={() => setViewing(null)}><div className="record-detail"><p>{viewing.description || 'Sem descrição.'}</p></div></Modal>}
    {editing && <Modal title={editing === 'new' ? `Adicionar ${kind === 'zones' ? 'zona' : 'categoria'}` : `Editar ${editing.name}`} onClose={() => setEditing(null)}><ReferenceForm key={editing === 'new' ? 'new' : editing.id} kind={kind} initial={editing === 'new' ? undefined : editing} onDone={() => { setEditing(null); setNotice('Alterações guardadas.'); queryClient.invalidateQueries({ queryKey: key }) }} onCancel={() => setEditing(null)} /></Modal>}
    {removing && <ConfirmDialog title={`Apagar ${kind === 'zones' ? 'zona' : 'categoria'}`} message={`Deseja apagar ${removing.name}? Esta acção não pode ser desfeita.`} onCancel={() => setRemoving(null)} onConfirm={() => remove.mutate(removing.id)} pending={remove.isPending} error={remove.isError ? errorMessage(remove.error) : undefined} />}
    {remove.isError && <p className="form-error" role="alert">{errorMessage(remove.error)}</p>}
  </div>
}

function ReferenceForm({ kind, initial, onDone, onCancel }: { kind: 'zones' | 'categories'; initial?: Reference; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const save = useMutation({ mutationFn: async () => initial ? http.put(`/${kind}/${initial.id}`, { name, description }) : http.post(`/${kind}`, { name, description }), onSuccess: onDone })
  return <ValidatedForm apiError={save.error} className="editor-panel reference-form" onSubmit={(event: FormEvent) => { event.preventDefault(); save.mutate() }}><label className="field">Nome<input name="name" required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label><label className="field">Descrição<textarea name="description" value={description} onChange={event => setDescription(event.target.value)} /></label>{save.isError && <p className="form-error" role="alert">{errorMessage(save.error)}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel}><X size={17} aria-hidden /> Cancelar</button><button className="button" disabled={save.isPending}><Save size={17} aria-hidden /> {save.isPending ? 'A guardar…' : 'Guardar'}</button></div></ValidatedForm>
}
