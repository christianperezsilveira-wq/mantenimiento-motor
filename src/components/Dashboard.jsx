import React, { useState } from 'react';
import { Plus, Milestone, Calendar, Flame, DollarSign, AlertCircle, ShieldCheck, Clock, Settings, Save, X, ExternalLink } from 'lucide-react';
import { saveVehiculo, calcularPrecioEstimadoUruguay } from '../utils/db';

const Dashboard = ({ 
  vehiculos, 
  vehiculoActivo, 
  onSelectVehiculo, 
  onUpdateVehiculos,
  registros, 
  alertas,
  onNavigate
}) => {
  const [showOdoModal, setShowOdoModal] = useState(false);
  const [targetVehForOdo, setTargetVehForOdo] = useState(null);
  const [newOdometerValue, setNewOdometerValue] = useState('');
  const [dashboardViewMode, setDashboardViewMode] = useState(() => vehiculos.length > 1 ? 'all' : 'single');

  // Abrir modal de odómetro para un vehículo específico
  const openOdometerModal = (veh) => {
    setTargetVehForOdo(veh);
    setNewOdometerValue(veh?.kmActual || '');
    setShowOdoModal(true);
  };

  // Guardar Kilometraje Rápido
  const handleSaveOdometer = (e) => {
    e.preventDefault();
    const kmVal = parseInt(newOdometerValue);
    if (isNaN(kmVal) || kmVal <= 0) return alert("Por favor ingresá un kilometraje válido.");
    
    const vehTarget = targetVehForOdo || vehiculoActivo;
    if (vehTarget) {
      if (vehTarget.kmActual && kmVal < vehTarget.kmActual) {
        if (!confirm(`El kilometraje ingresado (${kmVal.toLocaleString()} km) es menor que el registrado actualmente (${vehTarget.kmActual.toLocaleString()} km). ¿Deseás actualizarlo de todos modos?`)) {
          return;
        }
      }

      const updated = {
        ...vehTarget,
        kmActual: kmVal,
        kmActualFecha: new Date().toISOString().split('T')[0],
        kmActualNota: 'Actualizado rápidamente desde el Dashboard'
      };
      saveVehiculo(updated);
      onUpdateVehiculos();
      setShowOdoModal(false);
      setNewOdometerValue('');
      setTargetVehForOdo(null);
    }
  };

  // Calcular alertas por estado para vehículo activo
  const dangerCount = alertas.filter(a => a.estado.status === 'danger').length;
  const warningCount = alertas.filter(a => a.estado.status === 'warning').length;
  const okCount = alertas.filter(a => a.estado.status === 'ok').length;
  const noneCount = alertas.filter(a => a.estado.status === 'none').length;

  // Calcular Gastos Anuales del vehículo activo o flota completa
  const calcularGastosAnuales = (vehId = null) => {
    const gastos = {};
    const registrosFiltrados = vehId ? registros.filter(r => r.vehiculoId === vehId) : registros;

    registrosFiltrados.forEach(r => {
      if (!r.fecha) return;
      const anio = r.fecha.split('-')[0];
      
      const repuestos = r.repuestosArs || 0;
      const manoObra = r.manoObraArs || 0;
      const totalArs = repuestos + manoObra;

      let usd = 0;
      if (r.gastoUsd !== null && r.gastoUsd !== undefined) {
        usd = r.gastoUsd;
      } else if (r.cotizacionUsd && totalArs > 0) {
        usd = totalArs / r.cotizacionUsd;
      }

      if (!gastos[anio]) {
        gastos[anio] = { usd: 0, ars: 0, count: 0 };
      }

      gastos[anio].usd += usd;
      gastos[anio].ars += totalArs;
      gastos[anio].count += 1;
    });

    return gastos;
  };

  const gastosAnuales = calcularGastosAnuales(dashboardViewMode === 'single' ? vehiculoActivo?.id : null);
  const aniosOrdenados = Object.keys(gastosAnuales).sort((a, b) => b - a);

  // Totales de Flota Completa
  const totalInversionUsd = registros.reduce((acc, r) => {
    if (r.gastoUsd) return acc + r.gastoUsd;
    const totalArs = (r.repuestosArs || 0) + (r.manoObraArs || 0);
    return acc + (r.cotizacionUsd && totalArs > 0 ? totalArs / r.cotizacionUsd : 0);
  }, 0);

  const totalValuacionUsd = vehiculos.reduce((acc, v) => {
    const est = calcularPrecioEstimadoUruguay(v);
    return acc + (est?.precioFinalUsd || 0);
  }, 0);

  return (
    <div>
      {/* Selector de Modo de Vista / Vehículo en Dashboard */}
      {vehiculos.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${dashboardViewMode === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setDashboardViewMode('all')}
            style={{ fontWeight: '700' }}
          >
            🚘 Toda la Flota ({vehiculos.length} vehículos)
          </button>

          {vehiculos.map(v => (
            <button
              key={v.id}
              className={`btn btn-sm ${dashboardViewMode === 'single' && vehiculoActivo?.id === v.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => {
                onSelectVehiculo(v.id);
                setDashboardViewMode('single');
              }}
            >
              {v.nombre}
            </button>
          ))}

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('vehiculos')}
            style={{ marginLeft: 'auto', fontSize: '11px' }}
          >
            + Gestionar Flota
          </button>
        </div>
      )}

      {vehiculos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          <Milestone size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <h3>No tenés ningún vehículo registrado</h3>
          <p style={{ marginTop: '8px', marginBottom: '24px' }}>
            Registrá tu primer vehículo para comenzar a llevar el control del mantenimiento.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('vehiculos')}>
            <Plus size={16} />
            <span>Ir a Vehículos para registrar uno</span>
          </button>
        </div>
      ) : dashboardViewMode === 'all' ? (
        /* --- VISTA: TODA LA FLOTA SIMULTÁNEA --- */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Métricas Globales de la Flota */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Vehículos en Flota</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                {vehiculos.length} autos
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {vehiculos.filter(v => v.estadoOperativo !== 'vendido').length} en uso • {vehiculos.filter(v => v.estadoOperativo === 'vendido').length} vendidos
              </span>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Valuación Total Estimada</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)', marginTop: '4px' }}>
                USD {totalValuacionUsd.toLocaleString()}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Suma del valor de mercado actual
              </span>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Inversión Histórica Mantenimiento</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginTop: '4px' }}>
                USD {Math.round(totalInversionUsd).toLocaleString()}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {registros.length} trabajos registrados
              </span>
            </div>
          </div>

          {/* Tarjetas Individuales de los Vehículos en Vivo */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: 'var(--text-primary)' }}>
              Monitor de Vehículos en Tiempo Real
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {vehiculos.map(v => {
                const est = calcularPrecioEstimadoUruguay(v);
                const regsV = registros.filter(r => r.vehiculoId === v.id);
                return (
                  <div key={v.id} className="card vehicle-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div className="vehicle-card-accent"></div>
                    <div>
                      <div className="vehicle-header-info">
                        <div className="vehicle-meta">
                          <h3>{v.nombre}</h3>
                          <p>{v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ''}</p>
                        </div>
                        <span className="badge badge-ok" style={{ textTransform: 'capitalize' }}>
                          <Flame size={12} /> {v.combustible}
                        </span>
                      </div>

                      <div className="odometer-display" style={{ marginTop: '12px' }}>
                        <div className="odometer-value">
                          {v.kmActual ? v.kmActual.toLocaleString() : '0'}
                          <span>KM</span>
                        </div>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => openOdometerModal(v)}
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                        >
                          <Milestone size={12} /> Actualizar
                        </button>
                      </div>

                      {est && (
                        <div style={{ backgroundColor: 'rgba(6, 182, 212, 0.08)', padding: '10px 12px', borderRadius: '8px', marginTop: '12px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: '700' }}>
                              {est.banderaPais} VALOR MERCADO EST.
                            </span>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--accent)' }}>
                              USD {est.precioFinalUsd.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            ~{est.cotizacion.simbolo} {est.precioFinalLocal.toLocaleString()} {est.cotizacion.monedaLocal} ({est.cotizacion.bancoShort})
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {regsV.length} mantenimientos
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          onSelectVehiculo(v.id);
                          setDashboardViewMode('single');
                        }}
                        style={{ fontSize: '11px' }}
                      >
                        Ver Detalle ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : vehiculoActivo ? (
        /* --- VISTA: DETALLE DE VEHÍCULO INDIVIDUAL --- */
        <div className="dashboard-grid">
          {/* Tarjeta del Vehículo Activo */}
          <div className="card vehicle-card">
            <div className="vehicle-card-accent"></div>
            <div>
              <div className="vehicle-header-info">
                <div className="vehicle-meta">
                  <h3>{vehiculoActivo.nombre}</h3>
                  <p>
                    {vehiculoActivo.marca || 'Marca sin registrar'} {vehiculoActivo.modelo || 'Modelo sin registrar'} 
                    {vehiculoActivo.anio ? ` (${vehiculoActivo.anio})` : ''}
                  </p>
                </div>
                <span className="badge badge-ok" style={{ textTransform: 'capitalize' }}>
                  <Flame size={12} /> {vehiculoActivo.combustible}
                </span>
              </div>

              <div className="odometer-display">
                <div className="odometer-value">
                  {vehiculoActivo.kmActual ? vehiculoActivo.kmActual.toLocaleString() : '0'}
                  <span>KM</span>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => openOdometerModal(vehiculoActivo)}
                  style={{ padding: '4px 8px', borderRadius: '6px' }}
                >
                  <Milestone size={12} /> Actualizar
                </button>
              </div>
            </div>

            <div className="vehicle-specs">
              <div className="spec-item">
                <h5>Compra</h5>
                <p>{vehiculoActivo.kmCompra ? `${vehiculoActivo.kmCompra.toLocaleString()} km` : 'Sin registro'}</p>
              </div>
              <div className="spec-item">
                <h5>Fecha Compra</h5>
                <p>{vehiculoActivo.fechaCompra || 'Sin registro'}</p>
              </div>
              <div className="spec-item">
                <h5>Última Act.</h5>
                <p>{vehiculoActivo.kmActualFecha || 'Sin registro'}</p>
              </div>
            </div>

            {(() => {
              const estimacion = calcularPrecioEstimadoUruguay(vehiculoActivo, alertas);
              if (!estimacion) return null;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>
                      {estimacion.banderaPais} Valor Estimado Mercado ({estimacion.paisCodigo})
                    </span>
                    <span style={{ fontSize: '11px', color: estimacion.ajusteMantenimientoPct < 0 ? 'var(--status-danger)' : 'var(--status-ok)', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                      {estimacion.etiquetaMantenimiento}
                    </span>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {estimacion.fuentesDetalle?.map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>• {f.shortName}:</span>
                          <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: '600' }}>
                            <span>Ver avisos</span> <ExternalLink size={9} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)' }}>
                    USD {estimacion.precioFinalUsd.toLocaleString()}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Resumen del Semáforo de Alertas */}
          <div className="card summary-status-card">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={20} color="var(--primary)" />
              <h3 style={{ fontStyle: 'normal', fontSize: '15px' }}>Semáforo de Servicios</h3>
            </div>
            
            <div className="status-counter-row">
              <div className="status-box vencido">
                <div className="status-box-number">{dangerCount}</div>
                <div className="status-box-label">Vencidos</div>
              </div>
              <div className="status-box proximo">
                <div className="status-box-number">{warningCount}</div>
                <div className="status-box-label">Próximos</div>
              </div>
              <div className="status-box ok">
                <div className="status-box-number">{okCount}</div>
                <div className="status-box-label">Al día</div>
              </div>
              <div className="status-box none">
                <div className="status-box-number">{noneCount}</div>
                <div className="status-box-label">Sin Info</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {dangerCount > 0 ? (
                <span style={{ color: 'var(--status-danger)', fontWeight: '600' }}>
                  ⚠ Tenés {dangerCount} servicio(s) vencido(s). Requiere atención inmediata.
                </span>
              ) : warningCount > 0 ? (
                <span style={{ color: 'var(--status-warning)', fontWeight: '600' }}>
                  ⏰ Tenés {warningCount} servicio(s) próximo(s) a vencer.
                </span>
              ) : (
                <span style={{ color: 'var(--status-ok)', fontWeight: '600' }}>
                  ✓ ¡Excelente! Todos los mantenimientos están al día.
                </span>
              )}
            </div>
          </div>

          {/* Historial Financiero de Gastos */}
          <div className="card expenses-card">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
              <DollarSign size={20} color="var(--accent)" />
              <h3 style={{ fontSize: '15px' }}>Resumen Histórico de Gastos</h3>
            </div>

            {aniosOrdenados.length > 0 ? (
              <div className="expenses-grid">
                {aniosOrdenados.map((anio) => {
                  const gasto = gastosAnuales[anio];
                  return (
                    <div key={anio} className="expense-stat-box">
                      <span className="expense-year">{anio}</span>
                      <div className="expense-amount-usd">
                        USD {gasto.usd.toLocaleString('es-AR', { maximumFractionDigits: 1 })}
                      </div>
                      <div className="expense-detail">
                        Total ARS: ${gasto.ars.toLocaleString('es-AR')}
                      </div>
                      <div className="expense-detail" style={{ fontSize: '10px', marginTop: '4px' }}>
                        {gasto.count} trabajos realizados
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                No se registran gastos para este vehículo todavía.
              </div>
            )}
          </div>
        </div>
      ) : null}



      {/* --- MODAL PARA ACTUALIZAR ODÓMETRO RÁPIDO --- */}
      {showOdoModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3>Actualizar Kilometraje</h3>
              <button className="modal-close" onClick={() => setShowOdoModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveOdometer}>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Kilometraje Actual (KM)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newOdometerValue}
                    onChange={(e) => setNewOdometerValue(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
                    Último registrado: {vehiculoActivo?.kmActual?.toLocaleString()} km ({vehiculoActivo?.kmActualFecha})
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowOdoModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
