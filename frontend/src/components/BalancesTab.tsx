import { useCallback, useEffect, useState } from 'react';
import { api, type Balance, type Group, type Transfer } from '../api';
import { useAuth } from '../auth';
import { formatMoney } from '../money';
import { Empty, ErrorMessage, Loading, errorText } from './ui';

export function BalancesTab({ group, onPaid }: { group: Group; onPaid: () => void }) {
  const { user } = useAuth();
  const [data, setData] = useState<{ balances: Balance[]; settlement: Transfer[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(() => {
    api<{ balances: Balance[]; settlement: Transfer[] }>(`/groups/${group.id}/balances`)
      .then(setData)
      .catch((e) => setError(errorText(e)));
  }, [group.id]);

  useEffect(load, [load]);

  async function pay(t: Transfer, index: number) {
    if (!window.confirm(`¿Registrar que le pagaste ${formatMoney(t.amount)} a ${t.toName}? Queda pendiente hasta que lo confirme.`)) return;
    setBusy(index);
    setError(null);
    try {
      await api(`/groups/${group.id}/payments`, { method: 'POST', body: { toId: t.toId, amount: t.amount } });
      onPaid();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  if (!data) return error ? <ErrorMessage error={error} /> : <Loading />;

  return (
    <section>
      <h2>Saldos</h2>
      <ul className="list">
        {data.balances.map((b) => (
          <li key={b.userId} className="card row">
            <span>{b.name}{b.userId === user?.id && ' (vos)'}</span>
            <span className={b.balance > 0 ? 'positive' : b.balance < 0 ? 'negative' : 'muted'}>
              {b.balance > 0 ? `le deben ${formatMoney(b.balance)}` : b.balance < 0 ? `debe ${formatMoney(-b.balance)}` : 'al día'}
            </span>
          </li>
        ))}
      </ul>

      <h2>Cómo saldar las cuentas</h2>
      <p className="hint">La menor cantidad de transferencias para que todos queden en cero. Los pagos pendientes no se descuentan hasta que se confirman.</p>
      <ErrorMessage error={error} />
      {data.settlement.length === 0 && <Empty>Todas las cuentas están saldadas.</Empty>}
      <ul className="list">
        {data.settlement.map((t, i) => (
          <li key={`${t.fromId}-${t.toId}`} className="card row">
            <span><strong>{t.fromName}</strong> le paga a <strong>{t.toName}</strong> {formatMoney(t.amount)}</span>
            {t.fromId === user?.id && (
              <button className="primary" disabled={busy !== null} onClick={() => pay(t, i)}>
                {busy === i ? 'Registrando…' : 'Registrar este pago'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
