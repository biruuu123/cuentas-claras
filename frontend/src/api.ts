/** Cliente HTTP de la API. Toda llamada pasa por acá para manejar el token y los errores. */

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const TOKEN_KEY = 'cc_token';

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sin almacenamiento: la sesión dura lo que la pestaña */
  }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor. Si recién lo abriste, esperá un minuto y reintentá.');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event('cc:logout'));
    }
    throw new ApiError(res.status, data?.error?.code ?? 'ERROR', data?.error?.message ?? 'Ocurrió un error.');
  }
  return data as T;
}

export type User = { id: number; email: string; name: string };
export type Member = { id: number; name: string; email: string };
export type GroupSummary = { id: number; name: string; adminId: number; memberCount: number };
export type Group = { id: number; name: string; adminId: number; members: Member[] };
export type SplitType = 'IGUAL' | 'PORCENTAJE' | 'EXACTO';
export type Expense = {
  id: number;
  description: string;
  amount: number;
  splitType: SplitType;
  payerId: number;
  createdById: number;
  createdAt: string;
  payer: { id: number; name: string };
  shares: { userId: number; amount: number; basisPoints: number | null; user: { id: number; name: string } }[];
};
export type Balance = { userId: number; name: string; balance: number };
export type Transfer = { fromId: number; toId: number; amount: number; fromName: string; toName: string };
export type PaymentStatus = 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO';
export type Payment = {
  id: number;
  fromId: number;
  toId: number;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  from: { id: number; name: string };
  to: { id: number; name: string };
};
