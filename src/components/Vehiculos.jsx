import React, { useState, useRef, useEffect } from 'react';
import { Edit, Trash2, Plus, Milestone, Calendar, Flame, Save, X, Car, Check, Search, Globe, TrendingUp, Sparkles, DollarSign, ExternalLink, Scroll } from 'lucide-react';
import { saveVehiculo, deleteVehiculo, calcularPrecioEstimadoUruguay, obtenerEstudioMercadoUruguay, guardarCotizacionVehiculo } from '../utils/db';

// --- LISTA DE MARCAS Y MODELOS POPULARES (ORDENADOS ALFABÉTICAMENTE) ---
const MARCAS_POPULARES = [
  "Audi",
  "BMW",
  "Chevrolet",
  "Citroën",
  "Dodge / RAM",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jeep",
  "Kia",
  "Mercedes-Benz",
  "Nissan",
  "Peugeot",
  "Renault",
  "Toyota",
  "Volkswagen"
];

const MODELOS_POR_MARCA = {
  "Audi": [
    "A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7", "Q8", "A confirmar"
  ],
  "BMW": [
    "Serie 1", "Serie 2", "Serie 3", "Serie 4", "Serie 5", "X1", "X2", "X3", "X4", "X5", "X6", "A confirmar"
  ],
  "Chevrolet": [
    "Corsa", "Cruze", "Meriva", "Montana", "Onix", "Prisma", "S10", "Spin", "Tracker", "Trailblazer", "A confirmar"
  ],
  "Citroën": [
    "Berlingo", "C3", "C3 Aircross", "C4", "C4 Cactus", "C5 Aircross", "Jumper", "Jumpy", "A confirmar"
  ],
  "Dodge / RAM": [
    "Challenger", "Charger", "Durango", "Journey", "RAM 1500", "RAM 2500", "RAM Rampage", "A confirmar"
  ],
  "Fiat": [
    "Argo", "Cronos", "Ducato", "Fastback", "Fiorino", "Mobi", "Palio", "Pulse", "Strada", "Toro", "Uno", "A confirmar"
  ],
  "Ford": [
    "EcoSport", "F-100", "F-150", "Fiesta", "Focus", "Ka", "Kuga", "Maverick", "Ranger", "Territory", "Transit", "A confirmar"
  ],
  "Honda": [
    "Accord", "City", "Civic", "CR-V", "Fit", "HR-V", "WR-V", "A confirmar"
  ],
  "Hyundai": [
    "Creta", "Elantra", "HB20", "HR", "I30", "Santa Fe", "Tucson", "A confirmar"
  ],
  "Jeep": [
    "Commander", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler", "A confirmar"
  ],
  "Kia": [
    "Carnival", "Cerato", "Picanto", "Rio", "Seltos", "Soul", "Sportage", "A confirmar"
  ],
  "Mercedes-Benz": [
    "Clase A", "Clase C", "Clase E", "GLA", "GLC", "GLE", "Sprinter", "Vito", "A confirmar"
  ],
  "Nissan": [
    "Frontier", "Kicks", "March", "Note", "Sentra", "Versa", "X-Trail", "A confirmar"
  ],
  "Peugeot": [
    "2008", "208", "3008", "308", "408", "5008", "Boxer", "Expert", "Partner", "Partner Patagónica", "A confirmar"
  ],
  "Renault": [
    "Alaskan", "Clio", "Duster", "Fluence", "Kangoo", "Kwid", "Logan", "Master", "Oroch", "Sandero", "Stepway", "A confirmar"
  ],
  "Toyota": [
    "Camry", "Corolla", "Corolla Cross", "Etios", "Hiace", "Hilux", "RAV4", "SW4", "Yaris", "A confirmar"
  ],
  "Volkswagen": [
    "Amarok", "Bora", "Fox", "Gol / Gol Trend", "Nivus", "Polo", "Saveiro", "Suran", "Taos", "Tiguan", "Vento", "Virtus", "A confirmar"
  ]
};

// Generar lista de años descendente
const CURRENT_YEAR = new Date().getFullYear();
const YEARS_LIST = Array.from({ length: CURRENT_YEAR - 1969 }, (_, i) => CURRENT_YEAR - i);

const DATEPICKER_YEARS = Array.from({ length: (CURRENT_YEAR + 5) - 1970 + 1 }, (_, i) => (CURRENT_YEAR + 5) - i);

// --- LISTAS DE PROVINCIAS Y DEPARTAMENTOS ---
const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires (CABA)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán"
];

const DEPARTAMENTOS_URUGUAY = [
  "Artigas",
  "Canelones",
  "Cerro Largo",
  "Colonia",
  "Durazno",
  "Flores",
  "Florida",
  "Lavalleja",
  "Maldonado",
  "Montevideo",
  "Paysandú",
  "Río Negro",
  "Rivera",
  "Rocha",
  "Salto",
  "San José",
  "Soriano",
  "Tacuarembó",
  "Treinta y Tres"
];

