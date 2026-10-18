import { render, screen } from '@testing-library/react'
import { beforeAll, expect, it } from 'vitest'
import App from './App'

beforeAll(() => {
  // jsdom lacks matchMedia and ResizeObserver, which the sidebar and charts use.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

it('renders the dashboard shell', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Documents' })).toBeInTheDocument()
  expect(screen.getByText('Total Revenue')).toBeInTheDocument()
})
