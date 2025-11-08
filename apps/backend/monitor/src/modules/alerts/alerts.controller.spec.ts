import { Test, TestingModule } from '@nestjs/testing'
import { describe, it, expect, beforeEach } from 'vitest'

import { ApplicationService } from '../application/application.service'
import { AlertsController } from './alerts.controller'
import { AlertsService } from './alerts.service'

describe('AlertsController', () => {
    let controller: AlertsController
    let service: AlertsService

    const mockAlertsService = {
        getRules: vi.fn(),
        getRuleById: vi.fn(),
        createRule: vi.fn(),
        updateRule: vi.fn(),
        deleteRule: vi.fn(),
        getHistory: vi.fn(),
    }

    const mockApplicationService = {
        list: vi.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AlertsController],
            providers: [
                {
                    provide: AlertsService,
                    useValue: mockAlertsService,
                },
                {
                    provide: ApplicationService,
                    useValue: mockApplicationService,
                },
            ],
        }).compile()

        controller = module.get<AlertsController>(AlertsController)
        service = module.get<AlertsService>(AlertsService)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })

    describe('getRules', () => {
        it('should return a list of alert rules', async () => {
            const mockRules = [
                {
                    id: '1',
                    app_id: 'test-app',
                    user_id: 1,
                    name: 'Test Rule',
                    type: 'error_rate' as const,
                    threshold: 10,
                    window: '5m',
                    enabled: true,
                    notification_channels: [],
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ]

            mockAlertsService.getRules.mockResolvedValue(mockRules)
            mockApplicationService.list.mockResolvedValue({
                applications: [{ appId: 'test-app' }],
            })

            const result = await controller.getRules('test-app', undefined, {
                user: { id: 1 },
            })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockRules)
        })
    })

    describe('createRule', () => {
        it('should create a new alert rule', async () => {
            const createDto = {
                app_id: 'test-app',
                name: 'New Rule',
                type: 'error_rate' as const,
                threshold: 15,
                window: '10m',
            }

            const mockRule = {
                id: '2',
                ...createDto,
                user_id: 1,
                enabled: true,
                notification_channels: [],
                created_at: new Date(),
                updated_at: new Date(),
            }

            mockApplicationService.list.mockResolvedValue({
                applications: [{ appId: 'test-app' }],
            })
            mockAlertsService.createRule.mockResolvedValue(mockRule)

            const result = await controller.createRule(createDto, { user: { id: 1 } })

            expect(result.success).toBe(true)
            expect(result.data).toEqual(mockRule)
        })
    })

    describe('deleteRule', () => {
        it('should delete an alert rule', async () => {
            mockAlertsService.getRuleById.mockResolvedValue({
                id: '1',
                app_id: 'test-app',
            })
            mockApplicationService.list.mockResolvedValue({
                applications: [{ appId: 'test-app' }],
            })
            mockAlertsService.deleteRule.mockResolvedValue({ success: true })

            const result = await controller.deleteRule('1', { user: { id: 1 } })

            expect(result.success).toBe(true)
            expect(result.message).toBe('Alert rule deleted successfully')
        })
    })
})
