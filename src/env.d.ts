/// <reference types="astro/client" />
/** Minimal typing for the Workers runtime env - avoids pulling @cloudflare/workers-types
 *  into the whole project, whose HTMLRewriter `Element` clashes with the DOM lib. */
declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}

/** Just enough of the D1 surface for src/lib/db.ts, for the same reason. */
interface D1Result<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = Record<string, unknown>>(): Promise<D1Result<T>>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = Record<string, unknown>>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

/** Just enough of the scheduled-handler surface for src/worker.ts, for the
 *  same reason: the full workers-types package cannot be pulled in. */
interface ScheduledController {
  readonly scheduledTime: number;
  readonly cron: string;
  noRetry(): void;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
