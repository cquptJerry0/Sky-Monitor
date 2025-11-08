import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

import { HttpErrors } from '@/pages/Integrations/HttpErrors'
import { ResourceErrors } from '@/pages/Integrations/ResourceErrors'
import { WebVitals } from '@/pages/Performance/WebVitals'
import { ResourceTiming } from '@/pages/Performance/ResourceTiming'
import { AlertsConfig } from '@/pages/Settings/AlertsConfig'

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    })

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
    )
}

describe('Integration: New Pages', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render HttpErrors page', async () => {
        const { container } = render(<HttpErrors />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('HTTP错误监控')).toBeInTheDocument()
        })

        expect(container).toMatchSnapshot()
    })

    it('should render ResourceErrors page', async () => {
        const { container } = render(<ResourceErrors />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('资源加载错误')).toBeInTheDocument()
        })

        expect(container).toMatchSnapshot()
    })

    it('should render WebVitals page', async () => {
        const { container } = render(<WebVitals />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('Web Vitals 性能指标')).toBeInTheDocument()
        })

        expect(container).toMatchSnapshot()
    })

    it('should render ResourceTiming page', async () => {
        const { container } = render(<ResourceTiming />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('资源加载性能')).toBeInTheDocument()
        })

        expect(container).toMatchSnapshot()
    })

    it('should render AlertsConfig page', async () => {
        const { container } = render(<AlertsConfig />, { wrapper: createWrapper() })

        await waitFor(() => {
            expect(screen.getByText('告警配置')).toBeInTheDocument()
        })

        expect(container).toMatchSnapshot()
    })
})
