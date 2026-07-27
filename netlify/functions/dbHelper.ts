import fs from 'fs';
import path from 'path';

export function getDB(context: any): any {
  let db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;
  if (!db) {
    try {
      const cwd = process.cwd();
      console.log(`[dbHelper] Fallback active. CWD = ${cwd}`);
      const dir = path.join(cwd, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
      console.log(`[dbHelper] Target DB dir = ${dir}. Exists? = ${fs.existsSync(dir)}`);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.sqlite'));
        console.log(`[dbHelper] SQLite files found:`, files);
        if (files.length > 0) {
          const dbPath = path.join(dir, files[0]);
          // Dynamic require string construction to prevent bundler compilation rewrites
          const sqliteModule = 'node' + ':sqlite';
          const { DatabaseSync } = require(sqliteModule);
          const localDb = new DatabaseSync(dbPath);
          db = {
            prepare(sql: string) {
              const stmt = localDb.prepare(sql);
              let boundArgs: any[] = [];
              const d1Stmt = {
                bind(...args: any[]) {
                  boundArgs = args.map(arg => typeof arg === 'undefined' ? null : arg);
                  return d1Stmt;
                },
                async run() {
                  const info = stmt.run(...boundArgs);
                  return { success: true, meta: { changes: info.changes, lastRowId: info.lastInsertRowid } };
                },
                async all() {
                  const rows = stmt.all(...boundArgs);
                  return { success: true, results: rows };
                },
                async first() {
                  return stmt.get(...boundArgs);
                }
              };
              return d1Stmt;
            }
          };
        }
      }
    } catch (e: any) {
      console.warn("Local SQLite fallback failed:", e.message);
    }
  }
  return db;
}
