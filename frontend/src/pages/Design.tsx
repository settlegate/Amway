import { useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import { LAYOUTS, applyLayout, type LayoutMode } from '../lib/layout'
import HomeFocus from '../components/layouts/HomeFocus'
import HomeHub from '../components/layouts/HomeHub'
import HomeSplit from '../components/layouts/HomeSplit'

const PREVIEW_COMPONENT: Record<LayoutMode, ComponentType<{ preview?: boolean }>> = {
  focus: HomeFocus,
  hub: HomeHub,
  split: HomeSplit,
}

export default function Design() {
  const navigate = useNavigate()

  const apply = (mode: LayoutMode) => {
    applyLayout(mode)
    navigate('/')
  }

  return (
    <div className="page">
      <h2>디자인 템플릿 미리보기</h2>
      <p className="design-note">
        컬러는 시안의 ‘새벽 숲’ 그린 톤을 기준으로 유지하며, 레이아웃만 다르게
        구성했습니다.
      </p>
      <div className="design-grid">
        {LAYOUTS.map((t) => {
          const LayoutPreview = PREVIEW_COMPONENT[t.id]
          return (
            <article key={t.id} className="preview-card theme-forest">
              <div className="preview-meta">
                <div>
                  <h3>{t.label}</h3>
                  <p>{t.desc}</p>
                </div>
                <button type="button" onClick={() => apply(t.id)}>
                  이 레이아웃 적용
                </button>
              </div>
              <div className="preview-body preview-body--layout">
                <LayoutPreview preview />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
