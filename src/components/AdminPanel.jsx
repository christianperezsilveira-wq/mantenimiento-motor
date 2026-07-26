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
  RefreshCw
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVehiculos: 0,
    totalRegistros: 0
  });

  const fetchAdminData = async () => {
    setLoading(true);
    if (!isSupabaseConfigured()) {
      // Mock data para desarrollo local
      const mockList = [
        {
          id: 'u1',
          email: user?.email || 'admin@mantenimientomotores.com',
          nombre: 'Administrador Principal',
          role: 'admin',
          created_at: new Date().toISOString(),
          has_completed_onboarding: true
        },
        {
          id: 'u2',
          email: 'juan.perez@ejemplo.com',
          nombre: 'Juan Pérez',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          has_completed_onboarding: true
        },
        {
          id: 'u3',
          email: 'maria.gomez@ejemplo.com',
          nombre: 'María Gómez',
          role: 'user',
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          has_completed_onboarding: false
        }
      ];

      setUsersList(mockList);
      setStats({
        totalUsers: mockList.length,
        totalVehiculos: 5,
        totalRegistros: 14
      });
      setLoading(false);
      return;
    }

    try {
      // Cargar lista de perfiles desde Supabase
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

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
            <p>Control centralizado de usuarios registrados y métricas de la plataforma</p>
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
            <p>Cargando lista de usuarios...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo Electrónico</th>
                <th>Rol</th>
                <th>Fecha Registro</th>
                <th>Recorrido Guiado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table">
                    No se encontraron usuarios matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdminUser = u.role === 'admin' || ADMIN_EMAILS.includes(u.email);
                  return (
                    <tr key={u.id}>
                      <td className="user-cell">
                        <div className="user-avatar">
                          <UserCheck size={18} />
                        </div>
                        <span className="user-name">{u.nombre || 'Sin nombre'}</span>
                      </td>
                      <td className="email-cell">{u.email}</td>
                      <td>
                        <span className={`badge-role ${isAdminUser ? 'admin' : 'user'}`}>
                          {isAdminUser ? 'Administrador' : 'Usuario'}
                        </span>
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
                      <td>
                        <span className="status-tag active">Activo</span>
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
