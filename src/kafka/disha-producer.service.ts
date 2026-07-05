import { Injectable } from "@nestjs/common";
import { ProducerService } from "./kafka-producer.service";
import config from "src/config/env.config";
import { logger } from "src/utils/logger";
import { DishaUserRole, DishaConnectionType, DishaEventType } from "src/utils/enums";

const configVals = config();

export interface SocketToDishEventPayload {
  type: string; // Made flexible to support any event type
  sessionId: string;
  userId: string;
  role?: DishaUserRole;
  extraMinutes?: number;
  // Additional fields for connection events
  socketId?: string;
  connectionType?: DishaConnectionType;
  disconnectionReason?: string;
  disconnectionCode?: number;
  // Allow any additional fields that events might send
  [key: string]: any;
}

@Injectable()
export class DishaProducerService {
    constructor(private readonly producerService: ProducerService) {}

    async sendSocketEventToDisha(payload: SocketToDishEventPayload): Promise<void> {
        try {
            const topic = configVals.kafka.producer.topics.SOCKET_TO_DISHA_TOPIC;            
            logger.log(`🚀 DISHA PRODUCER: Sending to topic "${topic}": ${JSON.stringify(payload)}`);
            await this.producerService.produce(topic, payload);
            logger.log(`✅ DISHA PRODUCER: Sent socket event to disha: ${payload.type} for session ${payload.sessionId}`);
        } catch (error) {
            logger.error('❌ DISHA PRODUCER: Failed to send event to disha backend:', error);
            throw error;
        }
    }

    /**
     * Send DISHA session connection event to backend
     */
    async sendConnectionEvent(socketId: string, sessionId: string, userId: string): Promise<void> {
        try {
            // Send user_connected event for auto-join functionality
            // The backend will determine the actual role (user vs mentor) based on session data
            const event = {
                type: DishaEventType.USER_CONNECTED,
                sessionId,
                userId,
                socketId,
                connectionType: DishaConnectionType.INITIAL,
                createdAt: new Date().toISOString(),
            };
            
            logger.log(`🔥 SENDING KAFKA EVENT: ${JSON.stringify(event)}`);
            
            await this.sendSocketEventToDisha(event);
            
            logger.log(`✅ DISHA connection event sent successfully for user ${userId} in session ${sessionId} (socket: ${socketId})`);
        } catch (error) {
            logger.error("Failed to send DISHA connection event:", error);
            throw error;
        }
    }

    /**
     * Send DISHA session disconnection event to backend
     */
    async sendDisconnectionEvent(
        socketId: string, 
        sessionData: { sessionId: string; userId: string }, 
        code: number, 
        message: string
    ): Promise<void> {
        try {
            // Send user_disconnected event using the typed method
            await this.sendSocketEventToDisha({
                type: DishaEventType.USER_DISCONNECTED,
                sessionId: sessionData.sessionId,
                userId: sessionData.userId,
                socketId,
                disconnectionReason: message,
                disconnectionCode: code,
                createdAt: new Date().toISOString(),
            });
            
            logger.log(
                `DISHA disconnection event sent for user ${sessionData.userId} in session ${sessionData.sessionId} (socket: ${socketId}, reason: ${message})`
            );
        } catch (error) {
            logger.error("Failed to send DISHA disconnection event:", error);
            throw error;
        }
    }
} 