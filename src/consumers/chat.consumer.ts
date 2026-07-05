import { ConsumerService } from "../kafka/kafka-consumer.service";
import { ConsumerSubscribeTopic, MessagePayload } from "../kafka/kafka.interface";
import { Server as UWebSockets } from "@pw-tech/io-uwebsocket";
import { OnModuleInit } from "@nestjs/common";
import { EmitContext } from "../utils/enums";
import { logger } from "../utils/logger";
import config from "src/config/env.config";
const configVals = config();
const kafkaConfig = configVals.kafka;

export class ChatConsumer implements OnModuleInit {
    private kafkaTopic: any;
    private kafkaGrp: any;
    private consumer: ConsumerService;
    private io: UWebSockets;

    constructor(io: UWebSockets) {
        this.kafkaTopic = kafkaConfig.consumer.topics.CHAT_TOPIC;
        this.kafkaGrp = kafkaConfig.consumer.groups.CHAT_GROUP;
        this.consumer = new ConsumerService();
        this.io = io;
    }

    onModuleInit() {
        if (this.kafkaTopic && this.kafkaGrp) {
            this.consume();
        } else {
            logger.log("Wrong topic and group in ChatConsumer: ", this.kafkaTopic, this.kafkaGrp);
        }
    }

    async consume() {
        try {
            const topic: ConsumerSubscribeTopic = {
                topic: this.kafkaTopic,
            };
            const runConfig = {
                eachMessage: async (event: MessagePayload) => {
                    // try {
                    await this.messageProcessor(event);
                    // } catch (error) {
                    //     logger.warn(`CHAT KAFKA ERROR:: topic: ${this.kafkaTopic}, event: ${JSON.stringify(event)}, error: ${error}`);
                    // }
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
            logger.log("Emitting chat kafka data: ", kafkaData);
            if (kafkaData) {
                const parsedData = JSON.parse(kafkaData);
                const { room } = parsedData;
                // delete parsedData?.room;
                this.io.in(room, EmitContext.CHAT, parsedData);
            }
        } catch (err) {
            logger.error("Error while processing ChatConsumer message: ", err);
        }
    }
}
