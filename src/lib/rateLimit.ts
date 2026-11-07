interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Nettoyage périodique des enregistrements expirés en mémoire
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000);

export interface RateLimitOptions {
  windowMs: number; // Durée de la fenêtre en millisecondes
  max: number;      // Nombre maximal de requêtes autorisées
}

/**
 * Vérifie et incrémente le quota pour un identifiant donné (IP ou Numéro de téléphone)
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 10 * 60 * 1000, max: 5 }
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      remaining: options.max - 1,
      resetInSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (record.count >= options.max) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: options.max - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}

