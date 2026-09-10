import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Body from './pages/Body'
import Products from './pages/Products'
import Reminders from './pages/Reminders'
import Seminars from './pages/Seminars'
import Business from './pages/Business'
import Admin from './pages/Admin'
import Design from './pages/Design'

function App() {
  return (
    <div className="app">
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
          <Route path="/joohee0229" element={<Admin />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
