import BrandRail from './BrandRail'

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="landing">
      <div className="home-layout">
        <BrandRail />
        <main className="home-main">{children}</main>
      </div>
    </div>
  )
}
