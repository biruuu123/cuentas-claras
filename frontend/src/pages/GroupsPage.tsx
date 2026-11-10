import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type Group, type GroupSummary } from '../api';
import { useAuth } from '../auth';
import { Empty, ErrorMessage, Loading, errorText } from '../components/ui';

export function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ groups: GroupSummary[] }>('/groups')
      .then((r) => setGroups(r.groups))
      .catch((e) => setLoadError(errorText(e)));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Poné un nombre para el grupo.');
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ group: Group }>('/groups', { method: 'POST', body: { name } });
      navigate(`/grupos/${r.group.id}`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <>
      <h1>Mis grupos</h1>
      <section className="card">
        <form className="inline-form" onSubmit={onCreate} noValidate>
          <input
            aria-label="Nombre del nuevo grupo"
            placeholder="Nombre del grupo (ej.: Viaje a Córdoba)"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="primary" disabled={busy}>{busy ? 'Creando…' : 'Crear grupo'}</button>
        </form>
        <ErrorMessage error={error} />
      </section>

      <ErrorMessage error={loadError} />
      {!groups && !loadError && <Loading />}
      {groups && groups.length === 0 && <Empty>Todavía no estás en ningún grupo. Creá uno arriba.</Empty>}
      {groups && groups.length > 0 && (
        <ul className="list">
          {groups.map((g) => (
            <li key={g.id} className="card row">
              <Link to={`/grupos/${g.id}`}><strong>{g.name}</strong></Link>
              <span className="muted">
                {g.memberCount} {g.memberCount === 1 ? 'miembro' : 'miembros'}
                {g.adminId === user?.id && ' · sos admin'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
