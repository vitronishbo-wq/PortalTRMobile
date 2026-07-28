export interface ChargeRequest {
  amount: number;
  currency: string;
  description: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: 'credit_card' | 'multicaixa_express' | 'qr_code' | 'reference';
  referenceId?: string;
}

export interface ChargeResponse {
  chargeId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  provider: string;
  referenceCode?: string;
  paymentUrl?: string;
  createdAt: number;
  message?: string;
}

export interface RefundResponse {
  refundId: string;
  chargeId: string;
  amount: number;
  status: 'succeeded' | 'failed';
  timestamp: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  version: string;
  isConfigured: boolean;
  mode: 'sandbox' | 'live';
  
  initialize(config: Record<string, any>): Promise<void>;
  authenticate(clientId: string, clientSecret: string): Promise<{ success: boolean; token?: string; error?: string }>;
  charge(params: ChargeRequest): Promise<ChargeResponse>;
  status(chargeId: string): Promise<ChargeResponse>;
  refund(chargeId: string, amount?: number): Promise<RefundResponse>;
  webhook(payload: any, signature: string): Promise<{ processed: boolean; eventType?: string }>;
}

export class AppyPayProvider implements PaymentProvider {
  id = 'appypay';
  name = 'AppyPay Payment Gateway';
  version = '1.0.0';
  isConfigured = true;
  mode: 'sandbox' | 'live' = 'sandbox';

  private clientId = 'appypay_sbx_client_99482';
  private token: string | null = 'bearer_sbx_token_mock_appypay';
  private chargesMap = new Map<string, ChargeResponse>();

  async initialize(config: Record<string, any>): Promise<void> {
    if (config.mode) this.mode = config.mode;
    if (config.clientId) this.clientId = config.clientId;
    this.isConfigured = !!(this.clientId && config.clientSecret);
  }

  async authenticate(clientId: string, clientSecret: string): Promise<{ success: boolean; token?: string; error?: string }> {
    if (!clientId || !clientSecret) {
      return { success: false, error: 'ClientID e Secret são obrigatórios para a AppyPay.' };
    }
    this.clientId = clientId;
    this.token = `appypay_auth_token_${Math.random().toString(36).substring(2, 10)}`;
    this.isConfigured = true;
    return { success: true, token: this.token };
  }

  async charge(params: ChargeRequest): Promise<ChargeResponse> {
    const chargeId = `chg_appypay_${Math.random().toString(36).substring(2, 9)}`;
    const referenceCode = `AO-MCX-${Math.floor(100000000 + Math.random() * 900000000)}`;

    const response: ChargeResponse = {
      chargeId,
      status: 'succeeded',
      amount: params.amount,
      currency: params.currency || 'AOA',
      provider: 'AppyPay',
      referenceCode,
      paymentUrl: `https://sandbox.appypay.ao/checkout/${chargeId}`,
      createdAt: Date.now(),
      message: `Cobrança criada com sucesso via AppyPay (${this.mode.toUpperCase()})`
    };

    this.chargesMap.set(chargeId, response);
    return response;
  }

  async status(chargeId: string): Promise<ChargeResponse> {
    const existing = this.chargesMap.get(chargeId);
    if (existing) return existing;

    return {
      chargeId,
      status: 'succeeded',
      amount: 15000,
      currency: 'AOA',
      provider: 'AppyPay',
      referenceCode: `AO-MCX-998877112`,
      createdAt: Date.now() - 3600000,
      message: 'Cobrança confirmada pelo Webhook AppyPay'
    };
  }

  async refund(chargeId: string, amount?: number): Promise<RefundResponse> {
    const existing = this.chargesMap.get(chargeId);
    if (existing) {
      existing.status = 'refunded';
    }

    return {
      refundId: `ref_${Math.random().toString(36).substring(2, 8)}`,
      chargeId,
      amount: amount || existing?.amount || 0,
      status: 'succeeded',
      timestamp: Date.now()
    };
  }

  async webhook(payload: any, signature: string): Promise<{ processed: boolean; eventType?: string }> {
    if (!signature && this.mode === 'live') {
      return { processed: false };
    }
    return {
      processed: true,
      eventType: payload?.event || 'charge.succeeded'
    };
  }
}

export class PaymentRegistry {
  private static providers = new Map<string, PaymentProvider>();

  static register(provider: PaymentProvider): void {
    PaymentRegistry.providers.set(provider.id, provider);
  }

  static get(id: string): PaymentProvider | undefined {
    return PaymentRegistry.providers.get(id);
  }

  static getAll(): PaymentProvider[] {
    return Array.from(PaymentRegistry.providers.values());
  }
}

// Pre-register default AppyPay provider
PaymentRegistry.register(new AppyPayProvider());
