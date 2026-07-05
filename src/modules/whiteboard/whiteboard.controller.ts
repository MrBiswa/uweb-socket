import { InSession, Route } from "src/common/abstract/insession";
import { Injectable } from "@nestjs/common";
import { WhiteboardService } from "./whiteboard.service";
import { logger } from "src/utils/logger";
import { WhiteboardEnum } from "./whiteboard.enum";

@Injectable()
class WhiteboardController implements InSession {
    constructor(private whiteboardService: WhiteboardService) {}

    async route({ message, cb, socket }: Route) {
        switch (message.type as WhiteboardEnum) {
            case WhiteboardEnum.FETCH_EVENTS: {
                logger.log("WhiteboardController::route: FETCH_EVENTS", message);
                return this.whiteboardService.fetchWhiteboardEventsSocket(
                    socket,
                    message.scheduleId,
                    message.timestamp,
                    cb,
                );
            }

            default: {
                logger.error("WhiteboardController::route: Invalid message type", message.type);
                return cb({ status: "error", message: "Invalid message type" });
            }
        }
    }
}

export { WhiteboardController };
