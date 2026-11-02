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
const KAKAO_URL =
  (import.meta.env.VITE_KAKAO_CHANNEL_URL as string | undefined) ||
  'https://open.kakao.com/o/swrk4QLi'

const formatStart = (date: Date) => {
  const h = date.getHours()
  const m = date.getMinutes()
  const ampm = h >= 12 ? '오후' : '오전'
  const hour = h % 12 || 12
  return `${ampm} ${hour}시${m ? ` ${m}분` : ''}`
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const NOW = kstDate(new Date())
const eventDate = (day: number, hour = 0, minute = 0) =>
  `${NOW.getFullYear()}-${pad2(NOW.getMonth() + 1)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:00+09:00`

const EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    title: '암웨이 초청 세미나',
    date: eventDate(7, 14),
    location: '송파',
  },
  {
    id: 'ev-2',
    title: '요리 홈미팅',
    date: eventDate(10, 19, 30),
    location: '방배',
  },
  {
    id: 'ev-3',
    title: '암웨이 사업설명',
    date: eventDate(12, 19, 30),
    location: '서초',
  },
  {
    id: 'ev-4',
    title: '플리마켓 홈미팅',
    date: eventDate(18, 11),
    location: '다산',
  },
  {
    id: 'ev-5',
    title: '암웨이 사업설명',
    date: eventDate(18, 19, 30),
    location: '하남',
  },
  {
    id: 'ev-6',
    title: '와인 홈미팅',
    date: eventDate(20, 19),
    location: '방배',
  },
  {
    id: 'ev-7',
    title: '퀸요리 클래스',
    date: eventDate(24, 10, 30),
    location: '분당',
  },
  {
    id: 'ev-8',
    title: '요리 홈미팅',
    date: eventDate(27, 11),
    location: '방배',
  },
]

export default function EventCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(EVENTS)
  const [current, setCurrent] = useState(() => kstDate(new Date()))

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

  const dayGroups = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>()
    for (const e of monthEvents) {
      const day = kstDate(e.date).getDate()
      const list = map.get(day) ?? []
      list.push(e)
      map.set(day, list)
    }
    return [...map.entries()].map(([day, list]) => ({ day, list }))
  }, [monthEvents])

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
          dayGroups.map(({ day, list }) => {
            const d = kstDate(list[0].date)

            return (
              <div key={day} className='day-card'>
                <div className="day-date">
                  <span className="day-num">{day}</span>
                  <span className="day-week">{WEEKDAYS[d.getDay()]}</span>
                </div>
                <div className="day-events">
                  {list.map((e) => {
                    const ed = kstDate(e.date)
                    const meta = [ed.getHours() ? formatStart(ed) : '', e.location]
                      .filter(Boolean)
                      .join(' · ')

                    return (
                      <div key={e.id} className="day-event">
                        <div className="day-info">
                          <div className="title">{e.title}</div>
                          {meta && <div className="meta">{meta}</div>}
                        </div>
                        <a
                          href={KAKAO_URL}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='kakao-cta'
                          aria-label={`${e.title} 카카오톡 오픈채팅으로 문의하기`}
                        >
                          <svg viewBox='0 0 24 24' width='18' height='18' aria-hidden='true' focusable='false'>
                            <path
                              d='M12 3C6.48 3 2 6.58 2 11c0 2.8 1.76 5.25 4.4 6.65l-.98 3.32c-.09.4.35.72.72.5l4.14-2.5c.56.08 1.13.13 1.72.13 5.52 0 10-3.58 10-8S17.52 3 12 3z'
                              fill='#3C1E1E'
                            />
                          </svg>
                        </a>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
