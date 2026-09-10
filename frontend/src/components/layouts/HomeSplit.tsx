import { Link } from 'react-router-dom'
import ChatPanel from '../ChatPanel'
import ChatMock from '../ChatMock'
import LeafIcon from '../LeafIcon'

interface HomeSplitProps {
  preview?: boolean
}

export default function HomeSplit({ preview = false }: HomeSplitProps) {
  return (
    <div className="split-layout">
      <aside className="split-left">
        <section className="hero hero-small" aria-labelledby="hero-title">
          <span className="hero-badge">
            <LeafIcon size={14} />
            AMWAY WELLNESS AI
          </span>
          <h2 id="hero-title">자연에서 시작된 정직한 상담</h2>
          <p>오늘 건강의 새로운 시작</p>
        </section>

        <div className="card profile-card">
          <div className="profile-avatar" aria-hidden="true">
            <LeafIcon size={20} />
          </div>
          <div>
            <h3>정주희 ABO</h3>
            <p>오늘도 건강한 하루를 시작해보세요.</p>
          </div>
        </div>

        <div className="card">
          <h3>오늘의 추천</h3>
          <ul className="tip-list">
            <li>아침 공복 물 한 잔으로 하루를 시작하세요.</li>
            <li>단백질 보충으로 활력을 높이세요.</li>
          </ul>
        </div>

        <div className="card">
          <h3>최근 상담</h3>
          <ul className="recent-list">
            <li>
              <Link to="/chat">면역력 비타민 추천</Link>
            </li>
            <li>
              <Link to="/body">체성분 결과 해석</Link>
            </li>
          </ul>
        </div>
      </aside>

      <div className="split-right">
        {preview ? <ChatMock /> : <ChatPanel />}
      </div>
    </div>
  )
}
