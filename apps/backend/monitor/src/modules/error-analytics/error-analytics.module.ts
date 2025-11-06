import { Module } from '@nestjs/common'
import { ClickhouseModule } from '../../fundamentals/clickhouse/clickhouse.module'
import { ApplicationModule } from '../application/application.module'
import { ErrorAnalyticsController } from './error-analytics.controller'
import { ErrorAnalyticsStreamController } from './error-analytics-stream.controller'
import { ErrorAggregationService } from './services/error-aggregation.service'
import { ErrorSimilarityService } from './services/error-similarity.service'
import { ErrorTrendsService } from './services/error-trends.service'

@Module({
    imports: [ClickhouseModule, ApplicationModule],
    controllers: [ErrorAnalyticsController, ErrorAnalyticsStreamController],
    providers: [ErrorAggregationService, ErrorTrendsService, ErrorSimilarityService],
    exports: [ErrorAggregationService, ErrorTrendsService, ErrorSimilarityService],
})
export class ErrorAnalyticsModule {}
