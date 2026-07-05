import { Kafka, Consumer } from "kafkajs";
import config from "src/config/env.config";
const configVals = config();

import { ConsumerSubscribeTopic } from "./kafka.interface";
import { Injectable } from "@nestjs/common";
import { logger } from "src/utils/logger";
const kafkaConfig = configVals.kafka;

@Injectable()
export class ConsumerService {
    private readonly kafka = new Kafka({
        clientId: kafkaConfig.client.clientId,
        brokers: [kafkaConfig.client.brokers],
        ssl: true,
        sasl: {
            username: kafkaConfig.sasl.username,
            password: kafkaConfig.sasl.password,
            mechanism: kafkaConfig.sasl.mechanism,
        },
        connectionTimeout: 10000,
        requestTimeout: 35000,
        reauthenticationThreshold: 20000,
    });

    private readonly consumers: Array<Consumer> = [];

    async consume(topic: ConsumerSubscribeTopic, groupId: string, config: object) {
        try {
            const consumer = this.kafka.consumer({
                groupId: groupId,
                readUncommitted: true,
                allowAutoTopicCreation: true,
            });
            await consumer.connect();
            await consumer.subscribe(topic);
            await consumer.run(config);
            this.consumers.push(consumer);
        } catch (err) {
            logger.error("Error inside ConsumerService::consume ", err);
            throw err;
        }
    }
}
