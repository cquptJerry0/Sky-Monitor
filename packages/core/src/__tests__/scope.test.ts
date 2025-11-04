import { describe, expect, it } from 'vitest'

import { ScopeImpl } from '../scope'

describe('Scope', () => {
    it('should set and get user', () => {
        const scope = new ScopeImpl()
        const user = { id: '123', email: 'test@example.com' }
        scope.setUser(user)
        expect(scope.getUser()).toEqual(user)
    })

    it('should clear user when set to null', () => {
        const scope = new ScopeImpl()
        scope.setUser({ id: '123' })
        scope.setUser(null)
        expect(scope.getUser()).toBeNull()
    })

    it('should set and get tags', () => {
        const scope = new ScopeImpl()
        scope.setTag('env', 'production')
        scope.setTag('version', '1.0.0')
        expect(scope.getTags()).toEqual({ env: 'production', version: '1.0.0' })
    })

    it('should merge tags with setTags', () => {
        const scope = new ScopeImpl()
        scope.setTag('env', 'production')
        scope.setTags({ version: '1.0.0', region: 'us-east' })
        expect(scope.getTags()).toEqual({ env: 'production', version: '1.0.0', region: 'us-east' })
    })

    it('should set and get extras', () => {
        const scope = new ScopeImpl()
        scope.setExtra('debug', true)
        scope.setExtra('retries', 3)
        expect(scope.getExtras()).toEqual({ debug: true, retries: 3 })
    })

    it('should add breadcrumbs', () => {
        const scope = new ScopeImpl()
        scope.addBreadcrumb({ message: 'User clicked button' })
        scope.addBreadcrumb({ message: 'API call started', category: 'http' })

        const breadcrumbs = scope.getBreadcrumbs()
        expect(breadcrumbs).toHaveLength(2)
        expect(breadcrumbs[0].message).toBe('User clicked button')
        expect(breadcrumbs[0].level).toBe('info')
        expect(breadcrumbs[0].timestamp).toBeDefined()
    })

    it('should limit breadcrumbs to 100', () => {
        const scope = new ScopeImpl()
        for (let i = 0; i < 150; i++) {
            scope.addBreadcrumb({ message: `Crumb ${i}` })
        }
        const breadcrumbs = scope.getBreadcrumbs()
        expect(breadcrumbs.length).toBe(100)
        expect(breadcrumbs[0].message).toBe('Crumb 50')
        expect(breadcrumbs[99].message).toBe('Crumb 149')
    })

    it('should set and get context', () => {
        const scope = new ScopeImpl()
        scope.setContext('device', { type: 'mobile', os: 'iOS' })
        expect(scope.getContext('device')).toEqual({ type: 'mobile', os: 'iOS' })
    })

    it('should set level', () => {
        const scope = new ScopeImpl()
        scope.setLevel('warning')
        expect(scope.getLevel()).toBe('warning')
    })

    it('should clear all data', () => {
        const scope = new ScopeImpl()
        scope.setUser({ id: '123' })
        scope.setTag('env', 'prod')
        scope.addBreadcrumb({ message: 'test' })
        scope.setLevel('error')

        scope.clear()

        expect(scope.getUser()).toBeNull()
        expect(scope.getTags()).toEqual({})
        expect(scope.getBreadcrumbs()).toEqual([])
        expect(scope.getLevel()).toBeUndefined()
    })

    it('should clone scope correctly', () => {
        const scope = new ScopeImpl()
        scope.setUser({ id: '123' })
        scope.setTag('env', 'prod')
        scope.addBreadcrumb({ message: 'test' })

        const cloned = scope.clone()

        expect(cloned.getUser()).toEqual({ id: '123' })
        expect(cloned.getTags()).toEqual({ env: 'prod' })
        expect(cloned.getBreadcrumbs()).toHaveLength(1)

        // Modify cloned scope should not affect original
        cloned.setTag('env', 'dev')
        expect(scope.getTags()).toEqual({ env: 'prod' })
    })

    it('should apply context to event', () => {
        const scope = new ScopeImpl()
        scope.setUser({ id: '123', email: 'user@example.com' })
        scope.setTag('env', 'production')
        scope.setTag('version', '1.0.0')
        scope.setExtra('debug', true)
        scope.addBreadcrumb({ message: 'User action' })
        scope.setLevel('error')

        const event = { type: 'error', message: 'test error' }
        const enrichedEvent = scope.applyToEvent(event)

        expect(enrichedEvent.user).toEqual({ id: '123', email: 'user@example.com' })
        expect(enrichedEvent.tags).toEqual({ env: 'production', version: '1.0.0' })
        expect(enrichedEvent.extra).toEqual({ debug: true })
        expect(enrichedEvent.breadcrumbs).toHaveLength(1)
        expect(enrichedEvent.level).toBe('error')
    })

    it('should merge event tags with scope tags', () => {
        const scope = new ScopeImpl()
        scope.setTag('env', 'production')

        const event = { type: 'error', message: 'test', tags: { feature: 'login' } }
        const enrichedEvent = scope.applyToEvent(event)

        expect(enrichedEvent.tags).toEqual({ env: 'production', feature: 'login' })
    })

    it('should not override event level if already set', () => {
        const scope = new ScopeImpl()
        scope.setLevel('warning')

        const event = { type: 'error', message: 'test', level: 'fatal' }
        const enrichedEvent = scope.applyToEvent(event)

        expect(enrichedEvent.level).toBe('fatal')
    })

    it('should return copy of breadcrumbs', () => {
        const scope = new ScopeImpl()
        scope.addBreadcrumb({ message: 'test' })

        const breadcrumbs1 = scope.getBreadcrumbs()
        const breadcrumbs2 = scope.getBreadcrumbs()

        expect(breadcrumbs1).not.toBe(breadcrumbs2)
        expect(breadcrumbs1).toEqual(breadcrumbs2)
    })
})
