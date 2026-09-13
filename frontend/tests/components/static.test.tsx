import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BrandRail from '../../src/components/BrandRail'
import ChatMock from '../../src/components/ChatMock'
import ExternalLink from '../../src/components/ExternalLink'
import Footer from '../../src/components/Footer'
import IconBadge from '../../src/components/IconBadge'
import LeafIcon from '../../src/components/LeafIcon'
import PageLayout from '../../src/components/PageLayout'
import UploadIcon from '../../src/components/UploadIcon'
import { renderWithRouter } from '../helpers/render'

describe('ExternalLink', () => {
  it('새 탭에서 안전하게 열리는 링크를 렌더링한다', () => {
    render(
      <ExternalLink href="https://amway.co.kr" className="btn" ariaLabel="암웨이">
        이동
      </ExternalLink>,
    )

    const link = screen.getByRole('link', { name: '암웨이' })
    expect(link).toHaveAttribute('href', 'https://amway.co.kr')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveClass('btn')
    expect(link).toHaveTextContent('이동')
  })
})

describe('Footer', () => {
  it('주요 경로 내비게이션을 제공한다', () => {
    renderWithRouter(<Footer />)

    const nav = screen.getByRole('navigation', { name: '푸터 메뉴' })
    const links = Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])
    expect(links).toEqual([
      ['홈', '/'],
      ['건강 상담', '/chat'],
      ['제품', '/products'],
      ['세미나', '/seminars'],
      ['사업', '/business'],
    ])
  })
})

describe('BrandRail / PageLayout', () => {
  it('BrandRail은 홈 링크와 ABO 사진을 표시한다', () => {
    renderWithRouter(<BrandRail />)

    expect(screen.getByRole('link', { name: '홈으로 이동' })).toHaveAttribute('href', '/')
    expect(screen.getByAltText('ABO 정주희')).toBeInTheDocument()
  })

  it('PageLayout은 브랜드 레일과 함께 콘텐츠를 감싼다', () => {
    const { container } = renderWithRouter(
      <PageLayout>
        <p>본문</p>
      </PageLayout>,
    )

    expect(container.querySelector('.home-sidebar')).toBeInTheDocument()
    expect(container.querySelector('.home-main')).toHaveTextContent('본문')
  })
})

describe('ChatMock', () => {
  it('기본 문구를 표시한다', () => {
    render(<ChatMock />)
    expect(screen.getByText(/궁금한 점을 물어보세요/)).toBeInTheDocument()
    expect(screen.getByText('피로 회복에 좋은 영양제 추천해주세요')).toBeInTheDocument()
  })

  it('전달한 문구를 표시한다', () => {
    render(<ChatMock aiText="AI" userText="USER" />)
    expect(screen.getByText('AI')).toBeInTheDocument()
    expect(screen.getByText('USER')).toBeInTheDocument()
  })
})

describe('아이콘', () => {
  it('LeafIcon / UploadIcon은 기본 크기와 지정 크기를 지원한다', () => {
    const { container } = render(
      <>
        <LeafIcon />
        <LeafIcon size={30} />
        <UploadIcon />
        <UploadIcon size={12} />
      </>,
    )

    const sizes = Array.from(container.querySelectorAll('svg')).map((svg) => svg.getAttribute('width'))
    expect(sizes).toEqual(['18', '30', '18', '12'])
  })

  it.each(['zap', 'lock', 'scale', 'clock', 'shield', 'check'] as const)('IconBadge %s 경로를 렌더링한다', (type) => {
    const { container } = render(<IconBadge type={type} />)

    expect(container.querySelector('svg')).toHaveAttribute('width', '22')
    expect(container.querySelector('path')?.getAttribute('d')).toBeTruthy()
  })

  it('IconBadge 크기를 지정할 수 있다', () => {
    const { container } = render(<IconBadge type="check" size={40} />)
    expect(container.querySelector('svg')).toHaveAttribute('height', '40')
  })
})
