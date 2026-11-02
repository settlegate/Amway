import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageLayout from '../components/PageLayout'
import LeafIcon from '../components/LeafIcon'
import ExternalLink from "../components/ExternalLink"
import EventCalendar from '../components/EventCalendar'

export default function Home() {
  // AI 챗봇 히어로 입력 — 나중에 다시 활용할 예정으로 비활성
  // const navigate = useNavigate()
  // const [heroInput, setHeroInput] = useState('')
  // const [heroLoading, setHeroLoading] = useState(false)
  //
  // const handleHeroSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   if (!heroInput.trim()) return
  //   setHeroLoading(true)
  //   setTimeout(() => {
  //     setHeroLoading(false)
  //     navigate('/chat', { state: { initialQuestion: heroInput } })
  //   }, 800)
  // }

  const PROMO_COUNT = 3
  const [promoIndex, setPromoIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((i) => (i + 1) % PROMO_COUNT)
    }, 5000)
    return () => clearInterval(timer)
  }, [promoIndex])

  return (
    <PageLayout>
                    <section id='values' className='landing-section'>
            <div className='container'>
              <div className='landing-section-header'>
                <h2>놓칠 수 없는 프로모션</h2>
              </div>
              <div className='promo-carousel'>
                <div
                  className='promo-track'
                  style={{ transform: `translateX(-${promoIndex * 100}%)` }}
                >
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/promo-optimist.png' alt='옵티미스트 안심촉촉 프로모션' />
                  </div>
                  <div className='promotion-content'>
                    <h3>[홈리빙] 옵티미스트 안심촉촉 프로모션</h3>
                    <p>안심은 깊게, 촉촉함은 길게, 세균 걱정 없는 안심 가습, 옵티미스트로 다가오는 건조한 겨울을 준비하세요.</p>
                    <ExternalLink href='https://www.amway.co.kr/notifications/promotion/detail?notificationCode=00496303&amp;noticeType=PROMOTION' className='btn btn-primary' ariaLabel='프로모션 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/promo-nutrilite-gift.png' alt='밀크씨슬 이엑스 프로모션' />
                  </div>
                  <div className='promotion-content'>
                    <h3>[영양건강] 밀크씨슬 이엑스 프로모션</h3>
                    <p>소중한 분께 건강을 전할 수 있도록 뉴트리라이트 밀크씨슬을 특별한 기프트 패키지로 만나보세요.</p>
                    <ExternalLink href='https://www.amway.co.kr/notifications/promotion/detail?notificationCode=00497301&noticeType=PROMOTION&searchPromotionStatus=progress&page=0' className='btn btn-primary' ariaLabel='프로모션 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/promo-satinique.png' alt='새티니크 클린 스캘프 프로모션' />
                  </div>
                  <div className='promotion-content'>
                    <h3>[퍼스널 케어] 새티니크 클린 스캘프 프로모션</h3>
                    <p>식물 기반 과학으로 완성한 새티니크 스캘프 뉴트리션과 인텐시브 리페어 라인을 특별한 혜택으로 만나보세요.</p>
                    <ExternalLink href='https://www.amway.co.kr/notifications/promotion/detail?notificationCode=00496304&noticeType=PROMOTION&searchPromotionStatus=progress&page=0' className='btn btn-primary' ariaLabel='프로모션 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                </div>
                <div className='promo-nav'>
                  {Array.from({ length: PROMO_COUNT }, (_, i) => (
                    <button
                      key={i}
                      type='button'
                      className={`promo-dot${i === promoIndex ? ' active' : ''}`}
                      onClick={() => setPromoIndex(i)}
                      aria-label={`프로모션 ${i + 1}번 보기`}
                      aria-current={i === promoIndex}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>


                    <section id="process" className="landing-section process">
            <div className="container">
              <div className="landing-section-header">
                <h2>이달의 행사</h2>
                <p>ABO 정주희가 추천하는 이번 달 세미나와 일정</p>
              </div>
              <EventCalendar />
            </div>
          </section>


          <section id="services" className="landing-section">
            <div className="container">
              <div className="landing-section-header">
                <h2>시즌별 아이들 건강정보</h2>
                <p>계절마다 달라지는 아이 건강에 맞는 제품을 골라보세요.</p>
              </div>
              <div className="services-grid">
                <article className="service-card">
                  <span className="service-tag">PRODUCT</span>
                  <h3>제품 추천</h3>
                  <p>
                    목적과 컨디션에 맞는 뉴트리라이트 제품을 찾아보세요.
                  </p>
                </article>
              </div>
            </div>
          </section>



          {/* 하단 상담 CTA — 나중에 다시 활용할 예정으로 숨김 처리
          <section
            className="landing-cta"
            aria-labelledby="landing-cta-title"
          >
            <div className="container">
              <h2 id="landing-cta-title">
                지금 바로 웰니스 AI 상담을 시작하세요
              </h2>
              <p>
                카카오톡과 웹뷰 Mini-App으로 끝나는 새로운 건강 상담의
                기준. 암웨이 웰니스 AI와 함께 정직한 건강 관리를
                시작하세요.
              </p>
              <div className="landing-cta-actions">
                <Link to="/chat" className="btn btn-primary btn-lg">
                  상담 시작하기
                </Link>
                <Link to="/body" className="btn btn-outline btn-lg">
                  체성분 분석
                </Link>
              </div>
            </div>
          </section>
          */}

          <footer className="landing-footer">
            <div className="container">
              <div className="footer-grid">
                <div className="footer-brand">
                  <Link to="/" className="footer-logo" aria-label="Amway 웰니스 AI 홈">
                    <span className="leaf-badge" aria-hidden="true">
                      <LeafIcon size={18} />
                    </span>
                    <span>Amway 웰니스 AI</span>
                  </Link>
                  <p>
                    암웨이 ABO를 위한 웰니스 AI 컨설턴트. 자연, 정직,
                    건강을 담은 맞춤 케어를 제공합니다.
                  </p>
                </div>
                <div className="footer-links">
                  <div className="footer-col">
                    <h4>서비스</h4>
                    <Link to="/chat">건강 상담</Link>
                    <Link to="/body">체성분 분석</Link>
                    <Link to="/products">제품 추천</Link>
                    <Link to="/seminars">세미나 신청</Link>
                  </div>
                  <div className="footer-col">
                    <h4>계정</h4>
                    <Link to="/admin">CRM</Link>
                    <Link to="/business">사업 설명</Link>
                    <Link to="/reminders">알림</Link>
                  </div>
                </div>
              </div>
              <div className="copyright">
                © 2026 Amway 웰니스 AI. All rights reserved.
              </div>
            </div>
          </footer>
    </PageLayout>
  )
}

