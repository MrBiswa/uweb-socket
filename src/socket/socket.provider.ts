import queryString from "node:querystring";
import { redisClient } from "../redis/redis";
import { getRoomNameFromContext, getRoomNameFromContextAndRole, getDishaSessionRoomName } from "../insession/namespace";
import { Server, createRedisAdapater, Socket } from "@pw-tech/io-uwebsocket";
import config from "src/config/env.config";
import { Injectable } from "@nestjs/common";
import { AuthInternalService } from "../common/internal/auth.service";
import { logger } from "../utils/logger";
import { ActiveInactiveStatusEnum, EmitContext, RoomContext, ScheduleStatusEnum } from "src/utils/enums";
import { SessionHandler } from "src/modules/session/session.handler";
import { DishaSessionController } from "src/modules/session/disha-session.controller";
import { WhiteboardController } from "src/modules/whiteboard/whiteboard.controller";
import { BatchesService } from "src/common/internal/batches.service";
import { ScheduleDetailType, StudentMappingType } from "src/common/interfaces/common.interface";
import { isJWTToken, MAXHUB_TEACHER_ID, MAXHUB_TEACHER_ID_STAGE, ROLE_ID_OF, UnleashFlags } from "src/utils/constants";
import { UnleashService } from "src/utils/unleash";
import { metrics } from "@opentelemetry/api";
import { ProducerService } from "../kafka/kafka-producer.service";
import { DishaProducerService } from "../kafka/disha-producer.service";

const configVals = config();

interface QueryParamsType {
    token: string;
    roomContext?: string;
    scheduleId?: string;
}

@Injectable()
class WebSocketsServer {
    static instance: WebSocketsServer;
    io: Server;
    private kafkaProducer: ProducerService;
    private dishaProducer: DishaProducerService;
    private dishaSessionSockets = new Map<string, { sessionId: string; userId: string }>(); // socketId -> session data

    constructor(
        private sessionHandler: SessionHandler,
        private whiteboardController: WhiteboardController,
        private dishaSessionController: DishaSessionController,
        private unleashService: UnleashService,
    ) {
        this.kafkaProducer = new ProducerService();
        this.dishaProducer = new DishaProducerService(this.kafkaProducer);
    }

    start(port: number) {
        if (WebSocketsServer.instance) {
            return WebSocketsServer.instance;
        }
        logger.log("WebSocketsServer::constructor");
        const pubClient = redisClient.pubClient;
        const subClient = redisClient.subClient;
        const redisAdapter = createRedisAdapater(pubClient, subClient, "central-socket-service");
        this.io = new Server({
            adapter: redisAdapter,
            compression: 0,
            maxPayloadLength: 1 * 1024 * 1024, // 1MB
            idleTimeout: 10,
            sendPingsAutomatically: true,
            path: "/central-socket/ws",
            healthCheckPath: "/central-socket/healthcheck",
            maxBackpressure: 1024 * 1024,
        });
        const wsPort = configVals.webServerPort;
        this.io.listen(port || wsPort);
        this.connectionAuthentication();
        logger.log("WebSocketsServer::constructor::listening on port", wsPort);
        this.addIOEventListeners();
        this.getConnectedUsersCount();
        WebSocketsServer.instance = this;
    }

    async connectionAuthentication() {
        this.io.use(async (req, res, next) => {
            const queryParams = queryString.decode(req.getQuery()) as unknown as QueryParamsType;
            const isAuthorised = await this.basicValidations(queryParams, req.getUrl());
            if (isAuthorised) {
                next();
                return;
            } else {
                next(new Error("Not authorised"));
                return;
            }
        });
    }

