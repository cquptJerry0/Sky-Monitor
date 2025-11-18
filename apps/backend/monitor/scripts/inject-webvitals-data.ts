import { createClient } from '@clickhouse/client'

const APP_ID = 'vanillaGQqHf7'

const clickhouse = createClient({
    url: 'http://localhost:8123',
    username: 'default',
    password: 'skyClickhouse2024',
})

async function injectWebVitalsData() {
    console.log(`开始向应用 ${APP_ID} 注入 Web Vitals 数据...`)

    const events = []
    const now = Date.now()
    const hoursToGenerate = 24
    const eventsPerHour = 20

    const metrics = [
        { name: 'LCP', min: 1000, max: 4000 },
        { name: 'FCP', min: 500, max: 2000 },
        { name: 'TTFB', min: 100, max: 800 },
        { name: 'INP', min: 50, max: 500 },
    ]

    for (let hour = 0; hour < hoursToGenerate; hour++) {
        for (let i = 0; i < eventsPerHour; i++) {
            const timestamp = new Date(now - hour * 3600000 - i * 180000)

            for (const metric of metrics) {
                const value = Math.random() * (metric.max - metric.min) + metric.min

                events.push({
                    id: crypto.randomUUID(),
                    app_id: APP_ID,
                    event_type: 'webVital',
                    event_name: metric.name,
                    event_data: '{}',
                    path: `/page-${Math.floor(Math.random() * 5) + 1}`,
                    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
                    timestamp: timestamp.toISOString().replace('T', ' ').substring(0, 19),
                    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),

                    session_id: `session-${hour}-${i}`,
                    session_event_count: i + 1,
                    session_duration: 0,
                    session_error_count: 0,
                    session_page_count: 1,

                    user_id: `user-${Math.floor(Math.random() * 100)}`,

                    browser_name: 'Chrome',
                    browser_version: '120.0.0',
                    os_name: 'macOS',
                    os_version: '14.0',
                    device_type: 'desktop',

                    country: 'CN',
                    region: 'Beijing',
                    city: 'Beijing',

                    perf_category: 'webvital',
                    perf_value: value,
                    perf_is_slow: 0,
                    perf_success: 1,
                    perf_metrics: '{}',

                    dedup_count: 1,
                    sampling_rate: 1.0,
                    sampling_sampled: 1,

                    release: 'v1.0.0',
                    replay_id: '',
                    event_level: '',
                    environment: 'production',

                    error_type: '',
                    error_message: '',
                    error_stack: '',
                    error_file: '',
                    error_line: 0,
                    error_column: 0,
                    error_fingerprint: '',

                    http_url: '',
                    http_method: '',
                    http_status: 0,
                    http_duration: 0,
                    http_size: 0,

                    resource_url: '',
                    resource_type: '',
                    resource_duration: 0,
                    resource_size: 0,
                    resource_status: 0,
                })
            }
        }
    }

    console.log(`生成了 ${events.length} 条 Web Vitals 事件`)

    await clickhouse.insert({
        table: 'monitor_events',
        values: events,
        format: 'JSONEachRow',
    })

    console.log('数据注入完成!')
    await clickhouse.close()
}

injectWebVitalsData().catch(console.error)
