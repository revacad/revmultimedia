'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold px-3 py-1 text-xs',
  {
    variants: {
      variant: {
        graphic_design: 'bg-primary-light text-primary',
        motion_graphics: 'bg-secondary-light text-secondary-hover',
        video_editing: 'bg-accent-light text-accent-hover',
        online: 'bg-accent/15 text-accent border border-accent/30',
        in_person: 'bg-accent/15 text-accent border border-accent/30',
        hybrid: 'bg-secondary/15 text-secondary border border-secondary/30',
        default: 'bg-white/10 text-white/70',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        className={cn(badgeVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export default Badge
