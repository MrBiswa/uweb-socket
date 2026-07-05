import { Injectable } from "@nestjs/common";
import { ProducerService } from "src/kafka/kafka-producer.service";
import type { Socket } from "@pw-tech/io-uwebsocket";
import config from "src/config/env.config";
import { logger } from "src/utils/logger";
const configVals = config();
const kafkaConfig = configVals.kafka;

@Injectable()
export class SessionHandler {
    producerService: ProducerService;

    constructor() {
        this.producerService = new ProducerService();
    }

    async handleConnection(socket: Socket) {
        try {
            const data = await this.connectionDataPayload(socket);
            this.producerService.produce(kafkaConfig.producer.topics.SOCKET_CONNECTION_TOPIC, {
                data: data,
                event: "CONNECTION",
            });
        } catch (err) {
            logger.log("Error inside SessionHandler::handleConnection ", err);
        }
    }

    async handleDisconnection(socket: Socket, message: { code: number; message: string }) {
        try {
            const data = await this.connectionDataPayload(socket);
            data["code"] = message.code;
            data["message"] = message.message;
            this.producerService.produce(kafkaConfig.producer.topics.SOCKET_CONNECTION_TOPIC, {
                data: data,
                event: "DISCONNECTION",
            });
        } catch (err) {
            logger.log("Error inside SessionHandler::handleDisconnection ", err);
        }
    }

    async connectionDataPayload(socket: Socket) {
        return {
            userId: socket.userData.get("userId"),
            context: socket.userData.get("roomContext"),
            scheduleId: socket.userData.get("scheduleId"),
            socketId: socket.id,
            ipAddress: socket.getRemoteAddress(),
            creationTime: Date.now(),
        };
    }
}
