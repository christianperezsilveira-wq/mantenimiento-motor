import React, { useState } from 'react';
import { 
  Wrench, 
  Car, 
  ShieldCheck, 
  CalendarClock, 
  FileText, 
  Smartphone, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Zap,
  Lock,
  Award,
  Flame,
  Globe,
  Download,
  Share2,
  HelpCircle,
  MessageCircle,
  Mail,
  MapPin,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

const LandingPage = ({ onExploreApp }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: '¿Cómo funciona la sincronización entre la Web y la App de Android?',
      a: 'Tus datos se guardan en la nube utilizando la misma base de datos de Supabase. Todo vehículo o mantenimiento que registres en la web aparecerá automáticamente en tu teléfono celular al iniciar sesión.'
    },
    {
      q: '¿Cómo calcula la app las alertas preventivas por kilometraje?',
      a: 'Configuras el intervalo de kilómetros deseado (ejemplo: Cambio de Aceite cada 10,000 km). La app compara el odómetro actual con el último servicio cargado y te notifica con alertas de color Verde (Al día), Amarillo (Próximo) o Rojo (Vencido).'
    },
    {
      q: '¿Cómo funciona el escáner OCR de facturas y comprobantes?',
      a: 'Puedes subir una foto o PDF de tu presupuesto o factura de taller. Nuestra inteligencia artificial OCR analiza el documento y completa automáticamente la fecha, costo total, mecánico y lista detallada de repuestos cambiados.'
    },
    {
      q: '¿Otros usuarios pueden ver mis vehículos o gastos?',
      a: 'No. El sistema utiliza seguridad de nivel de fila (Row Level Security). Cada cuenta es 100% privada e independiente, excepto para administradores autorizados que monitorean el estado global de la plataforma.'
    }
  ];

  return (
    <div className="landing-container copper-theme fade-in">
      {/* Navegación Superior de la Landing */}
      <nav className="landing-nav glass-panel">
        <div className="landing-nav-brand">
          <img src="/logo_oficial.jpg" alt="Logo" className="landing-mini-logo" />
          <span className="brand-name">MANTENIMIENTO <strong>MOTORES</strong></span>
        </div>

        <div className="landing-nav-links">
          <a href="#caracteristicas">Módulos</a>
          <a href="#android">App Android</a>
          <a href="#faq">Preguntas</a>
          <a href="#contacto">Contacto</a>
        </div>

        <button className="btn-nav-cta" onClick={onExploreApp}>
          <span>Ingresar a la App</span>
          <ArrowRight size={16} />
        </button>
      </nav>

      {/* Hero Principal con Logo Oficial */}
      <header className="landing-hero vintage-hero glass-panel">
        <div className="hero-badge copper-badge">
          <Award size={16} />
          <span>Sello Oficial • Control & Potencia</span>
        </div>

        <div className="hero-content">
          <div className="hero-official-logo-container">
            <div className="official-logo-glow"></div>
            <img 
              src="/logo_oficial.jpg" 
              alt="Logo Oficial Mantenimiento Motores" 
              className="hero-official-logo-img"
            />
          </div>

          <h1 className="hero-title copper-title">
            MANTENIMIENTO <span className="copper-text-gradient">MOTORES</span>
          </h1>

          <div className="hero-motto">
            <span>CONTROL & POTENCIA</span>
          </div>

          <p className="hero-subtitle copper-subtitle">
            Plataforma profesional para la gestión de flota, control preventivo por odómetro, escaneo inteligente de facturas OCR y directorio de talleres de confianza.
          </p>

          <div className="hero-cta-group">
            <button className="btn-hero-copper" onClick={onExploreApp}>
              <span>Ingresar a la Plataforma Web</span>
              <ArrowRight size={20} />
            </button>

            <a href="#android" className="btn-android-hero">
              <Smartphone size={20} />
              <span>Descargar App para Android</span>
            </a>
          </div>
        </div>

        <div className="hero-stats-bar copper-stats-bar">
          <div className="hero-stat-item">
            <span className="stat-num copper-num">100%</span>
            <span className="stat-desc">Aislamiento Privado</span>
          </div>
          <div className="hero-stat-divider copper-divider"></div>
          <div className="hero-stat-item">
            <span className="stat-num copper-num">KM</span>
            <span className="stat-desc">Alertas por Odómetro</span>
          </div>
          <div className="hero-stat-divider copper-divider"></div>
          <div className="hero-stat-item">
            <span className="stat-num copper-num">OCR</span>
            <span className="stat-desc">Lectura de Facturas</span>
          </div>
          <div className="hero-stat-divider copper-divider"></div>
          <div className="hero-stat-item">
            <span className="stat-num copper-num">24/7</span>
            <span className="stat-desc">Sincronización Cloud</span>
          </div>
        </div>
      </header>

      {/* Sección Destacada: Aplicación para Android */}
      <section id="android" className="landing-section-android glass-panel">
        <div className="android-section-grid">
          <div className="android-info-side">
            <div className="preview-tag copper-badge">
              <Smartphone size={16} />
              <span>Disponible Próximamente en Android</span>
            </div>

            <h2>Lleva el control de tus motores en la palma de tu mano</h2>
            <p>
              Diseñada para conductores, mecánicos y administradores de flotas. Todos los datos que cargues en la web se sincronizan al instante con tu teléfono inteligente Android.
            </p>

            <div className="android-buttons-group">
              <button className="btn-google-play-mock" onClick={() => alert('Próximamente disponible en Google Play Store')}>
                <div className="play-icon-shape">▶</div>
                <div className="play-btn-text">
                  <span className="play-sub">DISPONIBLE EN</span>
                  <span className="play-main">Google Play</span>
                </div>
              </button>

              <button className="btn-apk-download" onClick={() => alert('Iniciando descarga de MantenimientoMotores.apk (Modo Demo)')}>
                <Download size={18} />
                <span>Descargar APK Directo (.apk)</span>
              </button>
            </div>

            <ul className="preview-checklist copper-checklist">
              <li><CheckCircle2 size={18} className="text-copper" /> Notificaciones push preventivas antes de que se venza el kilometraje.</li>
              <li><CheckCircle2 size={18} className="text-copper" /> Escaneo de facturas y presupuestos directamente usando la cámara del celular.</li>
              <li><CheckCircle2 size={18} className="text-copper" /> Contacto por llamadas o WhatsApp a mecánicos con 1 solo toque.</li>
            </ul>
          </div>

          <div className="android-phone-mockup">
            <div className="phone-screen-frame">
              <div className="phone-notch"></div>
              <div className="phone-app-preview">
                <img src="/logo_oficial.jpg" alt="App Icon" className="phone-app-icon" />
                <h3>Mantenimiento Motores</h3>
                <span className="phone-tagline">CONTROL & POTENCIA</span>
                <div className="phone-mock-btn">Iniciar Sesión con Google</div>
                <div className="phone-mock-btn secondary">Probar App Móvil</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Módulos y Funcionalidades */}
      <section id="caracteristicas" className="landing-features-section">
        <div className="section-header copper-section-header">
          <h2>Módulos y Herramientas del Sistema</h2>
          <p>Potencia, precisión y control absoluto sobre la vida útil de tus motores</p>
        </div>

        <div className="features-grid">
          <div className="feature-card copper-card glass-panel">
            <div className="feature-icon-box copper-icon-box">
              <Car size={28} />
            </div>
            <h3>Gestión Multivehículo</h3>
            <p>Registra camionetas, automóviles, motos, tractores y camiones. Mantén el odómetro actualizado y consulta cotizaciones e historial completo.</p>
          </div>

          <div className="feature-card copper-card glass-panel">
            <div className="feature-icon-box copper-icon-box">
              <CalendarClock size={28} />
            </div>
            <h3>Semáforo Preventivo por KM</h3>
            <p>Alertas visuales automatizadas por kilómetros recorridos o días transcurridos. Mantén tus cambios de aceite, filtros y correas al día.</p>
          </div>

          <div className="feature-card copper-card glass-panel">
            <div className="feature-icon-box copper-icon-box">
              <FileText size={28} />
            </div>
            <h3>Escáner OCR de Facturas</h3>
            <p>Adjunta comprobantes en foto o PDF y nuestro motor OCR extraerá automáticamente repuestos, mano de obra, cotizaciones y costos en USD.</p>
          </div>

          <div className="feature-card copper-card glass-panel">
            <div className="feature-icon-box copper-icon-box">
              <Users size={28} />
            </div>
            <h3>Agenda de Mecánicos & Talleres</h3>
            <p>Guarda a tus profesionales de confianza con teléfono directo (llamadas y WhatsApp), especialidad y dirección completa para ubicarlos rápido.</p>
          </div>

          <div className="feature-card copper-card glass-panel">
            <div className="feature-icon-box copper-icon-box">
              <Lock size={28} />
            </div>
            <h3>Aislamiento Multi-usuario</h3>
            <p>Cada usuario registrado cuenta con una cuenta independiente en la nube. Solo tú puedes ver tus vehículos y registros de gastos.</p>
          </div>

          <div className="feature-card copper-card glass-panel">
            <div className="feature-icon-box copper-icon-box">
              <ShieldCheck size={28} />
            </div>
            <h3>Panel Administrador</h3>
            <p>Supervisión centralizada en tiempo real de usuarios registrados, estado de sesión e historial de ingresos a la plataforma.</p>
          </div>
        </div>
      </section>

      {/* Sección Preguntas Frecuentes (FAQ) */}
      <section id="faq" className="landing-faq-section glass-panel">
        <div className="section-header copper-section-header">
          <h2>Preguntas Frecuentes</h2>
          <p>Resolvemos todas tus dudas sobre el funcionamiento de la plataforma</p>
        </div>

        <div className="faq-accordion">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`faq-item ${openFaq === index ? 'open' : ''}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <HelpCircle size={20} className="text-copper" />
                <span>{faq.q}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </div>
              {openFaq === index && (
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pie de Página Completo (Footer Profesional) */}
      <footer id="contacto" className="landing-footer glass-panel">
        <div className="footer-top-grid">
          {/* Columna 1: Marca & Eslogan */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <img src="/logo_oficial.jpg" alt="Logo Mantenimiento Motores" className="footer-logo-img" />
              <div>
                <h3>MANTENIMIENTO MOTORES</h3>
                <span className="footer-motto-tag">CONTROL & POTENCIA</span>
              </div>
            </div>
            <p className="footer-brand-desc">
              Plataforma inteligente para la gestión de flota vehicular, mantenimientos preventivos por odómetro y digitalización de comprobantes.
            </p>
          </div>

          {/* Columna 2: Navegación de la App */}
          <div className="footer-col">
            <h4>Navegación</h4>
            <ul className="footer-links-list">
              <li><button onClick={onExploreApp}>Dashboard Principal</button></li>
              <li><button onClick={onExploreApp}>Gestión de Vehículos</button></li>
              <li><button onClick={onExploreApp}>Plan de Mantenimientos</button></li>
              <li><button onClick={onExploreApp}>Historial de Registros</button></li>
              <li><button onClick={onExploreApp}>Agenda de Mecánicos</button></li>
            </ul>
          </div>

          {/* Columna 3: Descarga de Aplicaciones */}
          <div className="footer-col">
            <h4>Descargas & Apps</h4>
            <ul className="footer-links-list">
              <li><a href="#android"><Smartphone size={14} /> Android App (.APK)</a></li>
              <li><a href="#android"><Globe size={14} /> Aplicación Web PWA</a></li>
              <li><a href="#android"><Download size={14} /> Google Play Store</a></li>
              <li><span className="muted-link">iOS App Store (Próximamente)</span></li>
            </ul>
          </div>

          {/* Columna 4: Redes Sociales & Contacto */}
          <div className="footer-col">
            <h4>Redes Sociales & Soporte</h4>
            <div className="footer-social-row">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" title="Instagram" className="social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" title="Facebook" className="social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" title="YouTube" className="social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
              <a href="https://wa.me/59899000000" target="_blank" rel="noreferrer" title="WhatsApp Soporte" className="social-btn whatsapp">
                <MessageCircle size={18} />
              </a>
            </div>

            <div className="footer-contact-info">
              <div className="contact-item">
                <Mail size={14} className="text-copper" />
                <span>contacto@mantenimientomotores.com</span>
              </div>
              <div className="contact-item">
                <MapPin size={14} className="text-copper" />
                <span>Montevideo, Uruguay / Buenos Aires, Argentina</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="copyright-text">
            © 2026 <strong>Mantenimiento Motores</strong>. Todos los derechos reservados.
          </div>

          <div className="legal-links">
            <a href="#faq">Términos de Servicio</a>
            <span>•</span>
            <a href="#faq">Política de Privacidad</a>
            <span>•</span>
            <a href="#faq">Seguridad RLS Supabase</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
