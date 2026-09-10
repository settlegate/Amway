type IconType = 'zap' | 'lock' | 'scale' | 'clock' | 'shield' | 'check'

interface IconBadgeProps {
  type: IconType
  size?: number
}

const PATHS: Record<IconType, string> = {
  zap: 'M13 2L4.09 12.97a1 1 0 0 0 .77 1.64H11l-1 7.36c-.08.62.52 1.16 1.13.9L20.91 10.5a1 1 0 0 0-.77-1.5h-5.88l2-6.7c.13-.44-.2-.9-.67-.9h-1.59z',
  lock: 'M17 10h-1V7a4 4 0 0 0-8 0v3H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9 7a3 3 0 0 1 6 0v3H9z',
  scale: 'M12 3l-6 7h4v10h4V10h4z',
  clock: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-9h4v2h-6V7h2z',
  shield: 'M12 2L4 6v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6z',
  check: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
}

export default function IconBadge({ type, size = 22 }: IconBadgeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[type]} />
    </svg>
  )
}
