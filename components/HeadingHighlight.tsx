type HeadingHighlightProps = {
  text: string
  highlightWords?: number
  solidClassName?: string
  gradientClassName?: string
}

export default function HeadingHighlight({
  text,
  highlightWords = 1,
  solidClassName = 'heading-solid',
  gradientClassName = 'gradient-text',
}: HeadingHighlightProps) {
  const words = text.trim().split(/\s+/)
  const tailCount = Math.min(Math.max(highlightWords, 1), words.length)
  const lead = words.slice(0, words.length - tailCount).join(' ')
  const tail = words.slice(words.length - tailCount).join(' ')

  return (
    <>
      {lead && <span className={solidClassName}>{lead} </span>}
      <span className={gradientClassName}>{tail}</span>
    </>
  )
}
