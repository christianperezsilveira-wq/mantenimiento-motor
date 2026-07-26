import React, { useState, useEffect } from 'react';
import { Plus, Phone, Award, UserCheck, FileText, Trash2, Edit2, Save, X, Star, MessageSquare, Table, LayoutGrid, MapPin } from 'lucide-react';
import { saveMecanico, deleteMecanico } from '../utils/db';

const ESPECIALIDADES_OPCIONES = [
  "Mecánica General",
  "Cambio de Aceite y Lubricentro",
  "Correa de Distribución / Motor",
  "Embrague y Transmisión",
  "Frenos y Suspensión",
  "Electricidad y Electrónica",
  "Inyección Electrónica y Escáner",
  "Aire Acondicionado y Climatización",
  "Chapa y Pintura",
  "Neumáticos, Alineación y Balanceo",
  "Escape y Silenciadores",
  "Otra (especificar)"
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
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
  "Tucumán"
];

const AgendaMecanicos = ({ mecanicos, onUpdateMecanicos }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' o 'edit'
  
  // Modo de vista: 'table' por defecto, 'grid' en segunda opción
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('mecanicos_view_mode') || 'table';
  });

  useEffect(() => {
    localStorage.setItem('mecanicos_view_mode', viewMode);
  }, [viewMode]);

  // Estados del formulario
  const [mecId, setMecId] = useState('');
  const [mecNombre, setMecNombre] = useState('');
  const [mecAlias, setMecAlias] = useState('');
  const [mecTelefono, setMecTelefono] = useState('');
  const [mecTelefonoWhatsapp, setMecTelefonoWhatsapp] = useState('');
  const [mecDireccion, setMecDireccion] = useState('');
  const [mecLocalidad, setMecLocalidad] = useState('');
  const [mecPais, setMecPais] = useState('UY'); // 'UY', 'AR', 'Otro'
  const [mecDepartamentoProvincia, setMecDepartamentoProvincia] = useState('');
  const [mecEspecialidad, setMecEspecialidad] = useState('');
  const [customEspecialidad, setCustomEspecialidad] = useState('');
  const [mecRecomendadoPor, setMecRecomendadoPor] = useState('');
  const [mecNota, setMecNota] = useState('');
  const [mecValoracion, setMecValoracion] = useState(5); // Valoración de 1 a 5 estrellas

  // Abrir Modal
  const openModal = (mode, mec = null) => {
    setModalMode(mode);
    if (mode === 'edit' && mec) {
      setMecId(mec.id);
      setMecNombre(mec.nombre || '');
      setMecAlias(mec.alias || '');
      setMecTelefono(mec.telefono || '');
      setMecTelefonoWhatsapp(mec.telefonoWhatsapp || '');
      setMecDireccion(mec.direccion || '');
      setMecLocalidad(mec.localidad || '');
      
      const depProv = mec.departamentoProvincia || mec.provincia || mec.departamento || '';
      const paisDetected = mec.pais || (PROVINCIAS_ARGENTINA.includes(depProv) ? 'AR' : DEPARTAMENTOS_URUGUAY.includes(depProv) ? 'UY' : 'UY');
      setMecPais(paisDetected);
      setMecDepartamentoProvincia(depProv);

      const esp = mec.especialidad || '';
      if (esp && ESPECIALIDADES_OPCIONES.includes(esp)) {
        setMecEspecialidad(esp);
        setCustomEspecialidad('');
      } else if (esp) {
        setMecEspecialidad('Otra (especificar)');
        setCustomEspecialidad(esp);
      } else {
        setMecEspecialidad('');
        setCustomEspecialidad('');
      }

      setMecRecomendadoPor(mec.recomendadoPor || '');
      setMecNota(mec.nota || mec.notas || '');
      setMecValoracion(mec.valoracion || 5);
    } else {
      setMecId('');
      setMecNombre('');
      setMecAlias('');
      setMecTelefono('');
      setMecTelefonoWhatsapp('');
      setMecDireccion('');
      setMecLocalidad('');
      setMecPais('UY');
      setMecDepartamentoProvincia('');
      setMecEspecialidad('');
      setCustomEspecialidad('');
      setMecRecomendadoPor('');
      setMecNota('');
      setMecValoracion(5);
    }
    setShowModal(true);
  };

  // Guardar Mecánico
  const handleSave = (e) => {
    e.preventDefault();
    if (!mecNombre.trim()) return alert("Por favor ingresá el nombre del mecánico.");

    const especialidadFinal = mecEspecialidad === 'Otra (especificar)' 
      ? customEspecialidad 
      : mecEspecialidad;

    const mecData = {
      id: modalMode === 'edit' ? mecId : undefined,
      nombre: mecNombre,
      alias: mecAlias || null,
      telefono: mecTelefono || null,
      telefonoWhatsapp: mecTelefonoWhatsapp || null,
      direccion: mecDireccion || null,
      localidad: mecLocalidad || null,
      pais: mecPais || 'UY',
      departamentoProvincia: mecDepartamentoProvincia || null,
      especialidad: especialidadFinal || null,
      recomendadoPor: mecRecomendadoPor || null,
      nota: mecNota || '',
      valoracion: parseInt(mecValoracion) || 5
    };

    saveMecanico(mecData);
    onUpdateMecanicos();
    setShowModal(false);
  };

  // Eliminar Mecánico
  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de que querés eliminar este mecánico de la agenda?")) {
      deleteMecanico(id);
      onUpdateMecanicos();
    }
  };

  // Renderizar las estrellas de valoración
  const renderStars = (rating) => {
    const stars = [];
    const currentRating = rating || 5;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star 
          key={i} 
          size={14} 
          fill={i <= currentRating ? '#f59e0b' : 'none'} 
          color={i <= currentRating ? '#f59e0b' : 'var(--text-muted)'} 
          style={{ marginRight: '2px' }}
        />
      );
    }
    return <div style={{ display: 'flex', gap: '2px' }} title={`Valoración: ${currentRating} estrellas`}>{stars}</div>;
  };

  return (
    <div>
      {/* Controles de Cabecera */}
      <div className="page-title-section" style={{ justifyContent: 'flex-end', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Toggle Tabla (por defecto) vs Tarjetas */}
          <div className="view-toggle">
            <button 
              className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Vista Tabla (Por defecto)"
              type="button"
            >
              <Table size={16} />
            </button>
            <button 
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista Tarjetas"
              type="button"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => openModal('add')}>
            <Plus size={16} />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      {/* --- VISTA 1: TABLA (POR DEFECTO) --- */}
      {viewMode === 'table' && mecanicos.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '14px 16px' }}>Contacto / Mecánico</th>
                  <th style={{ padding: '14px 16px' }}>Especialidad</th>
                  <th style={{ padding: '14px 16px' }}>Teléfono (Llamada)</th>
                  <th style={{ padding: '14px 16px' }}>WhatsApp</th>
                  <th style={{ padding: '14px 16px' }}>Dirección / Ubicación</th>
                  <th style={{ padding: '14px 16px' }}>Valoración</th>
                  <th style={{ padding: '14px 16px' }}>Recomendado por</th>
                  <th style={{ padding: '14px 16px' }}>Notas</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mecanicos.map((mec) => {
                  const initials = mec.nombre ? mec.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'M';
                  const cleanWa = (mec.telefonoWhatsapp || mec.telefono || '').replace(/[^0-9]/g, '');
                  
                  const paisNombre = mec.pais === 'AR' ? 'Argentina' : mec.pais === 'UY' ? 'Uruguay' : (mec.pais || '');
                  const flag = mec.pais === 'AR' ? '🇦🇷' : mec.pais === 'UY' ? '🇺🇾' : '';
                  const fullAddress = [mec.direccion, mec.localidad, mec.departamentoProvincia || mec.provincia || mec.departamento, paisNombre].filter(Boolean).join(', ');

                  return (
                    <tr key={mec.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }} className="table-row-hover">
                      {/* Nombre y Alias */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="mecanico-avatar" style={{ width: '34px', height: '34px', fontSize: '12px', flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div>
                            <strong style={{ color: 'white', display: 'block', fontSize: '13px' }}>{mec.nombre}</strong>
                            {mec.alias && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({mec.alias})</span>}
                          </div>
                        </div>
                      </td>

                      {/* Especialidad */}
                      <td style={{ padding: '14px 16px' }}>
                        {mec.especialidad ? (
                          <span style={{ 
                            fontSize: '11px', 
                            color: 'var(--accent)', 
                            backgroundColor: 'rgba(6, 182, 212, 0.1)', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {mec.especialidad}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                        )}
                      </td>

                      {/* Teléfono Llamadas */}
                      <td style={{ padding: '14px 16px' }}>
                        {mec.telefono ? (
                          <a 
                            href={`tel:${mec.telefono}`}
                            style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}
                            title="Llamar desde celular"
                          >
                            <Phone size={13} style={{ color: 'var(--text-secondary)' }} />
                            {mec.telefono}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Teléfono WhatsApp */}
                      <td style={{ padding: '14px 16px' }}>
                        {mec.telefonoWhatsapp ? (
                          <a 
                            href={`https://wa.me/${cleanWa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}
                            title="Enviar WhatsApp"
                          >
                            <MessageSquare size={13} style={{ color: '#25D366' }} />
                            {mec.telefonoWhatsapp}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Dirección / Ubicación */}
                      <td style={{ padding: '14px 16px' }}>
                        {fullAddress ? (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                            title="Ver en Google Maps"
                          >
                            <MapPin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                            <span>{flag} {fullAddress}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Valoración */}
                      <td style={{ padding: '14px 16px' }}>
                        {renderStars(mec.valoracion)}
                      </td>

                      {/* Recomendado Por */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {mec.recomendadoPor ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <UserCheck size={13} style={{ color: 'var(--text-muted)' }} />
                            {mec.recomendadoPor}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>

                      {/* Notas */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '11px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mec.nota || mec.notas || ''}>
                        {mec.nota || mec.notas ? (mec.nota || mec.notas) : '-'}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => openModal('edit', mec)}
                            style={{ padding: '5px 8px' }}
                            title="Editar mecánico"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button 
                            className="btn btn-danger btn-sm" 
                            onClick={() => handleDelete(mec.id)}
                            style={{ padding: '5px 8px' }}
                            title="Eliminar de agenda"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- VISTA 2: TARJETAS / GRID --- */}
      {viewMode === 'grid' && mecanicos.length > 0 && (
        <div className="mecanicos-grid">
          {mecanicos.map((mec) => {
            const initials = mec.nombre ? mec.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'M';
            const cleanWa = (mec.telefonoWhatsapp || mec.telefono || '').replace(/[^0-9]/g, '');
            const paisNombre = mec.pais === 'AR' ? 'Argentina' : mec.pais === 'UY' ? 'Uruguay' : (mec.pais || '');
            const flag = mec.pais === 'AR' ? '🇦🇷' : mec.pais === 'UY' ? '🇺🇾' : '';
            const fullAddress = [mec.direccion, mec.localidad, mec.departamentoProvincia || mec.provincia || mec.departamento, paisNombre].filter(Boolean).join(', ');
            
            return (
              <div key={mec.id} className="card mecanico-card">
                <div className="mecanico-card-header">
                  <div className="mecanico-avatar">
                    {initials}
                  </div>
                  <div className="mecanico-name" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <h4 style={{ margin: 0 }}>{mec.nombre} {mec.alias ? `(${mec.alias})` : ''}</h4>
                      {renderStars(mec.valoracion)}
                    </div>
                    {mec.especialidad && <span style={{ display: 'inline-block', marginTop: '6px' }}>{mec.especialidad}</span>}
                  </div>
                </div>

                <div className="mecanico-body">
                  {mec.telefono && (
                    <div className="mecanico-info-row">
                      <Phone className="mecanico-info-icon" size={14} />
                      <a 
                        href={`tel:${mec.telefono}`}
                        style={{ color: 'white', fontWeight: '500' }}
                        title="Llamar desde celular"
                      >
                        {mec.telefono} <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>(Llamada)</span>
                      </a>
                    </div>
                  )}

                  {mec.telefonoWhatsapp && (
                    <div className="mecanico-info-row">
                      <MessageSquare className="mecanico-info-icon" size={14} style={{ color: '#25D366' }} />
                      <a 
                        href={`https://wa.me/${cleanWa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#25D366', fontWeight: '500' }}
                        title="Enviar mensaje por WhatsApp"
                      >
                        {mec.telefonoWhatsapp} <span style={{ fontSize: '11px', color: '#25D366' }}>(WhatsApp)</span>
                      </a>
                    </div>
                  )}

                  {fullAddress && (
                    <div className="mecanico-info-row">
                      <MapPin className="mecanico-info-icon" size={14} style={{ color: 'var(--accent)' }} />
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--text-primary)', fontWeight: '500' }}
                        title="Ver en Google Maps"
                      >
                        {flag} {fullAddress}
                      </a>
                    </div>
                  )}

                  {mec.recomendadoPor && (
                    <div className="mecanico-info-row">
                      <UserCheck className="mecanico-info-icon" size={14} />
                      <span>Recomendado por: <strong>{mec.recomendadoPor}</strong></span>
                    </div>
                  )}

                  {mec.nota && (
                    <div className="mecanico-info-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.02)', paddingTop: '8px', marginTop: '4px' }}>
                      <FileText className="mecanico-info-icon" size={14} />
                      <span style={{ fontStyle: 'italic', fontSize: '11px' }}>{mec.nota}</span>
                    </div>
                  )}
                  
                  {mec.rol && (
                    <div className="mecanico-info-row">
                      <Award className="mecanico-info-icon" size={14} />
                      <span>Rol: {mec.rol}</span>
                    </div>
                  )}
                  {mec.notas && (
                    <div className="mecanico-info-row" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.02)', paddingTop: '8px' }}>
                      <FileText className="mecanico-info-icon" size={14} />
                      <span style={{ fontStyle: 'italic', fontSize: '11px' }}>{mec.notas}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => openModal('edit', mec)}
                    style={{ padding: '6px' }}
                    title="Editar mecánico"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(mec.id)}
                    style={{ padding: '6px' }}
                    title="Eliminar de agenda"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mecanicos.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          No tenés contactos en la agenda de mecánicos. ¡Agrega uno nuevo arriba!
        </div>
      )}

      {/* --- MODAL AGREGAR / EDITAR MECÁNICO --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{modalMode === 'edit' ? 'Editar Contacto' : 'Nuevo Contacto de Confianza'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {/* Fila 1: Nombre Completo y Alias */}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Nombre Completo *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Julio Casanoves"
                      value={mecNombre}
                      onChange={(e) => setMecNombre(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Alias / Apodo</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Julio"
                      value={mecAlias}
                      onChange={(e) => setMecAlias(e.target.value)}
                    />
                  </div>
                </div>

                {/* Fila 2: Teléfonos */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono (Llamadas)</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Ej. 03572421000"
                      value={mecTelefono}
                      onChange={(e) => setMecTelefono(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono WhatsApp</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Ej. 5493572686138"
                      value={mecTelefonoWhatsapp}
                      onChange={(e) => setMecTelefonoWhatsapp(e.target.value)}
                    />
                  </div>
                </div>

                {/* Fila 3: País y Dirección */}
                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>País</label>
                    <select
                      className="form-control"
                      value={mecPais}
                      onChange={(e) => {
                        setMecPais(e.target.value);
                        setMecDepartamentoProvincia('');
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <option value="UY">🇺🇾 Uruguay</option>
                      <option value="AR">🇦🇷 Argentina</option>
                      <option value="Otro">🌐 Otro País</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label>Dirección del Taller / Calle</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Av. San Martín 450"
                      value={mecDireccion}
                      onChange={(e) => setMecDireccion(e.target.value)}
                    />
                  </div>
                </div>

                {/* Fila 4: Localidad y Departamento / Provincia dinámico */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Localidad / Ciudad</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={mecPais === 'AR' ? "Ej. Río Segundo, Rosario" : "Ej. Salto, Las Piedras"}
                      value={mecLocalidad}
                      onChange={(e) => setMecLocalidad(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>{mecPais === 'AR' ? 'Provincia' : mecPais === 'UY' ? 'Departamento' : 'Departamento / Provincia'}</label>
                    
                    {mecPais === 'UY' && (
                      <select
                        className="form-control"
                        value={mecDepartamentoProvincia}
                        onChange={(e) => setMecDepartamentoProvincia(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">-- Seleccionar Departamento (19) --</option>
                        {DEPARTAMENTOS_URUGUAY.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    )}

                    {mecPais === 'AR' && (
                      <select
                        className="form-control"
                        value={mecDepartamentoProvincia}
                        onChange={(e) => setMecDepartamentoProvincia(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      >
                        <option value="">-- Seleccionar Provincia (24) --</option>
                        {PROVINCIAS_ARGENTINA.map((prov) => (
                          <option key={prov} value={prov}>{prov}</option>
                        ))}
                      </select>
                    )}

                    {mecPais === 'Otro' && (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Escribí la provincia o departamento..."
                        value={mecDepartamentoProvincia}
                        onChange={(e) => setMecDepartamentoProvincia(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Especialidad</label>
                  <select
                    className="form-control"
                    value={mecEspecialidad}
                    onChange={(e) => setMecEspecialidad(e.target.value)}
                    style={{ cursor: 'pointer', marginBottom: mecEspecialidad === 'Otra (especificar)' ? '8px' : '0' }}
                  >
                    <option value="">-- Seleccionar Especialidad --</option>
                    {ESPECIALIDADES_OPCIONES.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                  {mecEspecialidad === 'Otra (especificar)' && (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Escribí la especialidad..."
                      value={customEspecialidad}
                      onChange={(e) => setCustomEspecialidad(e.target.value)}
                    />
                  )}
                </div>

                <div className="form-group">
                  <label>Valoración (1 a 5 Estrellas)</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setMecValoracion(star)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          padding: '4px 0',
                          marginRight: '6px'
                        }}
                      >
                        <Star 
                          size={24} 
                          fill={star <= mecValoracion ? '#f59e0b' : 'none'} 
                          color={star <= mecValoracion ? '#f59e0b' : 'var(--text-muted)'} 
                        />
                      </button>
                    ))}
                    <span style={{ fontSize: '13px', fontWeight: '600', marginLeft: '12px', color: 'var(--text-secondary)' }}>
                      {mecValoracion} {mecValoracion === 1 ? 'Estrella' : 'Estrellas'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Recomendado Por</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Primo Lesly, Susana"
                    value={mecRecomendadoPor}
                    onChange={(e) => setMecRecomendadoPor(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Notas de Contacto</label>
                  <textarea
                    className="form-control"
                    placeholder="Horarios de atención, sugerencias, comentarios..."
                    rows="3"
                    value={mecNota}
                    onChange={(e) => setMecNota(e.target.value)}
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

export default AgendaMecanicos;

