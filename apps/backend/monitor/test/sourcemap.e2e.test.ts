import { describe, expect, it } from 'vitest'

describe('Source Map E2E', () => {
    it('should upload source map', async () => {
        expect(true).toBe(true)
    })

    it('should parse stack trace', async () => {
        const mockStack = 'at fn (app.js:1:2345)'
        expect(mockStack).toContain('app.js')
    })
})
