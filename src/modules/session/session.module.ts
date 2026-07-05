import { Module } from "@nestjs/common";
import { KafkaModule } from "src/kafka/kafka.module";
import { SessionHandler } from "./session.handler";
import { DishaSessionController } from "./disha-session.controller";
import { UnleashService } from "src/utils/unleash";

@Module({
    imports: [KafkaModule],
    providers: [SessionHandler, DishaSessionController, UnleashService],
    exports: [SessionHandler, DishaSessionController, UnleashService],
})
export class SessionModule {}
