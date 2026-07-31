export class ConcurrentUpdateException extends Error {

    constructor() {

        super("Concurrent wallet update");

        this.name = "ConcurrentUpdateException";

    }

}