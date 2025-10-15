import { onBFCacheRestore } from './lib/bfcache.js'
import { initMetric } from './lib/initMetric.js'
import { observe } from './lib/observe.js'
import { bindReporter } from './lib/bindReporter.js'
import { doubleRAF } from './lib/doubleRAF.js'
import { onHidden } from './lib/onHidden.js'
import { runOnce } from './lib/runOnce.js'
import { onFCP } from './onFCP.js'
import { CLSMetric, MetricRatingThresholds, ReportOpts } from './types.js'

/** Thresholds for CLS. See https://web.dev/articles/cls#what_is_a_good_cls_score */
export const CLSThresholds: MetricRatingThresholds = [0.1, 0.25]

/**
 * Calculates the [CLS](https://web.dev/articles/cls) value for the current page and
 * calls the `callback` function once the value is ready to be reported, along
 * with all `layout-shift` performance entries that were used in the metric
 * value calculation. The reported value is a `double` (corresponding to a
 * [layout shift score](https://web.dev/articles/cls#layout_shift_score)).
 *
 * If the `reportAllChanges` configuration option is set to `true`, the
 * `callback` function will be called as soon as the value is initially
 * determined as well as any time the value changes throughout the page
 * lifespan.
 *
 * _**Important:** CLS should be continually monitored for changes throughout
 * the entire lifespan of a page—including if the user returns to the page after
 * it's been hidden/backgrounded. However, since browsers often [will not fire
 * additional callbacks once the user has backgrounded a
 * page](https://developer.chrome.com/blog/page-lifecycle-api/#advice-hidden),
 * `callback` is always called when the page's visibility state changes to
 * hidden. As a result, the `callback` function might be called multiple times
 * during the same page load._
 */
export const onCLS = (onReport: (metric: CLSMetric) => void, opts?: ReportOpts) => {
    // Set defaults
    opts = opts || {}

    // Start monitoring FCP so we can only report CLS if FCP is also reported.
    // Note: this is done to match the current behavior of CrUX.
    onFCP(
        runOnce(() => {
            let metric = initMetric('CLS', 0)
            let report: ReturnType<typeof bindReporter>

            let sessionValue = 0
            let sessionEntries: LayoutShift[] = []

            const handleEntries = (entries: LayoutShift[]) => {
                entries.forEach(entry => {
                    // Only count layout shifts without recent user input.
                    if (!entry.hadRecentInput) {
                        const firstSessionEntry = sessionEntries[0]
                        const lastSessionEntry = sessionEntries[sessionEntries.length - 1]

                        // If the entry occurred less than 1 second after the previous entry
                        // and less than 5 seconds after the first entry in the session,
                        // include the entry in the current session. Otherwise, start a new
                        // session.
                        if (
                            sessionValue &&
                            entry.startTime - (lastSessionEntry?.startTime ?? 0) < 1000 &&
                            entry.startTime - (firstSessionEntry?.startTime ?? 0) < 5000
                        ) {
                            sessionValue += entry.value
                            sessionEntries.push(entry)
                        } else {
                            sessionValue = entry.value
                            sessionEntries = [entry]
                        }
                    }
                })

                // If the current session value is larger than the current CLS value,
                // update CLS and the entries contributing to it.
                if (sessionValue > metric.value) {
                    metric.value = sessionValue
                    metric.entries = sessionEntries
                    report()
                }
            }

            const po = observe('layout-shift', handleEntries)
            if (po) {
                report = bindReporter(onReport, metric, CLSThresholds, opts!.reportAllChanges)

                onHidden(() => {
                    handleEntries(po.takeRecords() as CLSMetric['entries'])
                    report(true)
                })

                // Only report after a bfcache restore if the `PerformanceObserver`
                // successfully registered.
                onBFCacheRestore(() => {
                    sessionValue = 0
                    metric = initMetric('CLS', 0)
                    report = bindReporter(onReport, metric, CLSThresholds, opts!.reportAllChanges)

                    doubleRAF(() => report())
                })

                // Queue a task to report (if nothing else triggers a report first).
                // This allows CLS to be reported as soon as FCP fires when
                // `reportAllChanges` is true.
                setTimeout(report, 0)
            }
        })
    )
}