// --- SUBCOMPONENTE: CUSTOM DATEPICKER (Entrada manual + Selector de Calendario) ---
const CustomDatePicker = ({ value, onChange, placeholder }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef(null);

  // Cerrar el calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sincronizar mes/año del calendario al abrir
  useEffect(() => {
    if (showCalendar && value) {
      const parts = value.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          const d = new Date(year, month, 1);
          if (!isNaN(d.getTime())) {
            setCurrentDate(d);
          }
        }
      } else {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          setCurrentDate(d);
        }
      }
    }
  }, [showCalendar, value]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    onChange(`${dayStr}/${month}/${year}`);
    setShowCalendar(false);
  };

  const isSelectedDay = (day) => {
    if (!value) return false;
    const parts = value.split('/');
    if (parts.length === 3) {
      return (
        parseInt(parts[0], 10) === day &&
        parseInt(parts[1], 10) === currentDate.getMonth() + 1 &&
        parseInt(parts[2], 10) === currentDate.getFullYear()
      );
    }
    return false;
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  return (
    <div className="custom-datepicker-container" ref={containerRef}>
      <div className="input-with-icon">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder || "DD/MM/AAAA (ej. 01/10/2022)"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="datepicker-trigger-btn"
          onClick={() => setShowCalendar(!showCalendar)}
          aria-label="Abrir calendario"
        >
          <Calendar size={16} />
        </button>
      </div>

      {showCalendar && (
        <div className="datepicker-popup">
          <div className="datepicker-header">
            <button type="button" onClick={handlePrevMonth} className="datepicker-nav-btn" title="Mes anterior">
              &lt;
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <select
                className="datepicker-header-select"
                value={currentDate.getMonth()}
                onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value, 10), 1))}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className="datepicker-header-select"
                value={currentDate.getFullYear()}
                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value, 10), currentDate.getMonth(), 1))}
              >
                {DATEPICKER_YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={handleNextMonth} className="datepicker-nav-btn" title="Mes siguiente">
              &gt;
            </button>
          </div>
          <div className="datepicker-weekdays">
            <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
          </div>
          <div className="datepicker-days-grid">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                className={`datepicker-day-btn ${day === null ? 'empty' : ''} ${day && isSelectedDay(day) ? 'selected-day' : ''}`}
                disabled={day === null}
                onClick={() => day !== null && handleSelectDay(day)}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL DE VEHÍCULOS ---
const Vehiculos = ({
  vehiculos,
  vehiculoActivo,
  onSelectVehiculo,
  onUpdateVehiculos,
  showHelp,
  setShowHelp
}) => {
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  // Estados de Estudio de Mercado
  const [showMarketModal, setShowMarketModal] = useState(false);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [marketStudyData, setMarketStudyData] = useState(null);

  // Estados del Formulario
  const [vehId, setVehId] = useState('');
  const [vehNombre, setVehNombre] = useState('');
  
  // Marca
  const [vehMarcaSelect, setVehMarcaSelect] = useState('Peugeot');
  const [vehMarcaCustom, setVehMarcaCustom] = useState('');
  
  // Modelo
  const [vehModeloSelect, setVehModeloSelect] = useState('Partner');
  const [vehModeloCustom, setVehModeloCustom] = useState('');

  // Año
  const [vehAnioSelect, setVehAnioSelect] = useState('');
  const [vehAnioCustom, setVehAnioCustom] = useState('');

  // Combustible, Notas, Fechas, KM, Valor Referencia, País, Precio Compra, Estado Operativo, Provincia/Departamento
  const [vehCombustible, setVehCombustible] = useState('nafta');
  const [vehNotas, setVehNotas] = useState('');
  const [vehFechaCompra, setVehFechaCompra] = useState('');
  const [vehKmCompra, setVehKmCompra] = useState('');
  const [vehKmActual, setVehKmActual] = useState('');
  const [vehValorReferenciaUsd, setVehValorReferenciaUsd] = useState('');
  const [vehPais, setVehPais] = useState('UY');
  const [vehPrecioCompraUsd, setVehPrecioCompraUsd] = useState('');
  const [vehEstadoOperativo, setVehEstadoOperativo] = useState('activo');
  const [vehProvinciaDepartamento, setVehProvinciaDepartamento] = useState('Montevideo');

  // Filtro de flota (todos / activos / vendidos)
  const [fleetFilter, setFleetFilter] = useState('todos');

  // Cambiar Marca -> Actualizar modelos disponibles automáticamente
  const handleMarcaChange = (newMarca) => {
    setVehMarcaSelect(newMarca);
    if (newMarca !== 'otro') {
      const modelos = MODELOS_POR_MARCA[newMarca] || [];
      if (modelos.length > 0) {
        setVehModeloSelect(modelos[0]);
      } else {
        setVehModeloSelect('otro');
      }
    } else {
      setVehModeloSelect('otro');
    }
  };

  // Abrir modal de Agregar/Editar
  const openModal = (mode, vehicle = null) => {
    setModalMode(mode);
    if (mode === 'edit' && vehicle) {
      setVehId(vehicle.id);
      setVehNombre(vehicle.nombre || '');
      
      // Marca
      const rawMarca = vehicle.marca || '';
      if (MARCAS_POPULARES.includes(rawMarca)) {
        setVehMarcaSelect(rawMarca);
        setVehMarcaCustom('');
      } else if (rawMarca) {
        setVehMarcaSelect('otro');
        setVehMarcaCustom(rawMarca);
      } else {
        setVehMarcaSelect('Peugeot');
        setVehMarcaCustom('');
      }

      // Modelo
      const rawModelo = vehicle.modelo || '';
      const modelosDisponibles = MODELOS_POR_MARCA[rawMarca] || [];
      if (modelosDisponibles.includes(rawModelo)) {
        setVehModeloSelect(rawModelo);
        setVehModeloCustom('');
      } else if (rawModelo) {
        setVehModeloSelect('otro');
        setVehModeloCustom(rawModelo);
      } else {
        setVehModeloSelect(modelosDisponibles[0] || 'otro');
        setVehModeloCustom('');
      }

      // Año
      const rawAnio = vehicle.anio ? vehicle.anio.toString() : '';
      if (YEARS_LIST.map(y => y.toString()).includes(rawAnio)) {
        setVehAnioSelect(rawAnio);
        setVehAnioCustom('');
      } else if (rawAnio) {
        setVehAnioSelect('otro');
        setVehAnioCustom(rawAnio);
      } else {
        setVehAnioSelect('');
        setVehAnioCustom('');
      }

      setVehCombustible(vehicle.combustible || 'nafta');
      setVehNotas(vehicle.notas || '');
      setVehFechaCompra(vehicle.fechaCompra || '');
      setVehKmCompra(vehicle.kmCompra || '');
      setVehKmActual(vehicle.kmActual || '');
      setVehValorReferenciaUsd(vehicle.valorReferenciaUsd || '');
      setVehPais(vehicle.pais || 'UY');
      setVehPrecioCompraUsd(vehicle.precioCompraUsd || '');
      setVehEstadoOperativo(vehicle.estadoOperativo || 'activo');
      setVehProvinciaDepartamento(vehicle.provinciaDepartamento || (vehicle.pais === 'AR' ? 'Buenos Aires' : 'Montevideo'));
    } else {
      const currentYearStr = new Date().getFullYear().toString();
      const todayStr = new Date().toISOString().split('T')[0];

      setVehId('');
      setVehNombre('');
      setVehMarcaSelect('Peugeot');
      setVehMarcaCustom('');
      setVehModeloSelect('Partner');
      setVehModeloCustom('');
      setVehAnioSelect(currentYearStr);
      setVehAnioCustom('');
      setVehCombustible('nafta');
      setVehNotas('');
      setVehFechaCompra(todayStr);
      setVehKmCompra('');
      setVehKmActual('');
      setVehValorReferenciaUsd('');
      setVehPais('UY');
      setVehPrecioCompraUsd('');
      setVehEstadoOperativo('activo');
      setVehProvinciaDepartamento('Montevideo');
    }
    setShowVehicleModal(true);
  };

  // Guardar Vehículo
  const handleSave = (e) => {
    e.preventDefault();
    if (!vehNombre.trim()) return alert("Por favor ingresá un nombre para identificar el vehículo.");
    if (!vehPais) return alert("Por favor seleccioná el país del vehículo.");
    if (!vehMarcaSelect) return alert("Por favor seleccioná la marca.");
    if (!vehModeloSelect) return alert("Por favor seleccioná el modelo.");
    if (!vehAnioSelect) return alert("Por favor seleccioná el año.");
    if (!vehCombustible) return alert("Por favor seleccioná el tipo de combustible.");
    if (!vehKmCompra || parseInt(vehKmCompra) <= 0) return alert("Por favor ingresá los kilómetros de compra.");
    if (!vehFechaCompra) return alert("Por favor ingresá la fecha de compra.");
    if (!vehPrecioCompraUsd || parseFloat(vehPrecioCompraUsd) <= 0) return alert("Por favor ingresá el precio de compra (USD).");

    const existingVeh = modalMode === 'edit' ? (vehiculos.find(v => v.id === vehId) || {}) : {};

    const finalMarca = vehMarcaSelect === 'otro' ? vehMarcaCustom : vehMarcaSelect;
    const finalModelo = vehModeloSelect === 'otro' ? vehModeloCustom : vehModeloSelect;
    const finalAnioStr = vehAnioSelect === 'otro' ? vehAnioCustom : vehAnioSelect;
    const finalAnio = finalAnioStr ? parseInt(finalAnioStr) : (existingVeh.anio || null);

    const parsedKmCompra = parseInt(vehKmCompra);
    const finalKmCompra = !isNaN(parsedKmCompra) ? parsedKmCompra : (existingVeh.kmCompra || null);

    const parsedKmActual = parseInt(vehKmActual);
    const finalKmActual = !isNaN(parsedKmActual) ? parsedKmActual : (existingVeh.kmActual || finalKmCompra || 0);

    const parsedPrecioCompraUsd = parseFloat(vehPrecioCompraUsd);
    const finalPrecioCompraUsd = !isNaN(parsedPrecioCompraUsd) ? parsedPrecioCompraUsd : (existingVeh.precioCompraUsd || null);

    const vehData = {
      ...existingVeh,
      id: modalMode === 'edit' ? vehId : undefined,
      nombre: vehNombre,
      marca: finalMarca || existingVeh.marca || null,
      modelo: finalModelo || existingVeh.modelo || null,
      anio: finalAnio,
      combustible: vehCombustible || existingVeh.combustible || 'nafta',
      notas: vehNotas || existingVeh.notas || null,
      fechaCompra: vehFechaCompra || existingVeh.fechaCompra || null,
      precioCompraUsd: finalPrecioCompraUsd,
      kmCompra: finalKmCompra,
      kmActual: finalKmActual,
      valorReferenciaUsd: vehValorReferenciaUsd ? parseFloat(vehValorReferenciaUsd) : (existingVeh.valorReferenciaUsd || null),
      pais: vehPais || existingVeh.pais || 'UY',
      estadoOperativo: vehEstadoOperativo || existingVeh.estadoOperativo || 'activo',
      provinciaDepartamento: vehProvinciaDepartamento || existingVeh.provinciaDepartamento || (vehPais === 'AR' ? 'Buenos Aires' : 'Montevideo'),
      kmActualFecha: new Date().toISOString().split('T')[0],
      kmActualNota: modalMode === 'edit' ? 'Modificado manualmente en edición' : 'Registro inicial'
    };

    const saved = saveVehiculo(vehData);
    onUpdateVehiculos();
    onSelectVehiculo(saved.id);
    setShowVehicleModal(false);
  };

  // Eliminar Vehículo
  const handleDelete = (id, nombre) => {
    if (confirm(`¿Estás seguro de que querés eliminar el vehículo "${nombre}"? Se borrarán todos los registros de service y mantenimientos asociados.`)) {
      deleteVehiculo(id);
      onUpdateVehiculos();
    }
  };

  // Ejecutar Estudio de Mercado en Tiempo Real (Uruguay / Argentina)
  const handleRunMarketStudy = async (vehicle) => {
    setIsMarketLoading(true);
    setShowMarketModal(true);
    setMarketStudyData(null);
    const data = await obtenerEstudioMercadoUruguay(vehicle);
    setMarketStudyData({ ...data, vehicleId: vehicle.id, rawVehicle: vehicle });
    setIsMarketLoading(false);
  };

  // Guardar resultado de cotización de mercado en la ficha del vehículo
  const handleApplyMarketQuote = (vehicle, marketData) => {
    const targetVehId = vehicle?.id || marketData?.vehicleId;
    if (!targetVehId) return alert("No se pudo identificar el vehículo.");

    const updated = guardarCotizacionVehiculo(targetVehId, marketData);
    if (updated) {
      onUpdateVehiculos();
      setShowMarketModal(false);
      alert(`¡Cotización de USD ${marketData.precioFinalCalculado.toLocaleString()} guardada con éxito en la ficha de ${updated.nombre}!`);
    }
  };

  // Modelos dinámicos según la marca seleccionada
  const modelosActuales = MODELOS_POR_MARCA[vehMarcaSelect] || [];

  return (
    <div>
      <div className="page-title-section" style={{ justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button className="btn btn-primary" onClick={() => openModal('add')}>
          <Plus size={16} />
          <span>Nuevo Vehículo</span>
        </button>
      </div>

      {showHelp && (
        <div className="help-box" style={{ position: 'relative', animation: 'slideInDown var(--transition-fast)' }}>
          <button 
            onClick={() => setShowHelp(false)} 
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
          <h4 style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scroll size={16} /> ¿Qué hace la Flota de Vehículos?
          </h4>
          <p style={{ marginBottom: '8px' }}>
            En este módulo registrás y administrás todos los vehículos de tu familia o flota comercial.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Registrá nuevos vehículos</strong> ingresando marca, modelo, año y tipo de combustible.</li>
            <li>Llevá el control del estado de operatividad de cada unidad de forma independiente.</li>
            <li>Consultá resúmenes financieros específicos de gasto anual e historial de mantenimientos acumulado por vehículo.</li>
          </ul>
        </div>
      )}

      {vehiculos.length > 0 ? (
        <div>
          {/* Filtro de Flota */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
            <button
              type="button"
              className={`btn btn-sm ${fleetFilter === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFleetFilter('todos')}
            >
              Todos ({vehiculos.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${fleetFilter === 'activos' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFleetFilter('activos')}
            >
              🟢 En Flota ({vehiculos.filter(v => v.estadoOperativo !== 'vendido').length})
            </button>
            {vehiculos.some(v => v.estadoOperativo === 'vendido') && (
              <button
                type="button"
                className={`btn btn-sm ${fleetFilter === 'vendidos' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFleetFilter('vendidos')}
              >
                🏷️ Vendidos / Inactivos ({vehiculos.filter(v => v.estadoOperativo === 'vendido').length})
              </button>
            )}
          </div>

          <div className="fleet-grid">
            {vehiculos
              .filter(v => {
                if (fleetFilter === 'activos') return v.estadoOperativo !== 'vendido';
                if (fleetFilter === 'vendidos') return v.estadoOperativo === 'vendido';
                return true;
              })
              .map((v) => {
                const isActive = vehiculoActivo?.id === v.id;
                const isSold = v.estadoOperativo === 'vendido';
                return (
                  <div
                    key={v.id}
                    className={`fleet-card ${isActive ? 'active-vehicle-card' : ''}`}
                    style={{ opacity: isSold ? 0.82 : 1 }}
                  >
                    <div>
                      <div className="fleet-card-header">
                        <div>
                          <h3 className="fleet-vehicle-name">{v.nombre}</h3>
                          <p className="fleet-vehicle-brand">
                            {v.marca || 'Marca no reg.'} {v.modelo || 'Modelo no reg.'} {v.anio ? `(${v.anio})` : ''}
                          </p>
                          <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                            {isSold ? (
                              <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                                🏷️ Vendido / Inactivo
                              </span>
                            ) : (
                              <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700' }}>
                                🟢 En Flota (Activo)
                              </span>
                            )}
                            {v.provinciaDepartamento && (
                              <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '600' }}>
                                📍 {v.provinciaDepartamento}, {v.pais || 'UY'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                  <div className="fleet-card-body">
                    <div className="fleet-stat-row">
                      <span className="fleet-stat-label">Combustible</span>
                      <span className="fleet-stat-value" style={{ textTransform: 'capitalize' }}>
                        {v.combustible}
                      </span>
                    </div>
                    <div className="fleet-stat-row">
                      <span className="fleet-stat-label">KM Actuales</span>
                      <span className="fleet-stat-value" style={{ fontWeight: '700', color: 'white' }}>
                        {v.kmActual ? v.kmActual.toLocaleString() : '0'} km
                      </span>
                    </div>
                    <div className="fleet-stat-row">
                      <span className="fleet-stat-label">KM de Compra</span>
                      <span className="fleet-stat-value">
                        {v.kmCompra ? `${v.kmCompra.toLocaleString()} km` : 'Sin registro'}
                      </span>
                    </div>
                    <div className="fleet-stat-row">
                      <span className="fleet-stat-label">Fecha de Compra</span>
                      <span className="fleet-stat-value">{v.fechaCompra || 'Sin registro'}</span>
                    </div>
                    {v.precioCompraUsd && (
                      <div className="fleet-stat-row">
                        <span className="fleet-stat-label">Precio de Compra</span>
                        <span className="fleet-stat-value" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                          USD {v.precioCompraUsd.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {(() => {
                      const est = calcularPrecioEstimadoUruguay(v);
                      if (!est) return null;
                      return (
                        <div className="fleet-stat-row" style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '10px 12px', borderRadius: '8px', marginTop: '6px', border: '1px solid rgba(6, 182, 212, 0.2)', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span className="fleet-stat-label" style={{ color: 'var(--accent)', fontWeight: '700', fontSize: '10px' }}>
                                {est.banderaPais} PRECIO EST. MERCADO ({est.paisCodigo})
                              </span>
                              <span style={{ fontSize: '10px', color: est.ajusteMantenimientoPct < 0 ? 'var(--status-danger)' : 'var(--status-ok)', fontWeight: '600', marginTop: '2px' }}>
                                {est.etiquetaMantenimiento}
                              </span>
                              <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {est.fuentesDetalle?.map((f, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span>• {f.shortName}:</span>
                                    <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: '600', textDecoration: 'none' }}>
                                      <span>Ver avisos</span> <ExternalLink size={9} />
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="fleet-stat-value" style={{ color: 'var(--accent)', fontWeight: '800', fontSize: '15px', display: 'block' }}>
                                USD {est.precioFinalUsd.toLocaleString()}
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block' }}>
                                (~{est.cotizacion.simbolo} {est.precioFinalLocal.toLocaleString()} {est.cotizacion.monedaLocal})
                              </span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                                TC: 1 USD = {est.cotizacion.simbolo} {est.cotizacion.tasa} ({est.cotizacion.bancoShort})
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '10px', padding: '4px 8px', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' }}
                            onClick={() => handleRunMarketStudy(v)}
                          >
                            <Search size={12} color="var(--accent)" />
                            <span>Cotizar en Mercado {est.paisCodigo}</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Badge de Cotización Guardada en Ficha */}
                    {v.cotizacionesHistorial && v.cotizacionesHistorial.length > 0 && (
                      <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: '8px', marginTop: '8px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#10b981', fontWeight: '700', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            📌 Cotización Guardada en Ficha
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            {v.cotizacionesHistorial[0].fecha}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', marginTop: '2px' }}>
                          USD {v.cotizacionesHistorial[0].precioUsd?.toLocaleString()}
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px', fontWeight: '600' }}>
                            (~{v.cotizacionesHistorial[0].simboloLocal} {v.cotizacionesHistorial[0].precioLocal?.toLocaleString()} {v.cotizacionesHistorial[0].monedaLocal})
                          </span>
                        </div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          A los {v.cotizacionesHistorial[0].km?.toLocaleString()} km • TC: 1 USD = {v.cotizacionesHistorial[0].simboloLocal} {v.cotizacionesHistorial[0].tasa} ({v.cotizacionesHistorial[0].bancoShort})
                        </div>
                      </div>
                    )}

                    {v.notas && (
                      <div className="fleet-notes-section" title="Notas del vehículo">
                        <strong>Notas: </strong> {v.notes || v.notas}
                      </div>
                    )}
                  </div>
                </div>

                <div className="fleet-card-footer">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Act: {v.kmActualFecha || 'Sin reg.'}
                  </span>
                  <div className="fleet-action-buttons">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openModal('edit', v)}
                      title="Editar Vehículo"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(v.id, v.nombre)}
                      title="Eliminar Vehículo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          <Car size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>No tenés ningún vehículo registrado</h3>
          <p style={{ marginTop: '8px', marginBottom: '24px' }}>
            Registrá tu primer vehículo para comenzar a llevar el control del mantenimiento.
          </p>
          <button className="btn btn-primary" onClick={() => openModal('add')}>
            <Plus size={16} />
            <span>Agregar mi primer Vehículo</span>
          </button>
        </div>
      )}

      {/* --- MODAL PARA AGREGAR / EDITAR VEHÍCULO (Agrandado) --- */}
      {showVehicleModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px' }}>
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button className="modal-close" onClick={() => setShowVehicleModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ padding: '24px 32px' }}>
                {modalMode === 'edit' && (() => {
                  const est = calcularPrecioEstimadoUruguay({
                    id: vehId,
                    nombre: vehNombre,
                    marca: vehMarcaSelect === 'otro' ? vehMarcaCustom : vehMarcaSelect,
                    modelo: vehModeloSelect === 'otro' ? vehModeloCustom : vehModeloSelect,
                    anio: vehAnioSelect === 'otro' ? parseInt(vehAnioCustom) : parseInt(vehAnioSelect),
                    kmActual: vehKmActual ? parseInt(vehKmActual) : 0,
                    valorReferenciaUsd: vehValorReferenciaUsd ? parseFloat(vehValorReferenciaUsd) : null,
                    pais: vehPais
                  });
                  if (!est) return null;
                  return (
                    <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(6, 182, 212, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {est.banderaPais} PRECIO EST. MERCADO ({est.paisCodigo})
                        </span>
                        <div style={{ fontSize: '11px', color: est.ajusteMantenimientoPct < 0 ? 'var(--status-danger)' : 'var(--status-ok)', fontWeight: '600', marginTop: '2px' }}>
                          {est.etiquetaMantenimiento}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {est.fuentesDetalle?.map((f, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>• {f.nombre}:</span>
                              <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: '600', textDecoration: 'none' }}>
                                <span>Ver avisos en vivo</span> <ExternalLink size={10} />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent)', display: 'block' }}>
                            USD {est.precioFinalUsd.toLocaleString()}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', display: 'block' }}>
                            (~{est.cotizacion.simbolo} {est.precioFinalLocal.toLocaleString()} {est.cotizacion.monedaLocal})
                          </span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                            TC: 1 USD = {est.cotizacion.simbolo} {est.cotizacion.tasa} ({est.cotizacion.bancoShort})
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '6px 10px' }}
                          onClick={() => handleRunMarketStudy({
                            id: vehId,
                            nombre: vehNombre,
                            marca: vehMarcaSelect === 'otro' ? vehMarcaCustom : vehMarcaSelect,
                            modelo: vehModeloSelect === 'otro' ? vehModeloCustom : vehModeloSelect,
                            anio: vehAnioSelect === 'otro' ? parseInt(vehAnioCustom) : parseInt(vehAnioSelect),
                            kmActual: vehKmActual ? parseInt(vehKmActual) : 0,
                            pais: vehPais
                          })}
                        >
                          <Search size={12} color="var(--accent)" />
                          <span>Cotizar Mercado</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* SECCIÓN 1: UBICACIÓN Y REGISTRO EN FLOTA */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe size={14} /> 📌 Ubicación & Registro en Flota
                  </h4>
                  
                  {/* Fila 1: Nombre y Estado en Flota */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label>Identificador / Nombre *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. La Camioneta, El Onix, Taxi #1..."
                        value={vehNombre}
                        onChange={(e) => setVehNombre(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Estado en Flota *</label>
                      <select
                        className="form-control"
                        value={vehEstadoOperativo}
                        onChange={(e) => setVehEstadoOperativo(e.target.value)}
                        required
                      >
                        <option value="activo">🟢 En Uso / En Flota (Activo)</option>
                        <option value="vendido">🏷️ Vendido / Inactivo (Archivado)</option>
                      </select>
                    </div>
                  </div>

                  {/* Fila 2: País y Provincia / Departamento */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>País del Vehículo / Mercado *</label>
                      <select
                        className="form-control"
                        value={vehPais}
                        onChange={(e) => {
                          const newPais = e.target.value;
                          setVehPais(newPais);
                          setVehProvinciaDepartamento(newPais === 'AR' ? 'Buenos Aires' : 'Montevideo');
                        }}
                        required
                      >
                        <option value="AR">🇦🇷 Argentina (USD)</option>
                        <option value="UY">🇺🇾 Uruguay (USD)</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{vehPais === 'AR' ? 'Provincia *' : 'Departamento *'}</label>
                      <select
                        className="form-control"
                        value={vehProvinciaDepartamento}
                        onChange={(e) => setVehProvinciaDepartamento(e.target.value)}
                        required
                      >
                        {(vehPais === 'AR' ? PROVINCIAS_ARGENTINA : DEPARTAMENTOS_URUGUAY).map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: DATOS DEL VEHÍCULO (ESPECIFICACIONES TÉCNICAS) */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Car size={14} /> 🚘 Datos del Vehículo
                  </h4>

                  {/* Fila 3: Marca y Modelo */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label>Marca *</label>
                      <select
                        className="form-control"
                        value={vehMarcaSelect}
                        onChange={(e) => handleMarcaChange(e.target.value)}
                        required
                      >
                        {MARCAS_POPULARES.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="otro">Otro (Escribir a mano...)</option>
                      </select>
                      {vehMarcaSelect === 'otro' && (
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ingresá la marca..."
                          style={{ marginTop: '8px' }}
                          value={vehMarcaCustom}
                          onChange={(e) => setVehMarcaCustom(e.target.value)}
                          required
                        />
                      )}
                    </div>

                    <div className="form-group">
                      <label>Modelo *</label>
                      {vehMarcaSelect !== 'otro' ? (
                        <select
                          className="form-control"
                          value={vehModeloSelect}
                          onChange={(e) => setVehModeloSelect(e.target.value)}
                          required
                        >
                          {modelosActuales.map((mod) => (
                            <option key={mod} value={mod}>{mod}</option>
                          ))}
                          <option value="otro">Otro / Escribir a mano...</option>
                        </select>
                      ) : null}

                      {(vehMarcaSelect === 'otro' || vehModeloSelect === 'otro') && (
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Ingresá el modelo..."
                          style={{ marginTop: vehMarcaSelect !== 'otro' ? '8px' : '0' }}
                          value={vehModeloCustom}
                          onChange={(e) => setVehModeloCustom(e.target.value)}
                          required
                        />
                      )}
                    </div>
                  </div>

                  {/* Fila 4: Año y Combustible */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label>Año *</label>
                      <select
                        className="form-control"
                        value={vehAnioSelect}
                        onChange={(e) => setVehAnioSelect(e.target.value)}
                        required
                      >
                        <option value="">Seleccionar Año...</option>
                        {YEARS_LIST.map((y) => (
                          <option key={y} value={y.toString()}>{y}</option>
                        ))}
                        <option value="otro">Otro (Ingresar a mano...)</option>
                      </select>
                      {vehAnioSelect === 'otro' && (
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Ej. 1965"
                          style={{ marginTop: '8px' }}
                          value={vehAnioCustom}
                          onChange={(e) => setVehAnioCustom(e.target.value)}
                          required
                        />
                      )}
                    </div>

                    <div className="form-group">
                      <label>Combustible *</label>
                      <select
                        className="form-control"
                        value={vehCombustible}
                        onChange={(e) => setVehCombustible(e.target.value)}
                        required
                      >
                        <option value="diesel">Diesel</option>
                        <option value="electrico">Eléctrico</option>
                        <option value="gnc">GNC</option>
                        <option value="hibrido">Híbrido</option>
                        <option value="nafta">Nafta</option>
                      </select>
                    </div>
                  </div>

                  {/* Fila 5: Kilómetros Compra y Actuales */}
                  <div className="form-row" style={{ marginBottom: '14px' }}>
                    <div className="form-group">
                      <label>Kilómetros de Compra *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 76000"
                        value={vehKmCompra}
                        onChange={(e) => setVehKmCompra(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Kilómetros Actuales</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 184900 (Opcional - usa KM Compra)"
                        value={vehKmActual}
                        onChange={(e) => setVehKmActual(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Fila 6: Fecha de Compra y Precio de Compra */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Fecha de Compra *</label>
                      <CustomDatePicker
                        value={vehFechaCompra}
                        onChange={setVehFechaCompra}
                        placeholder="DD/MM/AAAA (ej. 01/10/2022)"
                      />
                    </div>
                    <div className="form-group">
                      <label>Precio de Compra (USD) *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 13500"
                        value={vehPrecioCompraUsd}
                        onChange={(e) => setVehPrecioCompraUsd(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: NOTAS Y ESPECIFICACIONES */}
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Notas / Especificaciones Adicionales</label>
                    <textarea
                      className="form-control"
                      placeholder="Ej. Especificaciones de aceite, líquido refrigerante PSA..."
                      rows="3"
                      value={vehNotas}
                      onChange={(e) => setVehNotas(e.target.value)}
                    ></textarea>
                  </div>

                  {/* Historial de Cotizaciones Guardadas en Edición */}
                  {modalMode === 'edit' && vehId && (() => {
                    const vehActual = vehiculos.find(v => v.id === vehId);
                    if (!vehActual || !vehActual.cotizacionesHistorial || vehActual.cotizacionesHistorial.length === 0) return null;
                    return (
                      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <TrendingUp size={14} /> 📜 Historial de Cotizaciones Mercado Libre Guardadas
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {vehActual.cotizacionesHistorial.map((cot, idx) => (
                            <div key={cot.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                              <div>
                                <span style={{ fontWeight: '700', color: 'white' }}>{cot.fecha}</span>
                                <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>({cot.km?.toLocaleString()} km)</span>
                                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                  TC: 1 USD = {cot.simboloLocal} {cot.tasa} ({cot.bancoShort})
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <strong style={{ color: 'var(--accent)', fontSize: '13px' }}>USD {cot.precioUsd?.toLocaleString()}</strong>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                                  (~{cot.simboloLocal} {cot.precioLocal?.toLocaleString()} {cot.monedaLocal})
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVehicleModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ESTUDIO DE MERCADO (URUGUAY) --- */}
      {showMarketModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={20} color="var(--accent)" />
                <h3 style={{ fontSize: '16px' }}>
                  Estudio de Mercado en Tiempo Real {marketStudyData?.banderaPais || ''} ({marketStudyData?.pais || 'Cargando...'})
                </h3>
              </div>
              <button className="modal-close" onClick={() => setShowMarketModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {isMarketLoading ? (
                <div style={{ textAlign: 'center', padding: '36px 16px' }}>
                  <div className="ocr-scanner-line-wrapper" style={{ margin: '0 auto 16px auto', width: '80px', height: '80px' }}>
                    <div className="ocr-scanner-line"></div>
                  </div>
                  <h4 style={{ color: 'var(--accent)', fontSize: '15px', marginBottom: '8px' }}>
                    Analizando publicaciones en Mercado Libre Uruguay y El Gallito...
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Buscando valoraciones activas para {marketStudyData?.marca || 'tu vehículo'} en plaza nacional.
                  </p>
                </div>
              ) : marketStudyData ? (
                <div>
                  <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>
                      🚗 {marketStudyData.rawVehicle?.nombre} ({marketStudyData.marca} {marketStudyData.modelo} - {marketStudyData.anio})
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Fuentes consultadas en tiempo real:</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {marketStudyData.fuentes?.map((f, idx) => (
                        <a
                          key={idx}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', borderColor: 'rgba(6, 182, 212, 0.3)' }}
                        >
                          <Globe size={12} />
                          <span>{f.nombre}</span>
                          <ExternalLink size={10} />
                        </a>
                      ))}
                      {marketStudyData.cotizacion && (
                        <a
                          href={marketStudyData.cotizacion.urlBanco}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}
                          title={`Banco Oficial: ${marketStudyData.cotizacion.bancoNombre}`}
                        >
                          <DollarSign size={12} />
                          <span>TC: 1 USD = {marketStudyData.cotizacion.simbolo} {marketStudyData.cotizacion.tasa} ({marketStudyData.cotizacion.bancoShort})</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div className="card" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Publicaciones Analizadas</span>
                      <div style={{ fontSize: '17px', fontWeight: '700', color: 'white', marginTop: '2px' }}>
                        {marketStudyData.publicacionesAnalizadas} avisos activos
                      </div>
                      <a
                        href={marketStudyData.meliSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600' }}
                      >
                        <span>Ver avisos en vivo</span> <ExternalLink size={10} />
                      </a>
                    </div>
                    <div className="card" style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rango Publicado ({marketStudyData.paisCodigo})</span>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'white', marginTop: '2px' }}>
                        USD {marketStudyData.minUsd.toLocaleString()} - {marketStudyData.maxUsd.toLocaleString()}
                      </div>
                      <a
                        href={marketStudyData.meliSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600' }}
                      >
                        <span>Ver autos en Mercado Libre</span> <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  {/* Listado de Artículos / Publicaciones de Muestra con Links Directos */}
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📌 Artículos y Publicaciones Encontradas para Validar:
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {marketStudyData.publicacionesMuestra?.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px' }}>
                          <div>
                            <span style={{ fontWeight: '600', color: 'white', display: 'block' }}>{item.titulo}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{item.fuente}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '12px', display: 'block' }}>
                                USD {item.precioUsd.toLocaleString()}
                              </span>
                              {item.precioArs && (
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>
                                  (~${item.precioArs.toLocaleString('es-AR')} ARS)
                                </span>
                              )}
                            </div>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '10px', color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}
                            >
                              <span>Ver</span> <ExternalLink size={10} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Desglose de Factores */}
                  <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0', marginBottom: '16px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Promedio Base del Mercado UY:</span>
                      <strong>USD {marketStudyData.promedioMercadoUsd.toLocaleString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Ajuste por Kilometraje ({marketStudyData.kmActual.toLocaleString()} km):</span>
                      <strong style={{ color: marketStudyData.ajusteKmPct >= 0 ? 'var(--status-ok)' : 'var(--status-danger)' }}>
                        {marketStudyData.ajusteKmPct >= 0 ? `+${marketStudyData.ajusteKmPct}%` : `${marketStudyData.ajusteKmPct}%`}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Plus por Ficha de Service al día:</span>
                      <strong style={{ color: marketStudyData.ajusteFichaPct >= 0 ? 'var(--status-ok)' : 'var(--status-danger)' }}>
                        {marketStudyData.ajusteFichaPct >= 0 ? `+${marketStudyData.ajusteFichaPct}%` : `${marketStudyData.ajusteFichaPct}%`}
                      </strong>
                    </div>
                  </div>

                  {/* Valor Final Tasado */}
                  <div style={{ textAlign: 'center', backgroundColor: 'var(--bg-card-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--primary)' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                      COTIZACIÓN FINAL ESTIMADA DE MERCADO ({marketStudyData.paisCodigo})
                    </span>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
                      USD {marketStudyData.precioFinalCalculado.toLocaleString()}
                    </div>
                    {marketStudyData.cotizacion && (
                      <>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
                          (~{marketStudyData.cotizacion.simbolo} {marketStudyData.precioFinalCalculadoLocal.toLocaleString()} {marketStudyData.cotizacion.monedaLocal})
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span>Tipo de Cambio Oficial: 1 USD = {marketStudyData.cotizacion.simbolo} {marketStudyData.cotizacion.tasa}</span>
                          <a href={marketStudyData.cotizacion.urlBanco} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span>({marketStudyData.cotizacion.bancoNombre})</span> <ExternalLink size={10} />
                          </a>
                        </div>
                      </>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--status-ok)', fontWeight: '600', marginTop: '6px', display: 'block' }}>
                      ✓ Ajustado con oferta/demanda real de {marketStudyData.pais} e historial del vehículo
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowMarketModal(false)}>
                Cerrar
              </button>
              {marketStudyData && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleApplyMarketQuote(marketStudyData.rawVehicle || vehiculos.find(v => v.id === marketStudyData.vehicleId), marketStudyData)}
                >
                  <Save size={16} /> Guardar Cotización en Ficha
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehiculos;
