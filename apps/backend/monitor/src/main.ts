import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as cookieParser from 'cookie-parser'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './fundamentals/common/filters/http-exception.filter'

// import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
// import { ValidationPipe } from './common/pipes/validation.pipe'

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule)

    // 确保上传目录存在
    const uploadsDir = join(__dirname, '..', 'uploads')
    const avatarsDir = join(uploadsDir, 'avatars')
    if (!existsSync(uploadsDir)) {
        mkdirSync(uploadsDir)
    }
    if (!existsSync(avatarsDir)) {
        mkdirSync(avatarsDir, { recursive: true })
    }

    // 配置静态文件服务
    app.useStaticAssets(uploadsDir, {
        prefix: '/uploads/',
    })

    // 使用 cookie-parser 中间件
    app.use(cookieParser())

    // 启用 CORS，允许发送 Cookie
    app.enableCors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true, // 允许发送 Cookie
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    })

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
        .setTitle('Sky-Monitor 监控平台数据服务 API 文档')
        .setDescription('Sky-Monitor 监控平台数据服务 API 文档')
        .setVersion('1.0')
        .addBearerAuth()
        .build()
    const document = SwaggerModule.createDocument(app, swaggerOptions)
    SwaggerModule.setup('doc', app, document)

    await app.listen(8081)
}
bootstrap()
