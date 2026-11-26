import { Link, useNavigate, useRouter } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, UserRound } from 'lucide-react'
import { z } from 'zod'
import { login, register, authKeys } from './api'
import { errorMessage, type ApiError } from '../../lib/http'

const credentialsSchema = z.object({ email: z.email('Indique um e-mail válido.'), password: z.string().min(1, 'Indique a palavra-passe.') })
const registrationSchema = credentialsSchema.extend({ name: z.string().min(2, 'Indique o seu nome.'), password: z.string().min(8, 'Use pelo menos 8 caracteres.'), password_confirmation: z.string() }).refine(data => data.password === data.password_confirmation, { path: ['password_confirmation'], message: 'As palavras-passe não coincidem.' })

export function AuthPage({ mode, redirect }: { mode: 'login' | 'register'; redirect: string }) {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [values, setValues] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const mutation = useMutation({ mutationFn: () => mode === 'login' ? login(values.email, values.password) : register(values), onSuccess: async user => {
    queryClient.setQueryData(authKeys.me, user)
    await router.invalidate()
    const destination = redirect === '/app' ? (user.role.name === 'moderador' ? '/moderacao' : user.role.name === 'administrador' ? '/admin/site' : '/app') : redirect
    await navigate({ to: destination.startsWith('/') && !destination.startsWith('//') ? destination : '/app' })
  }, onError: error => {
    const api = error as unknown as ApiError
    if (api.errors) setFieldErrors(Object.fromEntries(Object.entries(api.errors).map(([key, messages]) => [key, messages[0]])))
  } })
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const validation = mode === 'login' ? credentialsSchema.safeParse(values) : registrationSchema.safeParse(values)
    if (!validation.success) { setFieldErrors(Object.fromEntries(validation.error.issues.map(issue => [String(issue.path[0]), issue.message]))); return }
    setFieldErrors({})
    mutation.mutate()
  }
  const set = (field: keyof typeof values, value: string) => setValues(previous => ({ ...previous, [field]: value }))
  return <div className="auth-page"><div className="auth-art"><p className="eyebrow">Comunidade e ambiente</p><h1>O bairro muda quando participamos.</h1><p>Aprende, partilha e acompanha as acções da tua comunidade.</p></div><div className="auth-card"><Link to="/" className="text-link">Voltar ao início</Link><p className="eyebrow">{mode === 'login' ? 'Bem-vindo de volta' : 'Faz parte da comunidade'}</p><h2>{mode === 'login' ? 'Entrar na conta' : 'Criar conta'}</h2><form onSubmit={submit} noValidate>
    {mode === 'register' && <div className="field"><label htmlFor="auth-name">Nome</label><div className="auth-input-wrap"><UserRound className="auth-input-icon" size={19} aria-hidden /><input id="auth-name" autoComplete="name" value={values.name} onChange={event => set('name', event.target.value)} aria-invalid={!!fieldErrors.name} aria-describedby={fieldErrors.name ? 'name-error' : undefined} /></div>{fieldErrors.name && <span id="name-error" className="field-error">{fieldErrors.name}</span>}</div>}
    <div className="field"><label htmlFor="auth-email">E-mail</label><div className="auth-input-wrap"><Mail className="auth-input-icon" size={19} aria-hidden /><input id="auth-email" type="email" autoComplete="email" value={values.email} onChange={event => set('email', event.target.value)} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? 'email-error' : undefined} /></div>{fieldErrors.email && <span id="email-error" className="field-error">{fieldErrors.email}</span>}</div>
    <div className="field"><label htmlFor="auth-password">Palavra-passe</label><div className="auth-input-wrap password-input"><LockKeyhole className="auth-input-icon" size={19} aria-hidden /><input id="auth-password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={values.password} onChange={event => set('password', event.target.value)} aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? 'password-error' : undefined} /><button type="button" className="auth-visibility" aria-label={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}</button></div>{fieldErrors.password && <span id="password-error" className="field-error">{fieldErrors.password}</span>}</div>
    {mode === 'register' && <div className="field"><label htmlFor="auth-confirmation">Confirmar palavra-passe</label><div className="auth-input-wrap password-input"><LockKeyhole className="auth-input-icon" size={19} aria-hidden /><input id="auth-confirmation" type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" value={values.password_confirmation} onChange={event => set('password_confirmation', event.target.value)} aria-invalid={!!fieldErrors.password_confirmation} aria-describedby={fieldErrors.password_confirmation ? 'confirmation-error' : undefined} /><button type="button" className="auth-visibility" aria-label={showConfirmation ? 'Ocultar confirmação da palavra-passe' : 'Mostrar confirmação da palavra-passe'} aria-pressed={showConfirmation} onClick={() => setShowConfirmation(value => !value)}>{showConfirmation ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}</button></div>{fieldErrors.password_confirmation && <span id="confirmation-error" className="field-error">{fieldErrors.password_confirmation}</span>}</div>}
    {mutation.isError && <p className="form-error" role="alert">{errorMessage(mutation.error)}</p>}
    <button className="button full-width" disabled={mutation.isPending}><LogIn size={18} aria-hidden /> {mutation.isPending ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
  </form><p className="auth-switch">{mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'} <Link to={mode === 'login' ? '/registar' : '/entrar'} search={{ redirect }}>{mode === 'login' ? 'Criar conta' : 'Entrar'}</Link></p></div></div>
}
