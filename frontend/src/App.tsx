import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Products from './pages/Products'
import Reminders from './pages/Reminders'
import Seminars from './pages/Seminars'
import Business from './pages/Business'
import Admin from './pages/Admin'
import Session from './pages/Session'
import Design from './pages/Design'
import Footer from './components/Footer'
import PageTracker from './components/PageTracker'

function App() {
  return (
    <div className="app">
      <PageTracker />
      <main id="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/seminars" element={<Seminars />} />
          <Route path="/business" element={<Business />} />
          <Route path="/design" element={<Design />} />
          <Route path="/session" element={<Session />} />
          <Route path="/joohee0229" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
