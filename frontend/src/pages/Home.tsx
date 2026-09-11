import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LeafIcon from '../components/LeafIcon'
import ExternalLink from "../components/ExternalLink"
import EventCalendar from '../components/EventCalendar'

export default function Home() {
  const navigate = useNavigate()
  const [heroInput, setHeroInput] = useState('')
  const [heroLoading, setHeroLoading] = useState(false)

  const handleHeroSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!heroInput.trim()) return
    setHeroLoading(true)
    setTimeout(() => {
      setHeroLoading(false)
      navigate('/chat', { state: { initialQuestion: heroInput } })
    }, 800)
  }

  return (
    <div className="landing">
      <div className="home-layout">
                                        <aside className="home-sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <LeafIcon size={48} />
            </div>
            <div className="sidebar-brand-text">
              <img
                className="sidebar-brand-logo"
                src="/amway-logo.png"
                alt="Amway"
                height="28"
              />
              <span>건마주희's 뉴스레터</span>
            </div>
          </div>
        </aside>

        <main className="home-main">
          <section
            className="landing-hero"
            aria-labelledby="landing-hero-title"
          >
            <div className="container">
              <h1 id="landing-hero-title">ABO 정주희가 전하는 이달의 웰니스 뉴스</h1>
              <p className="lead">
                새로운 계절의 문턱, 자연이 옷을 갈아입듯 우리의 건강 밸런스도 새로워질 시간입니다.
                <br />
                이번 달도 당신의 활력 넘치는 하루를 곁에서 함께할게요.
              </p>
              <p className="hero-input-hint">AI 챗봇에게 물어보세요</p>
              <form
                className="hero-actions"
                onSubmit={handleHeroSubmit}
                aria-label="건강 상담 바로가기"
              >
                <input
                  type="text"
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  placeholder="이번 달 건강 이슈를 검색해보세요"
                  aria-label="상담 질문 입력"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={heroLoading}
                >
                  {heroLoading ? '답변 생성 중…' : '상담 시작하기'}
                </button>
              </form>
            </div>
          </section>


                    <section id='values' className='landing-section'>
            <div className='container'>
              <div className='landing-section-header'>
                <h2>이달의 프로모션</h2>
                <p>ABO 정주희가 전하는 이달의 추천 프로모션</p>
              </div>
              <div className='promotion-list'>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/promo-chuseok.png' alt='9월 신규 ABO 프로모션' />
                  </div>
                  <div className='promotion-content'>
                    <span className='promotion-tag'>[신규 ABO 대상]</span>
                    <h3>웰컴 선물 한가득, 지금 당장 달려가마(馬)!</h3>
                    <p>한가위 풍요로움을 가득 담아 드리는 9월 신규 ABO 프로모션</p>
                    <ExternalLink href='https://www.amway.co.kr/notifications/promotion/detail?notificationCode=00489301&amp;noticeType=PROMOTION' className='btn btn-primary' ariaLabel='프로모션 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/promo-chuseok.png' alt='Double X Refill' />
                  </div>
                  <div className='promotion-content'>
                    <span className='promotion-tag'>[기간 한정]</span>
                    <h3>Cellular Aging Support 구매 혜택</h3>
                    <p>NEW Cellular Aging Support 2개 구매 시 Double X 리필을 무료로 드립니다.</p>
                    <ExternalLink href='https://www.amway.co.kr/notifications/promotion/detail?notificationCode=00489301&amp;noticeType=PROMOTION' className='btn btn-primary' ariaLabel='프로모션 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/promo-chuseok.png' alt='가을 면역 케어 세트' />
                  </div>
                  <div className='promotion-content'>
                    <span className='promotion-tag'>[프리미엄 케어]</span>
                    <h3>가을 면역 케어 세트 할인</h3>
                    <p>뉴트리라이트 면역 케어 베스트셀러 3종을 특별한 가격에 만나보세요.</p>
                    <ExternalLink href='https://www.amway.co.kr/notifications/promotion/detail?notificationCode=00489301&amp;noticeType=PROMOTION' className='btn btn-primary' ariaLabel='프로모션 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
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
                <h2>핵심 서비스</h2>
                <p>
                  건강 상담부터 사업 지원까지, ABO를 위한 웰니스 인프라를
                  제공합니다.
                </p>
              </div>
              <div className="services-grid">
                <article className="service-card featured">
                  <span className="service-tag">CORE</span>
                  <h3>건강 상담 챗봇</h3>
                  <p>
                    AI 컨설턴트가 24시간 고객의 건강 질문에 답하고 적절한
                    제품을 안내합니다.
                  </p>
                </article>
                <article className="service-card">
                  <span className="service-tag">BODY</span>
                  <h3>체성분 분석</h3>
                  <p>
                    InBody 결과 사진을 올리면 AI가 근육량, 체지방 등을
                    해석해드립니다.
                  </p>
                </article>
                <article className="service-card">
                  <span className="service-tag">PRODUCT</span>
                  <h3>제품 추천</h3>
                  <p>
                    목적과 컨디션에 맞는 뉴트리라이트 제품을 찾아보세요.
                  </p>
                </article>
                <article className="service-card">
                  <span className="service-tag">SEMINAR</span>
                  <h3>세미나 신청</h3>
                  <p>
                    건강 세미나 일정을 확인하고 참여 신청을 간편하게
                    진행하세요.
                  </p>
                </article>
                <article className="service-card">
                  <span className="service-tag">BUSINESS</span>
                  <h3>사업 설명</h3>
                  <p>
                    ABO 비즈니스 기회와 암웨이 후원 시스템을
                    소개해드립니다.
                  </p>
                </article>
                <article className="service-card">
                  <span className="service-tag">CRM</span>
                  <h3>리드 CRM</h3>
                  <p>
                    상담 이력과 고객 케어 일정을 체계적으로
                    관리하세요.
                  </p>
                </article>
              </div>
            </div>
          </section>



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
        </main>
      </div>
    </div>
  )
}

