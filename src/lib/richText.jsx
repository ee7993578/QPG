import React from 'react'

const PATTERN = /(\*\*.+?\*\*|__.+?__|~~.+?~~|\*.+?\*)/g

/**
 * SRS 35/36 — minimal rich text so a question can carry bold/italic/underline/
 * strikethrough without a heavyweight editor library. Teachers type the
 * markers directly, or use the RichTextToolbar to wrap a selection.
 */
export function RichText({ text, className }) {
  if (!text) return null
  const parts = text.split(PATTERN).filter((p) => p !== '')
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <b key={i} className={className}>{part.slice(2, -2)}</b>
        if (part.startsWith('__') && part.endsWith('__')) return <u key={i} className={className}>{part.slice(2, -2)}</u>
        if (part.startsWith('~~') && part.endsWith('~~')) return <s key={i} className={className}>{part.slice(2, -2)}</s>
        if (part.startsWith('*') && part.endsWith('*')) return <i key={i} className={className}>{part.slice(1, -1)}</i>
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}
