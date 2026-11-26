import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Eye, FilePlus2, Pencil, Save, Send, Trash2, Undo2, X } from 'lucide-react'
import { ClearFiltersButton, ActionIcon, ConfirmDialog, ManagementTable, Modal, SearchField } from '../../components/ui/ManagementUI'
import { useDebouncedSearch } from '../../components/ui/useDebouncedSearch'
import { errorMessage, http } from '../../lib/http'
import { SelectField } from '../../components/ui/select'

type Page<T> = { data: T[]; meta?: { last_page: number } }
type Category = { id: number; name: string }
type Status = 'rascunho' | 'publicado'
type ContentSummary = { id: number; slug: string; title: string; summary: string; type: string; status: Status }
type ContentDetail = ContentSummary & { body: string | null; media_url: string | null; cover_image: string | null; category: Category }
type FormState = { title: string; summary: string; body: string; type: string; category_id: number; media_url: string; status: Status }
const blank: FormState = { title: '', summary: '', body: '', type: 'artigo', category_id: 0, media_url: '', status: 'rascunho' }

export function ManageContentPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [pendingAction, setPendingAction] = useState<{ kind: 'status' | 'delete'; item: ContentSummary } | null>(null)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const term = useDebouncedSearch(search)
  const [viewingSlug, setViewingSlug] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const list = useQuery({ queryKey: ['moderation', 'contents', status, term, page], queryFn: async ({ signal }) => (await http.get<Page<ContentSummary>>('/contents', { params: { per_page: 20, page, search: term || undefined, ...(status && { 'filter[status]': status }) }, signal })).data })
  const detail = useQuery({ queryKey: ['moderation', 'contents', selectedSlug], queryFn: async ({ signal }) => (await http.get<{ data: ContentDetail }>(`/contents/${selectedSlug}`, { signal })).data.data, enabled: !!selectedSlug })
  const viewDetail = useQuery({ queryKey: ['moderation', 'contents', 'view', viewingSlug], queryFn: async ({ signal }) => (await http.get<{ data: ContentDetail }>(`/contents/${viewingSlug}`, { signal })).data.data, enabled: !!viewingSlug })
  const categories = useQuery({ queryKey: ['categories', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Category>>('/categories', { params: { per_page: 50 }, signal })).data.data, staleTime: 300_000 })
  const refresh = () => { queryClient.invalidateQueries({ queryKey: ['moderation', 'contents'] }); queryClient.invalidateQueries({ queryKey: ['home'] }) }
  const remove = useMutation({ mutationFn: async (id: number) => http.delete(`/contents/${id}`), onSuccess: () => { setPendingAction(null); setNotice('Conteúdo removido.'); refresh() } })
  const changeStatus = useMutation({ mutationFn: async ({ id, next }: { id: number; next: Status }) => http.patch(`/contents/${id}/publish`, { status: next }), onSuccess: (_response, { next }) => { setPendingAction(null); setNotice(next === 'publicado' ? 'Conteúdo publicado.' : 'Conteúdo guardado como rascunho.'); refresh() } })
  const close = () => { setOpen(false); setSelectedSlug(null); refresh() }
  return <div className="dashboard management-page">
    <div className="page-actions"><div><p className="eyebrow">Moderação</p><h1>Conteúdos</h1></div><button className="button" onClick={() => { setSelectedSlug(null); setOpen(true) }}><FilePlus2 size={18} aria-hidden /> Criar conteúdo</button></div>
    {notice && <p className="success-message" role="status">{notice}</p>}
    {open && <Modal title={selectedSlug ? 'Editar conteúdo' : 'Criar conteúdo'} wide onClose={close}>{selectedSlug && detail.isPending ? <div role="status">A carregar conteúdo…</div> : selectedSlug && detail.isError ? <p className="form-error" role="alert">Não foi possível abrir o conteúdo.</p> : <ContentForm key={selectedSlug || 'new'} initial={selectedSlug ? detail.data : undefined} categories={categories.data || []} onDone={() => { setNotice('Conteúdo guardado.'); close() }} onCancel={close} />}</Modal>}
    {viewingSlug && <Modal title="Detalhes do conteúdo" wide onClose={() => setViewingSlug(null)}>{viewDetail.isPending ? <p role="status">A carregar…</p> : viewDetail.isError ? <p role="alert">{errorMessage(viewDetail.error)}</p> : <div className="record-detail"><span className="pill">{viewDetail.data.category?.name}</span><h3>{viewDetail.data.title}</h3><p>{viewDetail.data.summary}</p>{viewDetail.data.cover_image && <img className="detail-image" src={viewDetail.data.cover_image} alt={`Capa de ${viewDetail.data.title}`} />}{viewDetail.data.body && <p>{viewDetail.data.body}</p>}</div>}</Modal>}
    {pendingAction && <ConfirmDialog title={pendingAction.kind === 'delete' ? 'Apagar conteúdo' : pendingAction.item.status === 'publicado' ? 'Despublicar conteúdo' : 'Publicar conteúdo'} message={pendingAction.kind === 'delete' ? `Deseja apagar ${pendingAction.item.title}? Esta acção não pode ser desfeita.` : `Confirma a alteração do estado de ${pendingAction.item.title}?`} onCancel={() => setPendingAction(null)} onConfirm={() => pendingAction.kind === 'delete' ? remove.mutate(pendingAction.item.id) : changeStatus.mutate({ id: pendingAction.item.id, next: pendingAction.item.status === 'publicado' ? 'rascunho' : 'publicado' })} pending={remove.isPending || changeStatus.isPending} error={remove.isError || changeStatus.isError ? errorMessage(remove.error || changeStatus.error) : undefined} danger={pendingAction.kind === 'delete' || pendingAction.item.status === 'publicado'} />}
    <div className="management-filters"><SelectField label="Estado" className="filter-select" value={status} onValueChange={value => { setStatus(value); setPage(1) }} emptyLabel="Todos" options={[{ value: 'rascunho', label: 'Rascunhos' }, { value: 'publicado', label: 'Publicados' }]} /><SearchField value={search} onChange={value => { setSearch(value); setPage(1) }} placeholder="Pesquisar conteúdos" /><ClearFiltersButton onClick={() => { setSearch(''); setStatus(''); setPage(1) }} disabled={!search && !status} /></div>
    {list.isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : list.isError ? <div className="state-panel"><p>Não foi possível carregar conteúdos.</p><button className="button" onClick={() => list.refetch()}>Tentar de novo</button></div> : list.data.data.length === 0 ? <div className="state-panel"><p>Não há conteúdos neste estado.</p></div> : <ManagementTable headers={['Conteúdo', 'Tipo', 'Estado', 'Ações']}>
      {list.data.data.map(item => <tr key={item.id}><td><span className="table-primary">{item.title}</span><span className="table-secondary">{item.summary}</span></td><td>{item.type}</td><td><span className="pill">{item.status === 'publicado' ? 'Publicado' : 'Rascunho'}</span></td><td><div className="table-actions"><ActionIcon label="Ver detalhes" icon={Eye} onClick={() => setViewingSlug(item.slug)} /><ActionIcon label="Editar" icon={Pencil} onClick={() => { setSelectedSlug(item.slug); setOpen(true) }} /><ActionIcon label={item.status === 'publicado' ? 'Despublicar' : 'Publicar'} icon={item.status === 'publicado' ? Undo2 : Send} onClick={() => setPendingAction({ kind: 'status', item })} /><ActionIcon label="Apagar" icon={Trash2} tone="danger" onClick={() => setPendingAction({ kind: 'delete', item })} /></div></td></tr>)}
    </ManagementTable>}
    {list.data && (list.data.meta?.last_page || 1) > 1 && <div className="quiz-actions"><button className="button button-outline" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</button><span>Página {page} de {list.data.meta?.last_page}</span><button className="button button-outline" disabled={page >= (list.data.meta?.last_page || 1)} onClick={() => setPage(value => value + 1)}>Seguinte</button></div>}
    {(remove.isError || changeStatus.isError) && <p className="form-error" role="alert">{errorMessage(remove.error || changeStatus.error)}</p>}
  </div>
}

