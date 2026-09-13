import { vi } from 'vitest'

// `vi.mock('.../src/lib/api', () => import('../helpers/apiMock'))` 형태로 사용
export const api = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

export function mockApiDefaults(target: typeof api = api) {
  target.get.mockResolvedValue({ data: [] })
  target.post.mockResolvedValue({ data: {} })
  target.put.mockResolvedValue({ data: {} })
  target.delete.mockResolvedValue({ data: {} })
}

export function deferred<T = unknown>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}
