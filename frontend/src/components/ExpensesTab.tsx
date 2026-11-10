import { useCallback, useEffect, useState } from 'react';
import { api, type Expense, type Group } from '../api';
import { useAuth } from '../auth';
import { formatMoney } from '../money';
import { ExpenseForm } from './ExpenseForm';
import { Empty, ErrorMessage, Loading, errorText } from './ui';

const SPLIT_SHORT = { IGUAL: 'iguales', PORCENTAJE: 'por %', EXACTO: 'exacto' } as const;

export function ExpensesTab({ group }: { group: Group }) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Expense | 'new' | null>(null);

  const load = useCallback(() => {
    api<{ expenses: Expense[] }>(`/groups/${group.id}/expenses`)
      .then((r) => setExpenses(r.expenses))
      .catch((e) => setError(errorText(e)));
  }, [group.id]);

  useEffect(load, [load]);

  async function onDelete(e: Expense) {
    if (!window.confirm(`¿Eliminar "${e.description}"?`)) return;
    setError(null);
    try {
      await api(`/groups/${group.id}/expenses/${e.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(errorText(err));
    }
  }

  const canEdit = (e: Expense) => user?.id === e.createdById || user?.id === group.adminId;

  if (editing) {
    return (
      <ExpenseForm
        group={group}
        expense={editing === 'new' ? undefined : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    );
  }

  return (
    <section>
      <button className="primary" onClick={() => setEditing('new')}>+ Agregar gasto</button>
      <ErrorMessage error={error} />
      {!expenses && !error && <Loading />}
      {expenses && expenses.length === 0 && <Empty>No hay gastos todavía.</Empty>}
      <ul className="list" style={{ marginTop: '1rem' }}>
        {expenses?.map((e) => (
          <li key={e.id} className="card">
            <div className="row">
              <strong>{e.description}</strong>
              <strong>{formatMoney(e.amount)}</strong>
            </div>
            <p className="hint">
              Pagó {e.payer.name} · {new Date(e.createdAt).toLocaleDateString('es-AR')} · reparto {SPLIT_SHORT[e.splitType]}:{' '}
              {e.shares.map((s) => `${s.user.name} ${formatMoney(s.amount)}`).join(', ')}
            </p>
            {canEdit(e) && (
              <div className="row-actions" style={{ marginTop: '0.5rem' }}>
                <button onClick={() => setEditing(e)}>Editar</button>
                <button className="danger" onClick={() => onDelete(e)}>Eliminar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
