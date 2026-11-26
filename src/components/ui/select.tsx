import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

const EMPTY = '__empty_option__'

type Option = { value: string; label: string }
type Props = {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  placeholder?: string
  emptyLabel?: string
  required?: boolean
  error?: ReactNode
  className?: string
}

export function SelectField({ label, value, onValueChange, options, placeholder = 'Seleccione uma opção', emptyLabel, required = false, error, className = '' }: Props) {
  const id = useId()
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const selected = value || (required ? undefined : EMPTY)
  return <div className={`field select-field ${className}`} ref={setHost}>
    <span id={id} className="select-field-label">{label}</span>
    <SelectPrimitive.Root value={selected} onValueChange={next => onValueChange(next === EMPTY ? '' : next)} required={required}>
      <SelectPrimitive.Trigger className="shadcn-select-trigger" aria-labelledby={id} aria-invalid={!!error}>
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon><ChevronDown size={17} aria-hidden /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal container={host?.closest('dialog') ?? undefined}>
        <SelectPrimitive.Content className="shadcn-select-content" position="popper" sideOffset={5}>
          <SelectPrimitive.ScrollUpButton className="shadcn-select-scroll"><ChevronUp size={16} aria-hidden /></SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="shadcn-select-viewport">
            {!required && <SelectPrimitive.Item className="shadcn-select-item" value={EMPTY}><SelectPrimitive.ItemIndicator><Check size={15} aria-hidden /></SelectPrimitive.ItemIndicator><SelectPrimitive.ItemText>{emptyLabel || 'Todos'}</SelectPrimitive.ItemText></SelectPrimitive.Item>}
            {options.map(option => <SelectPrimitive.Item className="shadcn-select-item" key={option.value} value={option.value}><SelectPrimitive.ItemIndicator><Check size={15} aria-hidden /></SelectPrimitive.ItemIndicator><SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText></SelectPrimitive.Item>)}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="shadcn-select-scroll"><ChevronDown size={16} aria-hidden /></SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
    {error && <span className="field-error">{error}</span>}
  </div>
}
