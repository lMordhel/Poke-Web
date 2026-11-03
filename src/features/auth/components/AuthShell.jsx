import { Sparkles } from 'lucide-react';
import { authStyles } from '@/features/auth/auth.styles';

/**
 * Layout shared by the login and register pages: the responsive container, the
 * card and the banner/title/description header.
 *
 * Both pages rendered the same shell (react-doctor `duplicate-jsx-subtree`), so
 * it lives here; each page owns only its own form and footer.
 */
const AuthShell = ({ banner, title, highlight, description, children }) => (
  <div style={authStyles.container} className="login-container-responsive">
    <div style={authStyles.card} className="login-card-responsive">
      <div style={authStyles.header}>
        <div style={authStyles.banner}>
          <Sparkles size={16} />
          {banner}
        </div>
        <h1 style={authStyles.title}>
          {title} <span style={authStyles.highlight}>{highlight}</span>
        </h1>
        <p style={authStyles.description}>{description}</p>
      </div>

      {children}
    </div>
  </div>
);

export default AuthShell;
