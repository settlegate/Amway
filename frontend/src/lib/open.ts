export function openProductWindow(url?: string) {
  if (!url || url === '#') return
  window.open(url, '_blank', 'width=1200,height=800,left=50,top=50,noopener,noreferrer')
}
