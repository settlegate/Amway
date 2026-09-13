import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// 날짜/시간 포맷 결과가 실행 환경에 따라 달라지지 않도록 KST로 고정
process.env.TZ = 'Asia/Seoul'

export default defineConfig({
  plugins: [react()],
  // 로컬 .env(VITE_*)가 테스트에 섞이지 않도록 .env 파일이 없는 디렉터리를 사용
  envDir: 'tests',
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    mockReset: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
})
