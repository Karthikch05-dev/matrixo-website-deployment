'use client'

import { Button } from '@/components/ui/Button'
import { GoogleGlyph } from '@/components/brand/GoogleGlyph'

/**
 * The primary sign-in action everywhere on the site. The G sits on a white
 * disc so it keeps Google's colours on the brand-blue button.
 */
export default function GoogleButton({
  onClick,
  loading,
  disabled,
  size = 'lg',
  className,
  children = 'Continue with Google',
}: {
  onClick: () => void
  loading?: boolean
  disabled?: boolean
  size?: 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}) {
  return (
    <Button
      size={size}
      fullWidth
      className={className}
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      leadingIcon={
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
          <GoogleGlyph className="h-4 w-4" />
        </span>
      }
    >
      {children}
    </Button>
  )
}
