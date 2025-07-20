/**
 * Console transport with advanced features and formatting
 */
import type { LogEntry, LogOutput } from './logger';
import { BaseFormatter, type FormatterType, type FormatterOptions } from './formatters';
export interface ConsoleTransportOptions extends FormatterOptions {
    formatter?: FormatterType | BaseFormatter;
    stdoutLevels?: string[];
    stderrLevels?: string[];
    eol?: string;
}
export declare class ConsoleTransport implements LogOutput {
    name: string;
    private formatter;
    private stdoutLevels;
    private stderrLevels;
    private eol;
    constructor(options?: ConsoleTransportOptions);
    write(entry: LogEntry): void;
    shouldLog(level: string): boolean;
    setFormatter(formatter: FormatterType | BaseFormatter, options?: FormatterOptions): void;
    getFormatter(): BaseFormatter;
    setColors(enabled: boolean): void;
}
//# sourceMappingURL=console-transport.d.ts.map