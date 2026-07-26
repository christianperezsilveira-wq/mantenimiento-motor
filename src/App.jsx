import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Vehiculos from './components/Vehiculos';
import MantenimientoPlan from './components/MantenimientoPlan';
import HistorialRegistros from './components/HistorialRegistros';
import AgendaMecanicos from './components/AgendaMecanicos';
import AjustesDatos from './components/AjustesDatos';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import OnboardingTour from './components/OnboardingTour';

import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  getVehiculos, 
  getRegistros, 
  getMecanicos, 
  getPlanMantenimiento, 
  calcularEstadoMantenimiento, 
  setUserScope 
} from './utils/db';
import { getSugerenciasInteligentes, desecharSugerencia } from './utils/sugerenciasService';
import { Wrench } from 'lucide-react';

function MainApp() {
  const { user, isGuest, loading, showOnboarding, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoActivo, setVehiculoActivo] = useState(null);
  const [registros, setRegistros] = useState([]);
  const [planItems, setPlanItems] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [showHelp, setShowHelp] = useState(false);
  const [initialHistorialData, setInitialHistorialData] = useState(null);

  // Al cambiar de usuario o modo invitado, ajustar el scope de la base de datos y recargar
  useEffect(() => {
    if (user) {
      setUserScope(user.id);
    } else if (isGuest) {
      setUserScope('guest');
    } else {
      setUserScope('u1');
    }
    refreshData();
  }, [user, isGuest]);

  // Recargar todos los datos desde el alcance del usuario actual
  const refreshData = () => {
    const listVehiculos = getVehiculos();
    const listRegistros = getRegistros();
    const listMecanicos = getMecanicos();
    const listPlan = getPlanMantenimiento();

    setVehiculos(listVehiculos);
    setRegistros(listRegistros);
    setMecanicos(listMecanicos);
    setPlanItems(listPlan);

    // Seleccionar vehículo activo si no hay ninguno seleccionado o si ya no existe
    setVehiculoActivo((current) => {
      if (listVehiculos.length === 0) return null;
      if (current && listVehiculos.some(v => v.id === current.id)) {
        return listVehiculos.find(v => v.id === current.id);
      }
      return listVehiculos[0];
    });
  };

  // Calcular alertas y sugerencias reactivamente
  useEffect(() => {
    if (!vehiculoActivo) {
      setAlertas([]);
      setSugerencias([]);
      return;
    }

    const kmActual = vehiculoActivo.kmActual || 0;
    const computedAlerts = planItems.map(item => {
      const estado = calcularEstadoMantenimiento(item, kmActual);
      return {
        ...item,
        estado
      };
    });

    setAlertas(computedAlerts);
    setSugerencias(getSugerenciasInteligentes(vehiculoActivo, registros, planItems));
  }, [vehiculoActivo, planItems, registros]);

  const handleSelectVehiculo = (id) => {
    const selected = vehiculos.find(v => v.id === id);
    if (selected) {
      setVehiculoActivo(selected);
    }
  };

  const handleRegistrarRealizacion = (alerta) => {
    setInitialHistorialData({
      planItemId: alerta.id,
      tipo: alerta.nombre,
      km: vehiculoActivo?.kmActual || alerta.ultimoKm || '',
      fecha: new Date().toISOString().split('T')[0]
    });
    setActiveTab('historial');
  };

  const handleDesecharSugerencia = (id) => {
    desecharSugerencia(id);
    refreshData();
  };

  // Pantalla de carga mientras se verifica sesión
  if (loading) {
    return (
      <div className="app-loading-screen">
        <Wrench size={48} className="icon-spin text-accent" />
        <h2>Iniciando Mantenimiento Motores...</h2>
      </div>
    );
  }

  // Si no está autenticado y no está en modo invitado, mostrar Login
  if (!user && !isGuest) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Recorrido Guiado Onboarding para nuevos registros */}
      {showOnboarding && <OnboardingTour onNavigate={setActiveTab} />}

      {/* Menú de Navegación Lateral */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        numSugerencias={sugerencias.length}
      />

      {/* Contenido Principal */}
      <main className="main-content">
        <Navbar 
          vehiculos={vehiculos}
          vehiculoActivo={vehiculoActivo}
          onSelectVehiculo={handleSelectVehiculo}
          alertas={alertas}
          sugerencias={sugerencias}
          onNavigate={setActiveTab}
          activeTab={activeTab}
          showHelp={showHelp}
          setShowHelp={setShowHelp}
        />

        {/* Vistas según Pestaña Activa */}
        {activeTab === 'dashboard' && (
          <Dashboard 
            vehiculos={vehiculos}
            vehiculoActivo={vehiculoActivo}
            onSelectVehiculo={handleSelectVehiculo}
            onUpdateVehiculos={refreshData}
            registros={registros}
            alertas={alertas}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'vehiculos' && (
          <Vehiculos 
            vehiculos={vehiculos}
            vehiculoActivo={vehiculoActivo}
            onSelectVehiculo={handleSelectVehiculo}
            onUpdateVehiculos={refreshData}
          />
        )}

        {activeTab === 'mantenimiento' && (
          <MantenimientoPlan 
            vehiculoActivo={vehiculoActivo}
            planItems={planItems}
            alertas={alertas}
            sugerencias={sugerencias}
            onUpdatePlan={refreshData}
            onRegistrarRealizacion={handleRegistrarRealizacion}
            onDesecharSugerencia={handleDesecharSugerencia}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
          />
        )}

        {activeTab === 'historial' && (
          <HistorialRegistros 
            vehiculoActivo={vehiculoActivo}
            registros={registros}
            onUpdateRegistros={refreshData}
            initialData={initialHistorialData}
            clearInitialData={() => setInitialHistorialData(null)}
            showHelp={showHelp}
            setShowHelp={setShowHelp}
          />
        )}

        {activeTab === 'mecanicos' && (
          <AgendaMecanicos 
            mecanicos={mecanicos}
            onUpdateMecanicos={refreshData}
          />
        )}

        {activeTab === 'datos' && (
          <AjustesDatos 
            onDatabaseChange={refreshData}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <AdminPanel />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
