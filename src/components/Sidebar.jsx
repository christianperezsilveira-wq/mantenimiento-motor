import React from 'react';
import { LayoutDashboard, Wrench, History, Users, Database, Car, ShieldCheck, LogOut, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, onTabChange, numSugerencias = 0 }) => {
  const { profile, isAdmin, logout, isGuest, setShowOnboarding } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehiculos', label: 'Vehículos', icon: Car },
    { id: 'mantenimiento', label: 'Próximos Mantenimientos', icon: Wrench },
    { id: 'historial', label: 'Historial de Mantenimiento', icon: History },
    { id: 'mecanicos', label: 'Mecánicos', icon: Users },
    { id: 'landing', label: 'Presentación Web', icon: Globe },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Panel Admin', icon: ShieldCheck, isSpecial: true });
  }

  const userInitial = profile?.nombre ? profile.nombre.charAt(0).toUpperCase() : (isGuest ? 'G' : 'U');

  return (
    <>
      {/* Sidebar para Escritorio (Desktop) */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo official-sidebar-logo">
            <img src="/logo_oficial.jpg" alt="Logo Mantenimiento Motores" className="sidebar-official-img" />
            <div className="sidebar-brand-text">
              <span className="sidebar-app-name">MANTENIMIENTO <strong>& MOTORES</strong></span>
              <span className="sidebar-app-slogan">CONTROL & POTENCIA</span>
            </div>
          </div>
          
          <nav className="sidebar-menu">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`sidebar-link ${activeTab === item.id ? 'active' : ''} ${item.isSpecial ? 'special-link' : ''}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.id === 'mantenimiento' && numSugerencias > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                    }}>
                      {numSugerencias} sug.
                    </span>
                  )}
                </button>
              );
            })}

            <button
              className="sidebar-link tour-link"
              onClick={() => setShowOnboarding(true)}
              style={{ marginTop: '12px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}
            >
              <Sparkles size={18} className="text-yellow" />
              <span>Ver Recorrido Guiado</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {userInitial}
            </div>
            <div className="user-info">
              <span className="user-name">{profile?.nombre || (isGuest ? 'Invitado Local' : 'Usuario')}</span>
              <span className="user-role">{isAdmin ? 'Administrador' : (isGuest ? 'Modo Invitado' : 'Cuenta Estándar')}</span>
            </div>

            <button 
              className="btn-logout" 
              onClick={logout}
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Barra de Navegación Móvil Inferior (Bottom Bar) */}
      <nav className="mobile-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`mobile-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onTabChange(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};

export default Sidebar;
