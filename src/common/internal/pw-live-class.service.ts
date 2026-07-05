import { Injectable } from "@nestjs/common";
import { AxiosSingletonService } from "../http-utils/axios-singleton.service";
import config from "../../config/env.config";
import { MethodEnum } from "src/utils/enums";
import { OptionsType } from "src/utils/constants";
import { logger } from "src/utils/logger";

const configVals = config();

@Injectable()
class PWLiveClassService {
    static V2_INTERNAL = "v2/internal/";
    static V1_WHITEBOARD = "whiteboard/";

    fetchWhiteboardEvents(scheduleId: string, fromSlideChange: boolean = false, startTime: number, endTime: number) {
        const url =
            configVals.pwLiveClassBaseUrl +
            PWLiveClassService.V2_INTERNAL +
            PWLiveClassService.V1_WHITEBOARD +
            `${scheduleId}/events?fromSlideChange=${fromSlideChange}&startTime=${startTime}&endTime=${endTime}`;
        const options: OptionsType = {
            headers: {
                "content-type": "application/json",
            },
            url,
            method: MethodEnum.GET,
        };
        logger.log(`PWLiveClassService::fetchWhiteboardEvents::url: ${url}`, options);
        return AxiosSingletonService.getInstance().request(options);
    }
}

export { PWLiveClassService };
