import { BadRequestException, PipeTransform } from '@nestjs/common'
import { ZodError, ZodSchema } from 'zod'

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) {}

    transform(value: unknown /* , metadata: ArgumentMetadata */) {
        try {
            const parsedValue = this.schema.parse(value)
            return parsedValue
        } catch (error) {
            if (error instanceof ZodError) {
                const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
                throw new BadRequestException(`验证失败: ${errorMessages}`)
            }
            throw new BadRequestException('Validation failed')
        }
    }
}
