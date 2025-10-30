// 测试函数定义

// ============ 性能监控测试 ============

window.triggerSlowResource = function () {
    console.log('⏳ 加载慢资源...')
    const img = new Image()
    img.src = 'https://via.placeholder.com/1500?text=Slow+Loading+Image&delay=2000'
    document.getElementById('performanceTest').innerHTML = ''
    document.getElementById('performanceTest').appendChild(img)
}

window.triggerLayoutShift = function () {
    console.log('📐 触发布局偏移...')
    const div = document.createElement('div')
    div.className = 'slow-resource'
    div.textContent = '布局偏移测试区域'
    div.style.marginTop = '50px'
    document.getElementById('performanceTest').innerHTML = ''
    document.getElementById('performanceTest').appendChild(div)

    setTimeout(() => {
        div.style.marginTop = '100px'
    }, 1000)
}

window.triggerLongTask = function () {
    console.log('⏱️ 执行长任务（阻塞主线程）...')
    const start = Date.now()
    // 模拟长任务
    while (Date.now() - start < 500) {
        // 阻塞主线程500ms
    }
    console.log('✅ 长任务执行完成')
}

// ============ 错误监控测试 ============

window.triggerSyncError = function () {
    console.log('💥 触发同步错误')
    throw new Error('这是一个同步错误测试')
}

window.triggerAsyncError = function () {
    console.log('💥 触发异步错误')
    setTimeout(() => {
        throw new Error('这是一个异步错误测试')
    }, 100)
}

window.triggerPromiseError = function () {
    console.log('💥 触发Promise错误')
    Promise.reject(new Error('这是一个Promise拒绝测试'))
}

window.triggerReferenceError = function () {
    console.log('💥 触发引用错误')

    nonExistentFunction()
}

window.triggerTypeError = function () {
    console.log('💥 触发类型错误')
    const obj = null
    obj.someMethod()
}

window.triggerCustomError = function () {
    console.log('💥 触发自定义错误')
    throw new Error('自定义错误：用户操作导致的异常')
}

// ============ 用户行为测试 ============

window.simulateClick = function () {
    console.log('👆 模拟点击事件')
    alert('点击事件已触发！SDK会记录此交互。')
}

window.simulateInput = function () {
    console.log('⌨️ 模拟输入事件')
    const input = document.createElement('input')
    input.placeholder = '输入测试内容...'
    input.style.padding = '10px'
    input.style.width = '100%'
    input.style.marginTop = '10px'
    input.style.borderRadius = '5px'
    input.style.border = '2px solid #667eea'
    document.getElementById('performanceTest').innerHTML = ''
    document.getElementById('performanceTest').appendChild(input)
}

window.simulateScroll = function () {
    console.log('📜 模拟滚动事件')
    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth',
    })
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }, 1000)
}

// ============ 网络请求测试 ============

window.triggerSuccessAPI = async function () {
    console.log('🌐 发起成功的API请求')
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
        const data = await response.json()
        console.log('✅ API请求成功:', data)
        alert('API请求成功！')
    } catch (error) {
        console.error('❌ API请求失败:', error)
    }
}

window.triggerFailedAPI = async function () {
    console.log('🌐 发起失败的API请求')
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/nonexistent')
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`)
        }
    } catch (error) {
        console.error('❌ API请求失败（预期）:', error)
        alert('API请求失败（这是预期行为）')
    }
}

window.triggerSlowAPI = async function () {
    console.log('🌐 发起慢速API请求')
    const startTime = Date.now()
    try {
        // 使用一个慢速API
        await fetch('https://httpbin.org/delay/3')
        const endTime = Date.now()
        console.log(`✅ 慢速API请求完成，耗时: ${endTime - startTime}ms`)
        alert(`慢速API请求完成，耗时: ${endTime - startTime}ms`)
    } catch (error) {
        console.error('❌ API请求失败:', error)
    }
}
