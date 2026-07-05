import { TestBed } from "@automock/jest";
import { MessagePayload } from "src/kafka/kafka.interface";
import { ChatConsumer } from "../chat.consumer";

jest.mock("src/utils/logger");

describe("chat consumer testing", () => {
    let chatConsumer: ChatConsumer;

    beforeEach(() => {
        const { unit } = TestBed.create(ChatConsumer).compile();
        chatConsumer = unit;
    });

    describe("onModuleInit function testing", () => {
        it("happy case when it consumer runs", () => {
            const consumeSpy = jest.spyOn(chatConsumer, "consume").mockResolvedValueOnce();

            chatConsumer.onModuleInit();

            expect(consumeSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("consume function test cases", () => {
        it("happy case for consume function", async () => {
            const consumerConsumeSpy = jest.spyOn(chatConsumer["consumer"], "consume").mockResolvedValueOnce();

            await chatConsumer.consume();

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
            await chatConsumer.messageProcessor(event as unknown as MessagePayload);
        });
    });
});
