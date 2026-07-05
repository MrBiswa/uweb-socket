import { KafkaSaslOptions } from "../utils/enums";

export default () => {
    if (process.env.NODE_ENV == "local")
        return {
            mode: process.env.NODE_ENV || "development",
            authBaseUrl: process.env.AUTH_BASE_URL || "https://stage-auth.penpencil.co/",
            authKongPluginApiBaseUrl: process.env.AUTH_KONG_PLUGIN_API_BASE_URL || "https://stage-auth-uwebsocket.penpencil.co/",
            batchesServiceBaseUrl: process.env.BATCHES_BASE_URL || "https://batch-service-stage.penpencil.co",
            pwLiveClassBaseUrl: process.env.PW_LIVE_CLASS_BASE_URL || "http://localhost:8081/pw-live-class/",
            monolithBaseUrl: process.env.PP_BE_BASE_URL || "http://stage-api.penpencil.co/v1/internal/",
            node_env: process.env.NODE_ENV ? process.env.NODE_ENV : "development",
            serverUrl: "live.penpencil.co",
            webServerPort: parseInt(process.env.WS_PORT || "8080"),
            httpServer: {
                uwebsocketOpts: {
                    max_body_length: 5 * 1000 * 1000, // 5MB
                    auto_close: true,
                },
                port: parseInt(process.env.SERVER_PORT || "8081"),
            },
            socialLoginPortals: {
                admin: {
                    url: "admin-v2-stage.penpencil.co",
                    role: "5b27bd915842f950a778c6eb",
                },
                admin_v1: {
                    url: "admin-staging.penpencil.xyz",
                    role: "5b27bd915842f950a778c6eb",
                },
                adminPreProd: {
                    url: "pre-prod-penpencil-admin-v2.pw.live",
                    role: "5b27bd915842f950a778c6eb",
                },
            },
            redisNodes: (
                process.env.REDIS_NODES || "k8s-development-redis-cluster.5wulab.clustercfg.aps1.cache.amazonaws.com"
            ).split(","),
            redisHost: process.env.REDIS_URL || "localhost",
            redisPort: 6379,
            kafka: {
                sasl: {
                    username: process.env.KAFKA_USERNAME || "T4KUSC4UROKOFCES",
                    password:
                        process.env.KAFKA_PASSWORD ||
                        "591Xcnsr96xMoYDtJVnz+3yw4gqCWtf5IJwvibzMpz2hAg1SRASLTSR/+QmTXTbc",
                    mechanism: KafkaSaslOptions.PLAIN,
                },
                client: {
                    brokers: process.env.KAFKA_BROKER || "pkc-l7pr2.ap-south-1.aws.confluent.cloud:9092",
                    clientId: process.env.KAFKA_CLIENT_ID || "central-socket-service-client-local",
                },
                consumer: {
                    topics: {
                        POLL_TOPIC: "poll-uwebsocket",
                        CHAT_TOPIC: "chat-uwebsocket",
                        AI_GURU_SUGGESTIVE_QUESTION_TOPIC: "ai-guru-chat",
                        BATTLEGROUND_TOPIC: "battleground",
                        BATTLEGROUND_CHAT_TOPIC: "battleground-chat",
                        SCHEDULE_TOPIC: "schedule-uwebsocket",
                        BATCH_TOPIC: "batch-uwebsocket",
                        EMOJI_TOPIC: "emoji-uwebsocket",
                        DOUBT_SOLUTION_TOPIC: "doubt-solution-uwebsocket",
                        DISHA_SESSION_TOPIC: "disha-session-to-socket-v1",
                        SOCKET_TO_DISHA_TOPIC: "socket-to-disha-session-v1",
                        NOTIFICATION_TOPIC: "notification-uwebsocket",
                    },
                    groups: {
                        POLL_GROUP: process.env.POLL_KAFKA_GROUP || "poll-uwebsocket-group-local",
                        CHAT_GROUP: process.env.CHAT_KAFKA_GROUP || "chat-uwebsocket-group-local",
                        AI_GURU_CHAT_GROUP: process.env.AI_GURU_CHAT_KAFKA_GROUP || "ai-guru-chat-group-local",
                        BATTLEGROUND_GROUP: process.env.BATTLEGROUND_KAFKA_GROUP || "battleground-group-local",
                        BATTLEGROUND_CHAT_GROUP:
                            process.env.BATTLEGROUND_CHAT_KAFKA_GROUP || "battleground-group-local",
                        SCHEDULE_GROUP: process.env.SCHEDULE_KAFKA_GROUP || "schedule-uwebsocket-group-local",
                        BATCH_GROUP: process.env.BATCH_KAFKA_GROUP || "batch-uwebsocket-group-local",
                        EMOJI_GROUP: process.env.EMOJI_KAFKA_GROUP || "emoji-uwebsocket-group-local",
                        DOUBT_SOLUTION_GROUP: process.env.DOUBT_KAFKA_GROUP || "doubt-solution-uwebsocket-group-local",
                        DISHA_SESSION_GROUP: process.env.DISHA_SESSION_KAFKA_GROUP || "disha-session-group-local",
                        NOTIFICATION_GROUP: process.env.NOTIFICATION_KAFKA_GROUP || "notification-uwebsocket-group-local",
                    },
                },
                ssl: true,
                subscribe: {
                    fromBeginning: true,
                },
                producer: {
                    topics: {
                        SOCKET_CONNECTION_TOPIC: "uwebsocket-connect",
                        SOCKET_TO_DISHA_TOPIC: "socket-to-disha-session-v1",
                    },
                },
            },
            logProps: {
                dirname: "/var/log/live-class-logs",
                filename: "live-class-logs-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                zippedArchive: true,
                maxFiles: "7d",
            },
            jwtProps: {
                tokenName: "insert token name",
                issuer: "insert issues",
                secretKey: "",
            },
            appTokens: {
                client: "PW_CLIENT",
                clientId: "insert client id",
                clientSecret: "insert client secret",
            },
            noAuthApis: ["/health"],
            secrets: {
                secretName: "insert secret name",
                region: "ap-south-1",
            },
            log_levels: "error,log,warn,debug,verbose",
            unleash: {
                SERVICE_NAME: "central-socket-service",
                UNLEASH_URL: process.env.UNLEASH_URL || "https://unleash-stage.penpencil.co/api",
                UNLEASH_AUTHORIZATION_KEY:
                    process.env.UNLEASH_AUTHORIZATION_KEY ||
                    "*:development.707a488e6425fb35fd97e36686f22d274045dc231062007ed89322dc",
            },
        };
    else
        return {
            mode: process.env.NODE_ENV || "production",
            authBaseUrl: process.env.AUTH_BASE_URL || "http://auth-service.microservices.svc.cluster.local/",
            authKongPluginApiBaseUrl: process.env.AUTH_KONG_PLUGIN_API_BASE_URL || "http://auth-uwebsocket-service.microservices.svc.cluster.local/",
            batchesServiceBaseUrl: process.env.BATCHES_BASE_URL || "http://batches-service",
            pwLiveClassBaseUrl: process.env.PW_LIVE_CLASS_BASE_URL || "http://pw-live-class-service/pw-live-class/",
            monolithBaseUrl:
                process.env.PP_BE_BASE_URL || "http://penpencil-backend-service.microservices/v1/internal/",
            node_env: process.env.NODE_ENV ? process.env.NODE_ENV : "production",
            serverUrl: "live.penpencil.co",
            webServerPort: parseInt(process.env.WS_PORT || "8080"),
            httpServer: {
                uwebsocketOpts: {
                    max_body_length: 5 * 1000 * 1000, // 5MB
                    auto_close: true,
                },
                port: parseInt(process.env.SERVER_PORT || "8081"),
            },
            redisNodes: (process.env.REDIS_NODES || "").split(","),
            redisHost: process.env.REDIS_URL || "localhost",
            redisPort: 6379,
            kafka: {
                sasl: {
                    username: process.env.KAFKA_USERNAME || "T4KUSC4UROKOFCES",
                    password:
                        process.env.KAFKA_PASSWORD ||
                        "591Xcnsr96xMoYDtJVnz+3yw4gqCWtf5IJwvibzMpz2hAg1SRASLTSR/+QmTXTbc",
                    mechanism: KafkaSaslOptions.PLAIN,
                },
                client: {
                    brokers: process.env.KAFKA_BROKER || "pkc-l7pr2.ap-south-1.aws.confluent.cloud:9092",
                    clientId: process.env.KAFKA_CLIENT_ID || "central-socket-service-client-dev",
                },
                consumer: {
                    topics: {
                        POLL_TOPIC: "poll-uwebsocket",
                        CHAT_TOPIC: "chat-uwebsocket",
                        AI_GURU_SUGGESTIVE_QUESTION_TOPIC: "ai-guru-chat",
                        BATTLEGROUND_TOPIC: "battleground",
                        BATTLEGROUND_CHAT_TOPIC: "battleground-chat",
                        SCHEDULE_TOPIC: "schedule-uwebsocket",
                        BATCH_TOPIC: "batch-uwebsocket",
                        EMOJI_TOPIC: "emoji-uwebsocket",
                        DOUBT_SOLUTION_TOPIC: "doubt-solution-uwebsocket",
                        DISHA_SESSION_TOPIC: "disha-session-to-socket-v1",
                        SOCKET_TO_DISHA_TOPIC: "socket-to-disha-session-v1",
                    },
                    groups: {
                        POLL_GROUP: process.env.POLL_KAFKA_GROUP || "poll-uwebsocket-group",
                        CHAT_GROUP: process.env.CHAT_KAFKA_GROUP || "chat-uwebsocket-group",
                        AI_GURU_CHAT_GROUP: process.env.AI_GURU_CHAT_KAFKA_GROUP || "ai-guru-chat-group-dev",
                        BATTLEGROUND_GROUP: process.env.BATTLEGROUND_KAFKA_GROUP || "battleground-group-dev",
                        BATTLEGROUND_CHAT_GROUP: process.env.BATTLEGROUND_CHAT_KAFKA_GROUP || "battleground-group-dev",
                        SCHEDULE_GROUP: process.env.SCHEDULE_KAFKA_GROUP || "schedule-uwebsocket-group",
                        BATCH_GROUP: process.env.BATCH_KAFKA_GROUP || "batch-uwebsocket-group",
                        EMOJI_GROUP: process.env.EMOJI_KAFKA_GROUP || "emoji-uwebsocket-group",
                        DISHA_SESSION_GROUP: process.env.DISHA_SESSION_KAFKA_GROUP || "disha-session-group-stg",
                    },
                },
                ssl: true,
                subscribe: {
                    fromBeginning: true,
                },
                producer: {
                    topics: {
                        SOCKET_CONNECTION_TOPIC: "uwebsocket-connect",
                        SOCKET_TO_DISHA_TOPIC: "socket-to-disha-session-v1",
                    },
                },
            },
            logProps: {
                dirname: "/var/log/live-class-logs",
                filename: "live-class-logs-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                zippedArchive: true,
                maxFiles: "7d",
            },
            jwtProps: {
                tokenName: "insert token name",
                issuer: "insert issues",
                secretKey: "",
            },
            appTokens: {
                client: "PW_CLIENT",
                clientId: "insert client id",
                clientSecret: "insert client secret",
            },
            noAuthApis: ["/health"],
            secrets: {
                secretName: "insert secret name",
                region: "ap-south-1",
            },
            log_levels: "error,log,warn,debug,verbose",
            unleash: {
                SERVICE_NAME: "central-socket-service",
                UNLEASH_URL: process.env.UNLEASH_URL || "http://unleash-edge.unleash.svc.cluster.local/api",
                UNLEASH_AUTHORIZATION_KEY:
                    process.env.UNLEASH_AUTHORIZATION_KEY ||
                    "*:production.7d2c8b4adc108ba15b2ae823d1549bf4fa788df24d663719e5ab355f",
            },
        };
};
