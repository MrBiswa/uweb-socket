import { Redis, Cluster } from "ioredis";
import { smallUuid } from "../utils/utils";
import config from "src/config/env.config";
const configVals = config();
import { Injectable } from "@nestjs/common";
import { logger } from "../utils/logger";

const host = configVals.redisHost;
const port = configVals.redisPort;
const redisNodes = configVals.redisNodes;

type RedisMode = "CLUSTER" | "FORK";
const ONE_DAY_TTL = 24 * 60 * 60;

@Injectable()
class RedisClient {
    static instance: RedisClient;

    public pubClient: Redis | Cluster;
    public subClient: Redis | Cluster;

    public static MODE: RedisMode = "CLUSTER";

    private mainChannelId = "main";
    private ownChannelId = smallUuid();

    constructor() {
        logger.log("RedisClient::constructor", RedisClient.MODE, redisNodes, port, host);
        if (RedisClient.instance) {
            return RedisClient.instance;
        }
        if (RedisClient.MODE === "CLUSTER") {
            this.pubClient = new Redis.Cluster(redisNodes, { 
                enableAutoPipelining: true,
                scaleReads: "all",
            });
        } else {
            this.pubClient = new Redis({ port, host, enableAutoPipelining: true });
        }
        logger.log("pubclient: ", this.pubClient);
        this.subClient = this.pubClient.duplicate();
        RedisClient.addEventListeners(this.pubClient, "pub");
        RedisClient.addEventListeners(this.subClient, "sub");
        RedisClient.instance = this;
    }

    private static addEventListeners(redisClient: Cluster | Redis, clientName: string) {
        redisClient.on("connect", () => logger.log(`${clientName} connect event:`));
        redisClient.on("ready", () => logger.log(`${clientName} ready event:`));
        redisClient.on("error", (err) => console.error(`${clientName} error event:`, err));
        redisClient.on("close", (data: any) => logger.log(`${clientName} close event:`, data));
        redisClient.on("reconnecting", (ms: any) => logger.log(`${clientName} reconnecting event:`, ms));
        redisClient.on("end", (data: any) => logger.log(`${clientName} end event:`, data));
        redisClient.on("+node", () => logger.log(`${clientName} +node event`));
        redisClient.on("-node", () => logger.log(`${clientName} -node event`));
    }

    public addSubscribeEventListener(cb: any) {
        this.subClient.on("message", (channel: string, message) => {
            cb(channel, message);
        });
    }

    public subscribeToChannel(channelId: string): void {
        this.subClient.subscribe(channelId, (err, count) => {
            if (err) {
                // Just like other commands, subscribe() can fail for some reasons,
                // ex network issues.
                console.error("Failed to subscribe: %s", err.message);
            } else {
                // `count` represents the number of channels this client are currently subscribed to.
                logger.log(
                    `Subscribed successfully to ${channelId}! This client is currently subscribed to ${count} channels.`,
                );
            }
        });
    }

    // public async publishToChannelAndAwait(channelId: string, message: any): Promise<IRedisSubMessage> {
    //     const requestId = this.publishToChannel(channelId, message);
    //     const awaitSubResponse = (): Promise<IRedisSubMessage> => new Promise((resolve, reject) => {
    //         const timeout = setTimeout(() => {
    //             reject(`timeout for requestId ${requestId} for message ${JSON.stringify(message)}`);
    //         }, 10000);
    //         this.subClient.once(requestId, (message: IRedisSubMessage) => {
    //             logger.log("message recieved inside the subclient for requestId", requestId, message);
    //             clearTimeout(timeout);
    //             resolve(message);
    //         });
    //     });
    //     try {
    //         const response = await awaitSubResponse();
    //         return response;
    //     }
    //     catch (err) {
    //         console.error("publishToChannelAndAwait::error", err);
    //         return { ...message, message: { ack: false } };
    //     }
    // }

    public publishToChannel(channelId: string, message: string) {
        this.pubClient.publish(channelId, message, (err, count) => {
            if (err) {
                console.error("Failed to publish: %s", err.message);
            } else {
                logger.log(`Published successfully to ${channelId}! This message was sent to ${count} subscribers.`);
            }
        });
    }

    public addToStream(channelId: string, message: any) {
        this.pubClient.xadd(channelId, "*", process.pid, message, (err, id) => {
            if (err) console.error("xadd err:", err);
            logger.log(`xadd id: ${id}`);
        });
    }

    getMainChannelId() {
        return this.mainChannelId;
    }

