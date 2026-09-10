import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'

interface Product {
  id: string
  name: string
  category?: string
  imageUrl?: string
}

export default function ProductCategories() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    api
      .get('/api/products')
      .then((res) => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
  }, [])

  const categories = useMemo(() => {
    const map = new Map<string, Product>()
    products.forEach((p) => {
      const category = p.category || '기타'
      if (!map.has(category)) map.set(category, p)
    })
    return Array.from(map.entries()).map(([category, product]) => ({ category, product }))
  }, [products])

  if (categories.length === 0) {
    return <p className="empty-categories">카테고리를 불러오는 중입니다.</p>
  }

  return (
    <div className="category-grid">
      {categories.map(({ category, product }) => (
        <Link
          key={category}
          to={`/products?q=${encodeURIComponent(category)}`}
          className="category-card"
        >
          {product.imageUrl && (
            <img src={product.imageUrl} alt={category} loading="lazy" />
          )}
          <div className="category-card-body">
            <h3>{category}</h3>
            <p>{product.name} 외</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
