import { onBFCacheRestore } from './lib/bfcache.js'
import { bindReporter } from './lib/bindReporter.js'
import { getVisibilityWatcher } from './lib/getVisibilityWatcher.js'
import { initMetric } from './lib/initMetric.js'
import { observe } from './lib/observe.js'
import { onHidden } from './lib/onHidden.js'
import { firstInputPolyfill, resetFirstInputPolyfill } from './lib/polyfills/firstInputPolyfill.js'
import { runOnce } from './lib/runOnce.js'
import { whenActivated } from './lib/whenActivated.js'
import { FIDMetric, FirstInputPolyfillCallback, MetricRatingThresholds, ReportOpts } from './types.js'

/** Thresholds for FID. See https://web.dev/articles/fid#what_is_a_good_fid_score */
export const FIDThresholds: MetricRatingThresholds = [100, 300]

/**
 * Calculates the [FID](https://web.dev/articles/fid) value for the current page and
 * calls the `callback` function once the value is ready, along with the
 * relevant `first-input` performance entry used to determine the value. The
 * reported value is a `DOMHighResTimeStamp`.
 *
 * _**Important:** since FID is only reported after the user interacts with the
 * page, it's possible that it will not be reported for some page loads._
 */
export const onFID = (onReport: (metric: FIDMetric) => void, opts?: ReportOpts) => {
    // Set defaults
    opts = opts || {}

    whenActivated(() => {
        const visibilityWatcher = getVisibilityWatcher()
        let metric = initMetric('FID')
        let report: ReturnType<typeof bindReporter>

        const handleEntry = (entry: PerformanceEventTiming) => {
            // Only report if the page wasn't hidden prior to the first input.
            if (entry.startTime < visibilityWatcher.firstHiddenTime) {
                metric.value = entry.processingStart - entry.startTime
                metric.entries.push(entry)
                report(true)
            }
        }

        const handleEntries = (entries: FIDMetric['entries']) => {
            entries.forEach(handleEntry)
        }

        const po = observe('first-input', handleEntries)

        report = bindReporter(onReport, metric, FIDThresholds, opts!.reportAllChanges)

        if (po) {
            onHidden(
                runOnce(() => {
                    handleEntries(po.takeRecords() as FIDMetric['entries'])
                    po.disconnect()
                })
            )

            onBFCacheRestore(() => {
                metric = initMetric('FID')
                report = bindReporter(onReport, metric, FIDThresholds, opts!.reportAllChanges)

                // Browsers don't re-emit FID on bfcache restore so fake it until you make it
                resetFirstInputPolyfill()
                firstInputPolyfill(handleEntry as FirstInputPolyfillCallback)
            })
        }
    })
}
