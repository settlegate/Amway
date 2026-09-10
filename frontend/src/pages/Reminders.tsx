import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Reminders() {
  const [list, setList] = useState<any[]>([])
  const [form, setForm] = useState({ userId: '', productName: '', dosage: '', intakeTime: '09:00', cycleDays: 30 })

  const load = () => {
    if (!form.userId) return
    api.get('/api/reminders?userId=' + encodeURIComponent(form.userId)).then((res) => setList(res.data))
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/api/reminders', form)
    load()
    setForm({ ...form, productName: '', dosage: '', intakeTime: '09:00', cycleDays: 30 })
  }

  return (
    <div className="page">
      <h2>자동 복용 리마인더</h2>
      <form onSubmit={submit} className="card">
        <input value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} placeholder="userId" />
        <input value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} placeholder="제품명" />
        <input value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="섭취량" />
        <input type="time" value={form.intakeTime} onChange={(e) => setForm({ ...form, intakeTime: e.target.value })} />
        <input type="number" value={form.cycleDays} onChange={(e) => setForm({ ...form, cycleDays: Number(e.target.value) })} placeholder="섭취 주기(일)" />
        <button type="submit">등록</button>
      </form>
      {list.map((r) => (
        <div key={r.id} className="card">
          <p><strong>{r.productName}</strong> / {r.dosage}</p>
          <p>매일 {r.intakeTime} / {r.cycleDays}일분</p>
        </div>
      ))}
    </div>
  )
}
