export function simulateJavaScriptError() {
    throw new Error('模拟的 JavaScript 错误')
}

export function simulatePromiseRejection() {
    Promise.reject(new Error('模拟的 Promise 拒绝'))
}

export function simulateTypeError() {
    const obj: any = null
    obj.nonExistentMethod()
}

export function simulateReferenceError() {
    // @ts-expect-error - Intentionally accessing non-existent variable
    nonExistentVariable.toString()
}

export function simulateNetworkError() {
    fetch('https://nonexistent-domain-12345.com/api/data').then(response => response.json())
}

export function simulateResourceError() {
    const img = new Image()
    img.src = 'https://nonexistent-domain-12345.com/image.jpg'
}

export function simulateConsoleError() {
    console.error('这是一个控制台错误消息')
}

export function simulateCustomError() {
    class CustomError extends Error {
        constructor(message: string) {
            super(message)
            this.name = 'CustomError'
        }
    }
    throw new CustomError('这是一个自定义错误')
}
