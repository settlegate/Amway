import { Link } from 'react-router-dom'
import LeafIcon from '../components/LeafIcon'
import IconBadge from '../components/IconBadge'

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function Home() {
  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="landing-hero-title">
        <div className="container landing-hero-grid">
          <div className="landing-hero-content">
            <span className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              AMWAY WELLNESS AI
            </span>
            <h1 id="landing-hero-title">
              <span className="text-gradient">자연에서 시작된 정직한 상담,</span>
              <br />
              오늘 건강의 새로운 시작
            </h1>
            <p className="lead">
              웰니스 AI가 천연재료에 기반한 뉴트리라이트 철학으로 고객님의
              컨디션에 맞는
              <strong className="highlight"> 정직한 답변</strong>을
              드립니다.
            </p>
            <div className="hero-actions">
              <Link to="/chat" className="btn btn-primary btn-lg">
                상담 시작하기
              </Link>
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={() => scrollTo('services')}
              >
                서비스 보기
              </button>
            </div>
            <p className="hero-note">
              카카오톡 연동과 웹뷰 Mini-App으로 언제 어디서나 건강 상담을 받을 수
              있습니다.
            </p>
          </div>

          <div className="landing-hero-visual" aria-hidden="true">
            <div className="phone">
              <div className="phone-screen">
                <div className="phone-notch" />
                <div className="phone-chat">
                  <div className="phone-bubble">
                    안녕하세요. 암웨이 웰니스 AI 컨설턴트입니다. 오늘은 어떤
                    건강 고민이 있으신가요?
                  </div>
                  <div className="phone-bubble user">
                    <div>피로 회복 영양제 추천받고 싶어요</div>
                  </div>
                  <div className="phone-bubble">
                    천연재료 기반 뉴트리라이트로 맞춤 가이드를
                    준비했습니다.
                  </div>
                </div>
                <div className="phone-cta">맞춤 제안 확인하기</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="trust">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <span className="trust-icon">
                <IconBadge type="check" size={16} />
              </span>
              <span>식약처 승인 기능성 문구 기준</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <IconBadge type="lock" size={16} />
              </span>
              <span>개인정보 AES-256 암호화 저장</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <IconBadge type="shield" size={16} />
              </span>
              <span>뉴트리라이트 공식 가이드라인</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">
                <IconBadge type="clock" size={16} />
              </span>
              <span>1:1 ABO 웰니스 컨설팅</span>
            </div>
          </div>
        </div>
      </div>

      <section id="values" className="landing-section">
        <div className="container">
          <div className="landing-section-header">
            <h2>왜 웰니스 AI인가?</h2>
            <p>
              자연과 건강, 그리고 정직함을 담아 고객 한 사람 한 사람의 웰니스
              여정을 돕습니다.
            </p>
          </div>
          <div className="values-grid">
            <article className="value-card">
              <div className="value-icon">
                <LeafIcon size={26} />
              </div>
              <h3>자연 기반</h3>
              <p>
                천연재료를 담은 뉴트리라이트 철학을 바탕으로, 신뢰할 수 있는
                정보를 안내합니다.
              </p>
            </article>
            <article className="value-card">
              <div className="value-icon">
                <IconBadge type="shield" size={26} />
              </div>
              <h3>정직한 정보</h3>
              <p>
                과대광고 문구는 AI가 실시간 필터링하고, 검증된 정보만
                전달합니다.
              </p>
            </article>
            <article className="value-card">
              <div className="value-icon">
                <IconBadge type="zap" size={26} />
              </div>
              <h3>맞춤 추천</h3>
              <p>
                체성분과 상담 이력을 바탕으로 개인에게 맞는 제품과 루틴을
                제안합니다.
              </p>
            </article>
            <article className="value-card">
              <div className="value-icon">
                <IconBadge type="lock" size={26} />
              </div>
              <h3>개인정보 보호</h3>
              <p>
                체성분, 전화번호 등 민감 정보는 암호화 후 저장하고
                안전하게 관리합니다.
              </p>
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

      <section className="landing-cta" aria-labelledby="landing-cta-title">
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
    </div>
  )
}
