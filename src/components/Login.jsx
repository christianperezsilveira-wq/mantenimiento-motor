import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Wrench, 
  Mail, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { checkRateLimit, resetRateLimit } from '../utils/rateLimiter';

const Login = () => {
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, continueAsGuest } = useAuth();
  
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Rate Limiting anti-bruteforce check
    const rateCheck = checkRateLimit(`login_attempt_${email.toLowerCase().trim()}`, 5, 60000);
    if (!rateCheck.allowed) {
      setError(rateCheck.errorMsg);
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        if (!nombre.trim()) {
          throw new Error('Por favor ingresa tu nombre completo.');
        }
        await signUpWithEmail(email, password, nombre);
        resetRateLimit(`login_attempt_${email.toLowerCase().trim()}`);
        setSuccessMsg('¡Cuenta creada con éxito! Iniciando sesión...');
      } else {
        await loginWithEmail(email, password);
        resetRateLimit(`login_attempt_${email.toLowerCase().trim()}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error al procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || 'No se pudo iniciar sesión con Google.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        {/* Encabezado Principal con Logo */}
        <div className="login-header">
          <div className="login-official-logo-wrapper">
            <img src="/logo_oficial.jpg" alt="Logo Oficial" className="login-official-logo" />
          </div>
          <h2>Mantenimiento & Motores</h2>
          <span className="login-motto-tag">CONTROL & POTENCIA</span>
          <p className="login-subtitle">
            Control integral de flota, preventivos por odómetro e historial en la nube
          </p>
        </div>

        {/* Mensajes de Alerta/Error/Éxito */}
        {error && (
          <div className="login-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="login-alert success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Botón de Google OAuth */}
        <button 
          type="button" 
          onClick={handleGoogleLogin} 
          disabled={loading}
          className="btn-google"
        >
          <svg className="google-svg" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="login-divider">
          <span>o ingresa con tu correo</span>
        </div>

        {/* Selector de Pestañas (Iniciar Sesión / Registrarse) */}
        <div className="login-tabs">
          <button 
            className={`login-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(false); setError(null); }}
          >
            <LogIn size={16} />
            <span>Iniciar Sesión</span>
          </button>
          <button 
            className={`login-tab ${isRegister ? 'active' : ''}`}
            onClick={() => { setIsRegister(true); setError(null); }}
          >
            <UserPlus size={16} />
            <span>Crear Cuenta</span>
          </button>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <div className="form-group">
              <label>Nombre Completo</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Ej. Carlos Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-submit-login" 
            disabled={loading}
          >
            {loading ? (
              <span>Cargando...</span>
            ) : isRegister ? (
              <>
                <span>Registrar Mi Cuenta</span>
                <UserPlus size={18} />
              </>
            ) : (
              <>
                <span>Ingresar a la Plataforma</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Pie de Login - Modo Invitado */}
        <div className="login-footer">
          <div className="privacy-badge">
            <ShieldCheck size={14} />
            <span>Tus datos están aislados y encriptados en la nube</span>
          </div>

          <button 
            type="button" 
            onClick={continueAsGuest}
            className="btn-guest-mode"
          >
            Probar en modo invitado (Local)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
