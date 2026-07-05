import { Injectable } from "@nestjs/common";
import { AXIOS_RETRY_CONFIG, AxiosServiceName, OptionsType } from "../../utils/constants";
import axios from "axios";
import httpAgent from "http";
import { logger } from "src/utils/logger";
import axiosRetry from "axios-retry";

@Injectable()
export class AxiosSingletonService {
    static instances: any = {};
    axiosInstance: any;
    static getInstance() {
        if (!AxiosSingletonService.instances[AxiosServiceName]) {
            AxiosSingletonService.instances[AxiosServiceName] = new AxiosSingletonService();
        }
        return AxiosSingletonService.instances[AxiosServiceName];
    }

    constructor() {
        if (AxiosSingletonService.instances[AxiosServiceName]) {
            return AxiosSingletonService.instances[AxiosServiceName];
        }
        this.axiosInstance = axios.create({
            httpAgent: new httpAgent.Agent({ keepAlive: true, timeout: 60000 }),
        });
        axiosRetry(this.axiosInstance, {
            retries: AXIOS_RETRY_CONFIG.retryCount,
            retryDelay: () => AXIOS_RETRY_CONFIG.retryInterval,
            retryCondition: (error) => AXIOS_RETRY_CONFIG.retryErrors.includes(error.code),
            onRetry: (retryCount, error) => {
                logger.log(
                    `Retry attempt ${retryCount} time(s)... for url: ${error.config.url} with error code ${error.code}`
                );
            },
        });
        AxiosSingletonService.instances[AxiosServiceName] = this;
    }

    async request(options: OptionsType, isStatusCodeNeeded = false, isNonThrowable = false) {
        try {
            const { data, status } = await this.axiosInstance(options);
            if (isStatusCodeNeeded) {
                return {
                    data: data?.data ? data.data : data,
                    statusCode: status,
                };
            }
            return data?.data ? data.data : data;
        } catch (error: any) {
            let retValue;
            if (error?.response?.data) {
                if (isStatusCodeNeeded) {
                    retValue = {
                        data: error?.response?.data,
                        statusCode: error?.response?.status,
                    };
                    if (isNonThrowable) {
                        return retValue;
                    } else {
                        throw retValue;
                    }
                }
                if (isNonThrowable) {
                    return error.response.data;
                }
                throw error.response.data;
            }
            if (error.message) {
                throw error.message;
            }
            throw error;
        }
    }

    async axiosCallWithBackOff(
        options: OptionsType,
        retries = 3,
        backoff = 5000,
        nonRetryCodes?: Array<number>,
        retryCodes?: Array<number>,
    ) {
        try {
            let cond: boolean;

            const res = (await this.axiosInstance.request(options, true, true)) as { data: any; statusCode: number };

            if (retryCodes) {
                cond = retries > 0 && retryCodes.includes(res.statusCode);
            }
            if (nonRetryCodes) {
                cond = retries > 0 && !nonRetryCodes.includes(res.statusCode);
            } else {
                cond = retries > 0;
            }

            if (cond) {
                setTimeout(() => {
                    logger.warn("Retrying for:", JSON.stringify(options));
                    return this.axiosCallWithBackOff(
                        options,
                        retries - 1,
                        backoff * 2,
                        nonRetryCodes ? nonRetryCodes : retryCodes,
                    );
                }, backoff);
            }
            return res.data;
        } catch (error) {
            logger.error(JSON.stringify(error));
            throw error;
        }
    }
}
