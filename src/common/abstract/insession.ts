import { Injectable } from "@nestjs/common";
import { UWebSockets, UserSocket } from "@pw-tech/io-uwebsocket/dist/uwebsocket/uwebsocket";

type Route = {
    context?: string;
    message: any;
    messageToSave: any;
    socket?: UserSocket;
    io: UWebSockets;
    cb?: (data: Record<string, any>) => void;
};

@Injectable()
abstract class InSession {
    abstract route({ socket, context, message, messageToSave, io }: Route): void;
}

export { InSession, Route };
