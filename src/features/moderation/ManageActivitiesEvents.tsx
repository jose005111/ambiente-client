import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, Eye, Pencil, Plus, Save, Trash2, Users, X } from 'lucide-react'
import { ClearFiltersButton, ActionIcon, ConfirmDialog, ManagementTable, Modal, SearchField } from '../../components/ui/ManagementUI'
import { useDebouncedSearch } from '../../components/ui/useDebouncedSearch'
import { errorMessage, http } from '../../lib/http'
import { SelectField } from '../../components/ui/select'
import { ValidatedForm } from '../../components/ui/ValidatedForm'

type Kind = 'activities' | 'events'
type Item = { id: number; slug: string; title: string; summary?: string; location?: string; status: string; status_label?: string; category?: { id: number; name: string } | null }
type Detail = Item & { category_id?: number | null; zone_id?: number | null; instructions?: string; description?: string; starts_on?: string | null; ends_on?: string | null; starts_at?: string | null; ends_at?: string | null; capacity?: number | null; photos?: { id: number; url: string }[] }
type Option = { id: number; name: string }
type Page<T> = { data: T[]; meta: { last_page: number } }
type Form = { title: string; summary: string; instructions: string; description: string; location: string; starts_on: string; ends_on: string; starts_at: string; ends_at: string; capacity: string; category_id: string; zone_id: string; status: string }
const empty = (): Form => ({ title: '', summary: '', instructions: '', description: '', location: '', starts_on: '', ends_on: '', starts_at: '', ends_at: '', capacity: '', category_id: '', zone_id: '', status: 'rascunho' })
const dateTimeInput = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const fromDetail = (item: Detail): Form => ({ title: item.title, summary: item.summary || '', instructions: item.instructions || '', description: item.description || '', location: item.location || '', starts_on: item.starts_on || '', ends_on: item.ends_on || '', starts_at: dateTimeInput(item.starts_at), ends_at: dateTimeInput(item.ends_at), capacity: item.capacity == null ? '' : String(item.capacity), category_id: item.category_id == null ? '' : String(item.category_id), zone_id: item.zone_id == null ? '' : String(item.zone_id), status: item.status })

export function ManageActivitiesPage() { return <ManagePage kind="activities" /> }
export function ManageEventsPage() { return <ManagePage kind="events" /> }

