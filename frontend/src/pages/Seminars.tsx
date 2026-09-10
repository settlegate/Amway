import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Seminars() {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ name: '', phone: '', userId: '' })

  useEffect(() => {
    api.get('/api/seminars').then((res) => setList(res.data))
  }, [])

  const apply = async (seminarId: string) => {
    if (!form.name || !form.phone) {
      alert('이름과 연락처를 입력해주세요.')
      return
    }
    await api.post(`/api/seminars/${seminarId}/apply`, form)
    alert('신청이 완료되었습니다.')
  }

  return (
    <div className="page">
      <h2>홈미팅 / 세미나 일정</h2>
      <div className="card">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="이름" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="연락처" />
      </div>
      {list.map((s) => (
        <div key={s.id} className="card">
          <h3>{s.title}</h3>
          <p>{s.description}</p>
          <p>일시: {new Date(s.date).toLocaleString('ko-KR')}</p>
          <p>장소: {s.location || '미정'}</p>
          <button onClick={() => apply(s.id)}>신청하기</button>
        </div>
      ))}
    </div>
  )
}
