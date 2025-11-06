/**
 * test-panel.js - 测试控制面板UI
 *
 * 显示所有13个测试模块，支持单独运行或批量运行
 */

import { testEventBus, TestStatus, getStatusIcon, calculateProgress, dom } from '../utils/test-helpers.js'

// 导入所有测试模块
import ErrorsTests from '../tests/01-errors.js'
import MetricsTests from '../tests/02-metrics.js'
import SessionTests from '../tests/03-session.js'
import HttpErrorTests from '../tests/04-http-error.js'
import ResourceErrorTests from '../tests/05-resource-error.js'
import PerformanceTests from '../tests/06-performance.js'
import BreadcrumbTests from '../tests/07-breadcrumb.js'
import SessionReplayTests from '../tests/08-session-replay.js'
import SamplingTests from '../tests/09-sampling.js'
import DeduplicationTests from '../tests/10-deduplication.js'
import ResourceTimingTests from '../tests/11-resource-timing.js'
import UserContextTests from '../tests/12-user-context.js'
import BatchingOfflineTests from '../tests/13-batching-offline.js'

const testModules = [
    ErrorsTests,
    MetricsTests,
    SessionTests,
    HttpErrorTests,
    ResourceErrorTests,
    PerformanceTests,
    BreadcrumbTests,
    SessionReplayTests,
    SamplingTests,
    DeduplicationTests,
    ResourceTimingTests,
    UserContextTests,
    BatchingOfflineTests,
]

class TestPanel {
    constructor(containerId) {
        this.container = document.getElementById(containerId)
        this.testResults = {}
        this.isRunning = false

        this.init()
    }

    init() {
        if (!this.container) {
            console.error('Test panel container not found')
            return
        }

        this.render()
        this.attachEvents()
    }

    render() {
        this.container.innerHTML = `
            <div class="test-panel">
                <div class="panel-header">
                    <h2>测试控制面板</h2>
                    <div class="panel-actions">
                        <button id="run-all-tests" class="btn btn-primary">全部运行</button>
                        <button id="clear-results" class="btn btn-secondary">清除结果</button>
                    </div>
                </div>
                
                <div class="panel-progress" id="panel-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="progress-text">就绪</div>
                </div>
                
                <div class="test-modules" id="test-modules">
                    ${this.renderModules()}
                </div>
            </div>
        `
    }

    renderModules() {
        return testModules
            .map(
                (module, index) => `
            <div class="test-module" data-module-index="${index}">
                <div class="module-header">
                    <div class="module-info">
                        <span class="module-number">${index + 1}.</span>
                        <span class="module-name">${module.name}</span>
                        <span class="module-description">${module.description}</span>
                        <span class="module-count">(${module.scenarios.length}场景)</span>
                    </div>
                    <div class="module-actions">
                        <button class="btn btn-sm btn-run" data-module-index="${index}">运行</button>
                        <span class="module-status" id="status-${index}">⏸️</span>
                    </div>
                </div>
                <div class="module-scenarios" id="scenarios-${index}">
                    ${module.scenarios
                        .map(
                            (scenario, sIndex) => `
                        <div class="scenario-item" data-scenario-id="${scenario.id}">
                            <span class="scenario-icon" id="icon-${index}-${sIndex}">⏸️</span>
                            <span class="scenario-name">${scenario.name}</span>
                            <span class="scenario-description">${scenario.description}</span>
                        </div>
                    `
                        )
                        .join('')}
                </div>
            </div>
        `
            )
            .join('')
    }

    attachEvents() {
        // 全部运行
        dom.$('#run-all-tests')?.addEventListener('click', () => this.runAllTests())

        // 清除结果
        dom.$('#clear-results')?.addEventListener('click', () => this.clearResults())

        // 单个模块运行
        dom.$$('.btn-run').forEach(btn => {
            btn.addEventListener('click', e => {
                const moduleIndex = parseInt(e.target.dataset.moduleIndex)
                this.runModule(moduleIndex)
            })
        })
    }

    async runAllTests() {
        if (this.isRunning) return

        this.isRunning = true
        this.updateProgress(0, `运行中 0/${testModules.length}`)

        let completedCount = 0

        for (let i = 0; i < testModules.length; i++) {
            await this.runModule(i)
            completedCount++
            const progress = Math.round((completedCount / testModules.length) * 100)
            this.updateProgress(progress, `运行中 ${completedCount}/${testModules.length}`)
        }

        this.isRunning = false
        this.updateProgress(100, `完成 ${completedCount}/${testModules.length}`)

        // 触发完成事件
        testEventBus.emit('tests-completed', this.testResults)
    }

    async runModule(moduleIndex) {
        const module = testModules[moduleIndex]
        if (!module) return

        // 更新模块状态
        this.updateModuleStatus(moduleIndex, TestStatus.RUNNING)

        try {
            const results = await module.runAll()
            this.testResults[moduleIndex] = results

            // 更新场景状态
            results.forEach((result, sIndex) => {
                this.updateScenarioStatus(moduleIndex, sIndex, result.status)
            })

            // 更新模块状态
            const allSuccess = results.every(r => r.status === TestStatus.SUCCESS)
            this.updateModuleStatus(moduleIndex, allSuccess ? TestStatus.SUCCESS : TestStatus.ERROR)

            // 触发事件
            testEventBus.emit('module-completed', { moduleIndex, results })
        } catch (error) {
            this.updateModuleStatus(moduleIndex, TestStatus.ERROR)
            console.error(`Module ${module.name} failed:`, error)
        }
    }

    updateModuleStatus(moduleIndex, status) {
        const statusEl = dom.$(`#status-${moduleIndex}`)
        if (statusEl) {
            statusEl.textContent = getStatusIcon(status)
        }
    }

    updateScenarioStatus(moduleIndex, scenarioIndex, status) {
        const iconEl = dom.$(`#icon-${moduleIndex}-${scenarioIndex}`)
        if (iconEl) {
            iconEl.textContent = getStatusIcon(status)
        }
    }

    updateProgress(percentage, text) {
        const fillEl = dom.$('#progress-fill')
        const textEl = dom.$('#progress-text')

        if (fillEl) fillEl.style.width = `${percentage}%`
        if (textEl) textEl.textContent = text
    }

    clearResults() {
        this.testResults = {}

        // 重置所有状态
        testModules.forEach((module, moduleIndex) => {
            this.updateModuleStatus(moduleIndex, TestStatus.PENDING)
            module.scenarios.forEach((scenario, scenarioIndex) => {
                this.updateScenarioStatus(moduleIndex, scenarioIndex, TestStatus.PENDING)
            })
        })

        this.updateProgress(0, '就绪')
        testEventBus.emit('results-cleared')
    }
}

// 初始化测试面板
export function initTestPanel(containerId = 'test-panel') {
    return new TestPanel(containerId)
}

export default TestPanel
