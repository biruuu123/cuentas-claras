import type { ReactNode } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth';
import { Loading } from './components/ui';
import { LoginPage, RegisterPage } from './pages/AuthPages';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function Header() {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <Link to="/" className="brand">Cuentas Claras</Link>
      {user && (
        <div className="topbar-user">
          <span>{user.name}</span>
          <button className="link" onClick={logout}>Salir</button>
        </div>
      )}
    </header>
  );
}

function Home() {
  const { user } = useAuth();
  return <p>Hola, {user?.name}.</p>;
}

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/login" element={<PublicOnly><LoginPage /></PublicOnly>} />
          <Route path="/registro" element={<PublicOnly><RegisterPage /></PublicOnly>} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
