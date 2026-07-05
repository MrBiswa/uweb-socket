import { ActiveInactiveStatusEnum, ScheduleStatusEnum, ScheduleUrlTypeEnum } from "src/utils/enums";

export type JWTdecodedData = {
    exp: number;
    data: DecodedData;
    iat: 1698239740;
};

export type DecodedData = {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    organization: {
        _id: string;
        website: string;
        name: string;
    };
    email?: string;
    type: string;
};

export type ScheduleDetailType = {
    _id: string;
    batchSubjectId: string;
    batchId: string;
    teachers: string[];
    startTime: string;
    endTime: string;
    topic: string;
    isChatEnabled: boolean;
    status: ScheduleStatusEnum;
    emojiRefreshInterval: number;
    isEmojiEnabled: boolean;
    conversationId: string;
    chapterId: string;
    topicId: string;
    classActiveTime: string;
    tags: string[];
    classEndTime?: string;
    urlType?: ScheduleUrlTypeEnum;
    isRecordingEnabled?: boolean;
    isTtmEnabled?: boolean;
    secondaryTeachers?: string[];
    lectureType?: string;
    isFree: boolean;
    parentScheduleId?: string;
    isClickerPollEnabled?: boolean;
};

export type StudentMappingType = {
    _id: string;
    userId: string;
    batchId: string;
    status: ActiveInactiveStatusEnum;
    roomId?: string;
};
