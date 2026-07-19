// Ambient type declaration for Node's built-in `node:sqlite` module.
// @types/node v20 does not yet ship these types, and the module cannot be
// augmented (TS2664) from within a module file, so we declare it globally here.
declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): {
      all: (...params: unknown[]) => unknown[];
      get: (...params: unknown[]) => unknown;
      run: (...params: unknown[]) => { changes: number; lastInsertRowid: unknown };
    };
    close(): void;
  }
}
