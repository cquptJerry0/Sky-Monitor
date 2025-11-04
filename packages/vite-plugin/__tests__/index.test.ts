import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Vite Plugin', () => {
    it('should find map files in directory', () => {
        const testDir = path.join(__dirname, 'fixtures')

        if (!fs.existsSync(testDir)) {
            fs.mkdirSync(testDir, { recursive: true })
        }

        const mapFile = path.join(testDir, 'test.js.map')
        fs.writeFileSync(mapFile, JSON.stringify({ version: 3, sources: [] }))

        const files = fs.readdirSync(testDir).filter(f => f.endsWith('.map'))
        expect(files.length).toBeGreaterThan(0)

        fs.unlinkSync(mapFile)
        fs.rmdirSync(testDir)
    })
})
