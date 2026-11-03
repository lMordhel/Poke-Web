import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import '@/shared/styles/responsive.css';
import '../login.css';
import { authStyles } from '@/features/auth/auth.styles';
import { authService as apiService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth';
import AuthField from '@/features/auth/components/AuthField';
import AuthShell from '@/features/auth/components/AuthShell';
import { useActivity } from '@/features/dashboard';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const { logActivity } = useActivity();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    try {
      // Call backend login API
      await apiService.login({ email, password });

      // Get user data from backend
      const userData = await apiService.getCurrentUser();

      // Store current user data
      const currentUserData = {
        id: userData.id,
        name: userData.name || email.split('@')[0], // Fallback to email prefix if no name
        email: userData.email,
        role: userData.role
      };

      // Use AuthContext to manage global state
      login(currentUserData);

      logActivity('login', 'Inicio de sesión', `Bienvenido al panel, ${currentUserData.name || 'usuario'}`);

      console.log('Login exitoso:', currentUserData);

      // Redirigir según el rol
      if (currentUserData.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Correo electrónico o contraseña incorrectos');
    }
  };

  const styles = authStyles;

  return (
    <AuthShell
      banner="Bienvenido de vuelta"
      title="Inicia"
      highlight="Sesión"
      description="Accede a tu cuenta para continuar comprando tus peluches favoritos"
    >
      <form style={styles.form} onSubmit={handleSubmit}>
        <AuthField
          id="email"
          type="email"
          label="Correo electrónico"
          icon={<Mail size={18} style={styles.icon} />}
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(''); // Limpiar error al escribir
          }}
          error={Boolean(error)}
          focusHighlight
        />

        <AuthField
          id="password"
          type="password"
          label="Contraseña"
          icon={<Lock size={18} style={styles.icon} />}
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (error) setError(''); // Limpiar error al escribir
          }}
          error={Boolean(error)}
          focusHighlight
        >
          {error && <span style={styles.errorText}>{error}</span>}
        </AuthField>

        <div style={styles.options}>
          <label style={styles.checkboxLabel} htmlFor="remember">
            <input id="remember" type="checkbox" style={styles.checkbox} />
            Recordarme
          </label>
          <Link to="/recuperar" style={styles.forgotLink}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button type="submit" style={styles.submitButton} className="login-submit-button">
          Iniciar Sesión
          <ArrowRight size={20} />
        </button>
      </form>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          ¿No tienes una cuenta?{' '}
          <Link to="/Register" style={styles.link} className="login-link">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default Login;

