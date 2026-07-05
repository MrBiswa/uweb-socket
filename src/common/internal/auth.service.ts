import { Injectable } from "@nestjs/common";
import { AxiosSingletonService } from "../http-utils/axios-singleton.service";
import config from "../../config/env.config";
import { OptionsType } from "../../utils/constants";
import { MethodEnum } from "../../utils/enums";
import { DecodedData } from "../interfaces/common.interface";
import { logger } from "../../utils/logger";
const configVals = config();

@Injectable()
export class AuthInternalService {
    async socket(headers: { authorization: string }) {
        try {
            const url = configVals.authKongPluginApiBaseUrl + "v1/oauth/jwt-verify-check-no-scope";
            const options: OptionsType = {
                headers,
                url,
                method: MethodEnum.POST,
            };
            logger.log(`AuthInternalService::socket::url: ${url}`, options);
            return await AxiosSingletonService.getInstance().request(options);
        } catch (error) {
            console.log(`${JSON.stringify({ ERROR_IN_AuthInternalService: error })}`);
            return false;
        }
    }

    async getTokenByJwtData(data: { jwtData: DecodedData; expiresIn: number }) {
        try {
            const url = configVals.authBaseUrl + "v1/oauth/get-token-by-jwtData";
            const options: OptionsType = {
                headers: {
                    "content-type": "application/json",
                },
                url,
                method: MethodEnum.POST,
                data,
            };
            return await AxiosSingletonService.getInstance().request(options);
        } catch (error) {
            logger.error(`ERROR_IN_getTokenByJwtData: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    async verifyNonJWT(data: { accessToken: string, userFields: Array<string> }, headers?: Record<string, string>) {
        try {
            const url = configVals.authBaseUrl + "v1/internal/auth/non-jwt-verify";
            const options: OptionsType = {
                headers: headers ? headers : {
                    "content-type": "application/json",
                },
                url,
                method: MethodEnum.POST,
                data,
            };
            return await AxiosSingletonService.getInstance().request(options);
        } catch (error) {
            logger.error(`ERROR_IN_verifyNonJWT: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}
