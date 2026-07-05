import { Module } from "@nestjs/common";
import { WhiteboardController } from "./whiteboard.controller";
import { WhiteboardService } from "./whiteboard.service";
import { PWLiveClassService } from "src/common/internal/pw-live-class.service";
import { BatchesService } from "src/common/internal/batches.service";

@Module({
    imports: [],
    controllers: [],
    providers: [WhiteboardService, WhiteboardController, PWLiveClassService, BatchesService],
    exports: [WhiteboardService, WhiteboardController],
})
export class WhiteboardModule {}
