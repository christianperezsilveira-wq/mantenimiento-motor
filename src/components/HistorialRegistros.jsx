import React, { useState } from 'react';
import { Plus, Search, Calendar, Milestone, Users, FileText, ChevronDown, ChevronRight, Check, X, ShieldAlert, Sparkles, Upload, Scroll, Edit2, Paperclip, CheckCircle2, User, Phone, Wrench, DollarSign, Eye, Download, ExternalLink } from 'lucide-react';
import { addRegistro, saveRegistro, getMecanicos, saveMecanico, getPlanMantenimiento, deleteRegistro } from '../utils/db';
import { analizarArchivoFactura } from '../utils/ocrService';
import { AGRO_TODO_B64 } from '../utils/agroTodoInvoice';
import { checkCooldown, checkRateLimit } from '../utils/rateLimiter';

const ESPECIALIDADES_PREDEFINIDAS = [
  "Lubricentro / Cambio de aceite y filtros",
  "Electricidad / Baterías / Encendido",
  "Tren delantero / Amortiguadores / Frenos",
  "Mecánica General / Motor / Distribución",
  "Gomería / Neumáticos / Alineación",
  "Inyección / Escáner Electrónico",
  "Aire Acondicionado / Calefacción",
  "Chapa y Pintura / Carrocería"
];

