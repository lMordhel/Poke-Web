import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import '@/shared/styles/responsive.css';
import '../login.css';
import { authStyles } from '@/features/auth/auth.styles';
import { colors } from '@/shared/styles/theme';
import { authService as apiService } from '@/features/auth/services/authService';
import { useAuth } from '@/features/auth';
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
      const response = await apiService.login({ email, password });

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
    <div style={styles.container} className="login-container-responsive">
      <div style={styles.card} className="login-card-responsive">
        <div style={styles.header}>
          <div style={styles.banner}>
            <Sparkles size={16} />
            Bienvenido de vuelta
          </div>
          <h1 style={styles.title}>
            Inicia <span style={styles.highlight}>Sesión</span>
          </h1>
          <p style={styles.description}>
            Accede a tu cuenta para continuar comprando tus peluches favoritos
          </p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Mail size={18} style={styles.icon} />
              Correo electrónico
            </label>
            <input
              type="email"
              style={{
                ...styles.input,
                borderColor: error ? colors.redError : '#e5e5e5'
              }}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(''); // Limpiar error al escribir
              }}
              onFocus={(e) => e.target.style.borderColor = colors.yellowPrimary}
              onBlur={(e) => e.target.style.borderColor = error ? '#ff4444' : '#e5e5e5'}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <Lock size={18} style={styles.icon} />
              Contraseña
            </label>
            <input
              type="password"
              style={{
                ...styles.input,
                borderColor: error ? colors.redError : '#e5e5e5'
              }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(''); // Limpiar error al escribir
              }}
              onFocus={(e) => e.target.style.borderColor = colors.yellowPrimary}
              onBlur={(e) => e.target.style.borderColor = error ? '#ff4444' : '#e5e5e5'}
              required
            />
            {error && <span style={styles.errorText}>{error}</span>}
          </div>

          <div style={styles.options}>
            <label style={styles.checkboxLabel}>
              <input type="checkbox" style={styles.checkbox} />
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
      </div>
    </div>
  );
};
export default Login;

