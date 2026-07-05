import os from "node:os";
// import { Sentry } from '../modules/sentry';
import util from "node:util";
import path from "node:path";
import * as winston from "winston";
// import { isProdEnvironment } from './utils';
interface LogObject {
    level: string;
    ts: number;
    hostname: string;
    message: any;
}

const winstonLogger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.errors({
            stack: true,
        }),
        winston.format.json(),
    ),
    transports: [
        new winston.transports.Console({
            level: "info",
            handleExceptions: true,
        }),
    ],
});

const getBaseMessage = (args: any) => {
    let message = "";
    for (const arg of args) {
        if (typeof arg == "string") {
            message = `${message} ${arg}`;
        } else {
            message = `${message} ${util.inspect(arg, {
                breakLength: Infinity,
                maxArrayLength: 20,
            })}`;
        }
    }
    message = message.trimLeft();
    const stackInfo = getStackInfo(1);
    if (stackInfo) {
        message = `${message} (in ${stackInfo.file}:${stackInfo.line})`;
    }
    return { message, stackInfo };
};

const getLogObject = (level: string, message: any) => {
    const logObj: LogObject = {
        level: level,
        ts: Date.now(),
        hostname: os.hostname(),
        message: message,
    };
    return logObj;
};

class loggerClass {
    log(...args: any) {
        const { message } = getBaseMessage(args);
        winstonLogger.log(getLogObject("info", message));
    }
    info(...args: any) {
        const { message } = getBaseMessage(args);
        winstonLogger.log(getLogObject("info", message));
    }
    warn(...args: any) {
        const { message } = getBaseMessage(args);
        winstonLogger.log(getLogObject("warn", message));
    }
    debug(...args: any) {
        const { message } = getBaseMessage(args);
        winstonLogger.log(getLogObject("info", message));
    }
    error(...args: any) {
        let { message } = getBaseMessage(args);
        const { stackInfo } = getBaseMessage(args);
        if (stackInfo) {
            message = `${message}, stack: ${stackInfo.stack}`;
        }

        // if (isProdEnvironment()) {
        //     Sentry.captureException(new Error(message));
        // }

        winstonLogger.log({
            level: "error",
            ts: Date.now(),
            hostname: os.hostname(),
            message: message,
            in: `${stackInfo!.file}:${stackInfo!.line}`,
        });
    }

    disableLogging() {
        logger.log = () => {};
        logger.info = () => {};
        logger.warn = () => {};
        logger.error = () => {};
    }
}

const logger = new loggerClass();

const getStackInfo = (stackIndex: number) => {
    const stack = new Error().stack;
    const stacklist = (stack && stack.split("\n").slice(3)) || [];
    // stack trace format:
    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi
    const stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
    const stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

    const s = stacklist[stackIndex] || stacklist[0];
    const sp = stackReg.exec(s) || stackReg2.exec(s);

    if (sp && sp.length === 5) {
        return {
            method: sp[1],
            relativePath: path.relative(process.env["APP_HOME"]!, sp[2]),
            line: sp[3],
            pos: sp[4],
            file: path.basename(sp[2]),
            stack: stacklist.join("\n"),
        };
    }
};

export { logger };
