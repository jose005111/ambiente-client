import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ImagePlus, Pencil, Save, Trash2, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { ActionIcon, ClearFiltersButton, ConfirmDialog, Modal, SearchField } from '../../components/ui/ManagementUI'
import { useDebouncedSearch } from '../../components/ui/useDebouncedSearch'
import { errorMessage, http } from '../../lib/http'
import { ValidatedForm } from '../../components/ui/ValidatedForm'

export type MediaAsset = { id: number; url: string; alt_text: string; created_at: string | null }
type MediaPage = { data: MediaAsset[]; meta: { current_page: number; last_page: number; total: number } }
const mediaKeys = { all: ['admin', 'media'] as const }

function useMedia(search: string, page: number) {
  const term = useDebouncedSearch(search)
  return useQuery({ queryKey: [...mediaKeys.all, term, page], queryFn: async ({ signal }) => (await http.get<MediaPage>('/admin/media', { params: { search: term || undefined, page, per_page: 20 }, signal })).data })
}

function MediaSearch({ search, setSearch }: { search: string; setSearch: (value: string) => void }) {
  return <div className="management-filters"><SearchField value={search} onChange={setSearch} placeholder="Pesquisar pelo texto alternativo" /><ClearFiltersButton onClick={() => setSearch('')} disabled={!search} /></div>
}

function MediaPagination({ page, lastPage, setPage }: { page: number; lastPage: number; setPage: (value: number) => void }) {
  return lastPage > 1 && <div className="media-pagination"><button type="button" className="button button-outline button-small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button><span>Página {page} de {lastPage}</span><button type="button" className="button button-outline button-small" disabled={page >= lastPage} onClick={() => setPage(page + 1)}>Seguinte</button></div>
}

function UploadMediaModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [alt, setAlt] = useState('')
  const [preview, setPreview] = useState('')
  const [fileError, setFileError] = useState('')
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])
  const upload = useMutation({ mutationFn: async () => {
    const form = new FormData()
    form.append('image', file!)
    form.append('alt_text', alt.trim())
    return http.post('/admin/media', form)
  }, onSuccess: onDone })
  const submit = (event: FormEvent) => { event.preventDefault(); if (!file) { setFileError('Escolha uma imagem.'); return } upload.mutate() }
  return <Modal title="Adicionar imagem" onClose={onClose}><ValidatedForm apiError={upload.error} className="editor-panel media-form" onSubmit={submit}><label className="field">Imagem JPEG, PNG ou WebP (até 5 MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => { const chosen = event.target.files?.[0] || null; setFile(chosen); setPreview(chosen ? URL.createObjectURL(chosen) : ''); setFileError('') }} /></label>{fileError && <p className="field-error">{fileError}</p>}{preview && <img className="media-upload-preview" src={preview} alt="Pré-visualização da imagem escolhida" />}<label className="field">Texto alternativo<input name="alt_text" required maxLength={300} value={alt} onChange={event => setAlt(event.target.value)} placeholder="Descreva o que aparece na imagem" /></label>{upload.isError && <p className="form-error" role="alert">{errorMessage(upload.error)}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}><X size={17} aria-hidden /> Cancelar</button><button className="button" disabled={upload.isPending}><ImagePlus size={17} aria-hidden /> {upload.isPending ? 'A carregar…' : 'Carregar imagem'}</button></div></ValidatedForm></Modal>
}

