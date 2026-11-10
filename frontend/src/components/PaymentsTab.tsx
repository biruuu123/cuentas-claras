import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, type Group, type Payment, type PaymentStatus } from '../api';
import { useAuth } from '../auth';
import { formatMoney, parseMoney } from '../money';
import { Empty, ErrorMessage, Loading, errorText } from './ui';

const STATUS: Record<PaymentStatus, { label: string; className: string }> = {
  PENDIENTE: { label: 'pendiente', className: 'badge pending' },
  CONFIRMADO: { label: 'confirmado', className: 'badge ok' },
  RECHAZADO: { label: 'rechazado', className: 'badge rejected' },
};

export function PaymentsTab({ group }: { group: Group }) {
  const { user } = useAuth();
  const others = group.members.filter((m) => m.id !== user?.id);
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toId, setToId] = useState<number | ''>(others[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ payments: Payment[] }>(`/groups/${group.id}/payments`)
      .then((r) => setPayments(r.payments))
      .catch((e) => setError(errorText(e)));
  }, [group.id]);

  useEffect(load, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const cents = parseMoney(amount);
    if (toId === '') return setFormError('Elegí a quién le pagaste.');
    if (cents === null) return setFormError('Ingresá un monto válido.');
    setBusy(true);
    setFormError(null);
    try {
      await api(`/groups/${group.id}/payments`, { method: 'POST', body: { toId, amount: cents } });
      setAmount('');
      load();
    } catch (err) {
      setFormError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function resolve(p: Payment, decision: 'CONFIRMADO' | 'RECHAZADO') {
    setError(null);
    try {
      await api(`/groups/${group.id}/payments/${p.id}/resolve`, { method: 'POST', body: { decision } });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <section>
      {others.length > 0 && (
        <form className="card" onSubmit={onCreate} noValidate>
          <h2 style={{ marginTop: 0 }}>Registrar un pago que hiciste</h2>
          <label>
            Le pagué a
            <select value={toId} onChange={(e) => setToId(Number(e.target.value))}>
              {others.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>
            Monto ($)
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej.: 3.000" />
          </label>
          <ErrorMessage error={formError} />
          <button className="primary" disabled={busy}>{busy ? 'Registrando…' : 'Registrar pago'}</button>
          <p className="hint">Solo podés pagar hasta lo que debés. El pago cuenta cuando quien lo recibe lo confirma.</p>
        </form>
      )}

      <h2>Historial</h2>
      <ErrorMessage error={error} />
      {!payments && !error && <Loading />}
      {payments && payments.length === 0 && <Empty>No hay pagos registrados.</Empty>}
      <ul className="list">
        {payments?.map((p) => (
          <li key={p.id} className="card">
            <div className="row">
              <span><strong>{p.from.name}</strong> → <strong>{p.to.name}</strong> {formatMoney(p.amount)}</span>
              <span className={STATUS[p.status].className}>{STATUS[p.status].label}</span>
            </div>
            <p className="hint">{new Date(p.createdAt).toLocaleDateString('es-AR')}</p>
            {p.status === 'PENDIENTE' && p.toId === user?.id && (
              <div className="row-actions" style={{ marginTop: '0.5rem' }}>
                <button className="primary" onClick={() => resolve(p, 'CONFIRMADO')}>Confirmar que lo recibí</button>
                <button className="danger" onClick={() => resolve(p, 'RECHAZADO')}>Rechazar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
