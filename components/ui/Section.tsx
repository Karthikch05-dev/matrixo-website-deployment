import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Centered content column with the site's gutters. */
export function Container({
  className,
  size = 'default',
  ...rest
}: HTMLAttributes<HTMLDivElement> & { size?: 'narrow' | 'default' | 'wide' }) {
  const max = size === 'narrow' ? 'max-w-3xl' : size === 'wide' ? 'max-w-7xl' : 'max-w-site'
  return <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', max, className)} {...rest} />
}

/** A page band. `subtle` alternates the background like Apple's section rhythm. */
export function Section({
  className,
  tone = 'default',
  spacing = 'default',
  as: Tag = 'section',
  ...rest
}: HTMLAttributes<HTMLElement> & {
  tone?: 'default' | 'subtle' | 'inverse'
  spacing?: 'compact' | 'default' | 'loose'
  as?: ElementType
}) {
  const tones = {
    default: 'bg-canvas',
    subtle: 'bg-canvas-subtle',
    inverse: 'bg-[#06070B] text-white',
  }
  const spacings = {
    compact: 'py-12 sm:py-16',
    default: 'py-16 sm:py-24',
    loose: 'py-20 sm:py-32',
  }
  return <Tag className={cn(tones[tone], spacings[spacing], className)} {...rest} />
}

type SectionHeaderProps = {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  as?: 'h1' | 'h2' | 'h3'
  size?: 'md' | 'lg' | 'xl'
  actions?: ReactNode
  className?: string
}

/** Eyebrow, headline and lede in the site's type scale. */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Heading = 'h2',
  size = 'lg',
  actions,
  className,
}: SectionHeaderProps) {
  const sizes = {
    md: 'text-[28px] sm:text-[34px]',
    lg: 'text-[32px] sm:text-[44px]',
    xl: 'text-[40px] sm:text-[56px] lg:text-[64px]',
  }
  return (
    <div className={cn(align === 'center' && 'mx-auto text-center', 'max-w-3xl', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <Heading className={cn('font-semibold leading-[1.06] tracking-[-0.03em] text-ink', sizes[size])}>{title}</Heading>
      {description && (
        <p className={cn('mt-4 text-[17px] leading-relaxed text-muted sm:text-[19px]', align === 'center' && 'mx-auto', 'max-w-2xl')}>
          {description}
        </p>
      )}
      {actions && <div className={cn('mt-7 flex flex-wrap gap-3', align === 'center' && 'justify-center')}>{actions}</div>}
    </div>
  )
}
