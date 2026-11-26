import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MapPinned, Plus } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { z } from 'zod'
import { errorMessage, http } from '../../lib/http'
import { SelectField } from '../../components/ui/select'

type Page<T> = { data: T[] }
type Option = { id: number; name: string }
type Report = { id: number; title: string; description: string; status: string; status_label: string; created_at: string | null; zone?: Option; category?: Option | null; photos?: { id: number; url: string }[]; updates?: { id: number; to_status: string; note: string | null; created_at: string | null }[] }
const reportSchema = z.object({ title: z.string().min(4, 'Indique um título mais descritivo.'), description: z.string().min(10, 'Descreva o problema com mais detalhe.'), zone_id: z.number().positive('Escolha uma zona.'), category_id: z.number().optional(), location_note: z.string().optional(), latitude: z.number().optional(), longitude: z.number().optional() })
type Draft = z.infer<typeof reportSchema>
const emptyDraft: Draft = { title: '', description: '', zone_id: 0, location_note: '' }
const draftKey = 'ambiente:report-draft'

export function MyReportsPage() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['reports', 'mine'], queryFn: async ({ signal }) => (await http.get<Page<Report>>('/me/reports', { signal })).data.data })
  return <div className="dashboard"><div className="page-actions"><div><p className="eyebrow">Participação</p><h1>Os meus reportes</h1></div><Link to="/app/reportes/novo" className="button"><Plus size={18} aria-hidden /> Novo reporte</Link></div>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar os reportes.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><h2>Ainda não enviou reportes</h2><p>Se encontrar um problema ambiental, conte-nos.</p><Link to="/app/reportes/novo" className="button">Criar reporte</Link></div> : <div className="stack-list">{data.map(report => <Link key={report.id} to="/app/reportes/$id" params={{ id: String(report.id) }} className="list-card"><div><h2>{report.title}</h2><p>{report.zone?.name || 'Zona não indicada'} · {report.created_at ? new Intl.DateTimeFormat('pt', { dateStyle: 'medium' }).format(new Date(report.created_at)) : ''}</p></div><span className="pill">{report.status_label}</span></Link>)}</div>}</div>
}

export function ReportDetailPage({ id }: { id: string }) {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['reports', 'detail', id], queryFn: async ({ signal }) => (await http.get<{ data: Report }>(`/reports/${id}`, { signal })).data.data })
  if (isPending) return <div className="state-panel" role="status">A carregar reporte…</div>
  if (isError) return <div className="state-panel"><h1>Não foi possível abrir o reporte</h1><button className="button" onClick={() => refetch()}>Tentar de novo</button></div>
  return <div className="report-detail"><Link to="/app/reportes" className="text-link">Voltar aos reportes</Link><p className="eyebrow">Reporte #{data.id}</p><h1>{data.title}</h1><span className="pill">{data.status_label}</span><p className="report-description">{data.description}</p><p className="detail-meta"><MapPinned size={18} aria-hidden /> {data.zone?.name || 'Zona não indicada'}</p>{data.photos && data.photos.length > 0 && <div className="photo-grid">{data.photos.map(photo => <img key={photo.id} src={photo.url} alt={`Fotografia do reporte ${data.title}`} loading="lazy" />)}</div>}<h2>Seguimento</h2>{data.updates?.length ? <ol className="timeline">{data.updates.map(update => <li key={update.id}><strong>{update.to_status.replace('_', ' ')}</strong><small>{update.created_at ? new Intl.DateTimeFormat('pt', { dateStyle: 'medium' }).format(new Date(update.created_at)) : ''}</small>{update.note && <p>{update.note}</p>}</li>)}</ol> : <p className="muted">Ainda não há actualizações.</p>}</div>
}