const HistorialRegistros = ({ 
  vehiculoActivo, 
  registros, 
  onUpdateRegistros,
  initialData,
  clearInitialData,
  showHelp,
  setShowHelp
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [mecanicos, setMecanicos] = useState(() => getMecanicos());
  const [planItems, setPlanItems] = useState(() => getPlanMantenimiento());

  // Estados del Buscador y Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMecanico, setFilterMecanico] = useState('');
  const [filterAnio, setFilterAnio] = useState('');

  // Estados del Formulario de Alta
  const [tipo, setTipo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [km, setKm] = useState('');
  const [esFechaAproximada, setEsFechaAproximada] = useState(false);
  const [manoObraArs, setManoObraArs] = useState('');
  const [repuestosArs, setRepuestosArs] = useState('');
  const [cotizacionUsd, setCotizacionUsd] = useState('');
  const [gastoUsd, setGastoUsd] = useState('');
  const [mecanicoId, setMecanicoId] = useState('');
  const [notas, setNotas] = useState('');
  const [planItemId, setPlanItemId] = useState(''); // Vincular con una tarea del plan

  // Estado para registrar nuevo mecánico/taller al instante
  const [nuevoMecanicoNombre, setNuevoMecanicoNombre] = useState('');
  const [nuevoMecanicoTelefono, setNuevoMecanicoTelefono] = useState('');
  const [nuevoMecanicoAlias, setNuevoMecanicoAlias] = useState('');
  const [nuevoMecanicoEspecialidad, setNuevoMecanicoEspecialidad] = useState('');

  // Detalle de Repuestos Dinámico
  const [repuestosDetalle, setRepuestosDetalle] = useState([]);
  const [tempRepuestoItem, setTempRepuestoItem] = useState('');
  const [tempRepuestoPrecio, setTempRepuestoPrecio] = useState('');
  const [editingRepuestoIndex, setEditingRepuestoIndex] = useState(null);

  // Archivos Adjuntos Simulados
  const [adjuntos, setAdjuntos] = useState([]);
  const [tempAdjuntoNombre, setTempAdjuntoNombre] = useState('');

  // Estado del Mock OCR (Escáner de Facturas)
  const [isScanning, setIsScanning] = useState(false);
  const [ocrSuccessMsg, setOcrSuccessMsg] = useState('');

  // Estado para Previsualización Online de Comprobantes
  const [previewFile, setPreviewFile] = useState(null);

  // Manejar recepción de datos pre-cargados desde Próximos Mantenimientos ("Registrar")
  React.useEffect(() => {
    if (initialData) {
      const currentPlan = getPlanMantenimiento();
      setMecanicos(getMecanicos());
      setPlanItems(currentPlan);

      setEditingId(null);
      setEditingRepuestoIndex(null);
      setTipo(initialData.tipo || '');
      setFecha(initialData.fecha || new Date().toISOString().split('T')[0]);
      setKm(initialData.km !== null && initialData.km !== undefined ? initialData.km.toString() : '');
      setEsFechaAproximada(false);
      setManoObraArs('');
      setRepuestosArs('');
      setCotizacionUsd('');
      setGastoUsd('');
      setMecanicoId('');
      setNotas('');
      setPlanItemId(initialData.planItemId || '');
      setNuevoMecanicoNombre('');
      setNuevoMecanicoTelefono('');
      setNuevoMecanicoAlias('');
      setNuevoMecanicoEspecialidad('');
      setRepuestosDetalle([]);
      setAdjuntos([]);
      setOcrSuccessMsg('');
      setShowFormModal(true);

      if (clearInitialData) clearInitialData();
    }
  }, [initialData]);

  // Convierte un archivo nativo a objeto con dataUrl (base64) para previsualización y descarga
  const readFileAsObject = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          name: file.name,
          dataUrl: reader.result,
          type: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg')
        });
      };
      reader.onerror = () => {
        resolve({ name: file.name });
      };
      reader.readAsDataURL(file);
    });
  };

  // Genera un DataURL de un PDF 1.4 binario válido para archivos históricos o mock sin DataURL cargado
  const getValidPdfDataUrl = (title) => {
    const cleanTitle = (title || 'Comprobante de Mantenimiento').replace(/[()]/g, '');
    const pdfString = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj
4 0 obj <</Length 220>> stream
BT
/F1 18 Tf
50 720 Td
(MANTENIMIENTO MOTORES - COMPROBANTE) Tj
0 -35 Td
/F1 12 Tf
(Archivo: ${cleanTitle}) Tj
0 -20 Td
(Fecha: ${new Date().toLocaleDateString('es-AR')}) Tj
0 -20 Td
(Estado: Comprobante verificado en la bitacora digital) Tj
ET
endstream endobj
5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000062 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000514 00000 n 
trailer <</Size 6 /Root 1 0 R>>
startxref
584
%%EOF`;
    return 'data:application/pdf;base64,' + btoa(unescape(encodeURIComponent(pdfString)));
  };

  // Manejador para descargar cualquier comprobante adjunto
  const handleDownloadFile = (adjunto, e) => {
    if (e) e.stopPropagation();

    try {
      const isObj = typeof adjunto === 'object' && adjunto !== null;
      const rawName = isObj ? adjunto.name : adjunto;
      const name = rawName || 'Factura_Agro_Todo_005729.png';
      let dataUrl = (isObj && adjunto.dataUrl) ? adjunto.dataUrl : AGRO_TODO_B64;

      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
      const binary = atob(parts[1]);
      const u8arr = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        u8arr[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);

      let downloadName = name;
      if (mime === 'image/png' && !downloadName.toLowerCase().endsWith('.png')) {
        downloadName = `${downloadName.replace(/\.[^/.]+$/, '')}.png`;
      } else if (mime === 'application/pdf' && !downloadName.toLowerCase().endsWith('.pdf')) {
        downloadName = `${downloadName.replace(/\.[^/.]+$/, '')}.pdf`;
      }

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error("Error al descargar archivo", err);
      alert("No se pudo descargar el archivo.");
    }
  };

  // Manejador para Abrir / Ver Online
  const handleViewOnline = (adjunto, e) => {
    if (e) e.stopPropagation();

    const name = typeof adjunto === 'string' ? adjunto : (adjunto.name || 'Factura - AGRO TODO (Presupuesto N° 005729)');
    let dataUrl = (typeof adjunto === 'object' && adjunto.dataUrl) ? adjunto.dataUrl : AGRO_TODO_B64;

    setPreviewFile({
      name,
      dataUrl,
      type: (typeof adjunto === 'object' && adjunto.type) ? adjunto.type : 'image/png'
    });
  };

  // Recalcular costo total de repuestos si hay detalles cargados
  const recalculateRepuestosTotal = (list) => {
    const total = list.reduce((sum, r) => sum + (parseInt(r.precioArs) || 0), 0);
    if (total > 0) {
      setRepuestosArs(total.toString());
    }
  };

  // Agregar o Guardar edición de Repuesto
  const handleSaveRepuesto = () => {
    if (!tempRepuestoItem.trim()) return;

    const nuevoItem = {
      item: tempRepuestoItem.trim(),
      precioArs: tempRepuestoPrecio ? parseInt(tempRepuestoPrecio) : 0
    };

    let nuevaLista = [];
    if (editingRepuestoIndex !== null) {
      nuevaLista = [...repuestosDetalle];
      nuevaLista[editingRepuestoIndex] = nuevoItem;
      setEditingRepuestoIndex(null);
    } else {
      nuevaLista = [...repuestosDetalle, nuevoItem];
    }

    setRepuestosDetalle(nuevaLista);
    recalculateRepuestosTotal(nuevaLista);
    setTempRepuestoItem('');
    setTempRepuestoPrecio('');
  };

  // Iniciar edición de un repuesto de la lista
  const handleStartEditRepuesto = (index) => {
    setEditingRepuestoIndex(index);
    setTempRepuestoItem(repuestosDetalle[index].item || '');
    setTempRepuestoPrecio(repuestosDetalle[index].precioArs !== null && repuestosDetalle[index].precioArs !== undefined ? repuestosDetalle[index].precioArs : '');
  };

  // Cancelar edición de repuesto
  const handleCancelEditRepuesto = () => {
    setEditingRepuestoIndex(null);
    setTempRepuestoItem('');
    setTempRepuestoPrecio('');
  };

  // Quitar repuesto del detalle
  const handleRemoveRepuesto = (index) => {
    const nuevaLista = repuestosDetalle.filter((_, i) => i !== index);
    setRepuestosDetalle(nuevaLista);
    recalculateRepuestosTotal(nuevaLista);
    if (editingRepuestoIndex === index) {
      handleCancelEditRepuesto();
    }
  };

  // Agregar archivo adjunto
  const handleAddAdjunto = () => {
    if (!tempAdjuntoNombre.trim()) return;
    setAdjuntos([...adjuntos, tempAdjuntoNombre]);
    setTempAdjuntoNombre('');
  };

  // Quitar adjunto
  const handleRemoveAdjunto = (index) => {
    setAdjuntos(adjuntos.filter((_, i) => i !== index));
  };

  // Manejar subida real de archivo de factura para Lectura Inteligente (OCR)
  const handleScanUploadedFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Cooldown Throttling check for OCR scanner (3s pause minimum)
    const cd = checkCooldown('ocr_scan_action', 3000);
    if (cd.inCooldown) {
      alert(cd.errorMsg);
      e.target.value = '';
      return;
    }

    setIsScanning(true);
    setOcrSuccessMsg('');

    try {
      const response = await analizarArchivoFactura(file);
      if (response.success) {
        const ocrData = response.data;
        
        if (ocrData.tipo) setTipo(ocrData.tipo);
        if (ocrData.fecha) setFecha(ocrData.fecha);
        if (ocrData.manoObraArs !== undefined && ocrData.manoObraArs !== null) setManoObraArs(ocrData.manoObraArs || '');
        if (ocrData.repuestosArs !== undefined && ocrData.repuestosArs !== null) setRepuestosArs(ocrData.repuestosArs || '');
        if (ocrData.cotizacionUsd) setCotizacionUsd(ocrData.cotizacionUsd || '');
        if (ocrData.gastoUsd) setGastoUsd(ocrData.gastoUsd || '');
        if (ocrData.mecanicoId) setMecanicoId(ocrData.mecanicoId || '');
        if (ocrData.notas) setNotas(ocrData.notas);
        
        // Auto-vincular al plan si el tipo coincide
        if (ocrData.tipo) {
          const planItem = planItems.find(p => ocrData.tipo.toLowerCase().includes(p.nombre.toLowerCase()) || p.nombre.toLowerCase().includes(ocrData.tipo.toLowerCase()));
          if (planItem) setPlanItemId(planItem.id);
        }

        // Cargar detalle de repuestos
        if (ocrData.detalleRepuestos && ocrData.detalleRepuestos.length > 0) {
          setRepuestosDetalle(ocrData.detalleRepuestos);
        }
        
        // Cargar adjunto automáticamente
        if (ocrData.nombreAdjunto) {
          const fileObj = await readFileAsObject(file);
          setAdjuntos(prev => {
            const filtered = prev.filter(item => (typeof item === 'string' ? item : item.name) !== fileObj.name);
            return [...filtered, fileObj];
          });
        }

        setOcrSuccessMsg(`¡Factura '${file.name}' adjuntada y leída con éxito! Se rellenaron los datos automáticos.`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  // Manejar selección directa de archivos adjuntos desde el selector nativo
  const handleDirectFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const fileObjs = await Promise.all(files.map(f => readFileAsObject(f)));
    setAdjuntos(prev => {
      const newNames = new Set(fileObjs.map(f => f.name));
      const filtered = prev.filter(item => !newNames.has(typeof item === 'string' ? item : item.name));
      return [...filtered, ...fileObjs];
    });
    e.target.value = '';
  };

  // Abrir Modal para Nuevo Registro
  const handleOpenAdd = () => {
    const currentPlan = getPlanMantenimiento();
    setMecanicos(getMecanicos());
    setPlanItems(currentPlan);

    setEditingId(null);
    setEditingRepuestoIndex(null);
    setTipo('');
    setFecha(new Date().toISOString().split('T')[0]);
    setKm('');
    setEsFechaAproximada(false);
    setManoObraArs('');
    setRepuestosArs('');
    setCotizacionUsd('');
    setGastoUsd('');
    setMecanicoId('');
    setNotas('');
    setPlanItemId('');
    setNuevoMecanicoNombre('');
    setNuevoMecanicoTelefono('');
    setNuevoMecanicoAlias('');
    setNuevoMecanicoEspecialidad('');
    setRepuestosDetalle([]);
    setAdjuntos([]);
    setOcrSuccessMsg('');
    setShowFormModal(true);
  };

  // Abrir Modal para Editar Registro Existente
  const handleOpenEdit = (r) => {
    const currentPlan = getPlanMantenimiento();
    setMecanicos(getMecanicos());
    setPlanItems(currentPlan);

    setEditingId(r.id);
    setEditingRepuestoIndex(null);
    setTipo(r.tipo || '');
    setFecha(r.fecha || new Date().toISOString().split('T')[0]);
    setKm(r.km !== null && r.km !== undefined ? r.km : '');
    setEsFechaAproximada(r.esFechaAproximada || false);
    setManoObraArs(r.manoObraArs !== null && r.manoObraArs !== undefined ? r.manoObraArs : '');
    setRepuestosArs(r.repuestosArs !== null && r.repuestosArs !== undefined ? r.repuestosArs : '');
    setCotizacionUsd(r.cotizacionUsd !== null && r.cotizacionUsd !== undefined ? r.cotizacionUsd : '');
    setGastoUsd(r.gastoUsd !== null && r.gastoUsd !== undefined ? r.gastoUsd : '');
    setMecanicoId(r.mecanicoId || '');
    setNotas(r.notas || '');
    setNuevoMecanicoNombre('');
    setNuevoMecanicoTelefono('');
    setNuevoMecanicoAlias('');
    setNuevoMecanicoEspecialidad('');

    let matchedPlanId = r.planItemId || '';
    if (!matchedPlanId && r.tipo) {
      const match = currentPlan.find(p => p.nombre.toLowerCase() === r.tipo.toLowerCase());
      if (match) matchedPlanId = match.id;
    }
    setPlanItemId(matchedPlanId);

    setRepuestosDetalle(r.detalleRepuestos || []);
    setAdjuntos(r.adjuntos || []);
    setOcrSuccessMsg('');
    setShowFormModal(true);
  };

  // Guardar Trabajo (Alta o Edición)
  const handleSave = (e) => {
    e.preventDefault();

    // Throttling para prevenir creación masiva rápida accidental o maliciosa
    const saveThrottling = checkCooldown('save_registro_action', 1500);
    if (saveThrottling.inCooldown) {
      return alert(saveThrottling.errorMsg);
    }

    if (!tipo.trim()) return alert("Por favor ingresá el tipo de trabajo realizado.");
    if (!fecha) return alert("Por favor ingresá la fecha.");
    if (!km || parseInt(km) <= 0) return alert("Por favor ingresá el kilometraje actual para mantener actualizada la ficha del vehículo.");

    let finalMecanicoId = mecanicoId;

    // Si eligió registrar un taller nuevo en el momento
    if (mecanicoId === 'mecanico_externo' || mecanicoId === 'new') {
      if (!nuevoMecanicoNombre.trim()) {
        return alert("Por favor ingresá el nombre del nuevo taller o mecánico.");
      }

      const createdMecanico = saveMecanico({
        nombre: nuevoMecanicoNombre.trim(),
        alias: nuevoMecanicoAlias.trim() || nuevoMecanicoNombre.trim(),
        telefono: nuevoMecanicoTelefono.trim(),
        especialidad: nuevoMecanicoEspecialidad.trim()
      });

      if (createdMecanico && createdMecanico.id) {
        finalMecanicoId = createdMecanico.id;
        setMecanicos(getMecanicos());
      }
    }

    // Calcular gastoUsd si no está rellenado y hay cotización
    let finalGastoUsd = gastoUsd ? parseFloat(gastoUsd) : null;
    const partsVal = repuestosArs ? parseInt(repuestosArs) : 0;
    const laborVal = manoObraArs ? parseInt(manoObraArs) : 0;
    const totalArs = partsVal + laborVal;
    
    if (finalGastoUsd === null && cotizacionUsd && totalArs > 0) {
      finalGastoUsd = totalArs / parseInt(cotizacionUsd);
    }

    const registroData = {
      id: editingId || undefined,
      vehiculoId: vehiculoActivo.id,
      tipo,
      fecha,
      esFechaAproximada,
      km: km ? parseInt(km) : null,
      manoObraArs: manoObraArs !== '' ? parseInt(manoObraArs) : null,
      repuestosArs: repuestosArs !== '' ? parseInt(repuestosArs) : null,
      cotizacionUsd: cotizacionUsd !== '' ? parseInt(cotizacionUsd) : null,
      gastoUsd: finalGastoUsd,
      mecanicoId: finalMecanicoId || null,
      planItemId: planItemId || null,
      detalleRepuestos: repuestosDetalle,
      adjuntos: adjuntos,
      notas: notas
    };

    saveRegistro(registroData);
    onUpdateRegistros();
    setShowFormModal(false);

    // Resetear formulario
    setEditingId(null);
    setTipo('');
    setFecha(new Date().toISOString().split('T')[0]);
    setKm('');
    setEsFechaAproximada(false);
    setManoObraArs('');
    setRepuestosArs('');
    setCotizacionUsd('');
    setGastoUsd('');
    setMecanicoId('');
    setNotas('');
    setPlanItemId('');
    setRepuestosDetalle([]);
    setAdjuntos([]);
    setOcrSuccessMsg('');
  };

  // Borrar Trabajo
  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de borrar este mantenimiento del historial? Esto no revertirá el kilometraje del vehículo.")) {
      deleteRegistro(id);
      onUpdateRegistros();
    }
  };

  // Filtrar registros
  const registrosFiltrados = registros.filter(r => {
    if (r.vehiculoId !== vehiculoActivo?.id) return false;
    
    const matchesSearch = r.tipo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (r.notas && r.notes?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (r.notas && r.notas.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesMecanico = true;
    if (filterMecanico) {
      matchesMecanico = r.mecanicoId === filterMecanico;
    }

    let matchesAnio = true;
    if (filterAnio) {
      const anioReg = r.fecha ? r.fecha.split('-')[0] : '';
      matchesAnio = anioReg === filterAnio;
    }

    return matchesSearch && matchesMecanico && matchesAnio;
  });

  // Obtener lista de años únicos para el filtro
  const añosDisponibles = Array.from(new Set(
    registros
      .filter(r => r.vehiculoId === vehiculoActivo?.id && r.fecha)
      .map(r => r.fecha.split('-')[0])
  )).sort((a, b) => b - a);

  // Estado para controlar qué años están expandidos/colapsados
  const [collapsedYears, setCollapsedYears] = useState({});

  // Agrupar registros filtrados por año
  const registrosPorAnio = {};
  registrosFiltrados.forEach(r => {
    const anio = r.fecha ? r.fecha.split('-')[0] : 'Sin Fecha';
    if (!registrosPorAnio[anio]) {
      registrosPorAnio[anio] = [];
    }
    registrosPorAnio[anio].push(r);
  });

  const aniosOrganizados = Object.keys(registrosPorAnio).sort((a, b) => {
    if (a === 'Sin Fecha') return 1;
    if (b === 'Sin Fecha') return -1;
    return b - a;
  });

  const toggleYearCollapse = (anio) => {
    setCollapsedYears(prev => ({
      ...prev,
      [anio]: !prev[anio]
    }));
  };

  const isYearOpen = (anio) => {
    // Si hay búsqueda o filtro activo, mostrar todo desplegado
    if (searchQuery.trim() || filterMecanico || filterAnio) return true;
    
    // Si el usuario alternó explícitamente este año:
    if (collapsedYears[anio] !== undefined) {
      return !collapsedYears[anio];
    }

    // Por defecto: el año actual (o el año más reciente disponible) se muestra desplegado y los anteriores agrupados
    const currentAnioStr = new Date().getFullYear().toString();
    if (anio === currentAnioStr) return true;
    if (!registrosPorAnio[currentAnioStr] && aniosOrganizados.length > 0 && anio === aniosOrganizados[0]) {
      return true;
    }

    return false;
  };

  return (
    <div>
      {/* BLOQUE EXPLICATIVO DEL PERGAMINO */}
      {showHelp && (
        <div className="help-box" style={{ position: 'relative', animation: 'slideInDown var(--transition-fast)', marginBottom: '20px' }}>
          <button 
            onClick={() => setShowHelp(false)} 
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
          <h4 style={{ color: 'var(--accent)', fontWeight: '700', marginBottom: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Scroll size={16} /> ¿Qué hace el Historial de Mantenimientos?
          </h4>
          <p style={{ marginBottom: '8px' }}>
            En este módulo llevás la bitácora histórica y el registro detallado de todos los mantenimientos, reparaciones y servicios realizados a tus vehículos.
          </p>
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li><strong>Bitácora Completa:</strong> Guardá cada intervención con su fecha, kilometraje actual, taller o mecánico, repuestos utilizados y desglose de costos (Mano de obra y Repuestos en ARS y USD).</li>
            <li><strong>Adjunto de Documentos y Facturas:</strong> Adjuntá y consultá comprobantes, remitos o facturas escaneadas asociadas a cada mantenimiento.</li>
            <li><strong>Actualización Automática de Alertas:</strong> Al registrar un trabajo vinculado a un mantenimiento planificado, la alerta correspondiente en <em>Próximos Mantenimientos</em> pasa automáticamente a "Al día" (verde) e inicia un nuevo ciclo.</li>
          </ul>
        </div>
      )}

      <div className="page-title-section" style={{ justifyContent: 'flex-end', marginBottom: '24px' }}>
        {vehiculoActivo && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Registrar Mantenimiento</span>
          </button>
        )}
      </div>

      {!vehiculoActivo ? (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
          Por favor, selecciona o crea un vehículo en el Dashboard para ver su historial de mantenimiento.
        </div>
      ) : (
        <>
          {/* Barra de Filtros */}
          <div className="history-filters">
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por tipo, repuesto, notas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
              <Search 
                size={16} 
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
            </div>
            
            <select
              className="filter-select"
              value={filterMecanico}
              onChange={(e) => setFilterMecanico(e.target.value)}
            >
              <option value="">Todos los Mecánicos</option>
              {[...mecanicos].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')).map(m => (
                <option key={m.id} value={m.id}>{m.nombre} ({m.alias || 'Taller'})</option>
              ))}
              <option value="null">Sin Mecánico asignado</option>
            </select>

            <select
              className="filter-select"
              value={filterAnio}
              onChange={(e) => setFilterAnio(e.target.value)}
            >
              <option value="">Todos los Años</option>
              {añosDisponibles.map(anio => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>

            {(searchQuery || filterMecanico || filterAnio) && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterMecanico('');
                  setFilterAnio('');
                }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          {/* Listado de Registros Agrupados por Año */}
          <div className="records-list">
            {aniosOrganizados.map((anio) => {
              const itemsAnio = registrosPorAnio[anio];
              const isOpen = isYearOpen(anio);
              const currentAnioStr = new Date().getFullYear().toString();
              const isCurrentYear = anio === currentAnioStr;

              // Calcular totales anuales del grupo
              let totalUsdAnio = 0;
              let totalArsAnio = 0;
              itemsAnio.forEach(r => {
                const parts = r.repuestosArs || 0;
                const labor = r.manoObraArs || 0;
                const totalArs = parts + labor;
                totalArsAnio += totalArs;
                if (r.gastoUsd) {
                  totalUsdAnio += r.gastoUsd;
                } else if (r.cotizacionUsd && totalArs > 0) {
                  totalUsdAnio += (totalArs / r.cotizacionUsd);
                }
              });

              return (
                <div key={anio} className="year-group" style={{ marginBottom: '16px' }}>
                  {/* Encabezado Acordeón del Año */}
                  <div 
                    className="year-group-header"
                    onClick={() => toggleYearCollapse(anio)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '12px 18px',
                      backgroundColor: isCurrentYear ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card)',
                      border: `1px solid ${isCurrentYear ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'all 0.2s ease',
                      marginBottom: isOpen ? '12px' : '0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isOpen ? (
                        <ChevronDown size={18} color="var(--primary)" />
                      ) : (
                        <ChevronRight size={18} color="var(--text-muted)" />
                      )}
                      <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Año {anio}
                        {isCurrentYear && (
                          <span className="badge badge-ok" style={{ fontSize: '10px', padding: '2px 8px' }}>
                            Año en Curso
                          </span>
                        )}
                      </h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>
                        ({itemsAnio.length} {itemsAnio.length === 1 ? 'mantenimiento' : 'mantenimientos'})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {(totalUsdAnio > 0 || totalArsAnio > 0) && (
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', backgroundColor: 'rgba(6, 182, 212, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                          Total: {totalUsdAnio > 0 ? `USD ${totalUsdAnio.toLocaleString('es-AR', { maximumFractionDigits: 1 })}` : ''} 
                          {totalUsdAnio > 0 && totalArsAnio > 0 ? ' / ' : ''}
                          {totalArsAnio > 0 ? `$${totalArsAnio.toLocaleString('es-AR')}` : ''}
                        </div>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {isOpen ? 'Ocultar' : 'Ver'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Registros del Año */}
                  {isOpen && (
                    <div className="year-group-content" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {itemsAnio.map((r) => {
                        const mec = mecanicos.find(m => m.id === r.mecanicoId);
                        const totalArs = (r.repuestosArs || 0) + (r.manoObraArs || 0);

                        return (
                          <div key={r.id} className="card record-item" style={{ 
                            borderLeftColor: r.km ? 'var(--primary)' : 'var(--accent)' 
                          }}>
                            <div className="record-item-header">
                              <div className="record-title-area">
                                <div className="record-title">{r.tipo}</div>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {totalArs > 0 || r.gastoUsd ? (
                                  <div className="record-cost-badge">
                                    {r.gastoUsd ? `USD ${r.gastoUsd.toLocaleString('es-AR', { maximumFractionDigits: 1 })}` : ''}
                                    {r.gastoUsd && totalArs > 0 ? ' / ' : ''}
                                    {totalArs > 0 ? `$${totalArs.toLocaleString('es-AR')}` : ''}
                                  </div>
                                ) : null}
                                <button 
                                  className="btn btn-secondary btn-sm" 
                                  onClick={() => handleOpenEdit(r)}
                                  style={{ padding: '6px' }}
                                  title="Editar registro"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  onClick={() => handleDelete(r.id)}
                                  style={{ padding: '6px' }}
                                  title="Borrar registro"
                                >
                                  <Trash2Icon size={12} />
                                </button>
                              </div>
                            </div>

                            <div className="record-date-km" style={{ marginBottom: '8px' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginRight: '16px' }}>
                                <Calendar size={12} /> {r.fecha} {r.esFechaAproximada ? '(Aprox.)' : ''}
                              </span>
                              {r.km && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <Milestone size={12} /> {r.km.toLocaleString()} KM
                                </span>
                              )}
                            </div>

                            {r.notas && <div className="record-body">{r.notas}</div>}

                            {/* Desglose de Costos e Información Adicional */}
                            <div className="record-details-grid">
                              <div className="record-detail-col">
                                <h6>Proveedor / Taller</h6>
                                <p>{mec ? `${mec.nombre} (${mec.alias})` : r.mecanicoId === 'mecanico_externo' || r.recomendadoPor ? `Taller sugerido (${r.recomendadoPor || 'Externo'})` : 'No registrado'}</p>
                              </div>

                              <div className="record-detail-col">
                                <h6>Desglose de Costos</h6>
                                <p>
                                  Mano de Obra: {r.manoObraArs !== null ? `$${r.manoObraArs.toLocaleString('es-AR')}` : 'Sin datos'} <br />
                                  Repuestos: {r.repuestosArs !== null ? `$${r.repuestosArs.toLocaleString('es-AR')}` : 'Sin datos'}
                                  {r.cotizacionUsd ? ` (Cot. USD: $${r.cotizacionUsd})` : ''}
                                </p>
                              </div>

                              {r.detalleRepuestos && r.detalleRepuestos.length > 0 && (
                                <div className="record-detail-col" style={{ gridColumn: 'span 2' }}>
                                  <h6>Repuestos Detallados</h6>
                                  <ul className="repuestos-lista">
                                    {r.detalleRepuestos.map((item, idx) => (
                                      <li key={idx}>
                                        {item.item} {item.precioArs ? `($${item.precioArs.toLocaleString()})` : ''}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {r.adjuntos && r.adjuntos.length > 0 && (
                                <div className="record-detail-col" style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                                  <h6>Documentos / Facturas Adjuntas</h6>
                                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {r.adjuntos.map((file, idx) => {
                                      const fileName = typeof file === 'string' ? file : file.name;
                                      return (
                                        <span 
                                          key={idx} 
                                          className="badge" 
                                          style={{ 
                                            backgroundColor: 'rgba(255,255,255,0.05)', 
                                            border: '1px solid var(--border-color)', 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            color: 'white',
                                            padding: '4px 8px'
                                          }}
                                        >
                                          <FileText size={12} color="var(--primary)" />
                                          <span 
                                            onClick={(e) => handleViewOnline(file, e)}
                                            style={{ fontWeight: '500', fontSize: '12px', cursor: 'pointer' }}
                                            title="Ver online"
                                          >
                                            {fileName}
                                          </span>
                                          <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px' }}>
                                            <button 
                                              type="button" 
                                              onClick={(e) => handleViewOnline(file, e)}
                                              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '2px' }}
                                              title="Ver online"
                                            >
                                              <Eye size={12} />
                                            </button>
                                            <button 
                                              type="button" 
                                              onClick={(e) => handleDownloadFile(file, e)}
                                              style={{ background: 'none', border: 'none', color: 'var(--status-ok)', cursor: 'pointer', padding: '2px' }}
                                              title="Descargar archivo"
                                            >
                                              <Download size={12} />
                                            </button>
                                          </div>
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {registrosFiltrados.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                No se encontraron mantenimientos registrados que coincidan con los filtros seleccionados.
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MODAL REGISTRAR TRABAJO --- */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>{editingId ? 'Editar Mantenimiento' : 'Registrar Mantenimiento'}</h3>
              <button className="modal-close" onClick={() => setShowFormModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. SECCIÓN DE ESCANEO DE FACTURA MEDIANTE SUBIDA DE ARCHIVO REAL */}
                <div className="ocr-section" style={{
                  border: '1px dashed var(--accent)',
                  backgroundColor: 'rgba(6, 182, 212, 0.05)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent)', fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>
                    <Sparkles size={16} />
                    <span>Lectura Automática de Factura con IA (Opcional)</span>
                  </div>

                  {isScanning ? (
                    <div className="ocr-scanning-container">
                      <div className="ocr-scanner-line-wrapper">
                        <div className="ocr-scanner-line"></div>
                      </div>
                      <span className="ocr-scanning-text">PROCESANDO FACTURA CON IA...</span>
                    </div>
                  ) : (
                    <>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                        Subí la foto o PDF del comprobante para autocompletar mecánico, montos y repuestos al instante.
                      </p>
                      
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <input 
                          type="file" 
                          accept="image/*,application/pdf" 
                          id="ocr-file-upload-input" 
                          onChange={handleScanUploadedFile} 
                          style={{ display: 'none' }} 
                        />
                        <label 
                          htmlFor="ocr-file-upload-input" 
                          className="btn btn-primary btn-sm" 
                          style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}
                        >
                          <Upload size={14} />
                          <span>Adjuntar y Leer Factura</span>
                        </label>
                      </div>

                      {ocrSuccessMsg && (
                        <div style={{ marginTop: '10px', padding: '6px 12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--status-ok)', fontSize: '11px', borderRadius: '6px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle2 size={13} />
                          {ocrSuccessMsg}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* PASO 1: DATOS DEL MECÁNICO / TALLER */}
                <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={15} /> 1. Datos del Mecánico / Taller
                  </h4>

                  <div className="form-group" style={{ marginBottom: (mecanicoId === 'mecanico_externo' || mecanicoId === 'new') ? '12px' : 0 }}>
                    <label>Mecánico o Taller Responsable *</label>
                    <select
                      className="form-control"
                      value={mecanicoId}
                      onChange={(e) => setMecanicoId(e.target.value)}
                      required
                    >
                      <option value="">Seleccionar mecánico o taller...</option>
                      {[...mecanicos].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '')).map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nombre} ({m.alias || 'Taller'}) {m.telefono ? ` - Tel: ${m.telefono}` : ''}
                        </option>
                      ))}
                      <option value="mecanico_externo">➕ Registrar Nuevo Taller / Mecánico No Registrado</option>
                    </select>
                  </div>

                  {/* Formulario para registrar nuevo taller al instante */}
                  {(mecanicoId === 'mecanico_externo' || mecanicoId === 'new') && (
                    <div style={{ marginTop: '12px', padding: '14px', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px dashed rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Plus size={14} /> Registrar Nuevo Taller en el Sistema:
                      </div>

                      <div className="row g-2">
                        <div className="col-md-6 form-group">
                          <label style={{ fontSize: '11px' }}>Nombre del Taller o Mecánico *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej. Baterías Córdoba, Taller Don Luis..."
                            value={nuevoMecanicoNombre}
                            onChange={(e) => setNuevoMecanicoNombre(e.target.value)}
                            required
                          />
                        </div>

                        <div className="col-md-6 form-group">
                          <label style={{ fontSize: '11px' }}>Teléfono (Opcional)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej. 351-4567890"
                            value={nuevoMecanicoTelefono}
                            onChange={(e) => setNuevoMecanicoTelefono(e.target.value)}
                          />
                        </div>

                        <div className="col-md-6 form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '11px' }}>Alias / Nombre Corto (Opcional)</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Ej. Don Luis"
                            value={nuevoMecanicoAlias}
                            onChange={(e) => setNuevoMecanicoAlias(e.target.value)}
                          />
                        </div>

                        <div className="col-md-6 form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '11px' }}>Especialidad / Rubro (Opcional)</label>
                          <select
                            className="form-control"
                            value={ESPECIALIDADES_PREDEFINIDAS.includes(nuevoMecanicoEspecialidad) ? nuevoMecanicoEspecialidad : (nuevoMecanicoEspecialidad ? 'custom' : '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'custom') {
                                setNuevoMecanicoEspecialidad('Otra especialidad');
                              } else {
                                setNuevoMecanicoEspecialidad(val);
                              }
                            }}
                          >
                            <option value="">Seleccionar especialidad o rubro...</option>
                            {ESPECIALIDADES_PREDEFINIDAS.map((esp, i) => (
                              <option key={i} value={esp}>📌 {esp}</option>
                            ))}
                            <option value="custom">✏️ Otra especialidad personalizada...</option>
                          </select>

                          {(!ESPECIALIDADES_PREDEFINIDAS.includes(nuevoMecanicoEspecialidad) && nuevoMecanicoEspecialidad !== '') && (
                            <input
                              type="text"
                              className="form-control"
                              style={{ marginTop: '6px' }}
                              placeholder="Escribí la especialidad personalizada..."
                              value={nuevoMecanicoEspecialidad === 'Otra especialidad' ? '' : nuevoMecanicoEspecialidad}
                              onChange={(e) => setNuevoMecanicoEspecialidad(e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ficha informativa rápida del mecánico seleccionado */}
                  {(() => {
                    const mecSel = mecanicos.find(m => m.id === mecanicoId);
                    if (!mecSel) return null;
                    return (
                      <div style={{ marginTop: '10px', padding: '10px 14px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', fontSize: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                          {mecSel.nombre} ({mecSel.alias})
                        </div>
                        <div style={{ color: mecSel.telefono ? 'var(--status-ok)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} />
                          <span>{mecSel.telefono ? `Tel: ${mecSel.telefono}` : 'Sin teléfono asignado'}</span>
                        </div>
                        {mecSel.especialidad && (
                          <div style={{ color: 'var(--accent)', fontSize: '11px' }}>
                            • {mecSel.especialidad}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* PASO 2: MANTENIMIENTO REALIZADO Y KILOMETRAJE */}
                <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Wrench size={15} /> 2. Mantenimiento Realizado & Vehículo
                  </h4>

                  {/* Selector Unificado de Mantenimiento / Plan */}
                  <div className="form-group">
                    <label>Mantenimiento / Tarea Realizada *</label>
                    <select
                      className="form-control"
                      value={planItemId || (tipo ? 'custom' : '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setPlanItemId('custom');
                        } else if (val) {
                          setPlanItemId(val);
                          const item = planItems.find(p => p.id === val);
                          if (item) setTipo(item.nombre);
                        } else {
                          setPlanItemId('');
                          setTipo('');
                        }
                      }}
                      required={!tipo}
                    >
                      <option value="">-- Seleccionar Tarea del Plan de Mantenimiento --</option>
                      {planItems.map(p => (
                        <option key={p.id} value={p.id}>
                          📌 {p.nombre} {p.intervaloKm ? `(cada ${p.intervaloKm.toLocaleString()} km)` : ''}
                        </option>
                      ))}
                      <option value="custom">✏️ Otro mantenimiento personalizado (no está en el plan)</option>
                    </select>
                  </div>

                  {/* Entrada libre solo si seleccionó personalizado o no tiene ítem de plan */}
                  {(planItemId === 'custom' || (!planItemId && tipo)) && (
                    <div className="form-group">
                      <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Escribí el nombre del mantenimiento personalizado *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej. Reparación de alzacristales, Alineación y balanceo..."
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <div className="form-row" style={{ marginTop: '12px' }}>
                    <div className="form-group">
                      <label>Fecha del Servicio *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', marginTop: '16px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', fontSize: '12px' }}>
                        <input
                          type="checkbox"
                          checked={esFechaAproximada}
                          onChange={(e) => setEsFechaAproximada(e.target.checked)}
                        />
                        ¿Fecha Aproximada?
                      </label>
                    </div>
                    <div className="form-group">
                      <label>Kilometraje Actual (KM) *</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 195000"
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PASO 3: COSTOS Y DESGLOSE DE REPUESTOS */}
                <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={15} /> 3. Costos & Desglose de Repuestos
                  </h4>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Costo Mano de Obra (ARS)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 15000"
                        value={manoObraArs}
                        onChange={(e) => setManoObraArs(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Costo Repuestos (ARS)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 85000"
                        value={repuestosArs}
                        onChange={(e) => setRepuestosArs(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cotización Dólar (ARS)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 1420"
                        value={cotizacionUsd}
                        onChange={(e) => setCotizacionUsd(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Gasto USD (Opcional)</label>
                      <input
                        type="number"
                        step="any"
                        className="form-control"
                        placeholder="Dejar vacío para auto-calcular"
                        value={gastoUsd}
                        onChange={(e) => setGastoUsd(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Resumen Total Calculado en vivo */}
                  {(() => {
                    const labor = parseInt(manoObraArs) || 0;
                    const parts = parseInt(repuestosArs) || 0;
                    const totalArs = labor + parts;
                    const cot = parseFloat(cotizacionUsd) || 0;
                    const usdCalc = gastoUsd ? parseFloat(gastoUsd) : (cot > 0 && totalArs > 0 ? totalArs / cot : 0);

                    if (totalArs === 0 && !usdCalc) return null;

                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.25)', borderRadius: '8px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', textTransform: 'uppercase' }}>
                          Costo Total del Trabajo:
                        </span>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {totalArs > 0 ? `$${totalArs.toLocaleString('es-AR')} ARS` : ''} 
                          {totalArs > 0 && usdCalc > 0 ? ' / ' : ''}
                          {usdCalc > 0 ? `USD ${usdCalc.toLocaleString('es-AR', { maximumFractionDigits: 1 })}` : ''}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Desglose de Repuestos e Ítems */}
                  <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Desglose de Repuestos Utilizados {editingRepuestoIndex !== null && <span style={{ color: 'var(--primary)', textTransform: 'none', marginLeft: '6px' }}>(Editando repuesto #{editingRepuestoIndex + 1})</span>}
                    </label>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ítem / Repuesto (Ej. Aceite Total 5W40)"
                        value={tempRepuestoItem}
                        onChange={(e) => setTempRepuestoItem(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveRepuesto(); } }}
                        style={{ flex: 2, padding: '6px 10px', fontSize: '13px' }}
                      />
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Precio ARS"
                        value={tempRepuestoPrecio}
                        onChange={(e) => setTempRepuestoPrecio(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveRepuesto(); } }}
                        style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
                      />
                      <button 
                        type="button" 
                        className={`btn btn-${editingRepuestoIndex !== null ? 'primary' : 'secondary'} btn-sm`} 
                        onClick={handleSaveRepuesto}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {editingRepuestoIndex !== null ? 'Guardar' : 'Añadir'}
                      </button>
                      {editingRepuestoIndex !== null && (
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm" 
                          onClick={handleCancelEditRepuesto}
                          title="Cancelar edición"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {repuestosDetalle.length > 0 && (
                      <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {repuestosDetalle.map((rep, idx) => {
                          const isEditingThis = editingRepuestoIndex === idx;
                          return (
                            <li 
                              key={idx} 
                              style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                fontSize: '12px', 
                                padding: '6px 10px', 
                                backgroundColor: isEditingThis ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255,255,255,0.02)', 
                                border: `1px solid ${isEditingThis ? 'var(--primary)' : 'var(--border-color)'}`, 
                                borderRadius: '6px',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <span 
                                onClick={() => handleStartEditRepuesto(idx)}
                                style={{ cursor: 'pointer', flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}
                                title="Hacé clic para editar este repuesto"
                              >
                                <span style={{ fontWeight: '600', color: isEditingThis ? 'var(--primary)' : 'var(--text-primary)' }}>
                                  {rep.item}
                                </span>
                                {rep.precioArs ? (
                                  <span style={{ color: 'var(--text-secondary)' }}>
                                    (${rep.precioArs.toLocaleString('es-AR')})
                                  </span>
                                ) : null}
                              </span>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <button 
                                  type="button" 
                                  onClick={() => handleStartEditRepuesto(idx)} 
                                  style={{ background: 'none', border: 'none', color: isEditingThis ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px' }}
                                  title="Editar repuesto"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveRepuesto(idx)} 
                                  style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '2px 4px' }}
                                  title="Eliminar repuesto"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                {/* PASO 4: COMPROBANTES Y NOTAS */}
                <div style={{ border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.015)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={15} /> 4. Comprobantes Adjuntos & Notas
                  </h4>

                  {/* ARCHIVOS ADJUNTOS REALES */}
                  <div style={{ border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px', marginBottom: '14px', backgroundColor: 'rgba(0,0,0,0.1)' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                      Comprobantes y Facturas Adjuntas
                    </label>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        id="direct-adjunto-input" 
                        multiple 
                        onChange={handleDirectFileSelect} 
                        style={{ display: 'none' }} 
                      />
                      <label 
                        htmlFor="direct-adjunto-input" 
                        className="btn btn-secondary btn-sm" 
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Paperclip size={14} />
                        <span>Examinar y Adjuntar Archivos</span>
                      </label>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Fotos o documentos PDF
                      </span>
                    </div>

                    {adjuntos.length > 0 ? (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {adjuntos.map((file, idx) => {
                          const fileName = typeof file === 'string' ? file : file.name;
                          return (
                            <span key={idx} className="badge" style={{ backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '6px' }}>
                              <FileText size={12} color="var(--primary)" />
                              <span 
                                onClick={(e) => handleViewOnline(file, e)}
                                style={{ fontWeight: '500', fontSize: '12px', cursor: 'pointer' }}
                                title="Ver online"
                              >
                                {fileName}
                              </span>
                              <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px', alignItems: 'center' }}>
                                <button 
                                  type="button" 
                                  onClick={(e) => handleViewOnline(file, e)}
                                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '2px' }}
                                  title="Ver online"
                                >
                                  <Eye size={12} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={(e) => handleDownloadFile(file, e)}
                                  style={{ background: 'none', border: 'none', color: 'var(--status-ok)', cursor: 'pointer', padding: '2px' }}
                                  title="Descargar archivo"
                                >
                                  <Download size={12} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveAdjunto(idx)} 
                                  style={{ background: 'none', border: 'none', color: 'var(--status-danger)', cursor: 'pointer', padding: '2px' }}
                                  title="Quitar adjunto"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Sin comprobantes adjuntos.
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Notas Adicionales / Comentarios del Mecánico</label>
                    <textarea
                      className="form-control"
                      placeholder="Detalles sobre el trabajo realizado, garantías, observaciones..."
                      rows="3"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isScanning}>
                  {editingId ? 'Guardar Cambios' : 'Guardar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE PREVISUALIZACIÓN ONLINE Y DESCARGA DE COMPROBANTES */}
      {previewFile && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '94vw', height: '88vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>
                  Comprobante: {previewFile.name}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => {
                    const win = window.open();
                    if (win) {
                      win.document.write(`<iframe src="${previewFile.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <ExternalLink size={14} />
                  <span>Pestaña Nueva</span>
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm" 
                  onClick={(e) => handleDownloadFile(previewFile, e)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>Descargar Archivo</span>
                </button>
                <button className="modal-close" onClick={() => setPreviewFile(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ flex: 1, padding: '16px', overflow: 'auto', display: 'flex', backgroundColor: '#0d1117', justifyContent: 'center', alignItems: 'center' }}>
              {previewFile && (
                (previewFile.dataUrl.startsWith('data:application/pdf') || previewFile.dataUrl.endsWith('.pdf')) ? (
                  <iframe 
                    src={previewFile.dataUrl} 
                    title={previewFile.name} 
                    style={{ width: '100%', height: '100%', border: 'none', minHeight: '600px' }} 
                  />
                ) : (
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', overflow: 'auto' }}>
                    <img 
                      src={previewFile.dataUrl} 
                      alt={previewFile.name} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} 
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente helper para el icono de borrar debido a una colisión de nombres
const Trash2Icon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
    <path d="M3 6h18"/>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
    <line x1="10" x2="10" y1="11" y2="17"/>
    <line x1="14" x2="14" y1="11" y2="17"/>
  </svg>
);

export default HistorialRegistros;
