import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required('JWT_SECRET'),
  /** Orígenes permitidos por CORS, separados por coma. */
  frontendUrls: (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean),
};
