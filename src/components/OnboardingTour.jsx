import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  UserCheck, 
  CalendarClock, 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  CheckCircle2,
  X
} from 'lucide-react';

const OnboardingTour = ({ onNavigate }) => {
  const { completeOnboarding, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '1. Registra tu Primer Vehículo',
      icon: Car,
      color: '#3b82f6',
      badge: 'Paso 1 de 4',
      description: 'El primer paso para llevar el control es dar de alta tus vehículos (camioneta, automóvil, moto, tractor o camión).',
      details: [
        'Ingresa a la sección "Vehículos" en la barra lateral o panel principal.',
        'Presiona el botón "+ Agregar Vehículo".',
        'Completa el nombre, kilometraje actual, fecha de compra y foto opcional.',
        'Podrás cambiar entre diferentes vehículos en cualquier momento desde el menú superior.'
      ],
      actionTab: 'vehiculos',
      actionText: 'Ver Pestaña Vehículos'
    },
    {
      title: '2. Registra a tus Mecánicos de Confianza',
      icon: UserCheck,
      color: '#10b981',
      badge: 'Paso 2 de 4',
      description: 'Guarda en tu agenda a los talleres y mecánicos para asociarlos a los mantenimientos.',
      details: [
        'Dirígete a la pestaña "Mecánicos".',
        'Registra el nombre del mecánico o taller, especialidad (ej. Frenos, Motor, Electricidad).',
        'Ingresa sus teléfonos (llamada y WhatsApp), especialidad y dirección (calle, localidad, departamento o provincia) para ubicarlos rápidamente.',
        'Al registrar un mantenimiento en el historial, podrás seleccionar directamente a quién se lo confiaste.'
      ],
      actionTab: 'mecanicos',
      actionText: 'Ver Agenda de Mecánicos'
    },
    {
      title: '3. Programa Próximos Mantenimientos Preventivos',
      icon: CalendarClock,
      color: '#f59e0b',
      badge: 'Paso 3 de 4',
      description: 'Anticípate a fallas graves configurando alertas automáticas por kilometraje o tiempo.',
      details: [
        'Accede a "Plan de Mantenimiento".',
        'Configura tareas preventivas como: Cambio de Aceite (cada 10,000 km), Alineación y Balanceo, Correa de Distribución, etc.',
        'La app calculará automáticamente cuántos kilómetros te quedan y enviará alertas visuales según la urgencia (Verde, Amarillo, Rojo).',
        '¡Acepta sugerencias inteligentes automáticas según el uso de tu vehículo!'
      ],
      actionTab: 'mantenimiento',
      actionText: 'Ver Plan de Mantenimiento'
    },
    {
      title: '4. Registra los Mantenimientos en el Historial',
      icon: ClipboardList,
      color: '#ec4899',
      badge: 'Paso 4 de 4',
      description: 'Mantén un registro histórico completo de todo el dinero y repuestos invertidos.',
      details: [
        'Ve a "Historial de Mantenimientos" para cargar los mantenimientos realizados.',
        'Especifica el costo en moneda local o USD, mecánico contratado y repuestos cambiados.',
        'Adjunta comprobantes, facturas o utiliza nuestro scanner OCR automático para extraer datos de facturas automáticamente.',
        'Al registrar un mantenimiento, la alerta preventiva asociada se actualizará automáticamente.'
      ],
      actionTab: 'historial',
      actionText: 'Ver Historial de Registros'
    }
  ];

  const step = steps[currentStep];
  const IconComponent = step.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleJumpToTab = (tab) => {
    completeOnboarding();
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal glass-panel">
        <button 
          className="onboarding-close-btn"
          onClick={completeOnboarding}
          title="Omitir recorrido"
        >
          <X size={20} />
        </button>

        {/* Encabezado con bienvenida */}
        <div className="onboarding-header">
          <div className="welcome-tag">
            <Sparkles size={16} />
            <span>¡Bienvenido a Mantenimiento Motores, {profile?.nombre || 'Usuario'}!</span>
          </div>
          <h2>Recorrido Guiado por la Aplicación</h2>
          <p>Te enseñamos rápidamente cómo sacarle el máximo provecho a tu cuenta</p>
        </div>

        {/* Indicadores de Progreso por Pasos */}
        <div className="onboarding-stepper">
          {steps.map((s, idx) => (
            <div 
              key={idx}
              className={`stepper-item ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(idx)}
            >
              <div className="stepper-circle">
                {idx < currentStep ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <span className="stepper-label">{s.title.split('.')[1].trim()}</span>
            </div>
          ))}
        </div>

        {/* Contenido del Paso Actual */}
        <div className="onboarding-card-content">
          <div className="step-icon-wrapper" style={{ backgroundColor: `${step.color}20`, color: step.color }}>
            <IconComponent size={44} />
          </div>

          <div className="step-body">
            <span className="step-badge" style={{ backgroundColor: `${step.color}30`, color: step.color }}>
              {step.badge}
            </span>
            <h3>{step.title}</h3>
            <p className="step-description">{step.description}</p>

            <ul className="step-details-list">
              {step.details.map((detail, index) => (
                <li key={index}>
                  <span className="bullet-point" style={{ backgroundColor: step.color }}></span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pie de Navegación del Recorrido */}
        <div className="onboarding-footer">
          <div className="footer-left">
            {onNavigate && (
              <button 
                className="btn-link-action"
                onClick={() => handleJumpToTab(step.actionTab)}
              >
                {step.actionText} →
              </button>
            )}
          </div>

          <div className="footer-right">
            {currentStep > 0 && (
              <button 
                onClick={handlePrev}
                className="btn-secondary-onboarding"
              >
                <ChevronLeft size={18} />
                <span>Anterior</span>
              </button>
            )}

            <button 
              onClick={handleNext}
              className="btn-primary-onboarding"
              style={{ backgroundColor: step.color }}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  <span>Siguiente</span>
                  <ChevronRight size={18} />
                </>
              ) : (
                <>
                  <span>¡Entendido! Comenzar</span>
                  <CheckCircle2 size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
