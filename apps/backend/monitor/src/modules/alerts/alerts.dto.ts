import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsEnum } from 'class-validator'

export class CreateAlertRuleDto {
    @ApiProperty({ description: '应用ID' })
    @IsString()
    app_id: string

    @ApiProperty({ description: '规则名称' })
    @IsString()
    name: string

    @ApiProperty({ description: '告警类型', enum: ['error_rate', 'slow_request', 'session_anomaly'] })
    @IsEnum(['error_rate', 'slow_request', 'session_anomaly'])
    type: 'error_rate' | 'slow_request' | 'session_anomaly'

    @ApiProperty({ description: '阈值' })
    @IsNumber()
    threshold: number

    @ApiProperty({ description: '时间窗口', example: '5m' })
    @IsString()
    window: string

    @ApiProperty({ description: '是否启用', required: false })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean

    @ApiProperty({ description: '通知渠道', required: false, type: [String] })
    @IsArray()
    @IsOptional()
    notification_channels?: string[]
}

export class UpdateAlertRuleDto {
    @ApiProperty({ description: '规则名称', required: false })
    @IsString()
    @IsOptional()
    name?: string

    @ApiProperty({ description: '阈值', required: false })
    @IsNumber()
    @IsOptional()
    threshold?: number

    @ApiProperty({ description: '时间窗口', required: false })
    @IsString()
    @IsOptional()
    window?: string

    @ApiProperty({ description: '是否启用', required: false })
    @IsBoolean()
    @IsOptional()
    enabled?: boolean

    @ApiProperty({ description: '通知渠道', required: false, type: [String] })
    @IsArray()
    @IsOptional()
    notification_channels?: string[]
}