function ManagePage({ kind }: { kind: Kind }) {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const term = useDebouncedSearch(search)
  const [viewing, setViewing] = useState<Item | null>(null)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState('')
  const [removing, setRemoving] = useState<Item | null>(null)
  const label = kind === 'activities' ? 'Actividades' : 'Eventos'
  const statuses = kind === 'activities' ? ['rascunho', 'aberta', 'encerrada'] : ['rascunho', 'publicado', 'cancelado', 'concluido']
  const list = useQuery({ queryKey: ['moderation', kind, status, term, page], queryFn: async ({ signal }) => (await http.get<Page<Item>>(`/${kind}`, { params: { per_page: 20, page, search: term || undefined, ...(status && { 'filter[status]': status }) }, signal })).data })
  const detail = useQuery({ queryKey: ['moderation', kind, selected], queryFn: async ({ signal }) => (await http.get<{ data: Detail }>(`/${kind}/${selected}`, { signal })).data.data, enabled: !!selected })
  const categories = useQuery({ queryKey: ['categories', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Option>>('/categories', { params: { per_page: 50 }, signal })).data.data, staleTime: 300_000 })
  const zones = useQuery({ queryKey: ['zones', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Option>>('/zones', { params: { per_page: 50 }, signal })).data.data, staleTime: 300_000, enabled: kind === 'events' })
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['moderation', kind] }); queryClient.invalidateQueries({ queryKey: ['home'] }) }
  const close = () => { setEditing(false); setSelected(null); refresh() }
  const remove = useMutation({ mutationFn: async (id: number) => http.delete(`/${kind}/${id}`), onSuccess: () => { setRemoving(null); setNotice('Registo removido.'); refresh() } })
  return <div className="dashboard management-page">
    <div className="page-actions"><div><p className="eyebrow">Moderação</p><h1>{label}</h1></div><button className="button" onClick={() => { setSelected(null); setEditing(true) }}><Plus size={18} aria-hidden /> Criar {kind === 'activities' ? 'actividade' : 'evento'}</button></div>
    {notice && <p className="success-message" role="status">{notice}</p>}
    {editing && <Modal title={`${selected ? 'Editar' : 'Criar'} ${kind === 'activities' ? 'actividade' : 'evento'}`} wide onClose={close}>{selected && detail.isPending ? <p role="status">A carregar…</p> : selected && detail.isError ? <p role="alert" className="form-error">Não foi possível abrir o registo.</p> : <ManageForm key={selected || 'new'} kind={kind} initial={selected ? detail.data : undefined} categories={categories.data || []} zones={zones.data || []} onDone={() => { setNotice('Registo guardado.'); close() }} onCancel={close} />}</Modal>}
    {viewing && <ActivityEventDetails key={`${kind}-${viewing.id}`} kind={kind} item={viewing} onClose={() => setViewing(null)} />}
    {removing && <ConfirmDialog title={`Apagar ${kind === 'activities' ? 'actividade' : 'evento'}`} message={`Deseja apagar ${removing.title}? Esta acção não pode ser desfeita.`} onCancel={() => setRemoving(null)} onConfirm={() => remove.mutate(removing.id)} pending={remove.isPending} error={remove.isError ? errorMessage(remove.error) : undefined} />}
    <div className="management-filters"><SelectField label="Estado" className="filter-select" value={status} onValueChange={value => { setStatus(value); setPage(1) }} emptyLabel="Todos" options={statuses.map(value => ({ value, label: value }))} /><SearchField value={search} onChange={value => { setSearch(value); setPage(1) }} placeholder={`Pesquisar ${label.toLowerCase()}`} /><ClearFiltersButton onClick={() => { setSearch(''); setStatus(''); setPage(1) }} disabled={!search && !status} /></div>
    {list.isPending ? <p role="status">A carregar…</p> : list.isError ? <div className="state-panel"><p>Não foi possível carregar {label.toLowerCase()}.</p><button className="button" onClick={() => list.refetch()}>Tentar de novo</button></div> : list.data.data.length === 0 ? <div className="state-panel"><p>Não há registos neste estado.</p></div> : <ManagementTable headers={[kind === 'activities' ? 'Actividade' : 'Evento', kind === 'activities' ? 'Categoria' : 'Local', 'Estado', 'Ações']}>
      {list.data.data.map(item => <tr key={item.id}><td className="table-primary">{item.title}</td><td>{kind === 'activities' ? item.category?.name || '—' : item.location || '—'}</td><td><span className="pill">{item.status_label || item.status}</span></td><td><div className="table-actions"><ActionIcon label="Ver detalhes" icon={Eye} onClick={() => setViewing(item)} /><ActionIcon label="Editar" icon={Pencil} onClick={() => { setSelected(item.slug); setEditing(true) }} />{kind === 'events' && <Link to="/moderacao/eventos/$id/inscritos" params={{ id: String(item.id) }} className="table-action" aria-label="Ver inscritos" title="Ver inscritos" data-tooltip="Ver inscritos"><Users size={17} aria-hidden /></Link>}<ActionIcon label="Apagar" icon={Trash2} tone="danger" onClick={() => setRemoving(item)} /></div></td></tr>)}
    </ManagementTable>}
    {list.data && list.data.meta.last_page > 1 && <div className="quiz-actions"><button className="button button-outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>Página {page} de {list.data.meta.last_page}</span><button className="button button-outline" disabled={page >= list.data.meta.last_page} onClick={() => setPage(value => value + 1)}>Seguinte</button></div>}
    {remove.isError && <p role="alert" className="form-error">{errorMessage(remove.error)}</p>}
  </div>
}

