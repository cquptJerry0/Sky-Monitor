import { Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { SourceMapService } from './sourcemap.service'

@ApiTags('SourceMaps')
@Controller('sourcemaps')
export class SourceMapController {
    constructor(private readonly sourcemapService: SourceMapService) {}

    @Post('upload')
    @ApiOperation({ summary: 'Upload source map file' })
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @Body('release') release: string,
        @Body('appId') appId: string,
        @Body('urlPrefix') urlPrefix?: string
    ) {
        if (!file) {
            return { success: false, message: 'No file provided' }
        }

        if (!release) {
            return { success: false, message: 'Release is required' }
        }

        if (!appId) {
            return { success: false, message: 'AppId is required' }
        }

        await this.sourcemapService.save({
            appId,
            release,
            fileName: file.originalname,
            content: file.buffer.toString('utf-8'),
            urlPrefix,
        })

        return { success: true, message: 'Source map uploaded successfully' }
    }
}