export function NewReportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<Draft>(() => { try { return { ...emptyDraft, ...JSON.parse(localStorage.getItem(draftKey) || '{}') } as Draft } catch { return emptyDraft } })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  useEffect(() => () => previews.forEach(url => URL.revokeObjectURL(url)), [previews])
  const { data: zones } = useQuery({ queryKey: ['zones', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Option>>('/zones', { params: { per_page: 50 }, signal })).data.data, staleTime: 300_000 })
  const { data: categories } = useQuery({ queryKey: ['categories', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Option>>('/categories', { params: { per_page: 50 }, signal })).data.data, staleTime: 300_000 })
  const saveDraft = (next: Draft) => { setDraft(next); localStorage.setItem(draftKey, JSON.stringify(next)) }
  const mutation = useMutation({ mutationFn: async () => {
    const form = new FormData()
    for (const [key, value] of Object.entries(draft)) if (value !== undefined && value !== '' && value !== 0) form.append(key, String(value))
    photos.forEach(photo => form.append('photos[]', photo))
    return (await http.post('/reports', form)).data
  }, onSuccess: async () => { localStorage.removeItem(draftKey); await queryClient.invalidateQueries({ queryKey: ['reports', 'mine'] }); await navigate({ to: '/app/reportes' }) }, onError: error => { const api = error as unknown as { errors?: Record<string, string[]> }; if (api.errors) setErrors(Object.fromEntries(Object.entries(api.errors).map(([key, value]) => [key, value[0]]))) } })
  const next = (event: FormEvent) => { event.preventDefault(); const parsed = reportSchema.safeParse(draft); if (!parsed.success) { setErrors(Object.fromEntries(parsed.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return } setErrors({}); setStep(2) }
  const locate = () => navigator.geolocation?.getCurrentPosition(position => saveDraft({ ...draft, latitude: position.coords.latitude, longitude: position.coords.longitude }), () => setErrors(previous => ({ ...previous, location: 'Não foi possível obter a localização. Pode continuar sem GPS.' })))
  return <div className="report-form"><Link to="/app/reportes" className="text-link">Voltar aos reportes</Link><p className="eyebrow">Novo reporte · Passo {step} de 2</p><h1>Reportar um problema</h1><p className="muted">Descreva o que encontrou. O seu rascunho fica guardado neste dispositivo.</p>{step === 1 ? <form onSubmit={next} className="editor-panel"><label className="field">Título<input required maxLength={200} value={draft.title} onChange={event => saveDraft({ ...draft, title: event.target.value })} aria-invalid={!!errors.title} />{errors.title && <span className="field-error">{errors.title}</span>}</label><label className="field">Descrição<textarea required value={draft.description} onChange={event => saveDraft({ ...draft, description: event.target.value })} aria-invalid={!!errors.description} />{errors.description && <span className="field-error">{errors.description}</span>}</label><SelectField label="Zona" required placeholder="Escolha a zona" value={draft.zone_id ? String(draft.zone_id) : ""} onValueChange={value => saveDraft({ ...draft, zone_id: Number(value) })} options={(zones || []).map(zone => ({ value: String(zone.id), label: zone.name }))} error={errors.zone_id} /><SelectField label="Tema" emptyLabel="Sem tema específico" value={draft.category_id ? String(draft.category_id) : ""} onValueChange={value => saveDraft({ ...draft, category_id: Number(value) || undefined })} options={(categories || []).map(category => ({ value: String(category.id), label: category.name }))} /><label className="field">Ponto de referência<input value={draft.location_note || ''} onChange={event => saveDraft({ ...draft, location_note: event.target.value })} /></label><button type="button" className="button button-outline" onClick={locate}>Usar localização actual</button>{draft.latitude && <p className="muted">Localização guardada.</p>}{errors.location && <p className="field-error">{errors.location}</p>}<button className="button">Continuar</button></form> : <div className="editor-panel"><h2>Fotografias e revisão</h2><label className="field">Fotografias (opcional, até 5)<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={event => { const chosen = Array.from(event.target.files || []).slice(0, 5); setPhotos(chosen); setPreviews(chosen.map(file => URL.createObjectURL(file))) }} /></label>{previews.length > 0 && <div className="photo-grid">{previews.map((url, index) => <img src={url} key={url} alt={`Pré-visualização da fotografia ${index + 1}`} />)}</div>}<h3>{draft.title}</h3><p>{draft.description}</p><p>{zones?.find(zone => zone.id === draft.zone_id)?.name}</p>{mutation.isError && <p className="form-error" role="alert">{errorMessage(mutation.error)}</p>}<div className="quiz-actions"><button className="button button-outline" onClick={() => setStep(1)}>Voltar</button><button className="button" disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? 'A enviar…' : 'Enviar reporte'}</button></div></div>}</div>
}
