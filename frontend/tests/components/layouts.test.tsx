import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TemplateGallery from '../../src/components/TemplateGallery'
import HomeFocus from '../../src/components/layouts/HomeFocus'
import HomeHub from '../../src/components/layouts/HomeHub'
import HomeSplit from '../../src/components/layouts/HomeSplit'
import { mockApiDefaults } from '../helpers/apiMock'
import { renderWithRouter } from '../helpers/render'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

beforeEach(() => {
  mockApiDefaults()
})

describe.each([
  ['HomeFocus', HomeFocus, '/business'],
  ['HomeHub', HomeHub, '/reminders'],
  ['HomeSplit', HomeSplit, '/body'],
])('%s', (_name, Layout, expectedLink) => {
  it('preview 모드에서는 정적 ChatMock을 보여준다', () => {
    const { container } = renderWithRouter(<Layout preview />)

    expect(screen.queryByRole('log')).not.toBeInTheDocument()
    expect(container.querySelector('.chat-shell[aria-hidden="true"]')).toBeInTheDocument()
    expect(container.querySelector(`a[href="${expectedLink}"]`)).toBeInTheDocument()
  })

  it('기본 모드에서는 실제 ChatPanel을 보여준다', () => {
    renderWithRouter(<Layout />)

    expect(screen.getByRole('log')).toBeInTheDocument()
    expect(screen.getByLabelText('메시지 입력')).toBeInTheDocument()
  })
})

describe('TemplateGallery', () => {
  it('레이아웃 카드와 안내 문구를 렌더링하고 선택 상태를 표시한다', () => {
    renderWithRouter(<TemplateGallery selected="hub" />)

    expect(screen.getByText(/마음에 드는 레이아웃을 선택하면/)).toBeInTheDocument()
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false'])
    expect(radios[1]).toHaveTextContent('적용 중')
  })

  it('적용 버튼을 누르면 레이아웃을 저장하고 onSelect를 호출한다', () => {
    const onSelect = vi.fn()
    renderWithRouter(<TemplateGallery onSelect={onSelect} showLabel={false} />)

    expect(screen.queryByText(/마음에 드는 레이아웃을 선택하면/)).not.toBeInTheDocument()
    const card = screen.getByRole('heading', { name: '웰니스 허브' }).closest('article')!
    fireEvent.click(within(card).getByRole('radio'))

    expect(localStorage.getItem('amway-layout')).toBe('hub')
    expect(onSelect).toHaveBeenCalledWith('hub')
  })

  it('onSelect 없이도 레이아웃을 저장한다', () => {
    renderWithRouter(<TemplateGallery />)

    fireEvent.click(screen.getAllByRole('radio')[2])

    expect(localStorage.getItem('amway-layout')).toBe('split')
  })
})
