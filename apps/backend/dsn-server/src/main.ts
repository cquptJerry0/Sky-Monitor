import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './fundamentals/common/filters/http-exception.filter'

// import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
// import { ValidationPipe } from './common/pipes/validation.pipe'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    // 全局使用中间件
    // app.use(logger)

    // 全局过滤器
    app.useGlobalFilters(new HttpExceptionFilter())

    // 全局管道
    // app.useGlobalPipes(new ValidationPipe());

    // 全局拦截器
    // app.useGlobalInterceptors(new LoggingInterceptor());

    app.setGlobalPrefix('api')

    // 设置swagger文档相关配置
    const swaggerOptions = new DocumentBuilder()
        .setTitle('Sky-Monitor 监控平台 SDK API 文档')
        .setDescription('Sky-Monitor 监控平台 SDK API 文档')
        .setVersion('1.0')
        .addBearerAuth()
        .build()
    const document = SwaggerModule.createDocument(app, swaggerOptions)
    SwaggerModule.setup('doc', app, document)

    await app.listen(8080)
}
bootstrap()
