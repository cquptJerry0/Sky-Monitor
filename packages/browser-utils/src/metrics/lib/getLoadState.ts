import { getNavigationEntry } from './getNavigationEntry.js'
import { LoadState } from '../types.js'

export const getLoadState = (timestamp: number): LoadState => {
    if (document.readyState === 'loading') {
        // If the `readyState` is 'loading' there's no need to look at timestamps
        // since the timestamp has to be the current time or earlier.
        return 'loading'
    } else {
        const navigationEntry = getNavigationEntry()
        if (navigationEntry) {
            if (timestamp < navigationEntry.domInteractive) {
                return 'loading'
            } else if (navigationEntry.domContentLoadedEventStart === 0 || timestamp < navigationEntry.domContentLoadedEventStart) {
                // If the `domContentLoadedEventStart` timestamp has not yet been
                // set, or if the given timestamp is less than that value.
                return 'dom-interactive'
            } else if (navigationEntry.domComplete === 0 || timestamp < navigationEntry.domComplete) {
                // If the `domComplete` timestamp has not yet been
                // set, or if the given timestamp is less than that value.
                return 'dom-content-loaded'
            }
        }
    }
    // If any of the above fail, default to loaded. This could really only
    // happy if the browser doesn't support the performance timeline, which
    // most likely means this code would never run anyway.
    return 'complete'
}
