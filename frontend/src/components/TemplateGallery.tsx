import type { ComponentType } from 'react'
import { LAYOUTS, applyLayout, type LayoutMode } from '../lib/layout'
import HomeFocus from './layouts/HomeFocus'
import HomeHub from './layouts/HomeHub'
import HomeSplit from './layouts/HomeSplit'

const PREVIEW: Record<LayoutMode, ComponentType<{ preview?: boolean }>> = {
  focus: HomeFocus,
  hub: HomeHub,
  split: HomeSplit,
}

interface TemplateGalleryProps {
  selected?: LayoutMode
  onSelect?: (mode: LayoutMode) => void
  showLabel?: boolean
}

export default function TemplateGallery({
  selected,
  onSelect,
  showLabel = true,
}: TemplateGalleryProps) {
  const apply = (mode: LayoutMode) => {
    applyLayout(mode)
    onSelect?.(mode)
  }

  return (
    <div className="template-gallery" role="radiogroup" aria-label="인덱스 디자인 템플릿 선택">
      {showLabel && (
        <p className="template-gallery-hint">
          아래 3가지 인덱스 디자인 중 마음에 드는 레이아웃을 선택하면 홈에
          적용됩니다.
        </p>
      )}
      <div className="template-gallery-grid">
        {LAYOUTS.map((t) => {
          const Preview = PREVIEW[t.id]
          const isSelected = selected === t.id
          return (
            <article
              key={t.id}
              className={`template-card theme-forest ${isSelected ? 'is-selected' : ''}`}
            >
              <div className="template-card-meta">
                <div>
                  <h4>{t.label}</h4>
                  <p>{t.desc}</p>
                </div>
                <button
                  type="button"
                  aria-checked={isSelected}
                  role="radio"
                  onClick={() => apply(t.id)}
                >
                  {isSelected ? '적용 중' : '적용'}
                </button>
              </div>
              <div className="template-card-preview">
                <Preview preview />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
