import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**'],
      reporter: [
        'text',
        'html',
        'json-summary',
        'json',
      ],
      reportOnFailure: true,
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 70,
        lines: 75,
      },
    },
  },
})
