export function simulateSlowOperation(duration: number = 2000) {
    const start = Date.now()
    while (Date.now() - start < duration) {
        // 阻塞主线程
    }
}

export function simulateMemoryLeak() {
    const leakedArray: any[] = []
    setInterval(() => {
        leakedArray.push(new Array(1000000).fill('leak'))
    }, 100)
}

export function simulateLongTask() {
    const iterations = 100000000
    let result = 0
    for (let i = 0; i < iterations; i++) {
        result += Math.sqrt(i)
    }
    return result
}

export function simulateSlowRender() {
    const start = performance.now()
    const elements = []
    for (let i = 0; i < 10000; i++) {
        elements.push(document.createElement('div'))
    }
    const duration = performance.now() - start
    console.log(`Slow render took ${duration}ms`)
}

export async function simulateSlowAPI(delay: number = 3000) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({ data: 'Slow API response' })
        }, delay)
    })
}

export function simulateLayoutThrashing() {
    const element = document.createElement('div')
    document.body.appendChild(element)

    for (let i = 0; i < 100; i++) {
        element.style.width = `${i}px`
        const width = element.offsetWidth
        element.style.height = `${width}px`
    }

    document.body.removeChild(element)
}

export function measurePerformance(fn: () => void, label: string = 'Operation') {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    console.log(`${label} took ${duration.toFixed(2)}ms`)
    return duration
}
