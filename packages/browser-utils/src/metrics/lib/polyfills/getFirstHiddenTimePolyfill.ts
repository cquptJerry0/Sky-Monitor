let firstHiddenTime = document.visibilityState === 'hidden' ? 0 : Infinity

const onVisibilityChange = (event: Event) => {
    if (document.visibilityState === 'hidden') {
        firstHiddenTime = event.timeStamp
        removeEventListener('visibilitychange', onVisibilityChange, true)
    }
}

// Note: do not add event listeners unconditionally (outside of polyfills).
addEventListener('visibilitychange', onVisibilityChange, true)

export const getFirstHiddenTime = () => firstHiddenTime
