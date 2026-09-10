interface LeafIconProps {
  size?: number
}

export default function LeafIcon({ size = 18 }: LeafIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M20.5 3.5C10 3.5 4.5 9.5 4.5 16.5c0 1.5.4 3 1.2 4.2.4-4.5 2.8-9.4 8-12.8-3.5 4.1-5.4 8.4-5.6 12.6 3.8 0 12.3-1.5 12.4-13.5 0-1.5 0-2.5 0-3.5z"
        fill="currentColor"
      />
    </svg>
  )
}
