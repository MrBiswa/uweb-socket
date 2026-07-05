import { TestBed } from "@automock/jest";
import { MessagePayload } from "src/kafka/kafka.interface";
import { EmojiConsumer } from "../emoji.consumer";

jest.mock("src/utils/logger");

describe("emoji consumer testing", () => {
    let emojiConsumer: EmojiConsumer;

    beforeEach(() => {
        const { unit } = TestBed.create(EmojiConsumer).compile();
        emojiConsumer = unit;
    });

    describe("onModuleInit function testing", () => {
        it("happy case when it consumer runs", () => {
            const consumeSpy = jest.spyOn(emojiConsumer, "consume").mockResolvedValueOnce();

            emojiConsumer.onModuleInit();

            expect(consumeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("consume function test cases", () => {
        it("happy case for consume function", async () => {
            const consumerConsumeSpy = jest.spyOn(emojiConsumer["consumer"], "consume").mockResolvedValueOnce();

            await emojiConsumer.consume();

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
            await emojiConsumer.messageProcessor(event as unknown as MessagePayload);
        });
    });
});
