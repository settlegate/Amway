import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '../src/App'

vi.mock('../src/pages/Home', () => ({ default: () => <p>HOME_PAGE</p> }))
vi.mock('../src/pages/Chat', () => ({ default: () => <p>CHAT_PAGE</p> }))
vi.mock('../src/pages/Products', () => ({ default: () => <p>PRODUCTS_PAGE</p> }))
vi.mock('../src/pages/Reminders', () => ({ default: () => <p>REMINDERS_PAGE</p> }))
vi.mock('../src/pages/Seminars', () => ({ default: () => <p>SEMINARS_PAGE</p> }))
vi.mock('../src/pages/Business', () => ({ default: () => <p>BUSINESS_PAGE</p> }))
vi.mock('../src/pages/Design', () => ({ default: () => <p>DESIGN_PAGE</p> }))
vi.mock('../src/pages/Admin', () => ({ default: () => <p>ADMIN_PAGE</p> }))

describe('App 라우팅', () => {
  it.each([
    ['/', 'HOME_PAGE'],
    ['/chat', 'CHAT_PAGE'],
    ['/products', 'PRODUCTS_PAGE'],
    ['/reminders', 'REMINDERS_PAGE'],
    ['/seminars', 'SEMINARS_PAGE'],
    ['/business', 'BUSINESS_PAGE'],
    ['/design', 'DESIGN_PAGE'],
    ['/joohee0229', 'ADMIN_PAGE'],
  ])('%s 경로는 %s 를 렌더링하고 공통 푸터를 포함한다', (path, text) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('관리자 페이지는 /admin 경로로 노출되지 않는다', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.queryByText('ADMIN_PAGE')).not.toBeInTheDocument()
  })
})
