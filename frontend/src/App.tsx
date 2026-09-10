import { Routes, Route, NavLink, Link } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Body from './pages/Body'
import Products from './pages/Products'
import Reminders from './pages/Reminders'
import Seminars from './pages/Seminars'
import Business from './pages/Business'
import Admin from './pages/Admin'
import Design from './pages/Design'
import ThemeToggle from './components/ThemeToggle'
import LeafIcon from './components/LeafIcon'

function App() {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        본문으로 건너뛰기
      </a>
      <header className="app-header">
        <div className="header-inner">
          <Link to="/" className="brand-mark" aria-label="Amway 웰니스 AI 홈">
            <span className="leaf-badge" aria-hidden="true">
              <LeafIcon size={18} />
            </span>
            <h1>
              Amway 웰니스 AI
              <small>Wellness Consultant</small>
            </h1>
          </Link>
          <nav className="app-nav" aria-label="주요 메뉴">
            <NavLink to="/" end>
              홈
            </NavLink>
            <NavLink to="/chat">챗봇</NavLink>
            <NavLink to="/body">체성분</NavLink>
            <NavLink to="/products">제품</NavLink>
            <NavLink to="/design">테마</NavLink>
            <NavLink to="/admin">CRM</NavLink>
          </nav>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/body" element={<Body />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/seminars" element={<Seminars />} />
          <Route path="/business" element={<Business />} />
          <Route path="/design" element={<Design />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
