import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import ExternalLink from "../components/ExternalLink"
import EventCalendar from '../components/EventCalendar'
import CardCarousel from '../components/CardCarousel'

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

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const kstMonth = new Date(
    new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' })
  ).getMonth() + 1

  return (
    <PageLayout>
                    <section id='values' className='landing-section'>
            <div className='container'>
              <div className='landing-section-header'>
                <h2>놓칠 수 없는 프로모션</h2>
              </div>
              <CardCarousel>
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
              </CardCarousel>
            </div>
          </section>


                    <section id="process" className="landing-section process">
            <div className="container">
              <div className="landing-section-header">
                <h2>{kstMonth}월의 주요일정</h2>
              </div>
              <EventCalendar />
            </div>
          </section>


          <section id="highlights" className="landing-section">
            <div className="container">
              <div className="landing-section-header">
                <h2>지난달 주희 하이라이트</h2>
              </div>
              <CardCarousel>
                <article className='promotion-card'>
                  <button
                    type='button'
                    className='promotion-visual highlight-visual'
                    onClick={() => setLightboxSrc('/highlight-autumn-trip.jpg')}
                    aria-label='사진 크게 보기'
                  >
                    <img src='/highlight-autumn-trip.jpg' alt='리더스 그룹 가을 나들이 단체 사진' />
                  </button>
                  <div className='promotion-content'>
                    <h3>리더스 그룹 가을 나들이</h3>
                    <p>10월 21일 암웨이 리더스 그룹 가을 나들이가 있었어요. 속리산 산책 후, 보은 대추축제장으로 가서 맛난 대추 시식을 하고 양손 가득 쇼핑도 했답니다. 노는데 먹는데 진심인 박오팀!</p>
                  </div>
                </article>
                <article className='promotion-card'>
                  <button
                    type='button'
                    className='promotion-visual highlight-visual'
                    onClick={() => setLightboxSrc('/highlight-abc-day.jpg')}
                    aria-label='사진 크게 보기'
                  >
                    <img src='/highlight-abc-day.jpg' alt='강서 암웨이 ABC 소비자데이' />
                  </button>
                  <div className='promotion-content'>
                    <h3>강서 ABC 소비자데이</h3>
                    <p>강서 암웨이 ABC(Amway Brand Center)에서 소비자데이가 열렸어요. 암웨이 오프라인 매장 투어, 퍼스널컬러 진단, 두피&피부 측정 등 다양한 프로그램을 경험해 볼 수 있는 자리였답니다.</p>
                  </div>
                </article>
                <article className='promotion-card'>
                  <button
                    type='button'
                    className='promotion-visual highlight-visual'
                    onClick={() => setLightboxSrc('/highlight-halloween.jpg')}
                    aria-label='사진 크게 보기'
                  >
                    <img src='/highlight-halloween.jpg' alt='할로윈 컨셉 연합 홈미팅 음식' />
                  </button>
                  <div className='promotion-content'>
                    <h3>할로윈 연합 홈미팅</h3>
                    <p>할로윈 컨셉으로 연합 홈미팅을 진행했어요. 마녀빗자루 오뎅탕, 유령 데코 스파게티, 양송이 해골 피자~ 암웨이 하면 똥손도 금손으로 거듭나요! 11월에는 블랙프라이데이 컨셉으로 진행할 예정이에요. 관심있는 분들 신청해 주세요!</p>
                  </div>
                </article>
                <article className='promotion-card'>
                  <button
                    type='button'
                    className='promotion-visual highlight-visual'
                    onClick={() => setLightboxSrc('/highlight-chef-cooking.jpg')}
                    aria-label='사진 크게 보기'
                  >
                    <img src='/highlight-chef-cooking.jpg' alt='얼큰 채소 전골과 연두부 샐러드' />
                  </button>
                  <div className='promotion-content'>
                    <h3>쉐프님께 배운 가을 요리</h3>
                    <p>암웨이 쉐프님께 새로운 요리 직접 배웠어요. 얼큰 채소 전골과 연두부 샐러드인데요. 쌀쌀한 날 얼큰 국물이 정말 끝내줬어요! 맛보고 싶으신 분들 연락주세요! 출장가서 알려 드립니다~ ^^</p>
                  </div>
                </article>
              </CardCarousel>
            </div>
          </section>


          <section id="services" className="landing-section">
            <div className="container">
              <div className="landing-section-header">
                <h2>주희의 추천템</h2>
              </div>
              <div className='promotion-list'>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/recommend-omega-drops.jpg' alt='아티스트리 스킨 뉴트리션 오메가 드롭스' />
                  </div>
                  <div className='promotion-content'>
                    <h3>[아티스트리] 스킨 뉴트리션 오메가 드롭스</h3>
                    <p>뉴트리라이트 농장에서 자란 화이트 치아씨드의 오메가 3·6·7·9가 피부 장벽을 채워 24시간 촉촉한 광채 피부로 가꿔주는 99% 식물 유래 페이셜 오일 세럼입니다.</p>
                    <ExternalLink href='https://www.amway.co.kr/shop/beauty/skin-care/skin-care-serum-ample/p/128047K' className='btn btn-primary' ariaLabel='제품 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/recommend-allocare.jpg' alt='뉴트리라이트 앨로케어' />
                  </div>
                  <div className='promotion-content'>
                    <h3>[뉴트리라이트] 앨로케어</h3>
                    <p>피카오 프레토·아세로라·계피 세 가지 식물을 배합한 복합물이 콧물, 재채기, 코막힘 등 코 과민반응 개선에 도움을 주는 개별인정형 건강기능식품입니다.</p>
                    <ExternalLink href='https://www.amway.co.kr/shop/nutrition/functional/p/110860K' className='btn btn-primary' ariaLabel='제품 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
                </article>
                <article className='promotion-card'>
                  <div className='promotion-visual'>
                    <img src='/recommend-gh-atocream.jpg' alt='g&h 너리쉬 아토 크림' />
                  </div>
                  <div className='promotion-content'>
                    <h3>[g&amp;h] 너리쉬 아토 크림</h3>
                    <p>건성·민감성 피부의 피부장벽 강화를 돕는 저자극 포뮬러로 영유아부터 성인까지 온 가족이 함께 쓸 수 있는 바디 크림입니다.</p>
                    <ExternalLink href='https://www.amway.co.kr/shop/personal-care/body-care/body-moisturizer/p/319578K' className='btn btn-primary' ariaLabel='제품 자세히 보기'>자세히 보기</ExternalLink>
                  </div>
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

      {lightboxSrc && (
        <div
          className='lightbox'
          role='dialog'
          aria-modal='true'
          aria-label='사진 크게 보기'
          onClick={() => setLightboxSrc(null)}
          onKeyDown={(ev) => {
            if (ev.key === 'Escape') setLightboxSrc(null)
          }}
          tabIndex={-1}
          ref={(el) => el?.focus()}
        >
          <img src={lightboxSrc} alt='확대된 사진' />
        </div>
      )}
    </PageLayout>
  )
}

