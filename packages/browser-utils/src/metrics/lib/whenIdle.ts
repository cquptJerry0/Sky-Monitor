import { onHidden } from './onHidden.js'
import { runOnce } from './runOnce.js'

/**
 * Runs the passed callback during the next idle period, or immediately
 * if the browser's visibility state is (or becomes) hidden.
 */
export const whenIdle = (cb: () => void): number => {
    const rIC = self.requestIdleCallback || self.setTimeout

    let handle = -1
    cb = runOnce(cb)
    // If the document is hidden, run the callback immediately, otherwise
    // race an idle callback with the next `visibilitychange` event.
    if (document.visibilityState === 'hidden') {
        cb()
    } else {
        handle = rIC(cb)
        onHidden(cb)
    }
    return handle
}
