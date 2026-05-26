import { cn } from '@/lib/utils'

const REQUIRED_ASTERISK = 'text-[#C74A86]'

interface FormFieldLabelProps {
  children: React.ReactNode
  required?: boolean
  htmlFor?: string
  className?: string
  as?: 'label' | 'legend' | 'span'
}

export default function FormFieldLabel({
  children,
  required,
  htmlFor,
  className,
  as: Tag = 'label',
}: FormFieldLabelProps) {
  return (
    <Tag
      htmlFor={Tag === 'label' ? htmlFor : undefined}
      className={cn('mb-1.5 block text-[13px] font-medium text-gray-600', className)}
    >
      {children}
      {required && (
        <span className={cn(REQUIRED_ASTERISK, 'ml-0.5')} aria-hidden>
          *
        </span>
      )}
    </Tag>
  )
}

export { REQUIRED_ASTERISK }