function ManageForm({ kind, initial, categories, zones, onDone, onCancel }: { kind: Kind; initial?: Detail; categories: Option[]; zones: Option[]; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<Form>(initial ? fromDetail(initial) : empty())
  const [cover, setCover] = useState<File | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([])
  const update = (key: keyof Form, value: string) => setForm(previous => ({ ...previous, [key]: value }))
  const save = useMutation({ mutationFn: async () => {
    const payload = kind === 'activities' ? {
      title: form.title, summary: form.summary, instructions: form.instructions, category_id: Number(form.category_id), starts_on: form.starts_on || null, ends_on: form.ends_on || null, status: form.status,
    } : {
      title: form.title, description: form.description, location: form.location, starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null, capacity: form.capacity === '' ? null : Number(form.capacity), category_id: form.category_id === '' ? null : Number(form.category_id), zone_id: form.zone_id === '' ? null : Number(form.zone_id), status: form.status,
    }
    if (kind === 'activities' && (photos.length || removedPhotoIds.length)) {
      const data = new FormData()
      Object.entries(payload).forEach(([key, value]) => { if (value !== null) data.append(key, String(value)) })
      photos.forEach((photo, index) => data.append(`photos[${index}]`, photo))
      removedPhotoIds.forEach((id, index) => data.append(`removed_photo_ids[${index}]`, String(id)))
      if (initial) { data.append('_method', 'PUT'); return http.post(`/activities/${initial.id}`, data) }
      return http.post('/activities', data)
    }
    if (initial) return http.put(`/${kind}/${initial.id}`, payload)
    if (kind === 'events' && cover) {
      const data = new FormData()
      Object.entries(payload).forEach(([key, value]) => { if (value !== null) data.append(key, String(value)) })
      data.append('cover', cover)
      return http.post('/events', data)
    }
    return http.post(`/${kind}`, payload)
  }, onSuccess: onDone })
  return <ValidatedForm apiError={save.error} className="editor-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); save.mutate() }}>
    <h2>{initial ? 'Editar' : 'Criar'} {kind === 'activities' ? 'actividade' : 'evento'}</h2>
    <label className="field">Título<input name="title" required maxLength={200} value={form.title} onChange={event => update('title', event.target.value)} /></label>
    {kind === 'activities' ? <><label className="field">Resumo<textarea name="summary" required maxLength={300} value={form.summary} onChange={event => update('summary', event.target.value)} /></label><label className="field">Instruções<textarea name="instructions" required className="large-textarea" value={form.instructions} onChange={event => update('instructions', event.target.value)} /></label><label className="field">Data de início<input name="starts_on" type="date" value={form.starts_on} onChange={event => update('starts_on', event.target.value)} /></label><label className="field">Data de fim<input name="ends_on" type="date" min={form.starts_on || undefined} value={form.ends_on} onChange={event => update('ends_on', event.target.value)} /></label><label className="field">Fotografias (até 5, JPEG, PNG ou WebP)<input name="photos" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={event => setPhotos(Array.from(event.target.files || []))} /></label>{initial?.photos?.filter(photo => !removedPhotoIds.includes(photo.id)).map(photo => <div className="activity-photo-edit" key={photo.id}><img src={photo.url} alt={`Fotografia da actividade ${form.title}`} /><button type="button" className="button button-outline button-small" onClick={() => setRemovedPhotoIds(previous => [...previous, photo.id])}>Remover foto</button></div>)}{photos.length > 0 && <p className="field-help">{photos.length} fotografia(s) nova(s) seleccionada(s).</p>}</> : <><label className="field">Descrição<textarea name="description" required className="large-textarea" value={form.description} onChange={event => update('description', event.target.value)} /></label><label className="field">Local<input name="location" required maxLength={255} value={form.location} onChange={event => update('location', event.target.value)} /></label><label className="field">Início<input name="starts_at" required type="datetime-local" value={form.starts_at} onChange={event => update('starts_at', event.target.value)} /></label><label className="field">Fim<input name="ends_at" type="datetime-local" min={form.starts_at || undefined} value={form.ends_at} onChange={event => update('ends_at', event.target.value)} /></label><label className="field">Capacidade<input name="capacity" type="number" min="0" max="65535" value={form.capacity} onChange={event => update('capacity', event.target.value)} /></label><SelectField name="zone_id" label="Zona" value={form.zone_id} onValueChange={value => update('zone_id', value)} emptyLabel="Sem zona" options={zones.map(item => ({ value: String(item.id), label: item.name }))} />{!initial && <label className="field">Capa<input name="cover" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setCover(event.target.files?.[0] || null)} /></label>}</>}
    <SelectField name="category_id" label="Categoria" required={kind === 'activities'} placeholder="Escolha a categoria" emptyLabel="Sem categoria" value={form.category_id} onValueChange={value => update('category_id', value)} options={categories.map(item => ({ value: String(item.id), label: item.name }))} />
    <SelectField name="status" label="Estado" required value={form.status} onValueChange={value => update('status', value)} options={(kind === 'activities' ? ['rascunho', 'aberta', 'encerrada'] : ['rascunho', 'publicado', 'cancelado', 'concluido']).map(value => ({ value, label: value }))} />
    {save.isError && <p role="alert" className="form-error">{errorMessage(save.error)}</p>}
    <div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel}><X size={17} aria-hidden /> Cancelar</button><button className="button" disabled={save.isPending}><Save size={17} aria-hidden /> {save.isPending ? 'A guardar…' : 'Guardar'}</button></div>
  </ValidatedForm>
}

type Participant = { id: number; status: string; status_label?: string; user?: { id?: number; name: string; email?: string } }

