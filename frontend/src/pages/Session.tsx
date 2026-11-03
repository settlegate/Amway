import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// 카카오 챗봇 "내 정보" 링크(/session?t=토큰)로 진입해 세션을 저장하고 리마인더로 이동한다.
export default function Session() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token = params.get('t')
    if (token) {
      sessionStorage.setItem('userToken', token)
      navigate('/reminders', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }, [params, navigate])

  return null
}
