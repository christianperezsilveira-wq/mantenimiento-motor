import React, { useState } from 'react';
import { Bell, Car, ChevronDown, Scroll } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Navbar = ({ 
  vehiculos, 
  vehiculoActivo, 
  onSelectVehiculo, 
  alertas = [], 
  sugerencias = [],
  onNavigate,
  activeTab,
  showHelp,
  setShowHelp
}) => {
  const [bellOpen, setBellOpen] = useState(false);

  const dangerCount = alertas.filter(a => a.estado.status === 'danger').length;
  const warningCount = alertas.filter(a => a.estado.status === 'warning').length;
  const totalNotif = dangerCount + warningCount + sugerencias.length;

  // Obtener el título dinámico según la pestaña activa
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard';
      case 'vehiculos':
        return 'Flota de Vehículos';
      case 'mantenimiento':
        return 'Próximos Mantenimientos';
      case 'historial':
        return 'Historial de Mantenimientos';
      case 'mecanicos':
        return 'Agenda de Mecánicos';
      case 'datos':
        return 'Copia de Seguridad y Datos';
      default:
        return 'Mantenimiento Motores';
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Car className="nav-brand-icon" size={24} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1>{getTabTitle()}</h1>
          {(activeTab === 'mantenimiento' || activeTab === 'historial' || activeTab === 'vehiculos' || activeTab === 'mecanicos') && (
            <button 
              className="pergamino-icon-btn" 
              onClick={() => setShowHelp(!showHelp)}
              title="¿Cómo funciona este módulo?"
              type="button"
            >
              <Scroll size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="nav-actions">
        {/* Selector de Vehículo Global */}
        {vehiculos.length > 0 && (
          <div className="vehicle-picker-wrapper">
            <select
              className="vehicle-select"
              value={vehiculoActivo?.id || ''}
              onChange={(e) => onSelectVehiculo(e.target.value)}
            >
              {vehiculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="vehicle-picker-icon" />
          </div>
        )}

        {/* Campanita de Notificaciones */}
        <div className="notification-bell-container">
          <button 
            className="bell-btn"
            onClick={() => setBellOpen(!bellOpen)}
            aria-label="Campana de notificaciones"
          >
            <Bell size={20} />
            {totalNotif > 0 && (
              <span className="bell-badge">
                {totalNotif}
              </span>
            )}
          </button>
          
          <NotificationCenter
            alertas={alertas.filter(a => a.estado.status === 'danger' || a.estado.status === 'warning')}
            sugerencias={sugerencias}
            onNavigate={onNavigate}
            isOpen={bellOpen}
            onClose={() => setBellOpen(false)}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
