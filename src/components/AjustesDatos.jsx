import React, { useRef, useState } from 'react';
import { Download, Upload, RotateCcw, FileJson, Check, AlertTriangle } from 'lucide-react';
import { exportDatabase, importDatabase, resetDatabase } from '../utils/db';

const AjustesDatos = ({ onDatabaseChange }) => {
  const fileInputRef = useRef(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Descargar base de datos como archivo JSON
  const handleExport = () => {
    try {
      const dataStr = exportDatabase();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `mantenimiento_motores_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg('Base de datos exportada con éxito.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setErrorMsg('Error al exportar los datos.');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  // Subir e importar archivo JSON
  const handleImport = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    
    if (!file) return;

    fileReader.onload = (event) => {
      const content = event.target.result;
      const success = importDatabase(content);
      
      if (success) {
        setSuccessMsg('¡Base de datos importada con éxito! La aplicación se ha actualizado.');
        onDatabaseChange();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Error al importar el archivo. Verifica que tenga un formato JSON válido.');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    };
    
    fileReader.readAsText(file);
    // Limpiar input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Restablecer datos semilla originales
  const handleReset = () => {
    const confirmMessage = "⚠️ ATENCIÓN: Esto eliminará todos tus cambios personalizados (vehículos nuevos, mantenimientos registrados y mecánicos agregados) y restablecerá la base de datos a los registros semilla originales de 2022-2026.\n\n¿Estás seguro de que querés continuar?";
    
    if (confirm(confirmMessage)) {
      resetDatabase();
      onDatabaseChange();
      setSuccessMsg('Base de datos restablecida a los valores semilla originales.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div>
      <div style={{ marginTop: '12px' }}></div>

      <div className="ajustes-grid">
        {/* Exportar */}
        <div className="card ajuste-card">
          <div className="ajuste-info">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <Download size={20} color="var(--primary)" />
              <h4>Exportar Datos</h4>
            </div>
            <p>
              Descargá una copia completa de tu base de datos actual (vehículos, plan de mantenimiento, mecánicos e historial) en un archivo JSON. Ideal para resguardo o para pasar los datos de tu computadora a tu celular.
            </p>
          </div>
          <div className="ajuste-btn-group">
            <button className="btn btn-primary" onClick={handleExport}>
              <FileJson size={16} />
              <span>Exportar como JSON</span>
            </button>
          </div>
        </div>

        {/* Importar */}
        <div className="card ajuste-card">
          <div className="ajuste-info">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <Upload size={20} color="var(--accent)" />
              <h4>Importar Datos</h4>
            </div>
            <p>
              Cargá un archivo JSON previamente exportado para restaurar tu historial o cargar la planilla de mantenimiento de tus vehículos en este navegador. Reemplazará los datos actuales.
            </p>
          </div>
          <div className="ajuste-btn-group">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
              <FileJson size={16} />
              <span>Seleccionar Archivo JSON</span>
            </button>
          </div>
        </div>

        {/* Restablecer */}
        <div className="card ajuste-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <div className="ajuste-info">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <RotateCcw size={20} color="var(--status-danger)" />
              <h4>Restablecer Aplicación</h4>
            </div>
            <p>
              Borrá los cambios locales y volvé a cargar los datos iniciales provistos por el prototipo semilla original (datos de La Camioneta, Leo, Julio, Quiñoneros, etc. período 2022-2026).
            </p>
          </div>
          <div className="ajuste-btn-group">
            <button className="btn btn-danger" onClick={handleReset}>
              <AlertTriangle size={16} />
              <span>Restablecer Base de Datos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alertas flotantes de confirmación */}
      {successMsg && (
        <div style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          backgroundColor: 'var(--status-ok)', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '13px',
          zIndex: 1000
        }}>
          <Check size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          backgroundColor: 'var(--status-danger)', 
          color: 'white', 
          padding: '12px 20px', 
          borderRadius: '8px', 
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '13px',
          zIndex: 1000
        }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}
    </div>
  );
};

export default AjustesDatos;
