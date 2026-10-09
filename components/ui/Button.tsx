import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'contrast' | 'ghost' | 'link' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium ' +
  'transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-out ' +
  'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-solid text-accent-fg hover:bg-accent-solid-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-canvas-subtle',
  contrast: 'bg-ink text-canvas hover:bg-ink/85',
  ghost: 'text-ink hover:bg-ink/[0.06]',
  link: 'rounded-md px-0 text-accent hover:text-accent-hover hover:underline underline-offset-4 active:scale-100',
  danger: 'bg-danger text-white hover:bg-danger/90',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-[13px]',
  md: 'h-11 px-5 text-[15px]',
  lg: 'h-12 px-7 text-[16px]',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(base, variants[variant], variant !== 'link' && sizes[size], fullWidth && 'w-full', className)
}

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  /** Shows a spinner and blocks clicks while an action runs. */
  loading?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
    />
  )
}

/**
 * The one button. Variants cover every call-to-action on the site:
 * `primary` (brand blue) for the main action, `secondary` for alternatives,
 * `contrast` for ink-on-canvas emphasis, `ghost`/`link` for low-weight actions.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, loading, leadingIcon, trailingIcon, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  )
})

type ButtonLinkProps = CommonProps & {
  href: string
  className?: string
  children: ReactNode
  external?: boolean
  prefetch?: boolean
  onClick?: () => void
  'aria-label'?: string
}

/** A link styled as a button. Internal hrefs use next/link. */
export function ButtonLink({
  href,
  variant,
  size,
  fullWidth,
  leadingIcon,
  trailingIcon,
  className,
  children,
  external,
  prefetch,
  onClick,
  ...rest
}: ButtonLinkProps) {
  const classes = buttonClasses({ variant, size, fullWidth, className })
  const isExternal = external ?? /^(https?:|mailto:|tel:)/.test(href)

  if (isExternal) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} prefetch={prefetch} onClick={onClick} {...rest}>
      {leadingIcon}
      {children}
      {trailingIcon}
    </Link>
  )
}

export default Button
