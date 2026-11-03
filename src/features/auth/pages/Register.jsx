import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, CheckCircle } from 'lucide-react';
import '@/shared/styles/responsive.css';
import '../login.css';
import { authStyles } from '@/features/auth/auth.styles';
import AuthField from '@/features/auth/components/AuthField';
import AuthShell from '@/features/auth/components/AuthShell';
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
    <AuthShell
      banner="Únete a nosotros"
      title="Crea tu"
      highlight="Cuenta"
      description="Regístrate para conseguir ofertas exclusivas en peluches"
    >
      <form style={styles.form} onSubmit={handleSubmit}>
        <AuthField
          id="name"
          name="name"
          label="Nombre completo"
          icon={<User size={18} style={styles.icon} />}
          placeholder="Tu nombre"
          value={formData.name}
          onChange={handleChange}
        />

        <AuthField
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          icon={<Mail size={18} style={styles.icon} />}
          placeholder="tu@email.com"
          value={formData.email}
          onChange={handleChange}
        />

        <div style={styles.row}>
          <AuthField
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            icon={<Lock size={18} style={styles.icon} />}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <AuthField
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirmar contraseña"
          icon={<CheckCircle size={18} style={styles.icon} />}
          placeholder="••••••••"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={Boolean(error)}
        >
          {error && <span style={styles.errorText}>{error}</span>}
        </AuthField>

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
    </AuthShell>
  );
};

export default Register;