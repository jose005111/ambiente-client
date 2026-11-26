import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { authKeys, meQueryOptions } from '../auth/api'
import { errorMessage, http } from '../../lib/http'
import { SelectField } from '../../components/ui/select'
import { ConfirmDialog, Modal } from '../../components/ui/ManagementUI'

type Page<T> = { data: T[] }
type Participation = { id: number; activity_id: number; status_label: string; notes: string | null; activity?: { title: string; slug: string }; review_note?: string | null }
type Registration = { id: number; event_id: number; status: string; status_label: string; event?: { title: string; slug: string; starts_at: string | null } }
type Zone = { id: number; name: string }

export function MyActivitiesPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['activities', 'mine'], queryFn: async ({ signal }) => (await http.get<Page<Participation>>('/me/participations', { signal })).data.data })
  const [current, setCurrent] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const submit = useMutation({ mutationFn: async (activityId: number) => { const form = new FormData(); form.append('notes', notes); if (photo) form.append('proof_photo', photo); return http.post(`/activities/${activityId}/submit`, form) }, onSuccess: () => { setCurrent(null); setPhoto(null); setNotes(''); queryClient.invalidateQueries({ queryKey: ['activities', 'mine'] }) } })
  return <div className="dashboard"><p className="eyebrow">As minhas actividades</p><h1>Actividades</h1><p>Consulte as participações e envie o comprovativo de uma actividade.</p>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar as actividades.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><p>Ainda não participa em actividades.</p><Link to="/actividades" search={{ page: 1, search: '', category: '' }} className="button">Explorar actividades</Link></div> : <div className="stack-list">{data.map(item => <article key={item.id} className="list-card stacked"><div className="page-actions"><div><h2>{item.activity?.title || 'Actividade'}</h2><p>{item.review_note}</p></div><span className="pill">{item.status_label}</span></div>{item.status_label === 'Inscrito' && <button className="button button-small" onClick={() => setCurrent(item.id)}>Enviar prova</button>}</article>)}</div>}{current !== null && <Modal title="Enviar prova da actividade" onClose={() => { setCurrent(null); setPhoto(null); setNotes('') }}><form className="editor-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); const item = data?.find(entry => entry.id === current); if (photo && item) submit.mutate(item.activity_id) }}><label className="field">O que fez?<textarea value={notes} onChange={event => setNotes(event.target.value)} /></label><label className="field">Fotografia da actividade<input type="file" required accept="image/jpeg,image/png,image/webp" onChange={event => setPhoto(event.target.files?.[0] || null)} /></label>{submit.isError && <p className="form-error" role="alert">{errorMessage(submit.error)}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={() => setCurrent(null)}>Cancelar</button><button className="button" disabled={!photo || submit.isPending}>{submit.isPending ? 'A enviar…' : 'Submeter prova'}</button></div></form></Modal>}</div>
}

export function MyEventsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['events', 'mine'], queryFn: async ({ signal }) => (await http.get<Page<Registration>>('/me/registrations', { signal })).data.data })
  const [cancelling, setCancelling] = useState<Registration | null>(null)
  const cancel = useMutation({ mutationFn: async (id: number) => http.delete(`/events/${id}/register`), onSuccess: () => { setCancelling(null); queryClient.invalidateQueries({ queryKey: ['events', 'mine'] }) } })
  return <div className="dashboard"><p className="eyebrow">As minhas inscrições</p><h1>Eventos</h1>{isPending ? <div className="skeleton skeleton-row" role="status">A carregar…</div> : isError ? <div className="state-panel"><p>Não foi possível carregar as inscrições.</p><button className="button" onClick={() => refetch()}>Tentar de novo</button></div> : data.length === 0 ? <div className="state-panel"><p>Ainda não está inscrito em eventos.</p><Link to="/eventos" search={{ page: 1, search: '', category: '' }} className="button">Ver eventos</Link></div> : <div className="stack-list">{data.map(item => <article key={item.id} className="list-card"><div><h2>{item.event?.title || 'Evento'}</h2><p>{item.event?.starts_at ? new Intl.DateTimeFormat('pt', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.event.starts_at)) : ''}</p><span className="pill">{item.status_label}</span></div>{item.status === 'inscrito' && <button className="button button-outline button-small" disabled={cancel.isPending} onClick={() => setCancelling(item)}>Cancelar inscrição</button>}</article>)}</div>}{cancelling && <ConfirmDialog title="Cancelar inscrição" message={`Deseja cancelar a inscrição em ${cancelling.event?.title || 'este evento'}?`} onCancel={() => setCancelling(null)} onConfirm={() => cancel.mutate(cancelling.event_id)} pending={cancel.isPending} error={cancel.isError ? errorMessage(cancel.error) : undefined} />}{cancel.isError && <p className="form-error" role="alert">{errorMessage(cancel.error)}</p>}</div>
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const { data: user } = useQuery(meQueryOptions)
  const { data: zones } = useQuery({ queryKey: ['zones', 'list'], queryFn: async ({ signal }) => (await http.get<Page<Zone>>('/zones', { params: { per_page: 50 }, signal })).data.data, staleTime: 300_000 })
  const [name, setName] = useState(user?.name || '')
  const [zoneId, setZoneId] = useState(user?.zone?.id || 0)
  const [phone, setPhone] = useState(user?.phone || '')
  const [saved, setSaved] = useState(false)
  const update = useMutation({ mutationFn: async () => (await http.put('/me', { name, zone_id: zoneId || null, phone: phone || null })).data.data, onSuccess: value => { queryClient.setQueryData(authKeys.me, value); setSaved(true) } })
  return <div className="dashboard profile-page"><p className="eyebrow">Conta</p><h1>O meu perfil</h1><p>Actualize os seus dados pessoais.</p><form className="editor-panel" onSubmit={(event: FormEvent) => { event.preventDefault(); setSaved(false); update.mutate() }}><label className="field">Nome<input required value={name} onChange={event => setName(event.target.value)} /></label><label className="field">E-mail<input value={user?.email || ''} readOnly /></label><label className="field">Telefone<input type="tel" value={phone} onChange={event => setPhone(event.target.value)} /></label><SelectField label="Zona" value={zoneId ? String(zoneId) : ""} onValueChange={value => setZoneId(Number(value) || 0)} emptyLabel="Sem zona" options={(zones || []).map(zone => ({ value: String(zone.id), label: zone.name }))} />{update.isError && <p className="form-error" role="alert">{errorMessage(update.error)}</p>}{saved && <p className="success-message" role="status">Perfil actualizado.</p>}<button className="button" disabled={update.isPending}>{update.isPending ? 'A guardar…' : 'Guardar perfil'}</button></form></div>
}
