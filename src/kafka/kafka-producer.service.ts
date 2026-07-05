import { Kafka } from "kafkajs";
import { Injectable } from "@nestjs/common";
import config from "src/config/env.config";
import { logger } from "src/utils/logger";
const configVals = config();

const kafkaConfig = configVals.kafka;

@Injectable()
export class ProducerService {
    private readonly kafka = new Kafka({
        // clientId: kafkaConfig.client.clientId,
        brokers: [kafkaConfig.client.brokers],
        ssl: true,
        sasl: {
            username: kafkaConfig.sasl.username,
            password: kafkaConfig.sasl.password,
            mechanism: kafkaConfig.sasl.mechanism,
        },
        connectionTimeout: 10000,
    });
    private readonly producer = this.kafka.producer({ allowAutoTopicCreation: true });

    constructor() {
        try {
            this.producer.connect();
        } catch(err) {
            logger.error("Error inside ProducerService::new ", err);
        }
    }

    async produce(topic: string, value: any) {
        try {
            const message = {
                value: JSON.stringify(value),
            };
            const record = {
                topic: topic,
                messages: [message],
            };
            await this.producer.send(record);
        } catch (err) {
            logger.error("Error inside ProducerService::produce ", err);
            throw err;
        }
    }
}
