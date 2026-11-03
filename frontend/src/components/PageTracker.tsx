import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../lib/analytics'

const isSkipped = (path: string) => path === '/session' || path.startsWith('/joohee0229')

export default function PageTracker() {
  const location = useLocation()

  useEffect(() => {
    if (!isSkipped(location.pathname)) trackPageView(location.pathname)
  }, [location.pathname])

  return null
}
