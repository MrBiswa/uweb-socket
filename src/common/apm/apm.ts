import HyperExpressInstrumentation from "@pw-tech/instrumentation-hyper-express";
import elastic from "elastic-apm-node";
new HyperExpressInstrumentation();

const apm = elastic.start({
    serverUrl: process.env.ELASTIC_APM_SERVER_URL || "http://elk-apm.apm:8200",
    secretToken: process.env.ELASTIC_APM_SECRET || null,
    // serverUrl: process.env.ELASTIC_APM_SERVER_URL || "http://10.2.141.246:8211",
    serviceName: process.env.ELASTIC_APM_SERVICE_NAME || "central-socket",
    opentelemetryBridgeEnabled: true,
    metricsInterval: "10s",
    // maxQueueSize: 2000,
    // spanCompressionEnabled: false,
    contextManager: "asynclocalstorage",
});

export { apm as ApmInstance };
