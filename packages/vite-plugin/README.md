# @sky-monitor/vite-plugin

Vite plugin for automatically uploading source maps to Sky Monitor.

## Installation

```bash
pnpm add -D @sky-monitor/vite-plugin
```

## Usage

```typescript
import { defineConfig } from 'vite'
import { skyMonitorPlugin } from '@sky-monitor/vite-plugin'

export default defineConfig({
    build: {
        sourcemap: 'hidden',
    },
    define: {
        __RELEASE__: JSON.stringify(process.env.RELEASE_VERSION || 'dev'),
    },
    plugins: [
        skyMonitorPlugin({
            uploadUrl: 'http://localhost:8080/api/sourcemaps/upload',
            authToken: process.env.SKY_MONITOR_TOKEN,
            release: process.env.RELEASE_VERSION || 'dev',
            appId: 'your-app-id',
            urlPrefix: '~/assets/',
            deleteAfterUpload: true,
        }),
    ],
})
```

## Frontend SDK Usage

```javascript
import { init, Errors } from '@sky-monitor/monitor-sdk-browser'

init({
    dsn: 'http://localhost:8080/api/monitoring/your-app-id',
    release: __RELEASE__, // Injected by Vite
    integrations: [new Errors()],
})
```

## Options

-   `uploadUrl` (required) - Source map upload endpoint
-   `authToken` (required) - Authentication token
-   `release` (required) - Release version
-   `appId` (optional) - Application ID
-   `urlPrefix` (optional) - URL prefix for source files (default: '~/')
-   `deleteAfterUpload` (optional) - Delete map files after upload (default: true)

## Build

```bash
RELEASE_VERSION=v1.0.0 pnpm build
```

The plugin will automatically:

1. Generate source maps during build
2. Upload them to the Sky Monitor server
3. Delete local map files (if enabled)
