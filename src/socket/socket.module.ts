import { Module } from "@nestjs/common";
import { KafkaModule } from "src/kafka/kafka.module";
import { SessionModule } from "src/modules/session/session.module";
import { SessionHandler } from "src/modules/session/session.handler";
import { DishaSessionController } from "src/modules/session/disha-session.controller";
import { WebSocketsServer } from "./socket.provider";
import { WhiteboardController } from "src/modules/whiteboard/whiteboard.controller";
import { WhiteboardModule } from "src/modules/whiteboard/whiteboard.module";
import { UnleashService } from "src/utils/unleash";

const providers = [
    {
        provide: WebSocketsServer,
        useFactory: (sessionHandler: SessionHandler, whiteboardController: WhiteboardController, dishaSessionController: DishaSessionController, unleashService: UnleashService) => {
            return new WebSocketsServer(sessionHandler, whiteboardController, dishaSessionController, unleashService);
        },
        inject: [SessionHandler, WhiteboardController, DishaSessionController, UnleashService],
    },
];

@Module({
    imports: [KafkaModule, SessionModule, WhiteboardModule],
    providers,
    exports: providers,
})
export class WebSocketsModule {}
