export enum MethodEnum {
    POST = "POST",
    GET = "GET",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
}

export const AxiosServiceName = "central-socket-service";

export type OptionsType = {
    headers: Record<string, string>;
    url: string;
    method: MethodEnum;
    data?: Record<string, any> | string;
};

export const PollRoomEvents = {
    scheduleComplete: "SCHEDULE_COMPLETE",
};

export const AXIOS_RETRY_CONFIG = {
    retryCount: 3,
    retryErrors: [
        "ECONNRESET",
        "ENOTFOUND",
        "ETIMEDOUT",
        "ECONNREFUSED",
        "ERRADDRINUSE",
        "EADDRNOTAVAIL",
        "ECONNABORTED",
    ],
    retryInterval: 600, // in milliseconds
};

export const isJWTToken = (token: string) => {
    return token.includes(".") ? true : false;
};

export const ROLE_ID_OF = {
    TEACHER: "5b2b9742764bd519beb90ac2",
    ADMIN: "5b27bd915842f950a778c6eb",
};

export const UnleashFlags = {
    bac: "bac-central-socket",
};

export const MAXHUB_TEACHER_ID = "65056a7ebeafc0001835af80";

export const MAXHUB_TEACHER_ID_STAGE = "655ec9a53d7692630585cf9d";