function ActivityEventDetails({ kind, item, onClose }: { kind: Kind; item: Item; onClose: () => void }) {
  const [page, setPage] = useState(1)
  const detail = useQuery({ queryKey: ['moderation', kind, 'view', item.slug], queryFn: async ({ signal }) => (await http.get<{ data: Detail }>(`/${kind}/${item.slug}`, { signal })).data.data })
  const members = useQuery({ queryKey: ['moderation', kind, 'members', item.id, page], queryFn: async ({ signal }) => (await http.get<Page<Participant>>(kind === 'activities' ? '/activity-participations' : `/events/${item.id}/registrations`, { params: { per_page: 20, page, ...(kind === 'activities' && { 'filter[activity]': item.id, 'filter[status]': 'inscrito,submetido,validado,rejeitado' }) }, signal })).data })
  return <Modal title={`Detalhes de ${item.title}`} wide onClose={onClose}>
    {detail.isPending ? <p role="status">A carregar actividade…</p> : detail.isError ? <p role="alert">{errorMessage(detail.error)}</p> : <div className="record-detail"><span className="pill">{detail.data.category?.name || detail.data.status_label || detail.data.status}</span><p>{detail.data.summary || detail.data.description}</p>{detail.data.instructions && <p>{detail.data.instructions}</p>}{detail.data.location && <p><strong>Local:</strong> {detail.data.location}</p>}{detail.data.photos?.length ? <div className="photo-grid">{detail.data.photos.map(photo => <img key={photo.id} src={photo.url} alt={`Fotografia de ${item.title}`} />)}</div> : null}</div>}
    <h3>{kind === 'activities' ? 'Participantes' : 'Inscritos'}</h3>
    {members.isPending ? <p role="status">A carregar participantes…</p> : members.isError ? <p role="alert">{errorMessage(members.error)}</p> : members.data.data.length === 0 ? <p>Não há inscrições.</p> : <ManagementTable noScroll headers={['Morador', 'Estado']}>{members.data.data.map(member => <tr key={member.id}><td>{member.user?.id ? <Link to="/moderacao/moradores/$id" params={{ id: String(member.user.id) }} className="text-link">{member.user.name}</Link> : member.user?.name || 'Morador'}</td><td><span className="pill">{member.status_label || member.status}</span></td></tr>)}</ManagementTable>}
    {members.data && members.data.meta.last_page > 1 && <div className="quiz-actions"><button type="button" className="button button-outline button-small" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button><span>{page} / {members.data.meta.last_page}</span><button type="button" className="button button-outline button-small" disabled={page >= members.data.meta.last_page} onClick={() => setPage(page + 1)}>Seguinte</button></div>}
  </Modal>
}

type Registration = { id: number; status: string; user?: { id: number; name: string; email?: string } }
export function EventRegistrationsPage({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const list = useQuery({ queryKey: ['moderation', 'event-registrations', id, page], queryFn: async ({ signal }) => (await http.get<Page<Registration>>(`/events/${id}/registrations`, { params: { per_page: 20, page }, signal })).data })
  const present = useMutation({ mutationFn: async (registrationId: number) => http.patch(`/event-registrations/${registrationId}`), onSuccess: () => { setSelectedRegistration(null); queryClient.invalidateQueries({ queryKey: ['moderation', 'event-registrations', id] }) } })
  return <div className="dashboard management-page"><p className="eyebrow">Moderação</p><h1>Inscritos no evento</h1><Link to="/moderacao/eventos" className="button button-outline back-button"><ArrowLeft size={18} aria-hidden /> Voltar aos eventos</Link>{list.isPending ? <p role="status">A carregar…</p> : list.isError ? <p role="alert">{errorMessage(list.error)}</p> : list.data.data.length === 0 ? <p>Não há inscrições.</p> : <ManagementTable noScroll headers={['Residente', 'Estado', 'Ações']}>{list.data.data.map(item => <tr key={item.id}><td><span className="table-primary">{item.user?.name || 'Residente'}</span><span className="table-secondary">{item.user?.email}</span></td><td><span className="pill">{item.status}</span></td><td><div className="table-actions">{item.user?.id && <Link to="/moderacao/moradores/$id" params={{ id: String(item.user.id) }} className="table-action" aria-label={`Ver perfil de ${item.user.name}`} title="Ver perfil" data-tooltip="Ver perfil"><Eye size={17} aria-hidden /></Link>}<ActionIcon label="Marcar presença" icon={CheckCircle2} tone="success" disabled={item.status !== 'inscrito'} onClick={() => setSelectedRegistration(item)} /></div></td></tr>)}</ManagementTable>}{selectedRegistration && <ConfirmDialog title="Marcar presença" message={`Confirma a presença de ${selectedRegistration.user?.name || 'este residente'}?`} onCancel={() => setSelectedRegistration(null)} onConfirm={() => present.mutate(selectedRegistration.id)} pending={present.isPending} error={present.isError ? errorMessage(present.error) : undefined} danger={false} />}
    {list.data && list.data.meta.last_page > 1 && <div className="quiz-actions"><button className="button button-outline" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>Página {page} de {list.data.meta.last_page}</span><button className="button button-outline" disabled={page >= list.data.meta.last_page} onClick={() => setPage(value => value + 1)}>Seguinte</button></div>}{present.isError && <p role="alert" className="form-error">{errorMessage(present.error)}</p>}</div>
}
