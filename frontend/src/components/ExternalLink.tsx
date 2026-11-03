import type { ReactNode } from 'react'
import { trackContentView } from '../lib/analytics'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  className?: string
  ariaLabel?: string
  track?: { contentType: string; contentId: string; contentName?: string }
}

export default function ExternalLink({
  href,
  children,
  className,
  ariaLabel,
  track,
}: ExternalLinkProps) {
  return (
    <a
      href={href}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={
        track
          ? () => trackContentView(track.contentType, track.contentId, track.contentName)
          : undefined
      }
    >
      {children}
    </a>
  )
}
