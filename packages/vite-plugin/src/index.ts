import type { Plugin } from 'vite'
import type { IncomingMessage } from 'http'
import fs from 'fs'
import path from 'path'
import FormData from 'form-data'
import https from 'https'
import http from 'http'

export interface SkyMonitorPluginOptions {
    uploadUrl: string
    authToken: string
    release: string
    appId?: string
    urlPrefix?: string
    deleteAfterUpload?: boolean
}

export function skyMonitorPlugin(options: SkyMonitorPluginOptions): Plugin {
    const { uploadUrl, authToken, release, appId, urlPrefix = '~/', deleteAfterUpload = true } = options

    return {
        name: 'sky-monitor-sourcemap',
        apply: 'build',

        async closeBundle() {
            const distDir = path.resolve(process.cwd(), 'dist')

            if (!fs.existsSync(distDir)) {
                console.log('[Sky Monitor] No dist directory found, skipping source map upload')
                return
            }

            console.log(`[Sky Monitor] Uploading source maps for release: ${release}`)

            const mapFiles = findMapFiles(distDir)

            if (mapFiles.length === 0) {
                console.log('[Sky Monitor] No source map files found')
                return
            }

            for (const filePath of mapFiles) {
                try {
                    await uploadSourceMap(filePath, {
                        uploadUrl,
                        authToken,
                        release,
                        appId,
                        urlPrefix,
                    })

                    if (deleteAfterUpload) {
                        fs.unlinkSync(filePath)
                    }
                } catch (error) {
                    // Upload failed, but continue with other files
                }
            }
        },
    }
}

function findMapFiles(dir: string): string[] {
    const files: string[] = []

    function walk(currentDir: string) {
        const items = fs.readdirSync(currentDir)

        for (const item of items) {
            const fullPath = path.join(currentDir, item)
            const stat = fs.statSync(fullPath)

            if (stat.isDirectory()) {
                walk(fullPath)
            } else if (item.endsWith('.js.map')) {
                files.push(fullPath)
            }
        }
    }

    walk(dir)
    return files
}

async function uploadSourceMap(
    filePath: string,
    options: {
        uploadUrl: string
        authToken: string
        release: string
        appId?: string
        urlPrefix?: string
    }
): Promise<void> {
    return new Promise((resolve, reject) => {
        const fileName = path.basename(filePath)
        const fileContent = fs.readFileSync(filePath)

        const formData = new FormData()
        formData.append('file', fileContent, fileName)
        formData.append('release', options.release)
        if (options.appId) {
            formData.append('appId', options.appId)
        }
        if (options.urlPrefix) {
            formData.append('urlPrefix', options.urlPrefix)
        }

        const url = new URL(options.uploadUrl)
        const isHttps = url.protocol === 'https:'
        const httpModule = isHttps ? https : http

        const requestOptions: https.RequestOptions = {
            method: 'POST',
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname + url.search,
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${options.authToken}`,
            },
        }

        const req = httpModule.request(requestOptions, (res: IncomingMessage) => {
            let data = ''

            res.on('data', (chunk: Buffer) => {
                data += chunk.toString()
            })

            res.on('end', () => {
                if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`  Uploaded: ${fileName}`)
                    resolve()
                } else {
                    reject(new Error(`Upload failed with status ${res.statusCode}: ${data}`))
                }
            })
        })

        req.on('error', (error: Error) => {
            reject(error)
        })

        formData.pipe(req)
    })
}