    async basicValidations(queryParams: QueryParamsType, url: string): Promise<boolean> {
        const { token, roomContext, scheduleId } = queryParams;

        if (!token) return false;

        const isJWT = isJWTToken(token);

        // Token Authorization
        let tokenVerifyResp;
        if (isJWT) {
            const headers = {
                authorization: `Bearer ${token}`,
                path: url,
            };
            tokenVerifyResp = await new AuthInternalService().socket(headers);
        } else {
            const authInternalCallBody = {
                accessToken: token,
                userFields: ["roles"],
            };
            const verifyNonJWTResp = await new AuthInternalService().verifyNonJWT(authInternalCallBody);
            if (verifyNonJWTResp?.isVerified) {
                tokenVerifyResp = {
                    userId: verifyNonJWTResp.userData?._id,
                    roles: verifyNonJWTResp.userData?.roles?.join(),
                };
            }
        }
        if (!tokenVerifyResp?.userId) return false;

        if (roomContext === RoomContext.POLL) {
            // schedule validations
            if (!scheduleId) return false;
            const scheduleDetail = await this.scheduleValidations(scheduleId, tokenVerifyResp.userId);
            if (!scheduleDetail) return false;

            // basic user check
            if (
                tokenVerifyResp?.roles?.includes(ROLE_ID_OF.TEACHER) ||
                tokenVerifyResp?.roles?.includes(ROLE_ID_OF.ADMIN) ||
                scheduleDetail.isFree
            ) {
                return true;
            }

            // basic user check
            if (scheduleDetail?.isClickerPollEnabled) {
                // skip user validation in case of clicker flow for classRoomX machine user.
                return true;
            }
            // batch access check for students
            const batchStudentParams = {
                batchId: scheduleDetail.batchId,
                userId: tokenVerifyResp.userId,
            };
            const batchStudentDetail: StudentMappingType = await new BatchesService().batchStudentDetail(
                batchStudentParams,
            );
            if (!batchStudentDetail || batchStudentDetail?.status !== ActiveInactiveStatusEnum.Active) {
                logger.warn(
                    `basicValidations:: No batch access found for scheduleId: ${scheduleId} and userId: ${tokenVerifyResp.userId}`,
                );
                const isBacFlagEnabled = await this.unleashService.isFeatureEnabled(UnleashFlags.bac);
                logger.log(`isBacFlagEnabled: ${isBacFlagEnabled} for scheduleId: ${scheduleId}`);
                if (isBacFlagEnabled) {
                    logger.warn(
                        `basicValidations_ERROR:: No batch access found for scheduleId: ${scheduleId} and userId: ${tokenVerifyResp.userId}`,
                    );
                    return false;
                }
            }
        }
        return true;
    }

    isTeacherCheck(scheduleDetail: ScheduleDetailType, userId: string) {
        if (scheduleDetail.teachers.includes(userId)) return true;

        if (scheduleDetail.secondaryTeachers.includes(userId)) return true;

        return false;
    }

    async scheduleValidations(scheduleId: string, userId?: string) {
        const scheduleDetail = await new BatchesService().getScheduleDetailById(scheduleId);
        if (!scheduleDetail) {
            logger.warn(`scheduleValidations:: Invalid ScheduleId! scheduleId: ${scheduleId} and userId: ${userId}`);
            return false;
        }

        if (scheduleDetail.status === ScheduleStatusEnum.COMPLETED) {
            logger.warn(
                `scheduleValidations:: Trying to join Completed Schedule! schedule: ${scheduleDetail._id} and userId: ${userId}`,
            );
            return false;
        }

        return scheduleDetail;
    }

    addIOEventListeners() {
        this.io.on("connection", (socket: Socket) => {
            this.setUserSocketData(socket);
            this.joinRoom(socket);

            socket.on(EmitContext.DISHA_SESSION, (data: Record<string, any>, cb: (data: Record<string, any>) => void) => {
                const { message, messageToSave } = this.updateMessageWithDetails(data, socket);
                this.dishaSessionController.route({
                    socket,
                    context: EmitContext.DISHA_SESSION,
                    message,
                    messageToSave,
                    io: this.io,
                    cb: cb,
                });
            });

            socket.on(EmitContext.WHITEBOARD, (data: Record<string, any>, cb: (data: Record<string, any>) => void) => {
                const { message, messageToSave } = this.updateMessageWithDetails(data, socket);
                this.whiteboardController.route({
                    socket,
                    context: EmitContext.WHITEBOARD,
                    message,
                    messageToSave,
                    io: this.io,
                    cb: cb,
                });
            });

            socket.on("disconnect", (code: number, message: string) => {
                logger.log("WebSocketsServer::addIOEventListeners::disconnect", socket.id, code, message);
                
                // Check if this was a DISHA session socket and send disconnection event
                const dishaSessionData = this.dishaSessionSockets.get(socket.id);
                if (dishaSessionData) {
                    this.dishaProducer.sendDisconnectionEvent(socket.id, dishaSessionData, code, message);
                    this.dishaSessionSockets.delete(socket.id);
                }
                
                this.sessionHandler.handleDisconnection(socket, { code, message });
            });

            socket.on("dropped", (message: string) => {
                logger.log("WebSocketsServer::addIOEventListeners::dropped", socket.id, message);
            });

            socket.send("connected", { id: socket.id });
            this.sessionHandler.handleConnection(socket);
        });
    }

