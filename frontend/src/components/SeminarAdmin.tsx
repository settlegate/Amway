import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type Seminar = {
  id: string
  title: string
  description?: string | null
  date: string
  location?: string | null
  maxAttendees: number
  createdAt: string
}

const emptyForm = {
  title: '',
  description: '',
  date: '',
  location: '',
  maxAttendees: 20,
}

export default function SeminarAdmin() {
  const [seminars, setSeminars] = useState<Seminar[]>([])
  const [form, setForm] = useState({ ...emptyForm })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const load = () =>
    api.get('/api/admin/seminars').then((res) => setSeminars(res.data))

  useEffect(() => {
    load()
  }, [])

  const save = async () => {
    if (!form.title || !form.date) {
      setMessage('일정 제목과 날짜/시간을 입력해주세요.')
      return
    }
    setLoading(true)
    setMessage('')
    try {
      await api.post('/api/admin/seminars', {
        title: form.title,
        description: form.description || null,
        date: new Date(form.date).toISOString(),
        location: form.location || null,
        maxAttendees: Number(form.maxAttendees) || 20,
      })
      setForm({ ...emptyForm })
      setMessage('일정을 등록했습니다.')
      await load()
    } catch (err: any) {
      setMessage(err?.response?.data?.error || '일정 등록에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm('이 일정을 삭제할까요?')) return
    await api.delete(`/api/admin/seminars/${id}`)
    await load()
  }

  const fmt = (d: string) => new Date(d).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <section className="card" aria-labelledby="seminar-admin-title">
      <h3 id="seminar-admin-title" style={{ marginTop: 0 }}>
        캘린더 일정 관리
      </h3>
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="일정 제목"
      />
      <input
        type="datetime-local"
        value={form.date}
        onChange={(e) => setForm({ ...form, date: e.target.value })}
        aria-label="일정 날짜 및 시간"
      />
      <input
        value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })}
        placeholder="장소"
      />
      <input
        type="number"
        value={form.maxAttendees}
        onChange={(e) => setForm({ ...form, maxAttendees: Number(e.target.value) })}
        placeholder="최대 참석자 수"
        aria-label="최대 참석자 수"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="설명 (선택)"
        rows={3}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={save}
          disabled={loading}
          style={{ width: 'auto', margin: 0, padding: '10px 18px' }}
        >
          {loading ? '등록 중...' : '일정 등록'}
        </button>
      </div>
      {message && (
        <p
          role="status"
          style={{
            margin: '10px 0 0',
            fontSize: 13,
            color: message.includes('실패') || message.includes('입력')
              ? '#b91c1c'
              : 'var(--brand)',
          }}
        >
          {message}
        </p>
      )}

      <h4 style={{ margin: '24px 0 12px' }}>등록된 일정</h4>
      {seminars.length === 0 && (
        <div className="card">등록된 일정이 없습니다.</div>
      )}
      {seminars.map((s) => (
        <div key={s.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong>{s.title}</strong>
              <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--text-soft)' }}>
                {fmt(s.date)} · {s.location || '장소 미정'}
              </p>
              {s.description && <p style={{ margin: '4px 0', fontSize: 13 }}>{s.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => remove(s.id)}
              style={{
                width: 'auto',
                margin: 0,
                padding: '6px 12px',
                fontSize: 12,
                background: '#fee2e2',
                color: '#b91c1c',
                border: '1px solid #fecaca',
              }}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </section>
  )
}
