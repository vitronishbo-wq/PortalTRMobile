export interface ApiKeyRecord {
  apiKey: string;
  developerName: string;
  companyName: string;
  tier: 'FREE_DEVELOPER' | 'PRO_BUSINESS' | 'ENTERPRISE_BANK';
  rateLimitRpm: number; // requests per minute
  active: boolean;
  createdAt: number;
  requestCountTotal: number;
  lastUsedAt?: number;
}

export interface RateLimitCheckResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  keyRecord?: ApiKeyRecord;
  error?: string;
}

export class ApiGatewayRateLimiter {
  private static apiKeys: Map<string, ApiKeyRecord> = new Map([
    [
      'vcos_live_key_angola_bank_9921',
      {
        apiKey: 'vcos_live_key_angola_bank_9921',
        developerName: 'Sila Janeiro (Founder)',
        companyName: 'Vitronis Tech Angola',
        tier: 'ENTERPRISE_BANK',
        rateLimitRpm: 1200,
        active: true,
        createdAt: Date.now() - 86400000 * 30,
        requestCountTotal: 14200,
        lastUsedAt: Date.now()
      }
    ],
    [
      'vcos_test_dev_key_4412',
      {
        apiKey: 'vcos_test_dev_key_4412',
        developerName: 'Dev Partner',
        companyName: 'MinhaEmpresa LDA',
        tier: 'PRO_BUSINESS',
        rateLimitRpm: 120,
        active: true,
        createdAt: Date.now() - 86400000 * 5,
        requestCountTotal: 340,
        lastUsedAt: Date.now() - 3600000
      }
    ]
  ]);

  // Request timestamp tracking per API Key: key -> timestamps array in current minute window
  private static requestWindows: Map<string, number[]> = new Map();

  /**
   * Validates API Key and checks sliding window rate limit
   */
  static verifyAndRateLimit(apiKey: string): RateLimitCheckResult {
    const record = ApiGatewayRateLimiter.apiKeys.get(apiKey);
    if (!record || !record.active) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: 60,
        error: 'API Key inválida ou inativa.'
      };
    }

    const now = Date.now();
    const windowStart = now - 60000; // 1 minute sliding window

    let timestamps = ApiGatewayRateLimiter.requestWindows.get(apiKey) || [];
    // Clean expired timestamps
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= record.rateLimitRpm) {
      const oldestInWindow = timestamps[0] || now;
      const resetSeconds = Math.ceil((oldestInWindow + 60000 - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
        keyRecord: record,
        error: `Rate Limit Excedido (${record.rateLimitRpm} req/min). Tente em ${resetSeconds}s.`
      };
    }

    // Record request
    timestamps.push(now);
    ApiGatewayRateLimiter.requestWindows.set(apiKey, timestamps);

    record.requestCountTotal += 1;
    record.lastUsedAt = now;

    return {
      allowed: true,
      remaining: record.rateLimitRpm - timestamps.length,
      resetSeconds: 60,
      keyRecord: record
    };
  }

  static createApiKey(
    developerName: string,
    companyName: string,
    tier: 'FREE_DEVELOPER' | 'PRO_BUSINESS' | 'ENTERPRISE_BANK' = 'PRO_BUSINESS'
  ): ApiKeyRecord {
    const rand = Math.random().toString(36).substring(2, 10);
    const apiKey = `vcos_${tier.toLowerCase().split('_')[0]}_${rand}_${Date.now().toString(36)}`;
    const rpmMap = {
      FREE_DEVELOPER: 30,
      PRO_BUSINESS: 180,
      ENTERPRISE_BANK: 1200
    };

    const record: ApiKeyRecord = {
      apiKey,
      developerName,
      companyName,
      tier,
      rateLimitRpm: rpmMap[tier],
      active: true,
      createdAt: Date.now(),
      requestCountTotal: 0
    };

    ApiGatewayRateLimiter.apiKeys.set(apiKey, record);
    return record;
  }

  static getAllApiKeys(): ApiKeyRecord[] {
    return Array.from(ApiGatewayRateLimiter.apiKeys.values());
  }

  static toggleActiveKey(apiKey: string): ApiKeyRecord | undefined {
    const record = ApiGatewayRateLimiter.apiKeys.get(apiKey);
    if (record) {
      record.active = !record.active;
    }
    return record;
  }
}
