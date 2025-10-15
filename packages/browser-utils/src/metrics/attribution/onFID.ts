import { getLoadState } from '../lib/getLoadState.js'
import { getSelector } from '../lib/getSelector.js'
import { onFID as unattributedOnFID } from '../onFID.js'
import { FIDAttribution, FIDMetric, FIDMetricWithAttribution, ReportOpts } from '../types.js'

const attributeFID = (metric: FIDMetric): FIDMetricWithAttribution => {
    const fidEntry = metric.entries[0]
    const attribution: FIDAttribution = {
        eventTarget: getSelector(fidEntry.target),
        eventType: fidEntry.name,
        eventTime: fidEntry.startTime,
        eventEntry: fidEntry,
        loadState: getLoadState(fidEntry.startTime),
    }

    // Use Object.assign to set property to keep tsc happy.
    const metricWithAttribution: FIDMetricWithAttribution = Object.assign(metric, { attribution })
    return metricWithAttribution
}

/**
 * Calculates the [FID](https://web.dev/articles/fid) value for the current page and
 * calls the `callback` function once the value is ready, along with the
 * relevant `first-input` performance entry used to determine the value. The
 * reported value is a `DOMHighResTimeStamp`.
 *
 * _**Important:** since FID is only reported after the user interacts with the
 * page, it's possible that it will not be reported for some page loads._
 */
export const onFID = (onReport: (metric: FIDMetricWithAttribution) => void, opts?: ReportOpts) => {
    unattributedOnFID((metric: FIDMetric) => {
        const metricWithAttribution = attributeFID(metric)
        onReport(metricWithAttribution)
    }, opts)
}
