import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="app-footer" role="contentinfo">
      <div className="footer-inner">
        <nav className="footer-nav" aria-label="푸터 메뉴">
          <Link to="/">홈</Link>
          <Link to="/chat">건강 상담</Link>
          <Link to="/products">제품</Link>
          <Link to="/seminars">세미나</Link>
          <Link to="/business">사업</Link>
        </nav>
        <p className="footer-copy">© 2026 Amway 웰니스 AI. All rights reserved.</p>
      </div>
    </footer>
  )
}
