// Helper para Rate Limiting y Cooldown Throttling en el cliente

const attemptsMap = new Map();
const cooldownMap = new Map();

/**
 * Controla el límite de intentos en una ventana de tiempo dada.
 * @param {string} key Identificador único del evento (ej. 'login_attempts')
 * @param {number} maxAttempts Número máximo de intentos permitidos en la ventana
 * @param {number} windowMs Duración de la ventana en milisegundos (por defecto 60000ms = 1 min)
 */
export const checkRateLimit = (key, maxAttempts = 5, windowMs = 60000) => {
  const now = Date.now();
  const record = attemptsMap.get(key) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }

  attemptsMap.set(key, record);

  if (record.count > maxAttempts) {
    const secondsLeft = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      secondsLeft,
      errorMsg: `Demasiados intentos detectados. Por favor esperá ${secondsLeft} segundo(s) antes de reintentar.`
    };
  }

  return { allowed: true, secondsLeft: 0 };
};

/**
 * Limpia el contador de intentos al tener éxito (ej. al ingresar correctamente)
 * @param {string} key 
 */
export const resetRateLimit = (key) => {
  attemptsMap.delete(key);
};

/**
 * Aplica una pausa obligatoria (cooldown) entre ejecuciones consecutivas de acciones sensibles (ej. OCR o guardado acelerado).
 * @param {string} key Identificador de la acción
 * @param {number} cooldownMs Tiempo mínimo en ms entre ejecuciones (por defecto 3000ms = 3s)
 */
export const checkCooldown = (key, cooldownMs = 3000) => {
  const now = Date.now();
  const lastTime = cooldownMap.get(key) || 0;
  const elapsed = now - lastTime;

  if (elapsed < cooldownMs) {
    const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000);
    return {
      inCooldown: true,
      remainingSec,
      errorMsg: `Operación bloqueada temporalmente por throttling. Esperá ${remainingSec}s.`
    };
  }

  cooldownMap.set(key, now);
  return { inCooldown: false, remainingSec: 0 };
};
