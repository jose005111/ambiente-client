import { createPortal } from 'react-dom'
import { useId, useState, type FormEvent, type FormHTMLAttributes } from 'react'
import type { ApiError } from '../../lib/http'

type FieldIssue = { key: string; target: HTMLElement; message: string }
type Props = Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> & {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  apiError?: unknown
}

function messageFor(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  const validity = control.validity
  if (validity.valueMissing) return 'Este campo é obrigatório.'
  if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'email') return 'Introduza um e-mail válido.'
  if (validity.typeMismatch && control instanceof HTMLInputElement && control.type === 'url') return 'Introduza uma URL válida.'
  if (validity.rangeUnderflow) return `O valor mínimo é ${control instanceof HTMLInputElement ? control.min : ''}.`
  if (validity.rangeOverflow) return `O valor máximo é ${control instanceof HTMLInputElement ? control.max : ''}.`
  if (validity.tooShort) return `Introduza pelo menos ${control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement ? control.minLength : 0} caracteres.`
  if (validity.tooLong) return `Use no máximo ${control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement ? control.maxLength : 0} caracteres.`
  if (validity.patternMismatch) return 'O formato deste campo é inválido.'
  if (validity.badInput) return 'Introduza um valor válido.'
  return control.validationMessage || 'Verifique este campo.'
}

function fieldKey(control: HTMLElement, index: number): string {
  return control.getAttribute('name') || control.getAttribute('data-field') || control.id || `field-${index}`
}

function fieldTarget(control: HTMLElement): HTMLElement | null {
  return control.closest<HTMLElement>('.field, .builder-option, .checkbox-field')
}

function collectIssues(form: HTMLFormElement): FieldIssue[] {
  const issues: FieldIssue[] = []
  form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select').forEach((control, index) => {
    if (control.disabled || control.type === 'hidden' || control.type === 'button' || control.type === 'submit' || control.type === 'radio' || control.validity.valid) return
    const target = fieldTarget(control)
    if (target && !issues.some(issue => issue.target === target)) issues.push({ key: fieldKey(control, index), target, message: messageFor(control) })
  })
  form.querySelectorAll<HTMLElement>('.select-field[data-required="true"][data-empty="true"]').forEach((target, index) => {
    if (!issues.some(issue => issue.target === target)) issues.push({ key: target.dataset.field || `select-${index}`, target, message: 'Este campo é obrigatório.' })
  })
  return issues
}

function apiIssues(form: HTMLFormElement, error: unknown, hidden: string[]): { fields: FieldIssue[]; other: string[] } {
  if (!error || typeof error !== 'object' || !('errors' in error)) return { fields: [], other: [] }
  const errors = (error as ApiError).errors
  if (!errors || typeof errors !== 'object') return { fields: [], other: [] }
  const fields: FieldIssue[] = []
  const other: string[] = []
  for (const [key, messages] of Object.entries(errors)) {
    if (hidden.some(field => key === field || key.startsWith(`${field}.`)) || !Array.isArray(messages)) continue
    const controls = Array.from(form.querySelectorAll<HTMLElement>('[name], [data-field]'))
    const candidates = [key, ...key.split('.').slice(0, -1).map((_, index, parts) => parts.slice(0, parts.length - index - 1).join('.'))]
    const control = candidates.map(candidate => controls.find(element => element.getAttribute('name') === candidate || element.getAttribute('data-field') === candidate)).find(Boolean)
    const target = control && (fieldTarget(control) || (control.matches('.field') ? control : null))
    if (target) fields.push({ key, target, message: messages.join(' ') })
    else other.push(...messages)
  }
  return { fields, other }
}

export function ValidatedForm({ onSubmit, apiError, onInputCapture, onChangeCapture, children, ...props }: Props) {
  const [form, setForm] = useState<HTMLFormElement | null>(null)
  const id = useId()
  const [issues, setIssues] = useState<FieldIssue[]>([])
  const [hiddenApi, setHiddenApi] = useState<string[]>([])
  const api = form ? apiIssues(form, apiError, hiddenApi) : { fields: [], other: [] }
  const visible = [...issues, ...api.fields.filter(issue => !issues.some(local => local.target === issue.target))].filter(issue => form?.contains(issue.target))
  const validate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = collectIssues(event.currentTarget)
    setIssues(next)
    setHiddenApi([])
    if (next.length) { next[0].target.querySelector<HTMLElement>('[role="combobox"], input:not([type="hidden"]), textarea, select, button')?.focus(); return }
    onSubmit(event)
  }
  const clear = (target: EventTarget) => {
    if (!(target instanceof HTMLElement)) return
    const wrapper = fieldTarget(target)
    if (!wrapper) return
    setIssues(previous => previous.filter(issue => issue.target !== wrapper))
    const key = target.getAttribute('name') || wrapper.dataset.field
    if (key) setHiddenApi(previous => previous.includes(key) ? previous : [...previous, key])
  }
  return <form {...props} ref={setForm} noValidate onSubmit={validate} onInputCapture={event => { clear(event.target); onInputCapture?.(event) }} onChangeCapture={event => { clear(event.target); onChangeCapture?.(event) }}>
    {children}
    {visible.map((issue, index) => createPortal(<span className="field-error" role="alert" id={`${id}-${index}`} key={`${issue.key}-${index}`}>{issue.message}</span>, issue.target))}
    {api.other.length > 0 && <p className="form-error" role="alert">{api.other.join(' ')}</p>}
  </form>
}
