export class DailyTransferLimitError extends Error {
        constructor(limit: number) {
        super(
            `Daily transfer limit exceeded (${limit})`
        );
    }
}