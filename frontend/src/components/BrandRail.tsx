import { Link } from 'react-router-dom'
import LeafIcon from './LeafIcon'

export default function BrandRail() {
  return (
    <aside className="home-sidebar">
      <Link to="/" className="sidebar-brand" aria-label="홈으로 이동">
        <div className="sidebar-brand-mark">
          <LeafIcon size={48} />
        </div>
        <div className="sidebar-brand-text">
          <img
            className="sidebar-brand-logo"
            src="/amway-logo.png"
            alt="Amway"
            height="28"
          />
          <span>건마주희&apos;s 뉴스레터</span>
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
