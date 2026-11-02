import { useEffect, useRef, useState, type ReactNode } from 'react'

interface CardCarouselProps {
  children: ReactNode[]
  intervalMs?: number
}

export default function CardCarousel({ children, intervalMs = 5000 }: CardCarouselProps) {
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const count = children.length

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [index, count, intervalMs])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    setIndex((i) => (dx < 0 ? i + 1 : i - 1 + count) % count)
  }

  return (
    <div className='promo-carousel' onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className='promo-track' style={{ transform: `translateX(-${index * 100}%)` }}>
        {children}
      </div>
      <div className='promo-nav'>
        {children.map((_, i) => (
          <button
            key={i}
            type='button'
            className={`promo-dot${i === index ? ' active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번 카드 보기`}
            aria-current={i === index}
          />
        ))}
      </div>
    </div>
  )
}
