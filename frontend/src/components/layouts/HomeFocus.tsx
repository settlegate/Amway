import { Link } from 'react-router-dom'
import ChatPanel from '../ChatPanel'
import ChatMock from '../ChatMock'
import LeafIcon from '../LeafIcon'

interface HomeFocusProps {
  preview?: boolean
}

export default function HomeFocus({ preview = false }: HomeFocusProps) {
  return (
    <div>
      <section className="hero" aria-labelledby="hero-title">
        <span className="hero-badge">
          <LeafIcon size={14} />
          AMWAY WELLNESS AI
        </span>
        <h2 id="hero-title">
          자연에서 시작된 정직한 상담,
          <br />
          오늘 건강의 새로운 시작
        </h2>
        <p>
          천연재료를 담은 뉴트리라이트의 철학처럼, 웰니스 AI가 고객님의
          컨디션에 맞는 정직한 답변을 드립니다.
        </p>
      </section>

      {preview ? <ChatMock /> : <ChatPanel />}

      <div className="grid" style={{ marginTop: 14 }}>
        <Link to="/body" className="card">
          체성분 분석
          <span>InBody 결과 사진을 올리면 AI가 해석해드려요</span>
        </Link>
        <Link to="/products" className="card">
          제품 추천
          <span>목적에 맞는 뉴트리라이트 제품을 찾아보세요</span>
        </Link>
        <Link to="/seminars" className="card">
          세미나 신청
          <span>건강 세미나 일정을 확인하고 예약하세요</span>
        </Link>
        <Link to="/business" className="card">
          사업 설명
          <span>ABO 비즈니스 기회를 소개해드립니다</span>
        </Link>
      </div>
    </div>
  )
}
