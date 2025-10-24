export interface LogLevel {
    DEBUG: 0;
    INFO: 1;
    WARN: 2;
    ERROR: 3;
}

export interface LogEntry {
    level: keyof LogLevel;
    message: string;
    timestamp: string;
    data?: any;
}

class Logger {
    private logLevel: keyof LogLevel = 'INFO';
    private logs: LogEntry[] = [];
    private maxLogs = 1000;

    constructor() {
        this.logLevel = (process.env.LOG_LEVEL as keyof LogLevel) || 'INFO';
    }

    private shouldLog(level: keyof LogLevel): boolean {
        const levels: LogLevel = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
        return levels[level] >= levels[this.logLevel];
    }

    private log(level: keyof LogLevel, message: string, data?: any): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            data
        };

        this.logs.push(entry);

        // Keep only the last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const logMessage = `[${entry.timestamp}] ${level}: ${message}`;

        switch (level) {
            case 'DEBUG':
                console.debug(logMessage, data || '');
                break;
            case 'INFO':
                console.info(logMessage, data || '');
                break;
            case 'WARN':
                console.warn(logMessage, data || '');
                break;
            case 'ERROR':
                console.error(logMessage, data || '');
                break;
        }
    }

    public debug(message: string, data?: any): void {
        this.log('DEBUG', message, data);
    }

    public info(message: string, data?: any): void {
        this.log('INFO', message, data);
    }

    public warn(message: string, data?: any): void {
        this.log('WARN', message, data);
    }

    public error(message: string, data?: any): void {
        this.log('ERROR', message, data);
    }

    public getLogs(): LogEntry[] {
        return [...this.logs];
    }

    public clearLogs(): void {
        this.logs = [];
    }

    public setLogLevel(level: keyof LogLevel): void {
        this.logLevel = level;
    }
}

export const logger = new Logger();