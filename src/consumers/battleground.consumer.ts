import { ConsumerService } from "../kafka/kafka-consumer.service";
import { ConsumerSubscribeTopic, MessagePayload } from "../kafka/kafka.interface";
import { Server } from "@pw-tech/io-uwebsocket";
import { logger } from "../utils/logger";
import { OnModuleInit } from "@nestjs/common";
import config from "src/config/env.config";
import { EmitContext } from "src/utils/enums";
const configVals = config();
const kafkaConfig = configVals.kafka;

// @Controller()
export class BattlegroundConsumer implements OnModuleInit {
    private kafkaTopic: string;
    private kafkaGrp: string;
    private consumer: ConsumerService;
    private io: Server;

    constructor(io: Server) {
        this.kafkaTopic = kafkaConfig.consumer.topics.BATTLEGROUND_TOPIC;
        this.kafkaGrp = kafkaConfig.consumer.groups.BATTLEGROUND_GROUP;
        this.consumer = new ConsumerService();
        this.io = io;
    }

    onModuleInit() {
        if (this.kafkaTopic && this.kafkaGrp) {
            this.consume();
        } else {
            logger.log("Wrong topic and group in BattlegroundConsumer: ", this.kafkaTopic, this.kafkaGrp);
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
                    } catch (err) {
                        logger.warn("battlegroundConsumer::eachMessage", err);
                    }
                },
            };
            await this.consumer.consume(topic, this.kafkaGrp, runConfig);
        } catch (err) {
            logger.error(`${this.kafkaTopic} topic event failed and going to retry.`, err);
        }
    }

    async messageProcessor(event: MessagePayload) {
        try {
            const { message } = event;
            const data = message?.value?.toString() || "";
            logger.log("Emitting battleground kafka data: ", data);
            if (data) {
                const parsedData = JSON.parse(data);
                const { room } = parsedData;
                delete parsedData?.room;
                this.io.in(room, EmitContext.BATTLEGROUND, parsedData);
            }
        } catch (err) {
            logger.error("Error while processing BattlegroundConsumer message: ", err);
        }
    }
}
