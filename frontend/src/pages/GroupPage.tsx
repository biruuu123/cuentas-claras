import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, type Group } from '../api';
import { MembersTab } from '../components/MembersTab';
import { ErrorMessage, Loading, errorText } from '../components/ui';

const TABS = [{ id: 'miembros', label: 'Miembros' }] as const;
type TabId = (typeof TABS)[number]['id'];

export function GroupPage() {
  const groupId = Number(useParams().groupId);
  const [group, setGroup] = useState<Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>(TABS[0].id);

  useEffect(() => {
    setGroup(null);
    setError(null);
    api<{ group: Group }>(`/groups/${groupId}`)
      .then((r) => setGroup(r.group))
      .catch((e) => setError(errorText(e)));
  }, [groupId]);

  if (error) return (<><ErrorMessage error={error} /><p><Link to="/">Volver a mis grupos</Link></p></>);
  if (!group) return <Loading />;

  return (
    <>
      <p><Link to="/">← Mis grupos</Link></p>
      <h1>{group.name}</h1>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === 'miembros' && <MembersTab group={group} onChange={setGroup} />}
    </>
  );
}
