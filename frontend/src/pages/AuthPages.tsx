import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { ErrorMessage, errorText } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError('Ingresá un email válido.');
    if (!password) return setError('Ingresá tu contraseña.');
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Iniciar sesión</h1>
      <form onSubmit={onSubmit} noValidate>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <ErrorMessage error={error} />
        <button className="primary" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</button>
      </form>
      <p className="muted">¿No tenés cuenta? <Link to="/registro">Registrate</Link></p>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Ingresá tu nombre.');
    if (!EMAIL_RE.test(email.trim())) return setError('Ingresá un email válido.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    setBusy(true);
    setError(null);
    try {
      await register(email, name, password);
      navigate('/');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Crear cuenta</h1>
      <form onSubmit={onSubmit} noValidate>
        <label>
          Nombre
          <input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </label>
        <label>
          Email
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Contraseña <span className="muted">(mínimo 8 caracteres)</span>
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <ErrorMessage error={error} />
        <button className="primary" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</button>
      </form>
      <p className="muted">¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link></p>
    </div>
  );
}
