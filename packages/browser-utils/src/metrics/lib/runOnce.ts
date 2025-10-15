export const runOnce = (cb: () => void) => {
    let called = false
    return () => {
        if (!called) {
            cb()
            called = true
        }
    }
}
