export interface VibraniumError extends Error {
  code: string;
  context?: Record<string, any>;
  cause?: Error;
}

export interface ErrorHandler {
  handle(error: Error): void;
  canHandle(error: Error): boolean;
}