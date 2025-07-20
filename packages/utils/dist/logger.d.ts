/**
 * @deprecated Use ./logging exports instead
 * Structured logging system with colors - Legacy compatibility
 */
import { VibraniumLogger as NewVibraniumLogger } from './logging';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface Logger {
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    setLevel(level: LogLevel): void;
    enableColors(enabled: boolean): void;
}
/**
 * @deprecated Use VibraniumLogger from ./logging instead
 */
export declare class VibraniumLogger implements Logger {
    private logger;
    constructor();
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    setLevel(level: LogLevel): void;
    enableColors(enabled: boolean): void;
}
export declare const vibraniumLogger: NewVibraniumLogger;
//# sourceMappingURL=logger.d.ts.map