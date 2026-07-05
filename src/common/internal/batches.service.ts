import { Injectable } from "@nestjs/common";
import { AxiosSingletonService } from "../http-utils/axios-singleton.service";
import config from "../../config/env.config";
import { MethodEnum, OptionsType } from "src/utils/constants";
import { logger } from "src/utils/logger";
import { ScheduleDetailType } from "../interfaces/common.interface";
const configVals = config();
interface BatchStudentDetailsParams {
    batchId: string;
    userId: string;
};
@Injectable()
export class BatchesService {
    async getScheduleDetailById(scheduleId: string): Promise<ScheduleDetailType> {
        if (!scheduleId) return;
        try {
            const url =
                configVals.batchesServiceBaseUrl + `/internal/batch-service/batch-subject-schedules/${scheduleId}`;
            const options: OptionsType = {
                headers: {},
                url,
                method: MethodEnum.GET,
            };
            return await AxiosSingletonService.getInstance().request(options);
        } catch (error) {
            logger.log({ ERROR_IN_scheduleDetail: error });
            return null;
        }
    }

    async batchStudentDetail(batchStudentParams: BatchStudentDetailsParams, headers?: Record<string, string>) {
        try {
            const url =
                configVals.batchesServiceBaseUrl + `/batch/batch-student/mapping?userId=${batchStudentParams.userId}&batchId=${batchStudentParams.batchId}`;
            const options: OptionsType = {
                headers,
                url,
                method: MethodEnum.GET,
            };
            return await AxiosSingletonService.getInstance().request(options);
        } catch (error) {
            logger.error(`ERROR_IN_batchStudentDetail: ${error}`);
            return null;
        }
    }
}
