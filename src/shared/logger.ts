import log from 'loglevel';

export class Logger {
  private logger: log.Logger;
  private prefix: string;

  constructor(category: string) {
    this.prefix = `[${category}]`;
    this.logger = log.getLogger(category);
  }

  info(...args: unknown[]): void {
    this.logger.info(this.prefix, ...args);
  }

  warn(...args: unknown[]): void {
    this.logger.warn(this.prefix, ...args);
  }

  error(...args: unknown[]): void {
    this.logger.error(this.prefix, ...args);
  }

  debug(...args: unknown[]): void {
    this.logger.debug(this.prefix, ...args);
  }

  trace(...args: unknown[]): void {
    this.logger.trace(this.prefix, ...args);
  }
}
