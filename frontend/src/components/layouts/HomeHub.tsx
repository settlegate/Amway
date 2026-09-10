import { Link } from 'react-router-dom'
import ChatPanel from '../ChatPanel'
import ChatMock from '../ChatMock'
import LeafIcon from '../LeafIcon'

interface HomeHubProps {
  preview?: boolean
}

const SERVICES = [
  { to: '/chat', label: '건강 상담', desc: 'AI 상담' },
  { to: '/body', label: '체성분 분석', desc: 'InBody' },
  { to: '/products', label: '제품 추천', desc: '뉴트리라이트' },
  { to: '/seminars', label: '세미나 신청', desc: '일정' },
  { to: '/business', label: '사업 설명', desc: 'ABO' },
]

export default function HomeHub({ preview = false }: HomeHubProps) {
  return (
    <div>
      <section className="hero hero-compact" aria-labelledby="hero-title">
        <span className="hero-badge">
          <LeafIcon size={14} />
          AMWAY WELLNESS AI
        </span>
        <h2 id="hero-title">자연에서 시작된 정직한 상담</h2>
        <p>웰니스 AI가 고객님의 건강 목표에 맞춰 답변드립니다.</p>
        <div className="hero-search-wrap">
          <input
            className="hero-search"
            type="search"
            name="q"
            placeholder="예: 비타민, 체성분, 세미나…"
            aria-label="빠른 검색"
            autoComplete="off"
          />
        </div>
      </section>

      <nav className="service-strip" aria-label="빠른 서비스">
        {SERVICES.map((s) => (
          <Link key={s.to} to={s.to} className="service-pill">
            <span>{s.label}</span>
            <small>{s.desc}</small>
          </Link>
        ))}
      </nav>

      {preview ? <ChatMock /> : <ChatPanel />}

      <div className="grid" style={{ marginTop: 14 }}>
        <Link to="/admin" className="card">
          리드 CRM
          <span>최근 상담과 고객을 확인하세요</span>
        </Link>
        <Link to="/reminders" className="card">
          알림 설정
          <span>고객 케어 일정을 관리하세요</span>
        </Link>
      </div>
    </div>
  )
}
