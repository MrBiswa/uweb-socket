import { OnModuleInit } from "@nestjs/common";
import { UWebSockets } from "@pw-tech/io-uwebsocket/dist/uwebsocket/uwebsocket";
import { ConsumerService } from "src/kafka/kafka-consumer.service";
import { MessagePayload, ConsumerSubscribeTopic } from "src/kafka/kafka.interface";
import { EmitContext } from "src/utils/enums";
import { logger } from "src/utils/logger";
import config from "src/config/env.config";
const configVals = config();
const kafkaConfig = configVals.kafka;

export class NotificationConsumer implements OnModuleInit {
    private kafkaTopic: any;
    private kafkaGrp: any;
    private consumer: ConsumerService;
    private io: UWebSockets;

    constructor(io: UWebSockets) {
        this.kafkaTopic = kafkaConfig.consumer.topics.NOTIFICATION_TOPIC;
        this.kafkaGrp = kafkaConfig.consumer.groups.NOTIFICATION_GROUP;
        this.consumer = new ConsumerService();
        this.io = io;
    }

    onModuleInit() {
        if (this.kafkaTopic && this.kafkaGrp) {
            this.consume();
        } else {
            logger.log("Wrong topic and group in DishaSessionConsumer: ", this.kafkaTopic, this.kafkaGrp);
        }
    }

    async consume() {
        try {
            const topic: ConsumerSubscribeTopic = {
                topic: this.kafkaTopic,
            };
            const runConfig = {
                eachMessage: async (event: MessagePayload) => {
                    try {
                        await this.messageProcessor(event);
                    } catch (error) {
                        logger.warn(`NOTIFICATION KAFKA ERROR:: topic: ${this.kafkaTopic}, event: ${JSON.stringify(event)}, error: ${error}`);
                    }
                },
            };
            await this.consumer.consume(topic, this.kafkaGrp, runConfig);
        } catch (err) {
            logger.error(`${this.kafkaTopic} topic event failed and going to retry.`);
        }
    }

    async messageProcessor(event: MessagePayload) {
        try {
            const { message } = event;
            const kafkaData = message?.value?.toString() || "";
            logger.log("Emitting disha session kafka data: ", kafkaData);
            if (kafkaData) {
                const parsedData = JSON.parse(kafkaData);
                const { room } = parsedData;
                
                if (room) {
                    this.io.in(room, EmitContext.NOTIFICATION, parsedData);
                }
            }
        } catch (err) {
            logger.error("Error while processing NotificationConsumer message: ", err);
        }
    }
}