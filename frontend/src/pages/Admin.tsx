import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import SeminarAdmin from '../components/SeminarAdmin'

type Product = {
  id: string
  code: string
  name: string
  category: string
  price: number
  pv?: number | null
  bv?: number | null
  promotion?: string | null
  imageUrl?: string | null
  aClicUrl?: string | null
  lastSyncedAt?: string | null
  isActive: boolean
  promotions?: Promotion[]
}

type Promotion = {
  id: string
  productId?: string | null
  product?: { id: string; code: string; name: string } | null
  title: string
  description?: string | null
  startAt?: string | null
  endAt?: string | null
  isActive: boolean
  createdAt: string
}

const emptyPromotionForm = {
  title: '',
  description: '',
  productId: '',
  startAt: '',
  endAt: '',
  isActive: true,
}

export default function Admin() {
  const [data, setData] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [syncUrl, setSyncUrl] = useState('')
  const [syncCategory, setSyncCategory] = useState('')
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncAllLoading, setSyncAllLoading] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [promoForm, setPromoForm] = useState({ ...emptyPromotionForm })
  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null)
  const [promoSaving, setPromoSaving] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')

  const [homePromoFile, setHomePromoFile] = useState<File | null>(null)
  const [homePromoTargetUrl, setHomePromoTargetUrl] = useState('')
  const [homePromoAlt, setHomePromoAlt] = useState('')
  const [homePromoActive, setHomePromoActive] = useState(true)
  const [homePromotions, setHomePromotions] = useState<any[]>([])
  const [homePromoMessage, setHomePromoMessage] = useState('')
  const [homePromoSaving, setHomePromoSaving] = useState(false)

  const loadDashboard = () =>
    api.get('/api/admin/dashboard').then((res) => setData(res.data))
  const loadProducts = () =>
    api.get('/api/admin/products').then((res) => setProducts(res.data))
  const loadPromotions = () =>
    api.get('/api/admin/promotions').then((res) => setPromotions(res.data))
  const loadHomePromotions = () =>
    api.get('/api/admin/home-promotions').then((res) => setHomePromotions(res.data))

  useEffect(() => {
    loadDashboard()
    loadProducts()
    loadPromotions()
    loadHomePromotions()
  }, [])

  const syncSingle = async () => {
    if (!syncUrl) {
      setSyncMessage('암웨이 상품 페이지 URL을 입력해주세요.')
      return
    }
    setSyncLoading(true)
    setSyncMessage('')
    try {
      const res = await api.post('/api/admin/products/sync', {
        url: syncUrl,
        category: syncCategory || undefined,
      })
      setSyncMessage(`동기화 완료: ${res.data.name}`)
      setSyncUrl('')
      setSyncCategory('')
      await loadProducts()
      await loadPromotions()
    } catch (err: any) {
      setSyncMessage(err?.response?.data?.error || '제품 동기화에 실패했습니다.')
    } finally {
      setSyncLoading(false)
    }
  }

  const syncAll = async () => {
    setSyncAllLoading(true)
    setSyncMessage('전체 제품 동기화 중...')
    try {
      const res = await api.post('/api/admin/products/sync-all')
      setSyncMessage(`전체 동기화 완료: ${res.data.synced}개 제품`)
      await loadProducts()
      await loadPromotions()
    } catch (err: any) {
      setSyncMessage(err?.response?.data?.error || '전체 동기화에 실패했습니다.')
    } finally {
      setSyncAllLoading(false)
    }
  }

  const savePromotion = async () => {
    if (!promoForm.title) {
      setPromoMessage('프로모션 제목을 입력해주세요.')
      return
    }
    setPromoSaving(true)
    setPromoMessage('')
    try {
      const payload = {
        title: promoForm.title,
        description: promoForm.description || null,
        productId: promoForm.productId || null,
        startAt: promoForm.startAt || null,
        endAt: promoForm.endAt || null,
        isActive: promoForm.isActive,
      }
      if (editingPromotionId) {
        await api.put(`/api/admin/promotions/${editingPromotionId}`, payload)
        setPromoMessage('프로모션이 수정되었습니다.')
      } else {
        await api.post('/api/admin/promotions', payload)
        setPromoMessage('프로모션이 등록되었습니다.')
      }
      setPromoForm({ ...emptyPromotionForm })
      setEditingPromotionId(null)
      await loadPromotions()
      await loadProducts()
    } catch (err: any) {
      setPromoMessage(err?.response?.data?.error || '프로모션 저장에 실패했습니다.')
    } finally {
      setPromoSaving(false)
    }
  }

  const editPromotion = (p: Promotion) => {
    setEditingPromotionId(p.id)
    setPromoMessage('')
    setPromoForm({
      title: p.title,
      description: p.description || '',
      productId: p.productId || '',
      startAt: p.startAt ? p.startAt.slice(0, 10) : '',
      endAt: p.endAt ? p.endAt.slice(0, 10) : '',
      isActive: p.isActive,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const deletePromotion = async (id: string) => {
    setPromoMessage('프로모션을 삭제했습니다.')
    await api.delete(`/api/admin/promotions/${id}`)
    await loadPromotions()
  }

  const togglePromotion = async (p: Promotion) => {
    await api.put(`/api/admin/promotions/${p.id}`, { isActive: !p.isActive })
    await loadPromotions()
  }

  const saveHomePromo = async () => {
    if (!homePromoFile) {
      setHomePromoMessage('프로모션 이미지를 선택해주세요.')
      return
    }
    if (!homePromoTargetUrl) {
      setHomePromoMessage('프로모션 링크 URL을 입력해주세요.')
      return
    }
    setHomePromoSaving(true)
    setHomePromoMessage('')
    const form = new FormData()
    form.append('image', homePromoFile)
    form.append('targetUrl', homePromoTargetUrl)
    form.append('alt', homePromoAlt)
    form.append('isActive', homePromoActive ? 'true' : 'false')
    try {
      await api.post('/api/admin/home-promotions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setHomePromoMessage('홈 프로모션 배너가 등록되었습니다.')
      setHomePromoFile(null)
      setHomePromoTargetUrl('')
      setHomePromoAlt('')
      setHomePromoActive(true)
      await loadHomePromotions()
    } catch (err: any) {
      setHomePromoMessage(err?.response?.data?.error || '홈 프로모션 배너 등록에 실패했습니다.')
    } finally {
      setHomePromoSaving(false)
    }
  }

  const toggleHomePromo = async (p: any) => {
    await api.put(`/api/admin/home-promotions/${p.id}`, { isActive: !p.isActive })
    await loadHomePromotions()
  }

  const deleteHomePromo = async (id: string) => {
    await api.delete(`/api/admin/home-promotions/${id}`)
    setHomePromoMessage('홈 프로모션 배너가 삭제되었습니다.')
    await loadHomePromotions()
  }

  const fmtDate = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString('ko-KR') : '-'

  return (
    <div className="page">
      <h2>ABO 관리자</h2>

      <SeminarAdmin />

      <div className="grid" style={{ marginBottom: 20 }}>
        <div className="card">
          유저
          <span>{data?.counts?.userCount ?? 0}명</span>
        </div>
        <div className="card">
          리드
          <span>{data?.counts?.leadCount ?? 0}건</span>
        </div>
        <div className="card">
          세미나
          <span>{data?.counts?.seminarCount ?? 0}개</span>
        </div>
        <div className="card">
          체성분 기록
          <span>{data?.counts?.bodyRecordCount ?? 0}건</span>
        </div>
      </div>

      <section className="card" aria-labelledby="product-sync-title">
        <h3 id="product-sync-title" style={{ marginTop: 0 }}>
          제품 정보 동기화
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 0 }}>
          암웨이 공식몰 상품 페이지 URL을 넣으면 상품명·가격·PV/BV·이미지·프로모션
          정보를 자동으로 가져옵니다.
        </p>
        <input
          value={syncUrl}
          onChange={(e) => setSyncUrl(e.target.value)}
          placeholder="예: https://www.amway.co.kr/shop/nutrition/basic/vitamins-minerals/p/120843K"
        />
        <input
          value={syncCategory}
          onChange={(e) => setSyncCategory(e.target.value)}
          placeholder="카테고리 (예: 비타민/미네랄, 신규 제품일 때 사용)"
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={syncSingle}
            disabled={syncLoading || syncAllLoading}
            style={{ width: 'auto', margin: 0, padding: '10px 18px' }}
          >
            {syncLoading ? '동기화 중...' : '이 URL 동기화'}
          </button>
          <button
            type="button"
            onClick={syncAll}
            disabled={syncLoading || syncAllLoading}
            style={{
              width: 'auto',
              margin: 0,
              padding: '10px 18px',
              background: 'var(--surface-soft)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            {syncAllLoading ? '전체 동기화 중...' : '전체 제품 동기화'}
          </button>
        </div>
        {syncMessage && (
          <p
            role="status"
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              color: syncMessage.includes('실패') ? '#b91c1c' : 'var(--brand)',
            }}
          >
            {syncMessage}
          </p>
        )}
      </section>

      <section className="card" aria-labelledby="promotion-form-title">
        <h3 id="promotion-form-title" style={{ marginTop: 0 }}>
          {editingPromotionId ? '프로모션 수정' : '프로모션 / 일정 등록'}
        </h3>
        <input
          value={promoForm.title}
          onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })}
          placeholder="프로모션 제목 (예: 오늘도 눈부시게 글루타치온 프로모션)"
        />
        <textarea
          value={promoForm.description}
          onChange={(e) =>
            setPromoForm({ ...promoForm, description: e.target.value })
          }
          placeholder="프로모션 설명 / 혜택 / 참여 방법"
          rows={3}
        />
        <select
          value={promoForm.productId}
          onChange={(e) =>
            setPromoForm({ ...promoForm, productId: e.target.value })
          }
        >
          <option value="">연결할 제품 선택 (선택 사항)</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="date"
            value={promoForm.startAt}
            onChange={(e) =>
              setPromoForm({ ...promoForm, startAt: e.target.value })
            }
            aria-label="시작일"
            style={{ flex: 1, minWidth: 140 }}
          />
          <input
            type="date"
            value={promoForm.endAt}
            onChange={(e) =>
              setPromoForm({ ...promoForm, endAt: e.target.value })
            }
            aria-label="종료일"
            style={{ flex: 1, minWidth: 140 }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={promoForm.isActive}
            onChange={(e) =>
              setPromoForm({ ...promoForm, isActive: e.target.checked })
            }
            style={{ width: 'auto', margin: 0 }}
          />
          활성화
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={savePromotion}
            disabled={promoSaving}
            style={{ width: 'auto', margin: 0, padding: '10px 18px' }}
          >
            {promoSaving
              ? '저장 중...'
              : editingPromotionId
                ? '수정 저장'
                : '프로모션 등록'}
          </button>
          {editingPromotionId && (
            <button
              type="button"
              onClick={() => {
                setEditingPromotionId(null)
                setPromoForm({ ...emptyPromotionForm })
              }}
              style={{
                width: 'auto',
                margin: 0,
                padding: '10px 18px',
                background: 'var(--surface-soft)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              취소
            </button>
          )}
        </div>
        {promoMessage && (
          <p
            role="status"
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              color: promoMessage.includes('실패') || promoMessage.includes('입력') ? '#b91c1c' : 'var(--brand)',
            }}
          >
            {promoMessage}
          </p>
        )}
      </section>

      <h3>등록된 프로모션</h3>
      {promotions.length === 0 && (
        <div className="card">등록된 프로모션이 없습니다.</div>
      )}
      {promotions.map((p) => (
        <div key={p.id} className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 10,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong>{p.title}</strong>
              {p.product?.name && (
                <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--text-soft)' }}>
                  연결 제품: {p.product.name}
                </p>
              )}
              {p.description && <p style={{ margin: '4px 0' }}>{p.description}</p>}
              <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--text-soft)' }}>
                기간: {fmtDate(p.startAt)} ~ {fmtDate(p.endAt)}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => togglePromotion(p)}
                style={{
                  width: 'auto',
                  margin: 0,
                  padding: '6px 12px',
                  fontSize: 12,
                  background: p.isActive ? 'var(--accent)' : 'var(--surface-soft)',
                  color: p.isActive ? 'var(--accent-text)' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {p.isActive ? '활성' : '비활성'}
              </button>
              <button
                type="button"
                onClick={() => editPromotion(p)}
                style={{
                  width: 'auto',
                  margin: 0,
                  padding: '6px 12px',
                  fontSize: 12,
                  background: 'var(--surface-soft)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                수정
              </button>
              <button
                type="button"
                onClick={() => deletePromotion(p.id)}
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
        </div>
      ))}

      <section className="card" aria-labelledby="home-promo-title">
        <h3 id="home-promo-title" style={{ marginTop: 0 }}>
          홈 프로모션 배너
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 0 }}>
          캡처 이미지와 프로모션 링크 URL을 입력하면 메인 페이지 프로모션 영역에 즉시 적용됩니다.
        </p>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          onChange={(e) => setHomePromoFile(e.target.files?.[0] || null)}
          style={{ marginBottom: 8 }}
        />
        {homePromoFile && (
          <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: '4px 0' }}>
            선택 파일: {homePromoFile.name}
          </p>
        )}
        <input
          value={homePromoTargetUrl}
          onChange={(e) => setHomePromoTargetUrl(e.target.value)}
          placeholder="프로모션 링크 URL"
        />
        <input
          value={homePromoAlt}
          onChange={(e) => setHomePromoAlt(e.target.value)}
          placeholder="이미지 설명 (alt, 선택 사항)"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
          <input
            type="checkbox"
            checked={homePromoActive}
            onChange={(e) => setHomePromoActive(e.target.checked)}
            style={{ width: 'auto', margin: 0 }}
          />
          활성화
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={saveHomePromo}
            disabled={homePromoSaving}
            style={{ width: 'auto', margin: 0, padding: '10px 18px' }}
          >
            {homePromoSaving ? '등록 중...' : '배너 등록'}
          </button>
        </div>
        {homePromoMessage && (
          <p
            role="status"
            style={{
              margin: '10px 0 0',
              fontSize: 13,
              color:
                homePromoMessage.includes('실패') || homePromoMessage.includes('입력')
                  ? '#b91c1c'
                  : 'var(--brand)',
            }}
          >
            {homePromoMessage}
          </p>
        )}

        <h4 style={{ margin: '24px 0 12px' }}>등록된 홈 배너</h4>
        {homePromotions.length === 0 && (
          <div className="card">등록된 홈 배너가 없습니다.</div>
        )}
        {homePromotions.map((p) => (
          <div key={p.id} className="card">
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                flexWrap: 'wrap',
              }}
            >
              {p.imageUrl && (
                <img
                  src={p.imageUrl}
                  alt={p.alt || '배너 이미지'}
                  style={{
                    width: 120,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 10,
                    background: 'var(--surface-soft)',
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: '0 0 4px', fontSize: 13 }}>
                  <strong>링크:</strong>{' '}
                  <a href={p.targetUrl} target="_blank" rel="noopener noreferrer">
                    {p.targetUrl}
                  </a>
                </p>
                <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--text-soft)' }}>
                  상태: {p.isActive ? '활성' : '비활성'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => toggleHomePromo(p)}
                  style={{
                    width: 'auto',
                    margin: 0,
                    padding: '6px 12px',
                    fontSize: 12,
                    background: p.isActive ? 'var(--accent)' : 'var(--surface-soft)',
                    color: p.isActive ? 'var(--accent-text)' : 'var(--text)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {p.isActive ? '활성' : '비활성'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteHomePromo(p.id)}
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
          </div>
        ))}
      </section>

      <h3>제품 목록</h3>
      {products.map((p) => (
        <div key={p.id} className="card">
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            {p.imageUrl && (
              <img
                src={p.imageUrl}
                alt={p.name}
                style={{
                  width: 64,
                  height: 64,
                  objectFit: 'cover',
                  borderRadius: 10,
                  background: 'var(--surface-soft)',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 200 }}>
              <strong>{p.name}</strong>
              <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--text-soft)' }}>
                {p.category} · {p.price?.toLocaleString('ko-KR')}원
                {p.pv != null && ` · PV ${p.pv.toLocaleString()}`}
                {p.bv != null && ` · BV ${p.bv.toLocaleString()}`}
              </p>
              {p.promotion && (
                <p style={{ margin: '4px 0', fontSize: 13, color: 'var(--brand)' }}>
                  프로모션: {p.promotion}
                </p>
              )}
              {p.lastSyncedAt && (
                <p style={{ margin: '4px 0', fontSize: 12, color: 'var(--text-soft)' }}>
                  마지막 동기화: {new Date(p.lastSyncedAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      <h3>후속 상담 필요 리드</h3>
      {data?.followUpLeads?.map((lead: any) => (
        <div key={lead.id} className="card">
          <p>
            <strong>{lead.user?.name || '익명'}</strong> /{' '}
            {lead.category || '미분류'}
          </p>
          <p>상태: {lead.status}</p>
          <p>{lead.notes}</p>
        </div>
      ))}
    </div>
  )
}
