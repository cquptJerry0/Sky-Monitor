import { Controller, Get, Query } from '@nestjs/common'

import { VersionService } from './version.service'

@Controller()
export class VersionController {
    constructor(private readonly versionService: VersionService) {}

    @Get('version')
    getProfile() {
        return this.versionService.getVersion()
    }

    @Get('tracking')
    tracking(@Query() params: { event_type: string; message: string }) {
        return this.versionService.tracking(params)
    }

    @Get('span')
    span() {
        return this.versionService.span()
    }
}
