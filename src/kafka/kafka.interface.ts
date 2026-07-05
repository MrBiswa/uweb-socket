export interface ConsumerSubscribeTopic {
    topic: string | RegExp;
    fromBeginning?: boolean;
}

export interface MessagePayload {
    topic: string;
    partition: number;
    message: KafkaMessage;
    heartbeat(): Promise<void>;
}

export interface IHeaders {
    [key: string]: Buffer | string | undefined;
}

export type KafkaMessage = {
    key: Buffer | null;
    value: Buffer | null;
    timestamp: string;
    size: number;
    attributes: number;
    offset: string;
    headers?: IHeaders;
};
