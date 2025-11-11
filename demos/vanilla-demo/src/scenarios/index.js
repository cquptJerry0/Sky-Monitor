/**
 * 场景索引文件
 * 导出所有 Integration 测试场景
 */

import { ErrorsIntegrationScenarios, runErrorsScenarios } from './01-errors-integration.js'
import { MetricsIntegrationScenarios, runMetricsScenarios } from './02-metrics-integration.js'
import { SessionIntegrationScenarios, runSessionScenarios } from './03-session-integration.js'
import { HttpErrorIntegrationScenarios, runHttpErrorScenarios } from './04-http-error-integration.js'
import { ResourceErrorIntegrationScenarios, runResourceErrorScenarios } from './05-resource-error-integration.js'
import { PerformanceIntegrationScenarios, runPerformanceScenarios } from './06-performance-integration.js'
import { BreadcrumbIntegrationScenarios, runBreadcrumbScenarios } from './07-breadcrumb-integration.js'
import { SessionReplayIntegrationScenarios, runSessionReplayScenarios } from './08-session-replay-integration.js'
import { SamplingIntegrationScenarios, runSamplingScenarios } from './09-sampling-integration.js'
import { DeduplicationIntegrationScenarios, runDeduplicationScenarios } from './10-deduplication-integration.js'
import { ResourceTimingIntegrationScenarios, runResourceTimingScenarios } from './11-resource-timing-integration.js'

/**
 * 所有 Integration 场景
 */
export const ALL_SCENARIOS = {
    errors: ErrorsIntegrationScenarios,
    metrics: MetricsIntegrationScenarios,
    session: SessionIntegrationScenarios,
    httpError: HttpErrorIntegrationScenarios,
    resourceError: ResourceErrorIntegrationScenarios,
    performance: PerformanceIntegrationScenarios,
    breadcrumb: BreadcrumbIntegrationScenarios,
    sessionReplay: SessionReplayIntegrationScenarios,
    sampling: SamplingIntegrationScenarios,
    deduplication: DeduplicationIntegrationScenarios,
    resourceTiming: ResourceTimingIntegrationScenarios,
}

/**
 * 所有场景运行函数
 */
export const SCENARIO_RUNNERS = {
    errors: runErrorsScenarios,
    metrics: runMetricsScenarios,
    session: runSessionScenarios,
    httpError: runHttpErrorScenarios,
    resourceError: runResourceErrorScenarios,
    performance: runPerformanceScenarios,
    breadcrumb: runBreadcrumbScenarios,
    sessionReplay: runSessionReplayScenarios,
    sampling: runSamplingScenarios,
    deduplication: runDeduplicationScenarios,
    resourceTiming: runResourceTimingScenarios,
}

/**
 * 运行所有场景
 * @param {Function} onComplete - 所有场景完成后的回调
 */
export async function runAllScenarios(onComplete) {
    console.log('[Scenarios] Starting all Integration scenarios...')

    const runners = Object.keys(SCENARIO_RUNNERS)
    let currentIndex = 0

    function runNext() {
        if (currentIndex >= runners.length) {
            console.log('[Scenarios] All Integration scenarios completed')
            if (onComplete) onComplete()
            return
        }

        const runnerKey = runners[currentIndex]
        const runnerFn = SCENARIO_RUNNERS[runnerKey]

        console.log(`\n========== Running ${runnerKey} scenarios ==========\n`)

        runnerFn(() => {
            currentIndex++
            // 每个 Integration 之间间隔3秒
            setTimeout(runNext, 3000)
        })
    }

    runNext()
}

/**
 * 运行单个 Integration 的场景
 * @param {string} integrationName - Integration 名称
 * @param {Function} onComplete - 完成后的回调
 */
export function runSingleIntegration(integrationName, onComplete) {
    const runner = SCENARIO_RUNNERS[integrationName]
    if (!runner) {
        console.error(`[Scenarios] Integration "${integrationName}" not found`)
        return
    }

    console.log(`[Scenarios] Running ${integrationName} scenarios...`)
    runner(onComplete)
}
