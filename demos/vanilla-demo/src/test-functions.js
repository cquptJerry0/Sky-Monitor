/**
 * Sky Monitor SDK 完整功能测试函数
 *
 * 测试所有 8 个 Integrations 的功能
 */

// ============ 1. Breadcrumb Integration 测试 ============

/**
 * 测试 DOM 点击事件捕获
 */
window.testBreadcrumbClick = function () {
    console.log('👆 测试 Breadcrumb: DOM 点击事件')
    const button = document.createElement('button')
    button.textContent = '测试按钮'
    button.id = 'test-breadcrumb-btn'
    button.className = 'test-button'
    button.onclick = () => alert('Breadcrumb 会记录这次点击！')

    document.getElementById('test-area').innerHTML = ''
    document.getElementById('test-area').appendChild(button)

    // 自动触发点击
    setTimeout(() => button.click(), 100)
}

/**
 * 测试控制台日志捕获
 */
window.testBreadcrumbConsole = function () {
    console.log('📝 测试 Breadcrumb: 控制台日志')
    console.log('这是一条测试日志')
    console.warn('这是一条警告日志')
    console.error('这是一条错误日志')
    console.info('这是一条信息日志')
    alert('Breadcrumb 会记录这些控制台输出！')
}

/**
 * 测试页面导航捕获
 */
window.testBreadcrumbHistory = function () {
    console.log('🔄 测试 Breadcrumb: 页面导航')
    // 模拟 SPA 路由变化
    history.pushState({}, '', '/test-page-1')
    setTimeout(() => {
        history.pushState({}, '', '/test-page-2')
        setTimeout(() => {
            history.back()
        }, 500)
    }, 500)
    alert('Breadcrumb 会记录这些路由变化！')
}

/**
 * 测试 Fetch 请求捕获
 */
window.testBreadcrumbFetch = async function () {
    console.log('🌐 测试 Breadcrumb: Fetch 请求')
    try {
        await fetch('https://jsonplaceholder.typicode.com/posts/1')
        console.log('✅ Fetch 请求成功')
        alert('Breadcrumb 会记录这次 Fetch 请求！')
    } catch (error) {
        console.error('❌ Fetch 请求失败:', error)
    }
}

/**
 * 测试 XHR 请求捕获
 */
window.testBreadcrumbXHR = function () {
    console.log('🌐 测试 Breadcrumb: XHR 请求')
    const xhr = new XMLHttpRequest()
    xhr.open('GET', 'https://jsonplaceholder.typicode.com/users/1')
    xhr.onload = () => {
        console.log('✅ XHR 请求成功')
        alert('Breadcrumb 会记录这次 XHR 请求！')
    }
    xhr.onerror = () => {
        console.error('❌ XHR 请求失败')
    }
    xhr.send()
}

// ============ 2. Session Replay Integration 测试 ============

/**
 * 测试会话录制
 */
window.testSessionReplay = function () {
    console.log('📹 测试 Session Replay: 会话录制')
    alert('Session Replay 正在录制你的所有操作！\n包括鼠标移动、点击、滚动等。')

    // 创建一些交互元素
    const testArea = document.getElementById('test-area')
    testArea.innerHTML = `
        <div style="padding: 20px; background: #f0f4ff; border-radius: 5px;">
            <h3>会话录制测试区域</h3>
            <input type="text" placeholder="输入会被录制（脱敏）" style="width: 100%; padding: 10px; margin: 10px 0;">
            <button onclick="alert('点击被录制')" style="padding: 10px 20px;">点击我</button>
            <div style="height: 200px; overflow: auto; background: white; margin-top: 10px; padding: 10px;">
                <p>尝试滚动这个区域...</p>
                <p>所有操作都会被录制</p>
                <p style="margin-top: 100px;">继续滚动...</p>
                <p style="margin-top: 100px;">底部</p>
            </div>
        </div>
    `
}

// ============ 3. Session Integration 测试 ============

/**
 * 测试会话跟踪
 */
window.testSessionTracking = function () {
    console.log('📊 测试 Session: 会话跟踪')

    const sessionId = window.monitoring?.getSessionId?.() || 'N/A'
    const userId = window.monitoring?.getUserId?.() || 'N/A'

    alert(`会话跟踪信息:\n\nSession ID: ${sessionId}\nUser ID: ${userId}\n\n会话将在 30 分钟无活动后结束。`)
}

/**
 * 模拟用户会话活动
 */
