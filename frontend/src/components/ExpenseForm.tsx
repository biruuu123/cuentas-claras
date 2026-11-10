import { useState, type FormEvent } from 'react';
import { api, type Expense, type Group, type SplitType } from '../api';
import { useAuth } from '../auth';
import { centsToInput, parseMoney } from '../money';
import { buildSplit } from '../split';
import { ErrorMessage, errorText } from './ui';

type Props = { group: Group; expense?: Expense; onSaved: () => void; onCancel: () => void };

const SPLIT_LABELS: Record<SplitType, string> = {
  IGUAL: 'Partes iguales',
  PORCENTAJE: 'Por porcentaje',
  EXACTO: 'Montos exactos',
};

function initialValues(expense?: Expense): Record<number, string> {
  if (!expense || expense.splitType === 'IGUAL') return {};
  return Object.fromEntries(
    expense.shares.map((s) => [
      s.userId,
      expense.splitType === 'PORCENTAJE' ? String((s.basisPoints ?? 0) / 100).replace('.', ',') : centsToInput(s.amount),
    ]),
  );
}

export function ExpenseForm({ group, expense, onSaved, onCancel }: Props) {
  const { user } = useAuth();
  const [description, setDescription] = useState(expense?.description ?? '');
  const [amount, setAmount] = useState(expense ? centsToInput(expense.amount) : '');
  const [payerId, setPayerId] = useState(expense?.payerId ?? user?.id ?? group.members[0]!.id);
  const [type, setType] = useState<SplitType>(expense?.splitType ?? 'IGUAL');
  const [selected, setSelected] = useState<number[]>(
    expense?.splitType === 'IGUAL' ? expense.shares.map((s) => s.userId) : group.members.map((m) => m.id),
  );
  const [values, setValues] = useState<Record<number, string>>(initialValues(expense));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return setError('Escribí una descripción.');
    const total = parseMoney(amount);
    const result = buildSplit(total, { type, selected, values });
    if ('error' in result) return setError(result.error);
    setBusy(true);
    setError(null);
    const body = { description, amount: total, payerId, split: result.split };
    try {
      const base = `/groups/${group.id}/expenses`;
      if (expense) await api(`${base}/${expense.id}`, { method: 'PUT', body });
      else await api(base, { method: 'POST', body });
      onSaved();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].sort((a, b) => a - b)));

  return (
    <form className="card" onSubmit={onSubmit} noValidate>
      <h2 style={{ marginTop: 0 }}>{expense ? 'Editar gasto' : 'Nuevo gasto'}</h2>
      <label>
        Descripción
        <input value={description} maxLength={120} onChange={(e) => setDescription(e.target.value)} placeholder="Ej.: Supermercado" />
      </label>
      <label>
        Monto total ($)
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Ej.: 1.500,50" />
      </label>
      <label>
        Pagó
        <select value={payerId} onChange={(e) => setPayerId(Number(e.target.value))}>
          {group.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </label>
      <label>
        Cómo se reparte
        <select value={type} onChange={(e) => setType(e.target.value as SplitType)}>
          {(Object.keys(SPLIT_LABELS) as SplitType[]).map((t) => <option key={t} value={t}>{SPLIT_LABELS[t]}</option>)}
        </select>
      </label>

      {type === 'IGUAL' && (
        <fieldset className="card" style={{ margin: 0 }}>
          <legend>Participantes</legend>
          {group.members.map((m) => (
            <label key={m.id} className="checkbox">
              <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggle(m.id)} />
              {m.name}
            </label>
          ))}
          <p className="hint">Si no divide exacto, los centavos que sobran se asignan de a uno a los primeros miembros.</p>
        </fieldset>
      )}

      {type !== 'IGUAL' && (
        <fieldset className="card" style={{ margin: 0 }}>
          <legend>{type === 'PORCENTAJE' ? 'Porcentaje de cada uno (deben sumar 100)' : 'Monto de cada uno (deben sumar el total)'}</legend>
          <div className="split-grid">
            {group.members.map((m) => (
              <label key={m.id} style={{ display: 'contents' }}>
                <span>{m.name}</span>
                <input
                  inputMode="decimal"
                  aria-label={`Parte de ${m.name}`}
                  placeholder={type === 'PORCENTAJE' ? '%' : '$'}
                  value={values[m.id] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [m.id]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          <p className="hint">Dejá vacío a quien no participa.</p>
        </fieldset>
      )}

      <ErrorMessage error={error} />
      <div className="row-actions">
        <button className="primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar gasto'}</button>
        <button type="button" onClick={onCancel} disabled={busy}>Cancelar</button>
      </div>
    </form>
  );
}
