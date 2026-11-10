import type { ReactNode } from 'react';

export function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="error" role="alert">
      {error}
    </p>
  );
}

export function Loading({ text = 'Cargando…' }: { text?: string }) {
  return <p className="muted" aria-busy="true">{text}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="empty">{children}</p>;
}

export function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Ocurrió un error.';
}
