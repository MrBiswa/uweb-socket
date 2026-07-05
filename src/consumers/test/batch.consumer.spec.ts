import { TestBed } from "@automock/jest";
import { BatchConsumer } from "../batch.consumer";
import { MessagePayload } from "../../kafka/kafka.interface";

jest.mock("src/utils/logger");

describe("batch consumer testing", () => {
    let batchConsumer: BatchConsumer;

    beforeEach(() => {
        const { unit } = TestBed.create(BatchConsumer).compile();
        batchConsumer = unit;
    });

    describe("onModuleInit function testing", () => {
        it("happy case when it consumer runs", () => {
            const consumeSpy = jest.spyOn(batchConsumer, "consume").mockResolvedValueOnce();

            batchConsumer.onModuleInit();

            expect(consumeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("consume function test cases", () => {
        it("happy case for consume function", async () => {
            const consumerConsumeSpy = jest.spyOn(batchConsumer["consumer"], "consume").mockResolvedValueOnce();

            await batchConsumer.consume();

            expect(consumerConsumeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("messageProcessor function test cases", () => {
        it("happy case for messageProcessor function", async () => {
            const event = {
                message: {
                    value: {
                        room: "abc",
                    },
                },
            };
            await batchConsumer.messageProcessor(event as unknown as MessagePayload);
        });
    });
});
