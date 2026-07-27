import { execSync } from 'child_process';
console.log("🚀 Executing sync-audio-to-d1.ts via tsx runner...");
try {
  execSync('npx tsx src/sync-audio-to-d1.ts', { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
