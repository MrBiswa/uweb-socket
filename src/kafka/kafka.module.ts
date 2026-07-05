import { Module } from "@nestjs/common";
import { ConsumerService } from "./kafka-consumer.service";
import { ProducerService } from "./kafka-producer.service";
import { DishaProducerService } from "./disha-producer.service";

@Module({
    imports: [],
    providers: [ProducerService, ConsumerService, DishaProducerService],
    exports: [ProducerService, ConsumerService, DishaProducerService],
})
export class KafkaModule {}
