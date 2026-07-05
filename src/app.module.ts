import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import configuration from "src/config/env.config";
import { WebSocketsModule } from "./socket/socket.module";
import { WhiteboardModule } from "./modules/whiteboard/whiteboard.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            isGlobal: true,
            envFilePath: ".env",
        }),
        WebSocketsModule,
        WhiteboardModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
