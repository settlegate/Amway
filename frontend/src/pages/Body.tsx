import { useState } from 'react'
import { api } from '../lib/api'

export default function Body() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        const { data } = await api.post('/api/body/analyze', { imageBase64: base64, mimeType: file.type })
        setResult(data)
      } catch (err) {
        alert('분석에 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="page">
      <h2>체성분 분석 (OCR)</h2>
      <div className="card">
        <p>인바디/체성분 결과지 이미지를 업로드하면 AI가 수치를 추출합니다.</p>
        <input type="file" accept="image/*" onChange={handleFile} disabled={loading} />
      </div>
      {result && (
        <div className="card">
          <p><strong>체형 타입:</strong> {result.bodyType}</p>
          <p><strong>골격근량:</strong> {result.skeletalMuscleKg} kg</p>
          <p><strong>체지방률:</strong> {result.bodyFatPercent}%</p>
          <p><strong>내장지방:</strong> {result.visceralFatLevel}</p>
          <p><strong>요약:</strong> {result.summary}</p>
          <p><strong>추천:</strong> {result.recommendation}</p>
        </div>
      )}
    </div>
  )
}