window.testSessionActivity = function () {
    console.log('🏃 测试 Session: 模拟用户活动')

    let count = 0
    const interval = setInterval(() => {
        count++
        console.log(`用户活动 ${count}/5`)

        // 模拟各种活动
        if (count === 1) window.scrollBy(0, 100)
        if (count === 2) document.body.click()
        if (count === 3) window.scrollBy(0, -100)

        if (count >= 5) {
            clearInterval(interval)
            alert('会话活动模拟完成！Session Integration 会更新会话时长。')
        }
    }, 1000)
}

// ============ 4. HTTP Error Integration 测试 ============

/**
 * 测试 HTTP 404 错误
 */
window.testHttp404Error = async function () {
    console.log('❌ 测试 HTTP Error: 404')
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/nonexistent-endpoint')
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
    } catch (error) {
        console.error('捕获到 404 错误（预期）:', error)
        alert('HTTP Error Integration 会捕获这个 404 错误！')
    }
}

/**
 * 测试 HTTP 500 错误
 */
window.testHttp500Error = async function () {
    console.log('❌ 测试 HTTP Error: 500')
    try {
        // 模拟 500 错误（大部分公开 API 不会返回 500）
        await fetch('https://httpstat.us/500')
    } catch (error) {
        console.error('捕获到 500 错误:', error)
        alert('HTTP Error Integration 会捕获这个 500 错误！')
    }
}

/**
 * 测试网络超时
 */
window.testHttpTimeout = async function () {
    console.log('⏱️ 测试 HTTP Error: 超时')
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 100) // 100ms 超时

        await fetch('https://httpbin.org/delay/5', {
            signal: controller.signal,
        })

        clearTimeout(timeoutId)
    } catch (error) {
        console.error('捕获到超时错误:', error)
        alert('HTTP Error Integration 会捕获这个超时错误！')
    }
}

// ============ 5. Resource Error Integration 测试 ============

/**
 * 测试图片加载失败
 */
window.testResourceErrorImage = function () {
    console.log('🖼️ 测试 Resource Error: 图片加载失败')
    const img = new Image()
    img.src = 'https://nonexistent-domain-123456.com/image.png'
    img.onerror = () => {
        console.log('图片加载失败（预期）')
        alert('Resource Error Integration 会捕获这个图片加载错误！')
    }
    document.getElementById('test-area').innerHTML = ''
    document.getElementById('test-area').appendChild(img)
}

/**
 * 测试 JS 文件加载失败
 */
window.testResourceErrorScript = function () {
    console.log('📜 测试 Resource Error: JS 加载失败')
    const script = document.createElement('script')
    script.src = 'https://nonexistent-domain-123456.com/script.js'
    script.onerror = () => {
        console.log('脚本加载失败（预期）')
        alert('Resource Error Integration 会捕获这个脚本加载错误！')
    }
    document.head.appendChild(script)
}

/**
 * 测试 CSS 文件加载失败
 */
window.testResourceErrorCSS = function () {
    console.log('🎨 测试 Resource Error: CSS 加载失败')
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://nonexistent-domain-123456.com/style.css'
    link.onerror = () => {
        console.log('样式表加载失败（预期）')
        alert('Resource Error Integration 会捕获这个样式表加载错误！')
    }
    document.head.appendChild(link)
}

// ============ 6. Resource Timing Integration 测试 ============

/**
 * 测试资源加载性能监控
 */
window.testResourceTiming = function () {
    console.log('⚡ 测试 Resource Timing: 资源性能监控')

    // 加载一个较大的图片
    const img = new Image()
    img.src = 'https://via.placeholder.com/1500?text=Large+Image+for+Testing'
    img.onload = () => {
        console.log('✅ 图片加载完成')
        alert('Resource Timing Integration 会记录这个资源的加载性能（DNS、TCP、下载时间等）！')
    }

    document.getElementById('test-area').innerHTML = ''
    document.getElementById('test-area').appendChild(img)
}

/**
 * 测试多个资源加载
 */
window.testResourceTimingMultiple = function () {
    console.log('⚡ 测试 Resource Timing: 多个资源')

    const testArea = document.getElementById('test-area')
    testArea.innerHTML = '<h3>加载多个资源...</h3>'

    // 加载多个图片
    for (let i = 1; i <= 5; i++) {
        const img = new Image()
        img.src = `https://via.placeholder.com/300?text=Image+${i}`
        img.style.margin = '5px'
        testArea.appendChild(img)
    }

    alert('Resource Timing Integration 会记录所有这些资源的加载性能！')
}

