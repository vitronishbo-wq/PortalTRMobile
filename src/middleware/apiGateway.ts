import { Request, Response, NextFunction } from 'express';
import { ApiGatewayRateLimiter, RateLimitCheckResult, ApiKeyRecord } from '../services/apiGatewayRateLimiter.js';

export interface ApiGatewayOptions {
  requireApiKey?: boolean;
  defaultRpm?: number;
}

// Map for tracking IP-based sliding window rate limits when no API Key is provided
const ipRequestWindows: Map<string, number[]> = new Map();

/**
 * Middleware do API Gateway com verificação de API Key, validação de Tier e Rate Limiting com Sliding Window
 */
export function apiGateway(options: ApiGatewayOptions = {}) {
  const requireApiKey = options.requireApiKey ?? false;
  const defaultRpm = options.defaultRpm ?? 120; // Default 120 req/min for anonymous IP requests

  return (req: Request, res: Response, next: NextFunction) => {
    // Extrai API Key dos headers, query params ou Authorization header
    let apiKey = (
      req.headers['x-api-key'] ||
      req.query.apiKey ||
      req.query.api_key
    ) as string | undefined;

    if (!apiKey && req.headers['authorization']) {
      const authHeader = String(req.headers['authorization']);
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7).trim();
      } else if (authHeader.startsWith('ApiKey ')) {
        apiKey = authHeader.substring(7).trim();
      }
    }

    // Se API Key for obrigatória e não fornecida
    if (requireApiKey && !apiKey) {
      return res.status(401).json({
        success: false,
        error: 'Acesso Negado: API Key é obrigatória. Forneça via header x-api-key ou parâmetro apiKey.'
      });
    }

    // Se API Key foi fornecida, valida via ApiGatewayRateLimiter
    if (apiKey) {
      const rateCheck: RateLimitCheckResult = ApiGatewayRateLimiter.verifyAndRateLimit(apiKey);

      if (!rateCheck.allowed) {
        res.setHeader('X-RateLimit-Limit', rateCheck.keyRecord?.rateLimitRpm || 0);
        res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
        res.setHeader('X-RateLimit-Reset', rateCheck.resetSeconds);

        const statusCode = rateCheck.error?.includes('inválida') ? 401 : 429;
        return res.status(statusCode).json({
          success: false,
          error: rateCheck.error,
          remaining: rateCheck.remaining,
          resetSeconds: rateCheck.resetSeconds,
          tier: rateCheck.keyRecord?.tier
        });
      }

      // Sucesso: Anexa metadados na request e define headers HTTP de Rate Limit
      if (rateCheck.keyRecord) {
        res.setHeader('X-RateLimit-Limit', rateCheck.keyRecord.rateLimitRpm);
        res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);
        res.setHeader('X-RateLimit-Reset', rateCheck.resetSeconds);
        (req as any).apiKeyRecord = rateCheck.keyRecord;
      }

      return next();
    }

    // Se nenhuma API Key foi fornecida e não é estritamente obrigatória, aplica IP Rate Limiting
    const rawIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') as string;
    const ip = rawIp.split(',')[0].trim();
    const now = Date.now();
    const windowStart = now - 60000; // 1 min sliding window

    let timestamps = ipRequestWindows.get(ip) || [];
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= defaultRpm) {
      const oldest = timestamps[0] || now;
      const resetSeconds = Math.ceil((oldest + 60000 - now) / 1000);

      res.setHeader('X-RateLimit-Limit', defaultRpm);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', resetSeconds);

      return res.status(429).json({
        success: false,
        error: `Rate Limit excedido para o IP (${defaultRpm} req/min). Tente novamente em ${resetSeconds}s.`,
        remaining: 0,
        resetSeconds
      });
    }

    timestamps.push(now);
    ipRequestWindows.set(ip, timestamps);

    const remaining = defaultRpm - timestamps.length;
    res.setHeader('X-RateLimit-Limit', defaultRpm);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', 60);

    return next();
  };
}

/**
 * Middleware com API Key obrigatória
 */
export const requireApiKey = apiGateway({ requireApiKey: true });

/**
 * Middleware com API Key opcional (fallback para IP Rate Limit)
 */
export const apiGatewayMiddleware = apiGateway({ requireApiKey: false });
