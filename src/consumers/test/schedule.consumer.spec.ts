import { TestBed } from "@automock/jest";
import { MessagePayload } from "src/kafka/kafka.interface";
import { ScheduleConsumer } from "../schedule.consumer";

jest.mock("src/utils/logger");

describe("schedule consumer testing", () => {
    let scheduleConsumer: ScheduleConsumer;

    beforeEach(() => {
        const { unit } = TestBed.create(ScheduleConsumer).compile();
        scheduleConsumer = unit;
    });

    describe("onModuleInit function testing", () => {
        it("happy case when it consumer runs", () => {
            const consumeSpy = jest.spyOn(scheduleConsumer, "consume").mockResolvedValueOnce();

            scheduleConsumer.onModuleInit();

            expect(consumeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("consume function test cases", () => {
        it("happy case for consume function", async () => {
            const consumerConsumeSpy = jest.spyOn(scheduleConsumer["consumer"], "consume").mockResolvedValueOnce();

            await scheduleConsumer.consume();

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
            await scheduleConsumer.messageProcessor(event as unknown as MessagePayload);
        });
    });
});
