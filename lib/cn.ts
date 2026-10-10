type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[]

/** Join class names, skipping falsy values. Tiny stand-in for clsx. */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  for (const value of values) {
    if (!value || value === true) continue
    if (Array.isArray(value)) {
      const nested = cn(...value)
      if (nested) out.push(nested)
    } else {
      out.push(String(value))
    }
  }
  return out.join(' ')
}
