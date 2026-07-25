// Type declarations for modules without @types packages

declare module "check-disk-space" {
  interface DiskSpaceResult {
    diskPath: string;
    fsType: string | null;
    size: number;
    free: number;
    used: number;
  }
  function checkDiskSpace(path: string): Promise<DiskSpaceResult>;
  export = checkDiskSpace;
}

declare module "cron-parser" {
  interface CronParserOptions {
    currentDate?: Date | string;
    tz?: string;
    iterator?: boolean;
    reversed?: boolean;
  }

  interface CronExpression {
    next(): { value: Date };
    prev(): { value: Date };
    hasNext(): boolean;
    hasPrev(): boolean;
  }

  interface CronParser {
    parseExpression(expression: string, options?: CronParserOptions): CronExpression;
  }

  const cronParser: CronParser;
  export = cronParser;
}
