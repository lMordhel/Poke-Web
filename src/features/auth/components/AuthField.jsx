import { authStyles } from '@/features/auth/auth.styles';
import { colors } from '@/shared/styles/theme';

/**
 * Label + icon + input group shared by the login and register forms.
 *
 * Both pages rendered the same field subtree; it lives here so the markup, the
 * error border and the optional focus highlight exist once (react-doctor
 * `duplicate-jsx-subtree`). The pages only describe their own fields.
 *
 * `focusHighlight` keeps the login behaviour of tinting the border while the
 * field has focus; the register form never had it, so it stays off by default.
 */
const AuthField = ({
  id,
  name,
  type = 'text',
  label,
  icon,
  placeholder,
  value,
  onChange,
  error = false,
  focusHighlight = false,
  children,
}) => {
  const borderColor = error ? colors.redError : '#e5e5e5';

  return (
    <div style={authStyles.inputGroup}>
      <label style={authStyles.label} htmlFor={id}>
        {icon}
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        style={{ ...authStyles.input, borderColor }}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={
          focusHighlight
            ? (e) => { e.target.style.borderColor = colors.yellowPrimary; }
            : undefined
        }
        onBlur={
          focusHighlight
            ? (e) => { e.target.style.borderColor = borderColor; }
            : undefined
        }
        required
      />
      {children}
    </div>
  );
};

export default AuthField;
