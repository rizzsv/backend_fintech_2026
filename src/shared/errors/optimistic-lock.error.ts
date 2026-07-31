export class OptimisLockError extends Error {
    constructor() {
        super(
            "Concurrent updated detected. Please try again."
        );

        this.name = "OptimisticLockError";
    }
}