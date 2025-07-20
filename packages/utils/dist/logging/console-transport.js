/**
 * Console transport with advanced features and formatting
 */
import { FormatterFactory } from './formatters';
export class ConsoleTransport {
    name = 'console';
    formatter;
    stdoutLevels;
    stderrLevels;
    eol;
    constructor(options = {}) {
        const { formatter = 'simple', stdoutLevels = ['debug', 'info'], stderrLevels = ['warn', 'error'], eol = '\n', ...formatterOptions } = options;
        this.formatter = typeof formatter === 'string'
            ? FormatterFactory.create(formatter, formatterOptions)
            : formatter;
        this.stdoutLevels = new Set(stdoutLevels);
        this.stderrLevels = new Set(stderrLevels);
        this.eol = eol;
    }
    write(entry) {
        const formatted = this.formatter.format(entry);
        const output = formatted + this.eol;
        if (this.stderrLevels.has(entry.level)) {
            process.stderr.write(output);
        }
        else if (this.stdoutLevels.has(entry.level)) {
            process.stdout.write(output);
        }
    }
    shouldLog(level) {
        return this.stdoutLevels.has(level) || this.stderrLevels.has(level);
    }
    setFormatter(formatter, options) {
        this.formatter = typeof formatter === 'string'
            ? FormatterFactory.create(formatter, options)
            : formatter;
    }
    getFormatter() {
        return this.formatter;
    }
    setColors(enabled) {
        // Update formatter options if it supports colors
        if ('options' in this.formatter) {
            this.formatter.options.colors = enabled;
        }
    }
}
//# sourceMappingURL=console-transport.js.map