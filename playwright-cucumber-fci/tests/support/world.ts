// tests/support/world.ts
import { IWorldOptions, setWorldConstructor, World } from '@cucumber/cucumber';
import type { Browser, BrowserContext, Page } from 'playwright';

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;

  runId?: string;

  // Observability buffers
  consoleLogs: string[] = [];
  networkLogs: Array<{
    ts: string;
    type: 'requestfailed' | 'response';
    method?: string;
    url: string;
    status?: number;
    failureText?: string;
  }> = [];

  // Step timing
  stepStartTs?: number;

  constructor(options: IWorldOptions) {
    super(options);
  }
}

setWorldConstructor(CustomWorld);
