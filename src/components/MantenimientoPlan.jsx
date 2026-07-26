import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Milestone, Info, Save, X, Scroll, LayoutGrid, List, ChevronDown, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
import { savePlanItem, deletePlanItem } from '../utils/db';

const TAREAS_PLAN_PREDEFINIDAS = [
  "Cambio de aceite y filtro",
  "Bujías",
  "Filtro de aire",
  "Filtro de combustible",
  "Correa de distribución + bomba de agua",
  "Líquido refrigerante",
  "Líquido de frenos",
  "Escobillas limpiaparabrisas",
  "Alineación y balanceo",
  "Rotación de neumáticos",
  "Cubiertas",
  "Amortiguadores",
  "Cambio de batería",
  "Pastillas y discos de freno",
  "Aceite de caja de cambios",
  "Filtro de habitáculo"
];

const MantenimientoPlan = ({ 
  vehiculoActivo, 
  planItems, 
  alertas, 
  sugerencias = [],
  onUpdatePlan,
  onRegistrarRealizacion,
  onDesecharSugerencia,
  showHelp,
  setShowHelp
}) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' o 'edit'
  
  // Modo de vista por defecto: 'list' (lista) en lugar de 'grid'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('mantenimiento_view_mode') || 'list';
  });

  // Estados del formulario
  const [itemId, setItemId] = useState('');
  const [itemNombre, setItemNombre] = useState('');
  const [itemIntervaloKm, setItemIntervaloKm] = useState('');
  const [itemIntervaloMeses, setItemIntervaloMeses] = useState('');
  const [itemUltimoKm, setItemUltimoKm] = useState('');
  const [itemUltimaFecha, setItemUltimaFecha] = useState('');
  const [itemNota, setItemNota] = useState('');

  // Año en curso
  const currentAnioStr = new Date().getFullYear().toString();
  const [aniosAbiertos, setAniosAbiertos] = useState({ [currentAnioStr]: true });

  const toggleAnio = (anio) => {
    setAniosAbiertos(prev => ({
      ...prev,
      [anio]: prev[anio] === undefined ? false : !prev[anio]
    }));
  };

  // Persistir el modo de vista seleccionado
  useEffect(() => {
    localStorage.setItem('mantenimiento_view_mode', viewMode);
  }, [viewMode]);

  // Abrir Modal
  const openModal = (mode, item = null) => {
    setModalMode(mode);
    if (item) {
      setItemId(item.id && !item.id.startsWith('sug_') ? item.id : '');
      setItemNombre(item.nombre || '');
      setItemIntervaloKm(item.intervaloKm || '');
      setItemIntervaloMeses(item.intervaloMeses || '');
      setItemUltimoKm(item.ultimoKm || '');
      setItemUltimaFecha(item.ultimaFecha || '');
      setItemNota(item.nota || '');
    } else {
      setItemId('');
      setItemNombre('');
      setItemIntervaloKm('');
      setItemIntervaloMeses('');
      setItemUltimoKm('');
      setItemUltimaFecha('');
      setItemNota('');
    }
    setShowModal(true);
  };

  // Guardar Plan Item
  const handleSave = (e) => {
    e.preventDefault();
    if (!itemNombre.trim()) return alert("Por favor ingresá el nombre del mantenimiento.");

    const itemData = {
      id: modalMode === 'edit' ? itemId : undefined,
      nombre: itemNombre,
      intervaloKm: itemIntervaloKm ? parseInt(itemIntervaloKm) : 0,
      intervaloMeses: itemIntervaloMeses ? parseInt(itemIntervaloMeses) : 0,
      ultimoKm: itemUltimoKm ? parseInt(itemUltimoKm) : null,
      ultimaFecha: itemUltimaFecha || null,
      nota: itemNota || ''
    };

    savePlanItem(itemData);
    onUpdatePlan();
    setShowModal(false);
  };

  // Borrar Plan Item
  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de que querés eliminar este mantenimiento del plan?")) {
      deletePlanItem(id);
      onUpdatePlan();
    }
  };

  // Calcular año estimado de realización/vencimiento
  const getAnioEstimado = (alerta) => {
    if (alerta.estado.status === 'danger' || alerta.estado.status === 'warning' || alerta.estado.status === 'none') {
      return currentAnioStr;
    }
    const currentYear = new Date().getFullYear();
    let estimatedYear = currentYear;

    if (alerta.ultimaFecha && alerta.intervaloMeses > 0) {
      const lastDate = new Date(alerta.ultimaFecha);
      if (!isNaN(lastDate.getTime())) {
        lastDate.setMonth(lastDate.getMonth() + alerta.intervaloMeses);
        estimatedYear = lastDate.getFullYear();
      }
    } else if (alerta.ultimoKm && alerta.intervaloKm > 0 && vehiculoActivo?.kmActual) {
      const kmRecorridos = vehiculoActivo.kmActual - alerta.ultimoKm;
      const kmRestantes = alerta.intervaloKm - kmRecorridos;
      if (kmRestantes <= 0) {
        estimatedYear = currentYear;
      } else {
        const aniosRestantes = Math.ceil(kmRestantes / 12000);
        estimatedYear = currentYear + Math.max(1, aniosRestantes);
      }
    }

    if (estimatedYear < currentYear) return currentAnioStr;
    return estimatedYear.toString();
  };

  // Agrupar alertas por año
  const alertasPorAnio = alertas.reduce((acc, alerta) => {
    const anio = getAnioEstimado(alerta);
    if (!acc[anio]) acc[anio] = [];
    acc[anio].push(alerta);
    return acc;
  }, {});

  const aniosOrdenados = Object.keys(alertasPorAnio).sort((a, b) => parseInt(a) - parseInt(b));

  // Renderizador de Tarjetas
  const renderCardItem = (alerta) => {
    const statusClass = alerta.estado.status;
    let badgeClass = 'badge-none';
    if (statusClass === 'ok') badgeClass = 'badge-ok';
    if (statusClass === 'warning') badgeClass = 'badge-warning';
    if (statusClass === 'danger') badgeClass = 'badge-danger';

    return (
      <div key={alerta.id} className="card plan-card">
        <div>
          <div className="plan-card-header">
            <h3>{alerta.nombre}</h3>
            <span className={`badge ${badgeClass}`}>
              {alerta.estado.label}
            </span>
          </div>

          <div className="plan-progress-info">
            <div className="plan-progress-bar-container">
              <div 
                className={`plan-progress-bar ${statusClass}`}
                style={{ width: `${alerta.estado.porcentaje}%` }}
              ></div>
            </div>
            <div className="plan-progress-text">
              <span>{alerta.estado.detalles}</span>
              <span>{Math.round(alerta.estado.porcentaje)}%</span>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <strong>Intervalo:</strong> {alerta.intervaloKm ? `${alerta.intervaloKm.toLocaleString()} km` : ''} 
            {alerta.intervaloKm && alerta.intervaloMeses ? ' o ' : ''}
            {alerta.intervaloMeses ? `${alerta.intervaloMeses} meses` : ''}
          </div>

          {alerta.nota && (
            <div style={{ display: 'flex', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              <Info size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontStyle: 'italic' }}>{alerta.nota}</span>
            </div>
          )}

          <div className="plan-card-footer">
            <span className="plan-last-date">
              Realizado: {alerta.ultimoKm ? `${alerta.ultimoKm.toLocaleString()} km` : 'Sin registro'}
              {alerta.ultimaFecha ? ` (${alerta.ultimaFecha})` : ''}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {onRegistrarRealizacion && (
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => onRegistrarRealizacion(alerta)}
                  style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  title="Registrar realización de este mantenimiento en el historial"
                >
                  <CheckCircle2 size={13} />
                  <span>Registrar</span>
                </button>
              )}
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => openModal('edit', alerta)}
                style={{ padding: '6px' }}
                title="Editar mantenimiento"
              >
                <Edit2 size={12} />
              </button>
              <button 
                className="btn btn-danger btn-sm" 
                onClick={() => handleDelete(alerta.id)}
                style={{ padding: '6px' }}
                title="Eliminar mantenimiento"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizador de Lista
  const renderListItem = (alerta) => {
    const statusClass = alerta.estado.status;
    let badgeClass = 'badge-none';
    if (statusClass === 'ok') badgeClass = 'badge-ok';
    if (statusClass === 'warning') badgeClass = 'badge-warning';
    if (statusClass === 'danger') badgeClass = 'badge-danger';

    return (
      <div key={alerta.id} className="plan-list-item">
        {/* Columna Info */}
        <div className="plan-list-title-col">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`badge ${badgeClass}`}>
              {alerta.estado.label}
            </span>
            <h3>{alerta.nombre}</h3>
          </div>
          {alerta.nota && (
            <div style={{ display: 'flex', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ fontStyle: 'italic' }}>{alerta.nota}</span>
            </div>
          )}
        </div>

        {/* Columna Progreso */}
        <div className="plan-list-progress-col">
          <div className="plan-progress-bar-container" style={{ marginBottom: '6px' }}>
            <div 
              className={`plan-progress-bar ${statusClass}`}
              style={{ width: `${alerta.estado.porcentaje}%` }}
            ></div>
          </div>
          <div className="plan-progress-text" style={{ fontSize: '10px' }}>
            <span>{alerta.estado.detalles}</span>
            <span>{Math.round(alerta.estado.porcentaje)}%</span>
          </div>
        </div>

        {/* Columna Intervalo e Historial */}
        <div className="plan-list-meta-col">
          <div>
            <strong>Intervalo:</strong> {alerta.intervaloKm ? `${alerta.intervaloKm.toLocaleString()} km` : ''} 
            {alerta.intervaloKm && alerta.intervaloMeses ? ' o ' : ''}
            {alerta.intervaloMeses ? `${alerta.intervaloMeses} meses` : ''}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Último: {alerta.ultimoKm ? `${alerta.ultimoKm.toLocaleString()} km` : 'Sin registro'}
            {alerta.ultimaFecha ? ` (${alerta.ultimaFecha})` : ''}
          </div>
        </div>

        {/* Columna Acciones */}
        <div className="plan-list-actions-col">
          {onRegistrarRealizacion && (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => onRegistrarRealizacion(alerta)}
              style={{ padding: '6px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Registrar realización de este mantenimiento en el historial"
            >
              <CheckCircle2 size={13} />
              <span>Registrar</span>
            </button>
          )}
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => openModal('edit', alerta)}
            style={{ padding: '6px' }}
            title="Editar mantenimiento"
          >
            <Edit2 size={12} />
          </button>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={() => handleDelete(alerta.id)}
            style={{ padding: '6px' }}
            title="Eliminar mantenimiento"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Controles de cabecera de la página (sin título duplicado) */}
      <div className="page-title-section" style={{ justifyContent: 'flex-end', marginBottom: '24px' }}>
        {vehiculoActivo && (
          <div className="plan-header-controls">
            {/* Toggle Grid vs List */}
            <div className="view-toggle">
              <button 
                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Vista Tarjetas"
                type="button"
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Vista Lista"
                type="button"
              >
                <List size={16} />
              </button>
            </div>

            <button className="btn btn-primary" onClick={() => openModal('add')}>
              <Plus size={16} />
              <span>Próximo Mantenimiento</span>
            </button>
          </div>
        )}
      </div>

      {/* BLOQUE EXPLICATIVO DEL PERGAMINO */}
      {showHelp && (
        <div className="help-box" style={{ position: 'relative', animation: 'slideInDown var(--transition-fast)' }}>
          <button 
            onClick={() => setShowHelp(false)} 
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
          <h4 style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scroll size={16} /> ¿Cómo funciona este módulo?
          </h4>
          <p style={{ marginBottom: '8px' }}>
            En este panel configurás el <strong>planning</strong> de lo que tenés que hacerle a tu vehículo para no olvidarte de nada.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Creá un Mantenimiento</strong> indicando su frecuencia ideal por Kilómetros y/o meses (ej. Cambio de aceite cada 10.000 km).</li>
            <li>La app cruzará estas reglas contra los km actuales del vehículo y te mostrará una alerta de color (<strong>Verde</strong>: al día, <strong>Amarillo</strong>: próximo, <strong>Rojo</strong>: vencido).</li>
            <li>Cuando realices el mantenimiento en el taller, regístralo en la sección de <strong>Historial de Mantenimientos</strong>. Al guardarlo, el sistema lo detectará automáticamente y **pondrá esta alerta en verde ("Al día")** iniciando una nueva cuenta regresiva.</li>
          </ul>
        </div>
      )}

      {/* SECCIÓN DE SUGERENCIAS INTELIGENTES PARA REVISAR Y VALIDAR */}
      {sugerencias.length > 0 && (
        <div style={{
          marginBottom: '28px',
          padding: '20px',
          backgroundColor: 'rgba(59, 130, 246, 0.05)',
          border: '1px dashed rgba(59, 130, 246, 0.35)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Sparkles size={18} color="var(--primary)" />
              Sugerencias Inteligentes de Próximos Mantenimientos ({sugerencias.length} pendientes de validación)
            </h4>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Basado en tus facturas y mantenimientos 2026. Revisa y aprueba para incorporar al plan.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {sugerencias.map((sug) => (
              <div 
                key={sug.id}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h5 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                      📌 {sug.nombre}
                    </h5>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', fontWeight: '700' }}>
                      Sugerencia
                    </span>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontStyle: 'italic' }}>
                    {sug.fundamento}
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span><strong>Frecuencia propuesta:</strong> {sug.intervaloKm ? `${sug.intervaloKm.toLocaleString()} km` : ''} {sug.intervaloKm && sug.intervaloMeses ? 'o ' : ''}{sug.intervaloMeses ? `${sug.intervaloMeses} meses` : ''}</span>
                    <span><strong>Último servicio:</strong> {sug.ultimoKm ? `${sug.ultimoKm.toLocaleString()} km` : 'Sin km'} {sug.ultimaFecha ? `(${sug.ultimaFecha})` : ''}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                  <button 
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, fontSize: '11px', gap: '4px', justifyContent: 'center' }}
                    onClick={() => openModal('add', sug)}
                  >
                    <CheckCircle2 size={13} />
                    <span>Aprobar / Validar</span>
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', color: 'var(--status-danger)' }}
                    onClick={() => onDesecharSugerencia && onDesecharSugerencia(sug.id)}
                    title="Desechar sugerencia"
                  >
                    <X size={13} />
                    <span>Desechar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!vehiculoActivo ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          Por favor, selecciona o crea un vehículo en el Dashboard para ver sus próximos mantenimientos.
        </div>
      ) : (
        <>
          {/* AGRUPADO POR AÑO EN ACORDEONES */}
          {aniosOrdenados.map((anio) => {
            const itemsAnio = alertasPorAnio[anio];
            const isAbierto = aniosAbiertos[anio] !== false;

            return (
              <div key={anio} style={{ marginBottom: '20px' }}>
                {/* Encabezado del Acordeón por Año */}
                <div 
                  onClick={() => toggleAnio(anio)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: isAbierto ? 'var(--radius-md) var(--radius-md) 0 0' : 'var(--radius-md)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isAbierto ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
                    <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      Año {anio}
                    </span>
                    {anio === currentAnioStr && (
                      <span style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-ok)', fontWeight: '700' }}>
                        Año en Curso
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ({itemsAnio.length} {itemsAnio.length === 1 ? 'mantenimiento' : 'mantenimientos'})
                    </span>
                  </div>

                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {isAbierto ? 'Ocultar' : 'Ver'}
                  </span>
                </div>

                {/* Contenido desplegable del acordeón */}
                {isAbierto && (
                  <div style={{
                    border: '1px solid var(--border-color)',
                    borderTop: 'none',
                    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                    padding: '16px',
                    backgroundColor: 'rgba(0, 0, 0, 0.12)'
                  }}>
                    {viewMode === 'grid' ? (
                      <div className="plan-grid">
                        {itemsAnio.map(renderCardItem)}
                      </div>
                    ) : (
                      <div className="plan-list">
                        {itemsAnio.map(renderListItem)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {alertas.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Aún no tenés mantenimientos configurados en tu plan. ¡Agrega uno nuevo arriba!
            </div>
          )}
        </>
      )}

      {/* --- MODAL DE AGREGAR / EDITAR MANTENIMIENTO --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Editar Mantenimiento del Plan' : 'Nuevo Mantenimiento'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Mantenimiento *</label>
                  <select
                    className="form-control"
                    value={TAREAS_PLAN_PREDEFINIDAS.includes(itemNombre) ? itemNombre : (itemNombre ? 'custom' : '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'custom') {
                        setItemNombre('Otro mantenimiento');
                      } else {
                        setItemNombre(val);
                      }
                    }}
                    required
                  >
                    <option value="">-- Seleccionar mantenimiento o tarea --</option>
                    {TAREAS_PLAN_PREDEFINIDAS.map((t, i) => (
                      <option key={i} value={t}>📌 {t}</option>
                    ))}
                    <option value="custom">✏️ Otro mantenimiento personalizado...</option>
                  </select>

                  {(!TAREAS_PLAN_PREDEFINIDAS.includes(itemNombre) && itemNombre !== '') && (
                    <input
                      type="text"
                      className="form-control"
                      style={{ marginTop: '8px' }}
                      placeholder="Escribí el nombre del mantenimiento personalizado..."
                      value={itemNombre === 'Otro mantenimiento' ? '' : itemNombre}
                      onChange={(e) => setItemNombre(e.target.value)}
                      required
                    />
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Intervalo de Kilómetros</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 10000 (0 para ignorar)"
                      value={itemIntervaloKm}
                      onChange={(e) => setItemIntervaloKm(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Intervalo de Meses</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 12 (0 para ignorar)"
                      value={itemIntervaloMeses}
                      onChange={(e) => setItemIntervaloMeses(e.target.value)}
                    />
                  </div>
                </div>

                {/* Tarjeta de Sugerencia Inteligente basándose en el Historial */}
                {itemUltimoKm && itemIntervaloKm && (
                  <div style={{ padding: '12px 14px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', fontSize: '11px', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: '700', color: 'var(--status-ok)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={14} /> Cálculo Inteligente de Próximo Vencimiento:
                    </div>
                    <div>
                      Basado en el último service detectado en el Historial (<strong>{parseInt(itemUltimoKm).toLocaleString()} KM</strong> {itemUltimaFecha ? `del ${itemUltimaFecha}` : ''}) y tu regla de {parseInt(itemIntervaloKm).toLocaleString()} km:
                    </div>
                    <div style={{ marginTop: '6px', fontWeight: '800', color: 'var(--primary)', fontSize: '12px' }}>
                      👉 Próximo service recomendado: {(parseInt(itemUltimoKm) + parseInt(itemIntervaloKm)).toLocaleString()} KM
                    </div>
                  </div>
                )}

                <div className="form-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <div className="form-group">
                    <label>Último KM Realizado (Sincronizado con Historial)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 194998 (dejar vacío si no hay)"
                      value={itemUltimoKm}
                      onChange={(e) => setItemUltimoKm(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Última Fecha Realizada</label>
                    <input
                      type="date"
                      className="form-control"
                      value={itemUltimaFecha}
                      onChange={(e) => setItemUltimaFecha(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Notas de Referencia</label>
                  <textarea
                    className="form-control"
                    placeholder="Ej. Usar bujías NGK, refrigerante PSA, aceite Total..."
                    rows="2"
                    value={itemNota}
                    onChange={(e) => setItemNota(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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
    </div>
  );
};

export default MantenimientoPlan;
