export const whenActivated = (callback: () => void) => {
    if (document.prerendering) {
        addEventListener('prerenderingchange', () => callback(), true)
    } else {
        callback()
    }
}