// ============ 7. Performance Integration 测试 ============

/**
 * 测试慢速 API 请求
 */
window.testPerformanceSlowAPI = async function () {
    console.log('🐌 测试 Performance: 慢速 API')
    const startTime = Date.now()

    try {
        await fetch('https://httpbin.org/delay/3') // 3 秒延迟
        const duration = Date.now() - startTime
        console.log(`✅ 请求完成，耗时: ${duration}ms`)
        alert(`Performance Integration 会记录这个慢速请求（${duration}ms）！`)
    } catch (error) {
        console.error('❌ 请求失败:', error)
    }
}

/**
 * 测试快速 API 请求
 */
window.testPerformanceFastAPI = async function () {
    console.log('⚡ 测试 Performance: 快速 API')
    const startTime = Date.now()

    try {
        await fetch('https://jsonplaceholder.typicode.com/posts/1')
        const duration = Date.now() - startTime
        console.log(`✅ 请求完成，耗时: ${duration}ms`)
        alert(`Performance Integration 会记录这个快速请求（${duration}ms）！`)
    } catch (error) {
        console.error('❌ 请求失败:', error)
    }
}

/**
 * 测试多个并发请求
 */
window.testPerformanceConcurrent = async function () {
    console.log('🔀 测试 Performance: 并发请求')
    const startTime = Date.now()

    try {
        await Promise.all([
            fetch('https://jsonplaceholder.typicode.com/posts/1'),
            fetch('https://jsonplaceholder.typicode.com/users/1'),
            fetch('https://jsonplaceholder.typicode.com/comments/1'),
        ])

        const duration = Date.now() - startTime
        console.log(`✅ 所有请求完成，总耗时: ${duration}ms`)
        alert(`Performance Integration 会记录所有这 3 个并发请求的性能数据！`)
    } catch (error) {
        console.error('❌ 请求失败:', error)
    }
}

// ============ Breadcrumb 面包屑测试 ============

window.testBreadcrumbClick = function () {
    console.log('🍞 面包屑：点击事件已记录')
    alert('点击事件已被记录到面包屑！')
}

window.testBreadcrumbConsole = function () {
    console.log('🍞 这是一条 log 消息')
    console.warn('🍞 这是一条 warn 消息')
    console.error('🍞 这是一条 error 消息')
    console.info('🍞 这是一条 info 消息')
    alert('已输出多条不同级别的 console 日志，已记录到面包屑！')
}

window.testBreadcrumbFetch = async function () {
    console.log('🍞 发起 Fetch 请求测试')
    try {
        await fetch('https://jsonplaceholder.typicode.com/posts/1')
        console.log('🍞 Fetch 请求成功，已记录到面包屑')
        alert('Fetch 请求已完成并记录到面包屑！')
    } catch (error) {
        console.error('🍞 Fetch 请求失败:', error)
    }
}

window.testBreadcrumbHistory = function () {
    console.log('🍞 测试路由变化')
    const currentUrl = window.location.href

    // 修改路由
    history.pushState({ page: 1 }, '', '/test-page-1')
    console.log('🍞 路由已变更为: /test-page-1')

    setTimeout(() => {
        history.pushState({ page: 2 }, '', '/test-page-2')
        console.log('🍞 路由已变更为: /test-page-2')

        setTimeout(() => {
            // 恢复原始URL
            history.pushState({}, '', currentUrl)
            console.log('🍞 路由已恢复')
            alert('路由变化已记录到面包屑！检查控制台查看详情。')
        }, 500)
    }, 500)
}

window.triggerErrorWithBreadcrumbs = function () {
    console.log('🍞 准备触发错误，查看面包屑记录')

    // 执行一系列操作，生成面包屑
    console.log('步骤 1: 用户查看页面')
    console.log('步骤 2: 用户点击按钮')
    console.warn('步骤 3: 系统发出警告')

    // 模拟一个 fetch 请求
    fetch('https://jsonplaceholder.typicode.com/posts/1')
        .then(() => {
            console.log('步骤 4: API 请求成功')

            // 触发错误
            setTimeout(() => {
                console.error('步骤 5: 即将触发错误')
                throw new Error('🍞 测试错误：查看此错误的面包屑记录！')
            }, 500)
        })
        .catch(err => {
            console.error('请求失败:', err)
        })
}
