enum KafkaSaslOptions {
    PLAIN = "plain",
}

enum MethodEnum {
    POST = "POST",
    GET = "GET",
    PUT = "PUT",
    DELETE = "DELETE",
    PATCH = "PATCH",
}

enum RoomContext {
    POLL = "poll",
    PREMIUM_COHORT = "premium_cohort",
    BATTLEGROUND = "battleground",
    BATTLEGROUND_CHAT = "BATTLEGROUND_CHAT",
    AI_GURU_CHAT = "ai_guru_chat",
    SCHEDULE = "schedule",
    BATCH = "batch",
    EMOJI = "emoji",
    CHAT = "chat",
    DISHA_SESSION = "disha_session",
}

enum EmitContext {
    POLL = "poll",
    BATTLEGROUND = "battleground",
    BATTLEGROUND_CHAT = "battleground_chat",
    AI_GURU_CHAT = "ai_guru_chat",
    WHITEBOARD = "whiteboard",
    CHAT = "chat",
    SCHEDULE = "schedule",
    BATCH = "batch",
    EMOJI = "emoji",
    DOUBT_SOLUTION = "doubt_solution",
    DISHA_SESSION = "disha_session",
    NOTIFICATION = "notification",
}

enum DishaUserRole {
    USER = "user",
    MENTOR = "mentor",
}

enum DishaConnectionType {
    INITIAL = "initial",
    RECONNECT = "reconnect",
}

enum DishaEventType {
    // System-generated events only
    USER_CONNECTED = "user_connected",
    USER_DISCONNECTED = "user_disconnected",
    // All other events (join_session, start_audio, etc.) are dynamic from client
}

export enum ScheduleStatusEnum {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    CANCELED = "CANCELED",
    Inactive = "Inactive",
}

export enum ScheduleUrlTypeEnum {
    NONE = "NONE",
    YOUTUBE = "youtube",
    VIMEO = "vimeo",
    VIDEOCIPHER = "videoCipher",
    ZOOM = "zoom",
    PENPENCILVDO = "penpencilvdo",
    ANTMEDIA = "antMedia",
    JWPLAYER = "jwPlayer",
    AWSVIDEO = "awsVideo",
    ZOOMWEBINAR = "zoomWebinar",
    TENCENTVIDEO = "tencentVideo",
    PREMIUMWEBRTC = "premiumWebrtc",
}

enum ActiveInactiveStatusEnum {
    Active = "Active",
    Inactive = "Inactive",
}

export { KafkaSaslOptions, MethodEnum, RoomContext, EmitContext, ActiveInactiveStatusEnum, DishaUserRole, DishaConnectionType, DishaEventType };
