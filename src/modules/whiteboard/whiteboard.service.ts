import { Injectable } from "@nestjs/common";
import { logger } from "src/utils/logger";
import { PWLiveClassService } from "src/common/internal/pw-live-class.service";
import type { Socket } from "@pw-tech/io-uwebsocket";
import { BatchesService } from "src/common/internal/batches.service";

@Injectable()
class WhiteboardService {
    constructor(
        private pwLiveClassService: PWLiveClassService,
        private batchService: BatchesService,
    ) {}
    async fetchWhiteboardEventsSocket(
        socket: Socket,
        scheduleId: string,
        {
            startTime,
            endTime,
            fromSlideChange = false,
        }: { startTime?: number; endTime: number; fromSlideChange?: boolean },
        cb?: (data: Record<string, any>) => void,
    ) {
        try {
            let parentScheduleId = socket.userData.get("parentScheduleId") as string;
            if (!parentScheduleId) {
                const scheduleDetails = await this.batchService.getScheduleDetailById(scheduleId);
                if (!scheduleDetails) {
                    logger.error("fetchWhiteboardEventsSocket: scheduleDetails not found", scheduleId);
                    return cb({ error: "Schedule not found" });
                }
                parentScheduleId = scheduleDetails.parentScheduleId ?? scheduleId;
                socket.userData.set("parentScheduleId", parentScheduleId);
                logger.log("fetchWhiteboardEventsSocket: parentScheduleId", parentScheduleId, scheduleId);
            }
            const data = await this.pwLiveClassService.fetchWhiteboardEvents(
                parentScheduleId,
                fromSlideChange,
                startTime,
                endTime,
            );
            logger.log("fetchWhiteboardEvents: ", data);
            cb({ data });
        } catch (err) {
            logger.log("fetchWhiteboardEvents error: ", err);
            cb({ error: err });
        }
    }
}

export { WhiteboardService };