function ContentForm({ initial, categories, onDone, onCancel }: { initial?: ContentDetail; categories: Category[]; onDone: () => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(initial ? { title: initial.title, summary: initial.summary, body: initial.body || '', type: initial.type, category_id: initial.category.id, media_url: initial.media_url || '', status: initial.status } : blank)
  const [cover, setCover] = useState<File | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const save = useMutation({ mutationFn: async () => {
    const { status, ...fields } = form
    if (initial) {
      await http.put(`/contents/${initial.id}`, { ...fields, media_url: fields.media_url || null })
      if (status !== initial.status) await http.patch(`/contents/${initial.id}/publish`, { status })
      return
    }
    const body = new FormData()
    for (const [key, value] of Object.entries(fields)) if (value !== '') body.append(key, String(value))
    if (cover) body.append('cover_image', cover)
    const created = await http.post<{ data: { id: number } }>('/contents', body)
    if (status === 'publicado') await http.patch(`/contents/${created.data.data.id}/publish`, { status })
  }, onSuccess: onDone, onError: error => { const api = error as unknown as { errors?: Record<string, string[]> }; if (api.errors) setFieldErrors(Object.fromEntries(Object.entries(api.errors).map(([key, value]) => [key, value[0]]))) } })
  const update = (key: keyof FormState, value: string | number) => setForm(previous => ({ ...previous, [key]: value }))
  return <form className="editor-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); setFieldErrors({}); save.mutate() }}><h2>{initial ? 'Editar conteúdo' : 'Criar conteúdo'}</h2><label className="field">Título<input required maxLength={200} value={form.title} onChange={event => update('title', event.target.value)} />{fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}</label><label className="field">Resumo<textarea required maxLength={300} value={form.summary} onChange={event => update('summary', event.target.value)} />{fieldErrors.summary && <span className="field-error">{fieldErrors.summary}</span>}</label><SelectField label="Tipo" required value={form.type} onValueChange={value => update('type', value)} options={[{ value: 'artigo', label: 'Artigo' }, { value: 'dica', label: 'Dica' }, { value: 'video', label: 'Vídeo' }, { value: 'infografico', label: 'Infográfico' }]} /><SelectField label="Categoria" required placeholder="Escolha a categoria" value={form.category_id ? String(form.category_id) : ""} onValueChange={value => update('category_id', Number(value))} options={categories.map(item => ({ value: String(item.id), label: item.name }))} error={fieldErrors.category_id} /><label className="field">Texto do conteúdo<textarea className="large-textarea" value={form.body} onChange={event => update('body', event.target.value)} /></label><label className="field">URL do vídeo<input type="url" value={form.media_url} onChange={event => update('media_url', event.target.value)} /></label><SelectField label="Estado" required value={form.status} onValueChange={value => update('status', value)} options={[{ value: 'rascunho', label: 'Rascunho' }, { value: 'publicado', label: 'Publicado' }]} />{!initial && <label className="field">Imagem de capa<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setCover(event.target.files?.[0] || null)} />{fieldErrors.cover_image && <span className="field-error">{fieldErrors.cover_image}</span>}</label>}{save.isError && <p className="form-error" role="alert">{errorMessage(save.error)}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel}><X size={17} aria-hidden /> Cancelar</button><button className="button" disabled={save.isPending}><Save size={17} aria-hidden /> {save.isPending ? 'A guardar…' : 'Guardar'}</button></div></form>
}
