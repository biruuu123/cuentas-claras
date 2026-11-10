import { useState, type FormEvent } from 'react';
import { api, type Group } from '../api';
import { useAuth } from '../auth';
import { ErrorMessage, errorText } from './ui';

type Props = { group: Group; onChange: (g: Group) => void };

export function MembersTab({ group, onChange }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.id === group.adminId;
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Ingresá un email válido.');
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ group: Group }>(`/groups/${group.id}/members`, { method: 'POST', body: { email } });
      onChange(r.group);
      setEmail('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(memberId: number, name: string) {
    if (!window.confirm(`¿Quitar a ${name} del grupo?`)) return;
    setError(null);
    try {
      const r = await api<{ group: Group }>(`/groups/${group.id}/members/${memberId}`, { method: 'DELETE' });
      onChange(r.group);
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <section>
      {isAdmin && (
        <form className="inline-form card" onSubmit={onAdd} noValidate>
          <input
            type="email"
            aria-label="Email del nuevo miembro"
            placeholder="Email de una persona ya registrada"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="primary" disabled={busy}>{busy ? 'Agregando…' : 'Agregar miembro'}</button>
        </form>
      )}
      <ErrorMessage error={error} />
      <ul className="list">
        {group.members.map((m) => (
          <li key={m.id} className="card row">
            <span>
              <strong>{m.name}</strong> <span className="muted">{m.email}</span>
              {m.id === group.adminId && <> <span className="badge">admin</span></>}
            </span>
            {isAdmin && m.id !== group.adminId && (
              <button className="danger" onClick={() => onRemove(m.id, m.name)}>Quitar</button>
            )}
          </li>
        ))}
      </ul>
      {!isAdmin && <p className="hint">Solo el administrador puede agregar o quitar miembros.</p>}
    </section>
  );
}
