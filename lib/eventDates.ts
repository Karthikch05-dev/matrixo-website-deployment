/**
 * Event dates in events.json are written as IST wall-clock time without an
 * offset ("2026-07-11T15:00:00"). Parsing them as-is gives different instants
 * on the server (UTC) and in the browser, which shifts times and causes
 * hydration mismatches. Always read them as IST.
 */
export function parseEventDate(value: string): Date {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
  return new Date(hasZone ? value : `${value}+05:30`)
}

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
})

const timeFmt = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Kolkata',
})

export function formatEventDate(value: string): string {
  return dateFmt.format(parseEventDate(value))
}

export function formatEventTime(value: string): string {
  return timeFmt.format(parseEventDate(value)).replace(/\s?(am|pm)$/i, (m) => ` ${m.trim().toUpperCase()}`)
}

export function isEventPast(value: string, now = Date.now()): boolean {
  return parseEventDate(value).getTime() < now
}
