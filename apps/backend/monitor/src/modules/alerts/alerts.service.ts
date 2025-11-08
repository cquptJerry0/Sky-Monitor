import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'

import { AlertRule } from '../../entities/alert-rule.entity'

interface CreateAlertRuleParams {
    app_id: string
    user_id: number
    name: string
    type: 'error_rate' | 'slow_request' | 'session_anomaly'
    threshold: number
    window: string
    enabled?: boolean
    notification_channels?: string[]
}

interface UpdateAlertRuleParams {
    name?: string
    threshold?: number
    window?: string
    enabled?: boolean
    notification_channels?: string[]
}

@Injectable()
export class AlertsService {
    private readonly logger = new Logger(AlertsService.name)

    constructor(
        @InjectRepository(AlertRule)
        private alertRuleRepository: Repository<AlertRule>
    ) {}

    async getRules(params: { appId?: string; type?: string; userId: number }) {
        const { appId, type, userId } = params

        const queryBuilder = this.alertRuleRepository.createQueryBuilder('rule').where('rule.user_id = :userId', { userId })

        if (appId) {
            queryBuilder.andWhere('rule.app_id = :appId', { appId })
        }

        if (type) {
            queryBuilder.andWhere('rule.type = :type', { type })
        }

        const rules = await queryBuilder.orderBy('rule.created_at', 'DESC').getMany()

        return rules
    }

    async getRuleById(id: string) {
        return await this.alertRuleRepository.findOne({ where: { id } })
    }

    async createRule(params: CreateAlertRuleParams) {
        const rule = this.alertRuleRepository.create({
            id: uuidv4(),
            app_id: params.app_id,
            user_id: params.user_id,
            name: params.name,
            type: params.type,
            threshold: params.threshold,
            window: params.window,
            enabled: params.enabled !== false,
            notification_channels: params.notification_channels || [],
        })

        await this.alertRuleRepository.save(rule)

        this.logger.log(`Created alert rule: ${rule.id} for app: ${params.app_id}`)

        return rule
    }

    async updateRule(id: string, params: UpdateAlertRuleParams) {
        const rule = await this.getRuleById(id)

        if (!rule) {
            throw new Error('Alert rule not found')
        }

        if (params.name !== undefined) rule.name = params.name
        if (params.threshold !== undefined) rule.threshold = params.threshold
        if (params.window !== undefined) rule.window = params.window
        if (params.enabled !== undefined) rule.enabled = params.enabled
        if (params.notification_channels !== undefined) rule.notification_channels = params.notification_channels

        rule.updated_at = new Date()

        await this.alertRuleRepository.save(rule)

        this.logger.log(`Updated alert rule: ${id}`)

        return rule
    }

    async deleteRule(id: string) {
        const result = await this.alertRuleRepository.delete(id)

        if (result.affected === 0) {
            throw new Error('Alert rule not found')
        }

        this.logger.log(`Deleted alert rule: ${id}`)

        return { success: true }
    }

    async getHistory(params: { appId?: string; ruleId?: string; limit: number }) {
        const { appId, ruleId, limit } = params

        const queryBuilder = this.alertRuleRepository.createQueryBuilder('rule')

        if (appId) {
            queryBuilder.where('rule.app_id = :appId', { appId })
        }

        if (ruleId) {
            queryBuilder.andWhere('rule.id = :ruleId', { ruleId })
        }

        const rules = await queryBuilder.orderBy('rule.updated_at', 'DESC').take(limit).getMany()

        return rules
    }
}
