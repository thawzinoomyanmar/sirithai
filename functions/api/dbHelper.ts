import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';

export function getDB(context: any): any {
  let db = (context && context.env && context.env.DB) || (globalThis as any).env?.DB || (process.env as any).DB;
  if (!db) {
    try {
      const cwd = process.cwd();
      const dir = path.join(cwd, '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter((f: string) => f.endsWith('.sqlite') && !f.startsWith('metadata'));
        if (files.length > 0) {
          const dbPath = path.join(dir, files[0]);
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
      console.warn("[dbHelper] Local SQLite fallback note:", e.message);
    }
  }
  return db;
}

export function jsonResponse(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...extraHeaders,
    },
  });
}

export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Static-Admin',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}
