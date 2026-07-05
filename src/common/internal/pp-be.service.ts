import { Injectable } from "@nestjs/common";
import { AxiosSingletonService } from "../http-utils/axios-singleton.service";
import config from "../../config/env.config";
import { MethodEnum, OptionsType } from "src/utils/constants";
import { logger } from "src/utils/logger";
const configVals = config();

@Injectable()
export class PpBeService {

}
