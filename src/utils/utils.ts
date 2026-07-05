function smallUuid() {
    return Math.random().toString(36).substring(2);
}

export const sleep = async (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export { smallUuid };
