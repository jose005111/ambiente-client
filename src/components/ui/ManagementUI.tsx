import { useEffect, useRef, type ReactNode, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, RotateCcw, Search, X } from 'lucide-react'

type Icon = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

export function ActionIcon({ label, icon: IconComponent, onClick, disabled, tone, type = 'button' }: { label: string; icon: Icon; onClick?: () => void; disabled?: boolean; tone?: 'danger' | 'success'; type?: 'button' | 'submit' }) {
  return <button type={type} className={`table-action ${tone || ''}`} aria-label={label} title={label} data-tooltip={label} onClick={onClick} disabled={disabled}><IconComponent size={17} aria-hidden /></button>
}

export function ManagementTable({ headers, children, noScroll = false }: { headers: string[]; children: ReactNode; noScroll?: boolean }) {
  return <div className={`management-table-wrap ${noScroll ? 'management-table-no-scroll' : ''}`}><table className="management-table"><thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>
}

export function SearchField({ value, onChange, placeholder = 'Pesquisar' }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <label className="management-search"><Search size={18} aria-hidden /><span className="sr-only">Pesquisar</span><input type="search" value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>
}

export function ClearFiltersButton({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="button button-outline button-small clear-filters-button" onClick={onClick} disabled={disabled}><RotateCcw size={16} aria-hidden /> Limpar filtros</button>
}

export function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog?.showModal()
    return () => { dialog?.close(); previous?.focus() }
  }, [])
  return createPortal(<dialog ref={ref} className={`management-modal ${wide ? 'management-modal-wide' : ''}`} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === ref.current) onClose() }} aria-label={title}>
    <div className="modal-heading"><h2>{title}</h2><ActionIcon label="Fechar" icon={X} onClick={onClose} /></div><div className="modal-body">{children}</div>
  </dialog>, document.body)
}

export function ConfirmDialog({ title, message, onCancel, onConfirm, pending = false, danger = true, error }: { title: string; message: string; onCancel: () => void; onConfirm: () => void; pending?: boolean; danger?: boolean; error?: string }) {
  return <Modal title={title} onClose={onCancel}><div className="confirm-content"><AlertTriangle size={26} aria-hidden /><p>{message}</p></div>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="button button-outline" onClick={onCancel} disabled={pending}>Cancelar</button><button type="button" className={`button ${danger ? 'button-danger' : ''}`} onClick={onConfirm} disabled={pending}>{pending ? 'A processar…' : 'Confirmar'}</button></div></Modal>
}