    getOwnChannelId() {
        return this.ownChannelId;
    }

    close() {
        this.pubClient.disconnect();
        this.subClient.disconnect();
    }

    async get(key: string) {
        try {
            const resp = await this.pubClient.get(key);
            return JSON.parse(resp);
        } catch (err) {
            logger.error("Error inside RedisClient::get ", err);
            return;
        }
    }

    async set(key: string, data: any, ttl?: number): Promise<boolean> {
        try {
            data = JSON.stringify(data);
            await this.pubClient.set(key, data);
            if (!ttl) ttl = ONE_DAY_TTL;
            this.pubClient.expire(key, ttl);
            return true;
        } catch (err) {
            logger.error("Error inside RedisClient::set ", err);
            return false;
        }
    }

    async del(keys: string | string[]): Promise<boolean> {
        try {
            let resp = null;
            if (Array.isArray(keys)) {
                resp = await Promise.all(keys.map((key) => this.pubClient.del(key)));
            } else {
                resp = await this.pubClient.del(keys);
            }
            logger.log("RedisClient::del response: ", resp, keys);
            return true;
        } catch (err) {
            logger.error("Error inside RedisClient::del ", err);
            return false;
        }
    }

    async deleteByPattern(pattern: string) {
        try {
            const nodes = this.pubClient.isCluster ? (this.pubClient as any).nodes() : [this.pubClient];
            nodes.forEach((node: any) => {
                const stream = node.scanStream({ match: `*${pattern}*`, count: 1000 }); //todo
                stream.on("data", (keys: any[] = []) => {
                    keys.forEach((key) => {
                        logger.log("deleteBy: ", key);
                        this.del(key);
                    });
                });
                stream.on("error", (err: any) => {
                    logger.error(err);
                });
            });
            return;
        } catch (err) {
            logger.error("Error inside RedisClient::deleteByPattern ", err);
            return false;
        }
    }

    async hSet(key: string, field: string, value: string): Promise<boolean> {
        const resp = await this.pubClient.hset(key, field, value);
        if (resp !== 1) {
            logger.error("RedisClient::hset::error", resp);
            return false;
        }
        return true;
    }

    async hMSet(key: string, fieldValues: Array<string>): Promise<boolean> {
        const resp = await this.pubClient.hmset(key, ...fieldValues);
        if (resp !== "OK") {
            logger.error("RedisClient::hmset::error", resp);
            return false;
        }
        return true;
    }

    async hGet(key: string, field: string): Promise<string> {
        const resp = await this.pubClient.hget(key, field);
        return resp;
    }

    async hGetAll<T>(key: string): Promise<T> {
        const resp = await this.pubClient.hgetall(key);
        return resp as T;
    }

    async hMGet(key: string, fields: string[]): Promise<string[]> {
        const resp = await this.pubClient.hmget(key, ...fields);
        return resp;
    }

    async hDel(key: string, field: string): Promise<boolean> {
        const resp = await this.pubClient.hdel(key, field);
        if (resp !== 1) {
            logger.error("RedisClient::hdel::error", resp, key, field);
            return false;
        }
        return true;
    }

    async hDelAll(key: string): Promise<boolean> {
        const resp = await this.pubClient.del(key);
        if (resp === 0) {
            logger.warn("RedisClient::hdelAll::no key found", resp, key);
            return false;
        }
        return true;
    }

    async hExists(key: string, field: string): Promise<boolean> {
        const resp = await this.pubClient.hexists(key, field);
        return resp === 1;
    }

    async hKeys(key: string): Promise<string[]> {
        const resp = await this.pubClient.hkeys(key);
        return resp;
    }

    async hValues(key: string): Promise<string[]> {
        const resp = await this.pubClient.hvals(key);
        return resp;
    }

    async hLen(key: string): Promise<number> {
        const resp = await this.pubClient.hlen(key);
        return resp;
    }

    async hIncrBy(key: string, field: string, increment: number): Promise<number> {
        const resp = await this.pubClient.hincrby(key, field, increment);
        return resp;
    }

    async getJson(key: string, path?: string) {
        try {
            const resp = (await this.pubClient.call("JSON.GET", key, path)) as string;
            return JSON.parse(resp);
        } catch (error) {
            logger.log("error in getJSON redis", JSON.stringify(error));
        }
    }

