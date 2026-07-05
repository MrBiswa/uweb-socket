process.env.APP_HOME = process.cwd();
console.log(process.env.APP_HOME);
import "src/common/apm/apm";
import { NestFactory } from "@nestjs/core";
import { HyperExpressAdapter, NestHyperExpressApplication } from "@pw-tech/platform-hyper-express";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { WebSocketsModule } from "./socket/socket.module";
import { WebSocketsServer } from "./socket/socket.provider";
import { logger } from "./utils/logger";
import { ValidationPipe } from "@nestjs/common";
import { PollConsumer } from "./consumers/poll.consumer";
import { BattlegroundConsumer } from "./consumers/battleground.consumer";
import { BatchConsumer } from "./consumers/batch.consumer";
import { ScheduleConsumer } from "./consumers/schedule.consumer";
import { ChatConsumer } from "./consumers/chat.consumer";
import { EmojiConsumer } from "./consumers/emoji.consumer";
import { AIGuruChatConsumer } from "./consumers/ai-guru-chat.consumer";
import { DoubtSolutionConsumer } from "./consumers/doubt-solution.consumer";
import { DishaSessionConsumer } from "./consumers/disha-session.consumer";

async function bootstrap() {
    const app = await NestFactory.create<NestHyperExpressApplication>(
        AppModule,
        new HyperExpressAdapter({ max_body_length: 5 * 1024 * 1024 }),
        { bufferLogs: true },
    );
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            validateCustomDecorators: true,
        }),
    );
    app.setGlobalPrefix("uwebsocket-service");
    const port = app.get<ConfigService>(ConfigService).get("httpServer.port") || 8081;
    const wsPort = app.get<ConfigService>(ConfigService).get("webServerPort") || 8080;
    await app.listen(port, "0.0.0.0");
    const socketServer = app.select(WebSocketsModule).get(WebSocketsServer);
    socketServer.start(wsPort);

    const pollConsumer = new PollConsumer(socketServer.io);
    pollConsumer.consume();

    const scheduleConsumer = new ScheduleConsumer(socketServer.io);
    scheduleConsumer.consume();

    const batchConsumer = new BatchConsumer(socketServer.io);
    batchConsumer.consume();

    const chatConsumer = new ChatConsumer(socketServer.io);
    chatConsumer.consume();

    const doubtConsumer = new DoubtSolutionConsumer(socketServer.io);
    doubtConsumer.consume();

    const emojiConsumer = new EmojiConsumer(socketServer.io);
    emojiConsumer.consume();

    const battlegroundConsumer = new BattlegroundConsumer(socketServer.io);
    battlegroundConsumer.consume();

    const aiGuruChatConsumer = new AIGuruChatConsumer(socketServer.io);
    aiGuruChatConsumer.consume();

    const dishaSessionConsumer = new DishaSessionConsumer(socketServer.io);
    dishaSessionConsumer.consume();

    // const { BattlegroundChatConsumer } = await import("./consumers/battleground-chat.consumer");
    // const battlegroundChatConsumer = new BattlegroundChatConsumer(socketServer.io);
    // battlegroundChatConsumer.consume();

    process.on("unhandledRejection", (reason, p) => {
        logger.error("urgent: Unhandled Rejection at: Promise ", p, " reason: ", reason);
    });

    process.on("uncaughtException", (err) => {
        logger.error("urgent: Uncaught Exception ====>> ", err);
    });
    const errorTypes = [`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`];
    errorTypes.forEach((type) => {
        process.on(type, async (error) => {
            try {
                logger.error(`process.on ${type} error:`, error);
                await app.close();
                socketServer.close();
                logger.log("Nest application closed.");
                process.exit(0);
            } catch (err) {
                process.exit(1);
            }
        });
    });
}

bootstrap();
