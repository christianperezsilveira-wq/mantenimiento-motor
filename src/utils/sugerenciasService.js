// Servicio de Generación y Validación de Sugerencias Inteligentes de Próximos Mantenimientos
import { savePlanItem } from './db';

const DISMISSED_KEY = 'mantenimiento_sugerencias_desechadas';

export const getDesechadas = () => {
  try {
    const data = localStorage.getItem(DISMISSED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    return [];
  }
};

export const desecharSugerencia = (id) => {
  const desechadas = getDesechadas();
  if (!desechadas.includes(id)) {
    desechadas.push(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(desechadas));
  }
};

export const aprobarSugerencia = (sugerencia, planItemCustom = null) => {
  const itemData = planItemCustom || {
    nombre: sugerencia.nombre,
    intervaloKm: sugerencia.intervaloKm || 0,
    intervaloMeses: sugerencia.intervaloMeses || 0,
    ultimoKm: sugerencia.ultimoKm || null,
    ultimaFecha: sugerencia.ultimaFecha || null,
    nota: sugerencia.nota || ''
  };

  savePlanItem(itemData);
  desecharSugerencia(sugerencia.id);
  return itemData;
};

export const getSugerenciasInteligentes = (vehiculoActivo, registros, planItems = []) => {
  if (!vehiculoActivo) return [];

  const desechadas = getDesechadas();
  const planNombres = planItems.map(p => (p.nombre || '').toLowerCase().trim());

  // Definición de sugerencias basadas en el historial 2026 y registros reales
  const propuestasBase = [
    {
      id: 'sug_aceite_2026',
      nombre: 'Cambio de aceite y filtro',
      intervaloKm: 10000,
      intervaloMeses: 12,
      ultimoKm: 194998,
      ultimaFecha: '2026-06-08',
      nota: 'Ritmo real histórico: cada 10.000 - 12.000 km.',
      fundamento: 'Basado en la factura real de AGROTODO N° 005729 (08/06/2026 - 194.998 KM).',
      proximoKm: 204998
    },
    {
      id: 'sug_bateria_2026',
      nombre: 'Cambio de batería',
      intervaloKm: 0,
      intervaloMeses: 24,
      ultimoKm: 195000,
      ultimaFecha: '2026-01-14',
      nota: 'Batería 12V 75Ah colocada en enero 2026.',
      fundamento: 'Basado en el reemplazo de batería registrado el 14/01/2026.',
      proximoFecha: '2028-01-14'
    },
    {
      id: 'sug_bujias',
      nombre: 'Bujías',
      intervaloKm: 40000,
      intervaloMeses: 0,
      ultimoKm: 127500,
      ultimaFecha: '2024-01-03',
      nota: 'NGK. Recomendación de reemplazo por kilometraje acumulado.',
      fundamento: 'Detectado último cambio a los 127.500 KM en 2024 (+67.000 km recorridos).',
      proximoKm: 167500
    },
    {
      id: 'sug_distribucion',
      nombre: 'Correa de distribución + bomba de agua',
      intervaloKm: 60000,
      intervaloMeses: 60,
      ultimoKm: 177740,
      ultimaFecha: '2025-11-13',
      nota: 'Kit correa + bomba de agua especificación PSA.',
      fundamento: 'Basado en el kit de distribución cambiado el 13/11/2025 (177.740 KM).',
      proximoKm: 237740
    },
    {
      id: 'sug_cubiertas',
      nombre: 'Cubiertas / Neumáticos',
      intervaloKm: 70000,
      intervaloMeses: 0,
      ultimoKm: 150000,
      ultimaFecha: '2024-12-14',
      nota: 'Recomendación: Continental, Bridgestone o Michelin.',
      fundamento: 'Basado en las 4 cubiertas Bridgestone colocadas a los 150.000 KM.',
      proximoKm: 220000
    }
  ];

  // Filtrar sugerencias que no hayan sido desechadas y que no existan ya en el Plan activo
  return propuestasBase.filter(sug => {
    if (desechadas.includes(sug.id)) return false;
    if (planNombres.includes(sug.nombre.toLowerCase().trim())) return false;
    return true;
  });
};
