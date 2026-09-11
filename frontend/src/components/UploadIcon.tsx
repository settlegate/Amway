interface UploadIconProps {
  size?: number
}

export default function UploadIcon({ size = 18 }: UploadIconProps) {
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
        d="M21.2 10.2l-9-9a2.8 2.8 0 00-4 4l8.5 8.5a1.5 1.5 0 002.1-2.1l-8.5-8.5a4.8 4.8 0 00-6.8 6.8l9 9a6.8 6.8 0 009.6-9.6l-.3-.3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