    async setJson(key: string, value: object, path: string = "$", ttl = 43200) {
        //TODO: handle this JSON.stringify part properly in long run
        logger.log("setJson", key, path, value);
        let data: any;
        if (path === "$") {
            data = JSON.stringify(value);
        } else {
            data = value;
        }
        // default 12 hrs
        try {
            const resp = await this.pubClient.call("JSON.SET", key, path, data);
            this.pubClient.expire(key, ttl);
            return resp;
        } catch (error) {
            logger.log("error in setJSON redis", JSON.stringify(error));
        }
    }

    async arrAppendJson(key: string, value: object, path: string) {
        logger.log("arrAppendJson", key, path);
        try {
            const resp = await this.pubClient.call("JSON.ARRAPPEND", key, path, JSON.stringify(value));
            logger.log("arrAppendJson: ", path, resp);
            return resp;
        } catch (error) {
            logger.log("error in arrAppendJson redis", JSON.stringify(error));
        }
    }

    async arrRemoveJson(key: string, value: object, path: string = "$") {
        try {
            path += `[?(@==${JSON.stringify(value)})]`;
            const resp = (await this.pubClient.call("JSON.DEL", key, path)) as number;
            console.log("arrRemoveJson: ", path, resp);
            return resp >= 0 ? true : false;
        } catch (error) {
            logger.error("error in arrRemoveJson redis", JSON.stringify(error));
        }
    }

    async arrIndexJson(key: string, value: object, path: string = "$"): Promise<number> {
        try {
            const index = (await this.pubClient.call("JSON.ARRINDEX", key, path, JSON.stringify(value))) as number;
            return index;
        } catch (error) {
            logger.error("error in arrIndexJson redis", JSON.stringify(error));
            return -1;
        }
    }

    async delJson(key: string, path: string = "$") {
        logger.log("delJson", key, path);
        try {
            const resp = await this.pubClient.call("JSON.DEL", key, path);
            return resp;
        } catch (error) {
            logger.log("error in delJSON redis", JSON.stringify(error));
        }
    }

    async lPush(key: string, value: Array<string>): Promise<boolean> {
        try {
            const resp = await this.pubClient.lpush(key, ...value);
            if (resp !== 1) {
                logger.error("RedisClient::lPush::error", resp, key, value);
                return false;
            }
        } catch (error) {
            logger.log("error in lPush redis", JSON.stringify(error));
            return false;
        }
        return true;
    }

    async lPop(key: string): Promise<string> {
        try {
            const resp = await this.pubClient.lpop(key);
            return resp;
        } catch (error) {
            logger.log("error in lPop redis", JSON.stringify(error));
        }
    }

    async lRange(key: string, start: number, end: number): Promise<string[]> {
        try {
            const resp = await this.pubClient.lrange(key, start, end);
            return resp;
        } catch (error) {
            logger.log("error in lRange redis", JSON.stringify(error));
        }
    }

    async lLen(key: string) {
        try {
            const resp = await this.pubClient.llen(key);
            return resp;
        } catch (error) {
            logger.log("error in lLen redis", JSON.stringify(error));
        }
    }

    async rPush(key: string, value: Array<string>): Promise<boolean> {
        try {
            const resp = await this.pubClient.rpush(key, ...value);
            if (resp === 0) {
                logger.error("RedisClient::rPush::error", resp, key, value);
                return false;
            }
        } catch (error) {
            logger.log("error in rPush redis", JSON.stringify(error));
            return false;
        }
        return true;
    }

    /**
     * SETS: redis sets mainly used to perform set operations like UNION, INTERSECTION, DIFFERENCE etc.
     */

    // used to add element(s) in a set
    async sAdd(key: string, value: string, expire?: number) {
        // default expire: -1 (no expiry)
        const resp = await this.pubClient.sadd(key, value);
        if (expire) this.pubClient.expire(key, expire);
        return resp;
    }

    // used to remove element(s) in a set
    async sRem(key: string, value: string) {
        const resp = await this.pubClient.srem(key, value);
        return resp;
    }

    // used to check if member (given value) is available in set
    async sIsMember(key: string, value: string) {
        const resp = await this.pubClient.sismember(key, value);
        return resp;
    }

    // used to count elements in a set,
    // ps: for those curious beings CARD here is CARDinality
    async sCard(key: string) {
        const resp = await this.pubClient.scard(key);
        return resp;
    }

    async sMembers(key: string) {
        const resp = await this.pubClient.smembers(key);
        return resp;
    }

    async pipeline() {
        return this.pubClient.pipeline();
    }
}

const redisClient = new RedisClient();

export { redisClient, RedisClient };
