import React, { useState, useEffect } from 'react';
import { useAuth, ADMIN_EMAILS } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';
import { 
  ShieldCheck, 
  Users, 
  Car, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  Search,
  UserCheck,
  RefreshCw,
  Activity,
  Radio
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehiculos: 0,
    totalRegistros: 0
  });

  // Formatear la fecha a un formato legible de "Hace cuánto tiempo"
  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Sin datos';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Hace un momento';
    if (diffSec < 3600) {
      const mins = Math.floor(diffSec / 60);
      return `Hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
    }
    if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fetchAdminData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      // Mock data para desarrollo local
      const mockList = [
        {
          id: 'u1',
          email: user?.email || 'christianperezsilveira@gmail.com',
          nombre: 'Christian Pérez',
          role: 'admin',
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
          has_completed_onboarding: true
        },
        {
          id: 'u2',
          email: 'juan.perez@ejemplo.com',
          nombre: 'Juan Pérez (Cuñado)',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          last_login_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          has_completed_onboarding: true
        },
        {
          id: 'u3',
          email: 'maria.gomez@ejemplo.com',
          nombre: 'María Gómez',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
          last_login_at: new Date(Date.now() - 86400000 * 2).toISOString(),
          has_completed_onboarding: false
        }
      ];

      setUsersList(mockList);
      setOnlineUserIds(new Set(['u1']));
      setStats({
        totalUsers: mockList.length,
        totalVehiculos: 5,
        totalRegistros: 14
      });
      setLoading(false);
      return;
    }

    try {
      // Cargar lista de perfiles desde Supabase ordenados por último ingreso
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('last_login_at', { ascending: false, nullsFirst: false });

      if (error) {
        console.error('Error fetching admin profiles:', error);
      } else {
        setUsersList(profiles || []);
      }

      // Cargar métricas globales
      const { count: vCount } = await supabase.from('vehiculos').select('*', { count: 'exact', head: true });
      const { count: rCount } = await supabase.from('registros').select('*', { count: 'exact', head: true });

      setStats({
        totalUsers: profiles ? profiles.length : 0,
        totalVehiculos: vCount || 0,
        totalRegistros: rCount || 0
      });
    } catch (err) {
      console.error('Error in AdminPanel fetch:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    // Auto-refrescar datos de perfiles e historial cada 10 segundos
    const interval = setInterval(() => {
      fetchAdminData();
    }, 10000);

    if (!isSupabaseConfigured()) return () => clearInterval(interval);

    // Escuchar presencia de usuarios conectados en tiempo real (Supabase Realtime)
    const channel = supabase.channel('online-users-presence');

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const activeIds = new Set();
      Object.values(state).forEach((presences) => {
        presences.forEach((p) => {
          if (p.user_id) activeIds.add(p.user_id);
        });
      });
      setOnlineUserIds(activeIds);
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredUsers = usersList.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container fade-in">
      <div className="admin-header">
        <div className="admin-title">
          <ShieldCheck size={28} className="text-accent" />
          <div>
            <h2>Panel de Administración</h2>
            <p>Monitoreo en tiempo real de usuarios conectados, historial de ingresos y métricas globales</p>
          </div>
        </div>

        <button onClick={fetchAdminData} className="btn-refresh" title="Actualizar datos">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Tarjetas de Métricas Globales */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card glass-panel">
          <div className="stat-icon users-bg">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Usuarios Registrados</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel" style={{ borderLeft: '3px solid #10b981' }}>
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Radio size={24} className="icon-pulse" />
          </div>
          <div className="stat-content">
            <span className="stat-value" style={{ color: '#10b981' }}>
              {onlineUserIds.size > 0 ? onlineUserIds.size : (usersList.length > 0 ? 1 : 0)}
            </span>
            <span className="stat-label">En Línea (Tiempo Real)</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-icon vehicles-bg">
            <Car size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalVehiculos}</span>
            <span className="stat-label">Vehículos en la Nube</span>
          </div>
        </div>

        <div className="admin-stat-card glass-panel">
          <div className="stat-icon logs-bg">
            <ClipboardList size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalRegistros}</span>
            <span className="stat-label">Mantenimientos Registrados</span>
          </div>
        </div>
      </div>

      {/* Buscador de Usuarios */}
      <div className="admin-table-controls glass-panel">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text"
            placeholder="Buscar usuario por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="admin-table-container glass-panel">
        {loading ? (
          <div className="admin-loading">
            <RefreshCw size={24} className="spin" />
            <p>Cargando lista de usuarios e historial de sesión...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Estado Tiempo Real</th>
                <th>Último Login</th>
                <th>Fecha Registro</th>
                <th>Recorrido Guiado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table">
                    No se encontraron usuarios que coincidan con "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdminUser = u.role === 'admin' || ADMIN_EMAILS.includes(u.email);
                  const isOnline = onlineUserIds.has(u.id) || (user?.email === u.email);

                  return (
                    <tr key={u.id}>
                      <td className="user-cell">
                        <div className="user-avatar" style={{ position: 'relative' }}>
                          <UserCheck size={18} />
                          {isOnline && (
                            <span 
                              style={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                right: 0, 
                                width: '8px', 
                                height: '8px', 
                                backgroundColor: '#10b981', 
                                borderRadius: '50%',
                                border: '2px solid var(--bg-card)' 
                              }}
                            />
                          )}
                        </div>
                        <span className="user-name">{u.nombre || 'Sin nombre'}</span>
                      </td>
                      <td className="email-cell">{u.email}</td>
                      <td>
                        <span className={`badge-role ${isAdminUser ? 'admin' : 'user'}`}>
                          {isAdminUser ? 'Administrador' : 'Usuario'}
                        </span>
                      </td>
                      <td>
                        {isOnline ? (
                          <span className="status-tag success" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            🟢 En línea ahora
                          </span>
                        ) : (
                          <span className="status-tag" style={{ backgroundColor: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af' }}>
                            ⚪ Desconectado
                          </span>
                        )}
                      </td>
                      <td className="date-cell" style={{ fontWeight: '500' }}>
                        {isOnline ? '🟢 Conectado' : formatTimeAgo(u.last_login_at || u.created_at)}
                      </td>
                      <td className="date-cell">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </td>
                      <td>
                        {u.has_completed_onboarding ? (
                          <span className="status-tag success">
                            <CheckCircle size={14} /> Completado
                          </span>
                        ) : (
                          <span className="status-tag pending">
                            <Clock size={14} /> Pendiente
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
