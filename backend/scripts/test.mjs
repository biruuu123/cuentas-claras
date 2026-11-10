// Ejecuta todos los tests contra un esquema "test" separado dentro de la misma base de Neon.
// Así los tests nunca tocan los datos reales (esquema "public").
import 'dotenv/config';
import { execSync } from 'node:child_process';

const base = process.env.DATABASE_URL;
if (!base) {
  console.error('Falta DATABASE_URL en backend/.env');
  process.exit(1);
}
const url = new URL(base);
url.searchParams.set('schema', 'test');

const env = {
  ...process.env,
  DATABASE_URL: url.toString(),
  JWT_SECRET: process.env.JWT_SECRET || 'secreto-solo-para-tests',
  NODE_ENV: 'test',
};

try {
  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', { stdio: 'inherit', env });
  execSync('npx tsx --test --test-concurrency=1 "test/**/*.test.ts"', { stdio: 'inherit', env });
} catch {
  process.exit(1);
}
