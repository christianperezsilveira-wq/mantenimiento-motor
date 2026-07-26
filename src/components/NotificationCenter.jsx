import React, { useRef, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, CheckCircle2, Sparkles } from 'lucide-react';

const NotificationCenter = ({ alertas, sugerencias = [], onNavigate, isOpen, onClose }) => {
  const dropdownRef = useRef(null);

  // Cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAlertClick = () => {
    onNavigate('mantenimiento');
    onClose();
  };

  const totalNotif = alertas.length + sugerencias.length;

  return (
    <div className="bell-dropdown" ref={dropdownRef}>
      <div className="bell-dropdown-header">
        <h3>Centro de Notificaciones</h3>
        <span>{totalNotif} activas</span>
      </div>
      
      <div className="bell-dropdown-list">
        {sugerencias.length > 0 && (
          <div style={{ padding: '8px 14px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderBottom: '1px solid var(--border-color)', fontSize: '11px', fontWeight: '700', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>✨ {sugerencias.length} Sugerencia{sugerencias.length > 1 ? 's' : ''} para revisar</span>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '10px', padding: '2px 8px' }}
              onClick={handleAlertClick}
            >
              Ver todas
            </button>
          </div>
        )}

        {sugerencias.map((sug) => (
          <div 
            key={sug.id} 
            className="bell-item"
            onClick={handleAlertClick}
            style={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }}
          >
            <div className="bell-item-icon">
              <Sparkles size={18} color="var(--primary)" />
            </div>
            <div className="bell-item-content">
              <h4 style={{ color: 'var(--primary)' }}>
                Sugerencia: {sug.nombre}
              </h4>
              <p>{sug.fundamento}</p>
            </div>
          </div>
        ))}

        {alertas.length > 0 ? (
          alertas.map((alerta) => (
            <div 
              key={alerta.id} 
              className="bell-item"
              onClick={handleAlertClick}
            >
              <div className="bell-item-icon">
                {alerta.estado.status === 'danger' ? (
                  <AlertTriangle size={18} color="var(--status-danger)" />
                ) : (
                  <Clock size={18} color="var(--status-warning)" />
                )}
              </div>
              <div className="bell-item-content">
                <h4 style={{ 
                  color: alerta.estado.status === 'danger' ? 'var(--status-danger)' : 'var(--status-warning)' 
                }}>
                  {alerta.nombre}
                </h4>
                <p>{alerta.estado.label} • {alerta.estado.detalles}</p>
              </div>
            </div>
          ))
        ) : (
          sugerencias.length === 0 && (
            <div className="bell-empty">
              <CheckCircle2 size={32} color="var(--status-ok)" className="bell-empty-icon" />
              <p>¡Todo al día!</p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                No tenés mantenimientos próximos o sugerencias pendientes.
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
