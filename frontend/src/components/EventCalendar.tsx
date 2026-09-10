import { useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  date: string
  location?: string
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function EventCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [current, setCurrent] = useState(() => new Date())

  useEffect(() => {
    api
      .get('/api/seminars')
      .then((res) => setEvents(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEvents([]))
  }, [])

  const year = current.getFullYear()
  const month = current.getMonth()

  const monthEvents = useMemo(
    () =>
      events.filter((e) => {
        const d = new Date(e.date)
        return d.getFullYear() === year && d.getMonth() === month
      }),
    [events, year, month],
  )

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {}
    monthEvents.forEach((e) => {
      const day = new Date(e.date).getDate()
      if (!map[day]) map[day] = []
      map[day].push(e)
    })
    return map
  }, [monthEvents])

  const startOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = startOfMonth.getDay()

  const cells: (number | null)[] = []
  for (let i = 0; i < startDay; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d)

  const changeMonth = (delta: number) => {
    setCurrent(new Date(year, month + delta, 1))
  }

  return (
    <div className="event-calendar">
      <div className="calendar-header">
        <button type="button" onClick={() => changeMonth(-1)} aria-label="이전 달">
          ‹
        </button>
        <h3>
          {year}년 {month + 1}월
        </h3>
        <button type="button" onClick={() => changeMonth(1)} aria-label="다음 달">
          ›
        </button>
      </div>
      <div className="calendar-grid" role="grid" aria-label={`${year}년 ${month + 1}월 달력`}>
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((day, idx) => (
          <div
            key={idx}
            className={`calendar-cell ${day === null ? 'empty' : ''} ${
              day && eventsByDay[day] ? 'has-event' : ''
            }`}
            role="gridcell"
          >
            {day && (
              <>
                <span className="calendar-date">{day}</span>
                {eventsByDay[day] && <span className="calendar-dot" aria-hidden="true" />}
              </>
            )}
          </div>
        ))}
      </div>
      <div className="calendar-events">
        <h4>이번 달 일정</h4>
        {monthEvents.length === 0 ? (
          <p className="empty">이번 달 예정된 일정이 없습니다.</p>
        ) : (
          <ul>
            {monthEvents.map((e) => (
              <li key={e.id}>
                <time dateTime={e.date}>{new Date(e.date).toLocaleDateString('ko-KR')}</time>
                <strong>{e.title}</strong>
                <span>{e.location || '장소 미정'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
