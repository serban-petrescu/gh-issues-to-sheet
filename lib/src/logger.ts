import type { Logger, WithLogger } from './model';

export const consoleLogger: Logger = console;

export class BaseLoggedComponent implements WithLogger {
    protected logger: Logger;

    constructor() {
        this.logger = consoleLogger;
    }

    setLogger(logger: Logger): void {
        this.logger = logger;
    }
}
