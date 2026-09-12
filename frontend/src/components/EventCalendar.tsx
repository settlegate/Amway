import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  location?: string
}

const kstDate = (input: string | number | Date) =>
  new Date(new Date(input).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }))

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const KAKAO_URL = (import.meta.env.VITE_KAKAO_CHANNEL_URL as string | undefined) || ''

const isCookingClass = (e: CalendarEvent) =>
  (e.title + ' ' + (e.description || '')).toLowerCase().includes('쿠킹')

const openKakao = () => {
  if (KAKAO_URL) window.open(KAKAO_URL, '_blank', 'noopener,noreferrer')
}

const formatStart = (date: Date) => {
  const h = date.getHours()
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${ampm} ${hour}시`
}

const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: 'mock-1',
    title: 'OMR 리더십 특강',
    description: '오전 10시~12시',
    date: '2026-09-03T10:00:00+09:00',
    location: '온라인',
  },
  {
    id: 'mock-2',
    title: '뉴트리라이트 기초 세미나',
    description: '오전 10시~12시',
    date: '2026-09-06T10:00:00+09:00',
    location: '온라인',
  },
  {
    id: 'mock-3',
    title: '건강기능식품 실전 활용법',
    description: '오후 2시~5시',
    date: '2026-09-10T14:00:00+09:00',
    location: '강남 웰니스 센터',
  },
  {
    id: 'mock-4',
    title: '체성분 분석 오픈 데이',
    description: '오후 1시~4시',
    date: '2026-09-12T13:00:00+09:00',
    location: '강남 웰니스 센터',
  },
  {
    id: 'mock-5',
    title: '리서스 그룹 OMR',
    description: '오후 2시~5시',
    date: '2026-09-19T14:00:00+09:00',
    location: '구리 장자공원 잔디광장',
  },
  {
    id: 'mock-6',
    title: 'ABO 비즈니스 리더 워크숍',
    description: '오후 7시~9시',
    date: '2026-09-23T19:00:00+09:00',
    location: '잠실 롯데타워 3F',
  },
  {
    id: 'mock-7',
    title: '주말 가족 웰니스 캠페인',
    description: '오전 11시~1시',
    date: '2026-09-26T11:00:00+09:00',
    location: '홍대 마포구민체육센터',
  },
]

export default function EventCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS)
  const [current, setCurrent] = useState(() => kstDate(new Date(2026, 8, 1)))

  useEffect(() => {
    api
      .get('/api/seminars')
      .then((res) => {
        const fetched = Array.isArray(res.data) ? res.data : []
        setEvents((prev) => [...fetched, ...prev])
      })
      .catch(() => {})
  }, [])

  const year = current.getFullYear()
  const month = current.getMonth()

  const monthEvents = useMemo(
    () =>
      events
        .filter((e) => {
          const d = kstDate(e.date)
          return d.getFullYear() === year && d.getMonth() === month
        })
        .sort((a, b) => kstDate(a.date).getTime() - kstDate(b.date).getTime()),
    [events, year, month]
  )

  const changeMonth = (delta: number) => {
    setCurrent(kstDate(new Date(year, month + delta, 1)))
  }

  return (
    <div className="event-calendar">
      <div className="calendar-header">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">
          {'<'}
        </button>
        <h3>
          {year}년 {month + 1}월
        </h3>
        <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달">
          {'>'}
        </button>
      </div>
      <div className="calendar-days">
        {monthEvents.length === 0 ? (
          <p className="empty">아직 등록된 일정이 없어요</p>
        ) : (
          monthEvents.map((e) => {
            const d = kstDate(e.date)
            const cooking = isCookingClass(e)

            const handleOpen = () => {
              if (cooking && KAKAO_URL) openKakao()
            }

            return (
              <div
                key={e.id}
                className={`day-card${cooking ? ' cooking' : ''}`}
                onClick={cooking ? handleOpen : undefined}
                onKeyDown={(ev) => {
                  if (cooking && (ev.key === 'Enter' || ev.key === ' ')) {
                    ev.preventDefault()
                    handleOpen()
                  }
                }}
                role={cooking ? 'button' : undefined}
                tabIndex={cooking ? 0 : undefined}
                aria-label={cooking ? '카카오톡으로 쿠킹 클래스 신청하기' : undefined}
              >
                <div className="date">{d.getDate()}일({WEEKDAYS[d.getDay()]}), {formatStart(d)}</div>
                <div className="title">{e.title}</div>
                <div className="loc">{e.location || '장소 미정'}</div>
                {cooking && KAKAO_URL && (
                  <div className="kakao-overlay" aria-hidden="true">
                    <span>카카오톡으로</span>
                    <span>신청하기</span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
