import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function Business() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get('/api/business/stp').then((res) => setData(res.data))
  }, [])

  return (
    <div className="page">
      <h2>암웨이 ABO 사업 설명</h2>
      <p className="card">{data?.headline}</p>
      {data?.steps?.map((step: any, i: number) => (
        <div key={i} className="card">
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          {step.options?.map((opt: string) => (
            <button key={opt} style={{ marginRight: 8, marginBottom: 8, width: 'auto' }}>{opt}</button>
          ))}
        </div>
      ))}
    </div>
  )
}
