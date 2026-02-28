import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Sparkles, User, CheckCircle } from 'lucide-react';
import '@/shared/styles/responsive.css';
import '../login.css';
import { authStyles } from '@/features/auth/auth.styles';
import { colors } from '@/shared/styles/theme';
import { authService as apiService } from '@/features/auth/services/authService';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Limpiar error al escribir
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación simple
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      // Call backend register API
      const response = await apiService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      console.log('Usuario registrado exitosamente:', response);

      // Redirigir al login después del registro
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Este correo electrónico ya está registrado o ocurrió un error');
    }
  };

  const styles = authStyles;

  return (
    <div style={styles.container} className="login-container-responsive">
      <div style={styles.card} className="login-card-responsive">
        <div style={styles.header}>
          <div style={styles.banner}>
            <Sparkles size={16} />
            Únete a nosotros
          </div>
          <h1 style={styles.title}>
            Crea tu <span style={styles.highlight}>Cuenta</span>
          </h1>
          <p style={styles.description}>
            Regístrate para conseguir ofertas exclusivas en peluches
          </p>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="name">
              <User size={18} style={styles.icon} />
              Nombre completo
            </label>
            <input
              id="name"
              type="text"
              name="name"
              style={styles.input}
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="email">
              <Mail size={18} style={styles.icon} />
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              style={styles.input}
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="password">
                <Lock size={18} style={styles.icon} />
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                name="password"
                style={styles.input}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label} htmlFor="confirmPassword">
              <CheckCircle size={18} style={styles.icon} />
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              style={{
                ...styles.input,
                borderColor: error ? colors.redError : '#e5e5e5'
              }}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {error && <span style={styles.errorText}>{error}</span>}
          </div>

          <button type="submit" style={styles.submitButton} className="login-submit-button">
            Registrarse
            <ArrowRight size={20} />
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" style={styles.link}>
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;