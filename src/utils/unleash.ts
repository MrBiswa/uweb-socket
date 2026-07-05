import { Injectable } from "@nestjs/common";
import { PwUnleash } from "@pw/unleash-lib";
import { unleashEnvironment } from "@pw/unleash-lib/dist/interface";
import config from "../config/env.config"
import { logger } from "./logger";
const configVals = config();

@Injectable()
export class UnleashService {
    private pwUnleash: any;

    constructor() {
        const pwUnleashConfig: unleashEnvironment = {
            SERVICE_NAME: configVals.unleash.SERVICE_NAME,
            UNLEASH_API_URL: configVals.unleash.UNLEASH_URL,
            UNLEASH_AUTHORIZATION_KEY: configVals.unleash.UNLEASH_AUTHORIZATION_KEY
        };
        this.pwUnleash = new PwUnleash(pwUnleashConfig);
    }

    async isFeatureEnabled(featureName: string, property?: string): Promise<boolean> {
        try {
            return await this.pwUnleash.isEnabled(featureName, property);
        } catch (error) {
            logger.error("isFeatureEnabled unleash error: ", error);
            throw error;
        }
    }
}