    setUserSocketData(socket: Socket) {
        logger.log("WebSocketsServer::setUserSocketData", socket.id, socket.handshake.query);
        const context = socket.handshake.query.roomContext;
        switch (context) {
            case RoomContext.POLL:
                socket.userData.set("roomContext", RoomContext.POLL);
                socket.userData.set("scheduleId", socket.handshake.query.scheduleId as string);
                socket.userData.set("userId", socket.handshake.query.userId as string);
                socket.userData.set("batchId", socket.handshake.query.batchId as string);
                break;
            case RoomContext.BATTLEGROUND:
                socket.userData.set("roomContext", RoomContext.BATTLEGROUND);
                socket.userData.set("battlegroundId", socket.handshake.query.battlegroundId as string);
                socket.userData.set("testId", socket.handshake.query.testId as string);
                socket.userData.set("userId", socket.handshake.query.userId as string);
                break;
            case RoomContext.BATTLEGROUND_CHAT:
                socket.userData.set("roomContext", RoomContext.BATTLEGROUND_CHAT);
                socket.userData.set("conversationId", socket.handshake.query.conversationId as string);
                socket.userData.set("testId", socket.handshake.query.testId as string);
                socket.userData.set("userId", socket.handshake.query.userId as string);
                break;
            case RoomContext.AI_GURU_CHAT:
                socket.userData.set("roomContext", RoomContext.AI_GURU_CHAT);
                socket.userData.set("conversationId", socket.handshake.query.conversationId as string);
                socket.userData.set("testId", socket.handshake.query.testId as string);
                socket.userData.set("userId", socket.handshake.query.userId as string);
                break;
            case RoomContext.DISHA_SESSION:
                socket.userData.set("roomContext", RoomContext.DISHA_SESSION);
                socket.userData.set("sessionId", socket.handshake.query.sessionId as string);
                socket.userData.set("userId", socket.handshake.query.userId as string);
                break;
            default:
                logger.error("setUserSocketData::context not found", context);
                break;
        }
        logger.log("setUserSocketData::userData", socket.userData, socket.id);
    }

    joinRoom(socket: Socket) {
        const context = socket.userData.get("roomContext");
        switch (context) {
            case RoomContext.POLL:
                this.joinPollRoom(socket);
                this.joinScheduleRoom(socket);
                this.joinBatchRoom(socket);
                this.joinPollTeacherRoom(socket);
                this.joinScheduleUserRoom(socket);
                break;
            case RoomContext.PREMIUM_COHORT:
                break;
            case RoomContext.BATTLEGROUND:
                this.joinBattlegroundRoom(socket);
                break;
            case RoomContext.BATTLEGROUND_CHAT:
                this.joinBattlegroundChatRoom(socket);
                break;
            case RoomContext.AI_GURU_CHAT:
                this.joinAIGuruChatRoom(socket);
                break;
            case RoomContext.DISHA_SESSION:
                this.joinDishaSessionRoom(socket);
                break;
            default:
                logger.error("joinRoom::context not found", context);
                break;
        }
    }
    joinPollTeacherRoom(socket: Socket) {
        const scheduleId = socket.userData.get("scheduleId") as string;
        if (
            socket.userData.get("userId") === MAXHUB_TEACHER_ID ||
            socket.userData.get("userId") === MAXHUB_TEACHER_ID_STAGE
        ) {
            const pathshalaRoleBasedRoom = getRoomNameFromContextAndRole(RoomContext.POLL, "teacher", scheduleId);
            socket.join(pathshalaRoleBasedRoom);
        }
    }

