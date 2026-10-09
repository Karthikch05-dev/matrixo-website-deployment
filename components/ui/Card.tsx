import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** `flat` drops the shadow; `raised` lifts on hover; `inset` sits on a subtle fill. */
  tone?: 'default' | 'flat' | 'raised' | 'inset'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  as?: 'div' | 'article' | 'section' | 'li'
}

const tones = {
  default: 'bg-surface border border-line shadow-card',
  flat: 'bg-surface border border-line',
  raised:
    'bg-surface border border-line shadow-card transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-raised',
  inset: 'bg-canvas-subtle border border-transparent',
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
}

export function Card({ tone = 'default', padding = 'md', as = 'div', className, ...rest }: CardProps) {
  const Tag = as as 'div'
  return <Tag className={cn('rounded-card', tones[tone], paddings[padding], className)} {...rest} />
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-[17px] font-semibold leading-snug text-ink', className)}>{children}</h3>
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('mt-1.5 text-[15px] leading-relaxed text-muted', className)}>{children}</p>
}

export default Card
