import { useAuth } from '@/features/auth';

/**
 * Sesión no verificada (S24): `/auth/me` no respondió por red o 5xx. No se
 * cierra la sesión por un fallo transitorio ni se abre la ruta sin confirmarla.
 */
const SessionUnavailable = () => {
  const { revalidate } = useAuth();

  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: '#18181b' }}>
      <h1 style={{ fontSize: '20px', margin: '0 0 8px' }}>No pudimos verificar tu sesión</h1>
      <p style={{ margin: '0 0 16px', color: '#52525b' }}>
        El servidor no respondió. Tu sesión sigue guardada: reintenta cuando vuelvas a tener conexión.
      </p>
      <button
        type="button"
        onClick={() => revalidate()}
        style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#facc15', fontWeight: 600, cursor: 'pointer' }}
      >
        Reintentar
      </button>
    </div>
  );
};

export default SessionUnavailable;
