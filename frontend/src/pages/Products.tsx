import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { openProductWindow } from '../lib/open'

export default function Products() {
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    api.get('/api/products?q=' + encodeURIComponent(query)).then((res) => setProducts(res.data))
  }, [query])

  return (
    <div className="page">
      <h2>맞춤 제품 추천</h2>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="증상/키워드 검색 (예: 피로, 체지방)"
      />
      {products.map((p) => (
        <div key={p.id} className="card">
          <h3>{p.name}</h3>
          <p>{p.description}</p>
          <p>{Array.isArray(p.benefits) ? p.benefits.join(', ') : p.benefits}</p>
          <p>섭취법: {p.dosage}</p>
          {p.promotion && (
            <p style={{ color: 'var(--brand)', fontWeight: 600 }}>
              프로모션: {p.promotion}
            </p>
          )}
          <p>가격: {p.price?.toLocaleString('ko-KR')}원</p>
          {p.pv != null && p.bv != null && (
            <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>
              PV {p.pv.toLocaleString()} · BV {p.bv.toLocaleString()}
            </p>
          )}
          <button
            type="button"
            onClick={() => openProductWindow(p.purchaseUrl || p.aClicUrl)}
          >
            새창에서 제품 보기
          </button>
        </div>
      ))}
    </div>
  )
}
