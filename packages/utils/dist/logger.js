/**
 * @deprecated Use ./logging exports instead
 * Structured logging system with colors - Legacy compatibility
 */
import { VibraniumLogger as NewVibraniumLogger, logger } from './logging';
/**
 * @deprecated Use VibraniumLogger from ./logging instead
 */
export class VibraniumLogger {
    logger;
    constructor() {
        this.logger = new NewVibraniumLogger();
    }
    debug(message, ...args) {
        this.logger.debug(message, { args });
    }
    info(message, ...args) {
        this.logger.info(message, { args });
    }
    warn(message, ...args) {
        this.logger.warn(message, { args });
    }
    error(message, ...args) {
        this.logger.error(message, { args });
    }
    setLevel(level) {
        this.logger.setLevel(level);
    }
    enableColors(enabled) {
        this.logger.setColors(enabled);
    }
}
// Export the global logger instance for backward compatibility
export const vibraniumLogger = logger;
//# sourceMappingURL=logger.js.map