'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-smooth cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover hover:-translate-y-0.5 hover:shadow-glow-primary',
        secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary-light',
        ghost: 'bg-surface-2 text-dark border-2 border-brand-gray-300 hover:bg-brand-gray-100 hover:border-primary',
        'ghost-on-dark': 'bg-white/8 text-white border border-white/12 hover:bg-white/15',
        accent: 'bg-accent text-dark hover:bg-accent-hover',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'px-5 py-2.5 text-sm',
        md: 'px-7 py-3.5 text-base',
        lg: 'px-9 py-4 text-lg',
        xl: 'px-12 py-5 text-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export default Button
