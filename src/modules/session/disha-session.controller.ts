import { InSession, Route } from "src/common/abstract/insession";
import { Injectable } from "@nestjs/common";
import { logger } from "src/utils/logger";
import { DishaProducerService } from "src/kafka/disha-producer.service";

@Injectable()
class DishaSessionController implements InSession {
    constructor(private dishaProducer: DishaProducerService) {}

    async route({ message, socket, cb }: Route) {
        try {
            const sessionId = socket.userData.get("sessionId") as string;
            const userId = socket.userData.get("userId") as string;
            
            // Basic validation
            if (!sessionId || !userId) {
                const error = { 
                    message: `Missing session or user context for ${message.type}`,
                    event: message.type
                };
                logger.error("DishaSessionController::route: Validation failed", error);
                if (cb) cb({ status: "error", ...error });
                socket.send('error', error);
                return;
            }

            // Prepare event payload for Kafka
            const eventPayload = {
                type: message.type,
                sessionId: message.sessionId || sessionId,
                userId: userId,
                ...message // Include any additional data from the event
            };

            // Send to Kafka topic for disha backend to consume
            await this.dishaProducer.sendSocketEventToDisha(eventPayload);
            
            // Send acknowledgment back to client
            const acknowledgment = { 
                sessionId: eventPayload.sessionId,
                status: "success"
            };
            
            if (cb) cb(acknowledgment);
            
            logger.log(`DishaSessionController::route: Forwarded ${message.type} event to disha backend for session ${eventPayload.sessionId}`);
            
        } catch (error) {
            const errorResponse = {
                message: `Failed to process ${message.type}`,
                event: message.type,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            
            logger.error(`DishaSessionController::route: Error processing ${message.type}:`, error);
            
            if (cb) cb({ status: "error", ...errorResponse });
            socket.send('error', errorResponse);
        }
    }
}

export { DishaSessionController }; 