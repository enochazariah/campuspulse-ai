import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => cleanup())

// jsdom does not implement scrollTo; define it directly on window.
Object.defineProperty(window, 'scrollTo', { value: () => {}, writable: true, configurable: true })
