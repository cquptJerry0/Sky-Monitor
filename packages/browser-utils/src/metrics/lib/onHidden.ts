export const onHidden = (cb: () => void) => {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            cb()
        }
    })
}