    joinPollRoom(socket: Socket) {
        const scheduleId = socket.userData.get("scheduleId") as string;
        const pollRoom = getRoomNameFromContext(RoomContext.POLL, scheduleId);
        socket.join(pollRoom);
    }

    joinScheduleRoom(socket: Socket) {
        const scheduleId = socket.userData.get("scheduleId") as string;
        const scheduleRoom = getRoomNameFromContext(RoomContext.SCHEDULE, scheduleId);
        socket.join(scheduleRoom);
    }

    joinBatchRoom(socket: Socket) {
        const batchId = socket.userData.get("batchId") as string;
        const batchRoom = getRoomNameFromContext(RoomContext.BATCH, batchId);
        socket.join(batchRoom);
    }

    joinScheduleUserRoom(socket: Socket) {
        const userId = socket.userData.get("userId") as string;
        const scheduleId = socket.userData.get("scheduleId") as string;
        const scheduleRoom = getRoomNameFromContext(RoomContext.POLL, `${userId}_${scheduleId}`);
        socket.join(scheduleRoom);
    }

    joinBattlegroundRoom(socket: Socket) {
        logger.log("WebSocketsServer::joinBattlegroundRoom", socket.id, socket.userData);
        const battlegroundId = socket.userData.get("battlegroundId") as string;
        const battlegroundRoom = getRoomNameFromContext(RoomContext.BATTLEGROUND, battlegroundId);
        socket.join(battlegroundRoom);
    }

    joinBattlegroundChatRoom(socket: Socket) {
        logger.log("WebSocketsServer::joinBattlegroundChatRoom", socket.id, socket.userData);
        const conversationId = socket.userData.get("conversationId") as string;
        const battlegroundChatRoom = getRoomNameFromContext(RoomContext.BATTLEGROUND_CHAT, conversationId);
        socket.join(battlegroundChatRoom);
    }

    joinAIGuruChatRoom(socket: Socket) {
        logger.log("WebSocketsServer::joinAIGuruChatRoom", socket.id, socket.userData);
        const conversationId = socket.userData.get("conversationId") as string;
        const aiGuruChatRoom = getRoomNameFromContext(RoomContext.AI_GURU_CHAT, conversationId);
        socket.join(aiGuruChatRoom);
    }
    joinDishaSessionRoom(socket: Socket) {
        logger.log("WebSocketsServer::joinDishaSessionRoom", socket.id, socket.userData);
        const sessionId = socket.userData.get("sessionId") as string;
        const userId = socket.userData.get("userId") as string;
        const dishaSessionRoom = getDishaSessionRoomName(sessionId);
        socket.join(dishaSessionRoom);
        
        // Track this socket for DISHA session and send auto-connection event
        if (sessionId && userId) {
            this.dishaSessionSockets.set(socket.id, { sessionId, userId });
                            this.dishaProducer.sendConnectionEvent(socket.id, sessionId, userId);
        }
    }

    private updateMessageWithDetails(data: Record<string, any>, socket: Socket) {
        const message = { ...data };
        const scheduleId = socket.userData.get("scheduleId");
        const userId = socket.userData.get("userId");
        message.userId = userId;
        message.scheduleId = scheduleId ?? data.scheduleId; // todo: remove this
        message.socketId = socket.id;
        return {
            message: message,
            messageToSave: { ...message },
        };
    }

    private getConnectedUsersCount() {
        const meter = metrics.getMeter("central-socket-websocket-metrics");

        const activeConnectionsMetric = meter.createObservableGauge("active_socket_connections", {
            description: "Number of active WebSocket connections",
        });

        activeConnectionsMetric.addCallback((observableResult) => {
            const connectedUsers = this.io.getConnectedSocketCount();
            logger.log("socket::getConnectedUsersCount", connectedUsers);
            observableResult.observe(connectedUsers);
        });
    }

    close() {
        logger.log("WebSocketsServer::close");
        this.io.close();
    }
}

export { WebSocketsServer };
