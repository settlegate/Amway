import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LeafIcon from '../components/LeafIcon'
import ExternalLink from "../components/ExternalLink"

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
                <h2>4단계 웰니스 케어</h2>
                <p>챗봇에서 시작해 지속 가능한 건강 관리로 연결합니다.</p>
              </div>
              <div className="process-grid">
                <article className="process-card">
                  <h3>챗봇 상담</h3>
                  <p>
                    증상과 목표를 자연어로 입력하면 AI가 초동 상담과 가이드를
                    제공합니다.
                  </p>
                </article>
                <article className="process-card">
                  <h3>체성분/증빙 분석</h3>
                  <p>
                    InBody 사진이나 건강 데이터를 업로드하면 AI가 수치를
                    해석합니다.
                  </p>
                </article>
                <article className="process-card">
                  <h3>제품/루틴 제안</h3>
                  <p>
                    뉴트리라이트 제품과 식이·운동 루틴을 개인별로
                    매칭합니다.
                  </p>
                </article>
                <article className="process-card">
                  <h3>지속 케어</h3>
                  <p>
                    알림톡과 리드 CRM으로 정기적인 케어와 재구매를
                    돕습니다.
                  </p>
                </article>
              </div>
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

          <section id="pricing" className="landing-section pricing">
            <div className="container">
              <div className="landing-section-header">
                <h2>이용 안내</h2>
                <p>
                  필요한 만큼 선택하세요. 복잡한 약정 없이 투명하게 이용할 수
                  있습니다.
                </p>
              </div>
              <div className="pricing-grid">
                <article className="pricing-card">
                  <h3 className="pricing-name">무료 상담</h3>
                  <p className="pricing-desc">기본 건강 상담부터 제품 안내까지</p>
                  <div className="pricing-price">
                    ₩0 <span>/ 평생 무료</span>
                  </div>
                  <ul className="pricing-features">
                    <li>AI 건강 상담 챗봇</li>
                    <li>뉴트리라이트 제품 정보</li>
                    <li>건강 콘텐츠 및 FAQ</li>
                  </ul>
                  <Link to="/chat" className="btn btn-outline" style={{ width: '100%' }}>
                    상담 시작
                  </Link>
                </article>

                <article className="pricing-card popular">
                  <h3 className="pricing-name">ABO 웰니스 케어</h3>
                  <p className="pricing-desc">체성분 분석과 맞춤 케어를 위한 멤버십</p>
                  <div className="pricing-price">
                    ₩19,000 <span>/ 월</span>
                  </div>
                  <ul className="pricing-features">
                    <li>InBody 분석 및 AI 해석</li>
                    <li>맞춤 제품/루틴 제안</li>
                    <li>알림톡 케어 및 리드 CRM</li>
                  </ul>
                  <Link to="/chat" className="btn btn-primary" style={{ width: '100%' }}>
                    신청하기
                  </Link>
                </article>

                <article className="pricing-card">
                  <h3 className="pricing-name">사업 파트너십</h3>
                  <p className="pricing-desc">ABO 비즈니스 및 기업 웰니스 프로그램</p>
                  <div className="pricing-price">
                    협의 <span>/ 건별</span>
                  </div>
                  <ul className="pricing-features">
                    <li>세미나·사업 설명 자료</li>
                    <li>리드 CRM 및 고객 관리</li>
                    <li>기업 맞춤 웰니스 솔루션</li>
                  </ul>
                  <Link to="/business" className="btn btn-outline" style={{ width: '100%' }}>
                    문의하기
                  </Link>
                </article>
              </div>
            </div>
          </section>

          <section id="compliance" className="landing-section">
            <div className="container">
              <div className="landing-section-header">
                <h2>안전과 신뢰를 위한 설계</h2>
                <p>
                  법률·규제 기준과 개인정보 보호를 최우선으로
                  두었습니다.
                </p>
              </div>
              <div className="compliance-grid">
                <article className="compliance-card">
                  <h3>컴플라이언스 기준</h3>
                  <ul>
                    <li>식약처 승인 기능성 문구만 사용</li>
                    <li>질병 치료·예방 과대광고 문구 필터링</li>
                    <li>월소득 확정 등 과장 표현 차단</li>
                    <li>암웨이 공식 라벨/가이드라인 내 답변</li>
                  </ul>
                </article>
                <article className="compliance-card">
                  <h3>보안 및 개인정보 보호</h3>
                  <p>
                    데이터 전송 구간 암호화, AES-256 저장 암호화, 민감
                    정보 마스킹을 적용합니다. API 키와 개인정보는 저장소에
                    커밋되지 않으며 pre-commit hook으로 차단합니다.
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