export function MediaLibraryPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState<MediaAsset | null>(null)
  const [removing, setRemoving] = useState<MediaAsset | null>(null)
  const [alt, setAlt] = useState('')
  const [notice, setNotice] = useState('')
  const media = useMedia(search, page)
  const save = useMutation({ mutationFn: async () => http.patch(`/admin/media/${editing!.id}`, { alt_text: alt.trim() }), onSuccess: () => { setEditing(null); setNotice('Texto alternativo actualizado.'); queryClient.invalidateQueries({ queryKey: mediaKeys.all }) } })
  const remove = useMutation({ mutationFn: async () => http.delete(`/admin/media/${removing!.id}`), onSuccess: () => { setRemoving(null); setPage(1); setNotice('Imagem removida.'); queryClient.invalidateQueries({ queryKey: mediaKeys.all }) } })
  const changeSearch = (value: string) => { setSearch(value); setPage(1) }
  return <div className="dashboard management-page"><div className="page-actions"><div><p className="eyebrow">Administração</p><h1>Biblioteca de media</h1><p className="muted">Carregue imagens para usar na apresentação do site.</p></div><button className="button" onClick={() => setUploading(true)}><ImagePlus size={18} aria-hidden /> Adicionar imagem</button></div>{notice && <p className="success-message" role="status">{notice}</p>}<MediaSearch search={search} setSearch={changeSearch} />
    {media.isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : media.isError ? <div className="state-panel"><p>Não foi possível carregar as imagens.</p><button className="button" onClick={() => media.refetch()}>Tentar de novo</button></div> : media.data.data.length === 0 ? <div className="state-panel"><p>{search ? 'Nenhuma imagem corresponde à pesquisa.' : 'Ainda não há imagens na biblioteca.'}</p></div> : <><div className="media-grid">{media.data.data.map(asset => <article className="media-card" key={asset.id}><img src={asset.url} alt={asset.alt_text} loading="lazy" /><div className="media-card-body"><p>{asset.alt_text}</p><div className="table-actions"><ActionIcon label="Editar texto alternativo" icon={Pencil} onClick={() => { setEditing(asset); setAlt(asset.alt_text) }} /><ActionIcon label="Apagar imagem" icon={Trash2} tone="danger" onClick={() => setRemoving(asset)} /></div></div></article>)}</div><MediaPagination page={page} lastPage={media.data.meta.last_page} setPage={setPage} /></>}
    {uploading && <UploadMediaModal onClose={() => setUploading(false)} onDone={() => { setUploading(false); setNotice('Imagem carregada.'); setPage(1); queryClient.invalidateQueries({ queryKey: mediaKeys.all }) }} />}
    {editing && <Modal title="Editar texto alternativo" onClose={() => setEditing(null)}><ValidatedForm apiError={save.error} className="editor-panel media-form" onSubmit={event => { event.preventDefault(); save.mutate() }}><img className="media-upload-preview" src={editing.url} alt={editing.alt_text} /><label className="field">Texto alternativo<input name="alt_text" required maxLength={300} value={alt} onChange={event => setAlt(event.target.value)} /></label>{save.isError && <p className="form-error" role="alert">{errorMessage(save.error)}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setEditing(null)}>Cancelar</button><button className="button" disabled={save.isPending}><Save size={17} aria-hidden /> {save.isPending ? 'A guardar…' : 'Guardar'}</button></div></ValidatedForm></Modal>}
    {removing && <ConfirmDialog title="Apagar imagem" message={`Deseja apagar a imagem «${removing.alt_text}»?`} onCancel={() => setRemoving(null)} onConfirm={() => remove.mutate()} pending={remove.isPending} error={remove.isError ? errorMessage(remove.error) : undefined} />}
  </div>
}

export function MediaPicker({ onClose, onSelect }: { onClose: () => void; onSelect: (asset: MediaAsset) => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const media = useMedia(search, page)
  return <Modal title="Escolher imagem da biblioteca" onClose={onClose} wide><MediaSearch search={search} setSearch={value => { setSearch(value); setPage(1) }} />{media.isPending ? <p role="status">A carregar imagens…</p> : media.isError ? <div className="state-panel"><p>Não foi possível carregar as imagens.</p><button className="button" onClick={() => media.refetch()}>Tentar de novo</button></div> : media.data.data.length === 0 ? <p className="muted">{search ? 'Nenhuma imagem corresponde à pesquisa.' : 'Ainda não há imagens. Adicione uma na biblioteca de media.'}</p> : <><div className="media-grid">{media.data.data.map(asset => <button type="button" className="media-card media-choice" key={asset.id} onClick={() => onSelect(asset)}><img src={asset.url} alt={asset.alt_text} loading="lazy" /><span><Check size={17} aria-hidden /> {asset.alt_text}</span></button>)}</div><MediaPagination page={page} lastPage={media.data.meta.last_page} setPage={setPage} /></>}</Modal>
}
