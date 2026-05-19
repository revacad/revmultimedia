'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  surface?: 'dark' | 'light'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, surface = 'dark', type, ...props }, ref) => {
    const surfaceClasses = surface === 'dark' 
      ? 'bg-white/5 border-white/12 text-white placeholder:text-white/35 focus:border-primary focus:ring-primary/15'
      : 'bg-white border-brand-gray-200 text-dark placeholder:text-brand-gray-400 focus:border-primary focus:ring-primary/15'
    
    const errorClasses = error ? 'border-red-500 focus:ring-red-500/15' : ''

    return (
      <div className="w-full">
        {label && (
          <label className={cn(
            'block text-[13px] font-medium mb-1.5',
            surface === 'dark' ? 'text-white/70' : 'text-brand-gray-600'
          )}>
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'w-full px-4 py-3.5 rounded-md border transition-all duration-200',
            'focus:outline-none focus:ring-4',
            'font-body text-[15px]',
            surfaceClasses,
            errorClasses,
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-xs mt-1.5">{error}</p>
        )}
        {helperText && !error && (
          <p className={cn(
            'text-xs mt-1.5',
            surface === 'dark' ? 'text-white/50' : 'text-brand-gray-400'
          )}>{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input
