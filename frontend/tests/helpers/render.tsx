import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'

export function renderWithRouter(ui: ReactElement, { route = '/', state }: { route?: string; state?: unknown } = {}) {
  return render(<MemoryRouter initialEntries={[{ pathname: route, state }]}>{ui}</MemoryRouter>)
}

export function LocationProbe() {
  const location = useLocation()
  return (
    <div data-testid="location" data-state={JSON.stringify(location.state ?? null)}>
      {location.pathname}
      {location.search}
    </div>
  )
}

// path 경로에 ui를 렌더링하고, 그 외 경로로 이동하면 LocationProbe로 확인한다
export function renderRoute(path: string, ui: ReactElement, { state }: { state?: unknown } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route path={path} element={ui} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}
