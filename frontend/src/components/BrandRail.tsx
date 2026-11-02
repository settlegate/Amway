import { Link } from 'react-router-dom'

export default function BrandRail() {
  return (
    <aside className="home-sidebar">
      <Link to="/" className="sidebar-brand" aria-label="홈으로 이동">
        <div className="sidebar-brand-text">
          <img
            className="sidebar-brand-logo"
            src="/amway-logo.png"
            alt="Amway"
            height="28"
          />
          <h1 id="landing-hero-title">ABO 정주희가 전하는 이달의 웰니스 뉴스레터</h1>
        </div>
      </Link>
      <img
        className="sidebar-abo-photo"
        src="/images/abo-photo.jpg"
        alt="ABO 정주희"
      />
    </aside>
  )
}
