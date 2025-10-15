// kafka-consumer.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Client, ClientKafka, Transport } from '@nestjs/microservices'

@Injectable()
export class KafkaConsumerService implements OnModuleInit {
    constructor() {}

    async onModuleInit() {
        this.kafkaClient.subscribeToResponseOf('tracking')
        this.kafkaClient.bindTopics()
    }

    @Client({
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: 'sky-monitor',
                brokers: ['localhost:9092'],
            },
            consumer: {
                groupId: 'sky-consumer',
            },
        },
    })
    private kafkaClient: ClientKafka

    async consumeMessages() {
        await this.kafkaClient.connect()
        this.kafkaClient.send('tracking', {}).subscribe({
            next: async message => {
                const payload = message.value // 获取 Kafka 消息的内容
                // 这里可以调用将消息写入 ClickHouse 的逻辑
                await this.writeToClickHouse(payload)
            },
            error: err => {
                Logger.error('Error while consuming message', err)
            },
        })
    }

    async writeToClickHouse(payload: any) {
        Logger.log('Writing to ClickHouse', JSON.stringify(payload))
        // 这里将数据写入到 ClickHouse
    }
}
