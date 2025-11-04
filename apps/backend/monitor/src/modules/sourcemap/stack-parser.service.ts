import { Injectable, Logger } from '@nestjs/common'
import { SourceMapConsumer } from 'source-map'

import { SourceMapService } from './sourcemap.service'

interface StackFrame {
    function?: string
    file: string
    line: number
    column: number
}

@Injectable()
export class StackParserService {
    private readonly logger = new Logger(StackParserService.name)

    constructor(private readonly sourcemapService: SourceMapService) {}

    async parseStack(stack: string, release: string, appId: string): Promise<string> {
        try {
            const frames = this.extractFrames(stack)
            const parsedFrames: string[] = []

            for (const frame of frames) {
                const parsedFrame = await this.parseFrame(frame, release, appId)
                parsedFrames.push(parsedFrame)
            }

            return parsedFrames.join('\n')
        } catch (error) {
            this.logger.error(`Failed to parse stack: ${error.message}`, error.stack)
            return stack
        }
    }

    private extractFrames(stack: string): StackFrame[] {
        const frames: StackFrame[] = []
        const lines = stack.split('\n')

        const regex = /at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/
        const simpleRegex = /at\s+(.+?):(\d+):(\d+)/

        for (const line of lines) {
            let match = line.match(regex)
            if (match) {
                frames.push({
                    function: match[1],
                    file: match[2],
                    line: parseInt(match[3]),
                    column: parseInt(match[4]),
                })
            } else {
                match = line.match(simpleRegex)
                if (match) {
                    frames.push({
                        file: match[1],
                        line: parseInt(match[2]),
                        column: parseInt(match[3]),
                    })
                }
            }
        }

        return frames
    }

    private async parseFrame(frame: StackFrame, release: string, appId: string): Promise<string> {
        try {
            const fileName = this.extractFileName(frame.file)
            const mapFileName = fileName + '.map'

            const mapEntity = await this.sourcemapService.getByReleaseAndFile(release, mapFileName)

            if (!mapEntity) {
                return this.formatFrame(frame)
            }

            const consumer = await new SourceMapConsumer(JSON.parse(mapEntity.content))

            const original = consumer.originalPositionFor({
                line: frame.line,
                column: frame.column,
            })

            consumer.destroy()

            if (original.source && original.line !== null && original.column !== null) {
                return `  at ${frame.function || '<anonymous>'} (${original.source}:${original.line}:${original.column})`
            }

            return this.formatFrame(frame)
        } catch (error) {
            this.logger.error(`Failed to parse frame: ${error.message}`)
            return this.formatFrame(frame)
        }
    }

    private extractFileName(filePath: string): string {
        const parts = filePath.split('/')
        return parts[parts.length - 1]
    }

    private formatFrame(frame: StackFrame): string {
        if (frame.function) {
            return `  at ${frame.function} (${frame.file}:${frame.line}:${frame.column})`
        }
        return `  at ${frame.file}:${frame.line}:${frame.column}`
    }
}
