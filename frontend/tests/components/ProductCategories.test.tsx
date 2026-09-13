import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ProductCategories from '../../src/components/ProductCategories'
import { api } from '../../src/lib/api'
import { mockApiDefaults } from '../helpers/apiMock'
import { renderWithRouter } from '../helpers/render'

vi.mock('../../src/lib/api', () => import('../helpers/apiMock'))

const get = vi.mocked(api.get)

beforeEach(() => {
  mockApiDefaults()
})

describe('ProductCategories', () => {
  it('카테고리별 첫 번째 제품을 대표로 보여준다', async () => {
    get.mockResolvedValue({
      data: [
        { id: '1', name: '더블엑스', category: '비타민/미네랄', imageUrl: 'd.jpg' },
        { id: '2', name: '비타민C', category: '비타민/미네랄', imageUrl: 'c.jpg' },
        { id: '3', name: '기타 제품' },
      ],
    })

    renderWithRouter(<ProductCategories />)

    expect(await screen.findByRole('heading', { name: '비타민/미네랄' })).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/api/products')
    expect(screen.getByText('더블엑스 외')).toBeInTheDocument()
    expect(screen.queryByText('비타민C 외')).not.toBeInTheDocument()
    expect(screen.getByAltText('비타민/미네랄')).toHaveAttribute('src', 'd.jpg')

    const etc = screen.getByRole('link', { name: /기타/ })
    expect(etc).toHaveAttribute('href', `/products?q=${encodeURIComponent('기타')}`)
    expect(etc.querySelector('img')).toBeNull()
  })

  it('제품이 없으면 로딩 문구를 보여준다', async () => {
    get.mockResolvedValue({ data: { not: 'array' } })

    renderWithRouter(<ProductCategories />)

    expect(await screen.findByText('카테고리를 불러오는 중입니다.')).toBeInTheDocument()
  })

  it('API 오류가 나도 로딩 문구를 유지한다', async () => {
    get.mockRejectedValue(new Error('fail'))

    renderWithRouter(<ProductCategories />)

    expect(await screen.findByText('카테고리를 불러오는 중입니다.')).toBeInTheDocument()
  })
})
