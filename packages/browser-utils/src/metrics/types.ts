export * from './types/base.js'
export * from './types/polyfills.js'

export * from './types/cls.js'
export * from './types/fcp.js'
export * from './types/fid.js'
export * from './types/inp.js'
export * from './types/lcp.js'
export * from './types/ttfb.js'

// --------------------------------------------------------------------------
// Everything below is modifications to built-in modules.
// --------------------------------------------------------------------------

interface PerformanceEntryMap {
    navigation: PerformanceNavigationTiming
    resource: PerformanceResourceTiming
    paint: PerformancePaintTiming
}

// Update built-in types to be more accurate.
declare global {
    interface Document {
        // https://wicg.github.io/nav-speculation/prerendering.html#document-prerendering
        prerendering?: boolean
        // https://wicg.github.io/page-lifecycle/#sec-api
        wasDiscarded?: boolean
    }

    interface Performance {
        getEntriesByType<K extends keyof PerformanceEntryMap>(type: K): PerformanceEntryMap[K][]
    }

    // https://w3c.github.io/event-timing/#sec-modifications-perf-timeline
    interface PerformanceObserverInit {
        durationThreshold?: number
    }

    // https://wicg.github.io/nav-speculation/prerendering.html#performance-navigation-timing-extension
    interface PerformanceNavigationTiming {
        activationStart?: number
    }

    // https://wicg.github.io/event-timing/#sec-performance-event-timing
    interface PerformanceEventTiming extends PerformanceEntry {
        duration: DOMHighResTimeStamp
        interactionId: number
    }

    // https://wicg.github.io/layout-instability/#sec-layout-shift-attribution
    interface LayoutShiftAttribution {
        node?: Node
        previousRect: DOMRectReadOnly
        currentRect: DOMRectReadOnly
    }

    // https://wicg.github.io/layout-instability/#sec-layout-shift
    interface LayoutShift extends PerformanceEntry {
        value: number
        sources: LayoutShiftAttribution[]
        hadRecentInput: boolean
    }

    // https://w3c.github.io/largest-contentful-paint/#sec-largest-contentful-paint-interface
    interface LargestContentfulPaint extends PerformanceEntry {
        readonly renderTime: DOMHighResTimeStamp
        readonly loadTime: DOMHighResTimeStamp
        readonly size: number
        readonly id: string
        readonly url: string
        readonly element: Element | null
    }

    // https://w3c.github.io/long-animation-frame/#sec-PerformanceLongAnimationFrameTiming
    interface PerformanceLongAnimationFrameTiming extends PerformanceEntry {
        renderStart: DOMHighResTimeStamp
        duration: DOMHighResTimeStamp
    }
}
