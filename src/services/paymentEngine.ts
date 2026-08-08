export interface ChargeRequest {
  amount: number;
  currency: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentMethod?: 'multicaixa_express' | 'reference' | 'qr_code' | 'credit_card';
  referenceId?: string;
}

export interface ChargeResponse {
  chargeId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  provider: string;
  paymentMethod?: 'multicaixa_express' | 'reference' | 'qr_code' | 'credit_card';
  entityCode?: string; // e.g. 00124 (Entidade Multicaixa)
  referenceCode?: string; // e.g. 918 273 401
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  createdAt: number;
  paidAt?: number;
  reconciled?: boolean;
  reconciledWithSmsId?: string;
  refundAmount?: number;
  refundedAt?: number;
  paymentUrl?: string;
  message?: string;
}

export interface RefundResponse {
  refundId: string;
  chargeId: string;
  amount: number;
  status: 'succeeded' | 'failed';
  reason?: string;
  timestamp: number;
}

export interface WebhookLog {
  id: string;
  event: 'charge.succeeded' | 'charge.failed' | 'refund.created' | 'reference.created' | 'reconciliation.matched';
  chargeId: string;
  payload: any;
  status: 'DELIVERED' | 'FAILED' | 'RETRYING';
  responseCode: number;
  timestamp: number;
}

export interface ReconciliationMatch {
  id: string;
  chargeId: string;
  smsId?: string;
  bankName: 'BAI' | 'BFA' | 'BIC' | 'ATLANTICO' | 'PROXYPAY';
  amountAoa: number;
  referenceCode: string;
  status: 'MATCHED' | 'DISCREPANCY' | 'PENDING';
  confidence: number;
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
  refund(chargeId: string, amount?: number, reason?: string): Promise<RefundResponse>;
  webhook(payload: any, signature: string): Promise<{ processed: boolean; eventType?: string }>;
}

export class AppyPayProvider implements PaymentProvider {
  id = 'appypay';
  name = 'AppyPay Payment Gateway';
  version = '2.4.0';
  isConfigured = true;
  mode: 'sandbox' | 'live' = 'sandbox';

  private clientId = 'appypay_sbx_client_99482';
  private token: string | null = 'bearer_sbx_token_mock_appypay';
  private chargesMap = new Map<string, ChargeResponse>();
  private webhooksList: WebhookLog[] = [];
  private reconciliationList: ReconciliationMatch[] = [];

  constructor() {
    this.seedMockData();
  }

  private seedMockData() {
    const mockCharges: ChargeResponse[] = [
      {
        chargeId: 'chg_appypay_001',
        status: 'succeeded',
        amount: 150000,
        currency: 'AOA',
        provider: 'AppyPay',
        paymentMethod: 'multicaixa_express',
        entityCode: '00124',
        referenceCode: '918 273 401',
        customerName: 'SILA JANEIRO',
        customerPhone: '+244 923 000 111',
        customerEmail: 'silajaneiro9@gmail.com',
        description: 'Licença Anual PortalTRMobile Enterprise',
        createdAt: Date.now() - 3600000 * 2,
        paidAt: Date.now() - 3600000 * 1.9,
        reconciled: true,
        reconciledWithSmsId: 'sms-bai-99182',
        message: 'Pagamento confirmado via Multicaixa Express (AppyPay)'
      },
      {
        chargeId: 'chg_appypay_002',
        status: 'pending',
        amount: 45000,
        currency: 'AOA',
        provider: 'AppyPay',
        paymentMethod: 'reference',
        entityCode: '00124',
        referenceCode: '882 104 332',
        customerName: 'Manuel Agostinho',
        customerPhone: '+244 912 345 678',
        description: 'Renovação de Subscrição CPaaS SMS Dispatcher',
        createdAt: Date.now() - 1800000,
        reconciled: false,
        message: 'Aguardando pagamento no Multicaixa Express'
      },
      {
        chargeId: 'chg_appypay_003',
        status: 'succeeded',
        amount: 85000,
        currency: 'AOA',
        provider: 'AppyPay',
        paymentMethod: 'qr_code',
        entityCode: '00124',
        referenceCode: '773 992 101',
        customerName: 'Empresa Sonangol Tech',
        customerEmail: 'financeiro@sonangoltech.co.ao',
        description: 'Módulo de IA Gemini Automação e Notificações',
        createdAt: Date.now() - 86400000,
        paidAt: Date.now() - 86000000,
        reconciled: true,
        message: 'QR Code escaneado e pago com sucesso'
      },
      {
        chargeId: 'chg_appypay_004',
        status: 'refunded',
        amount: 25000,
        currency: 'AOA',
        provider: 'AppyPay',
        paymentMethod: 'multicaixa_express',
        entityCode: '00124',
        referenceCode: '551 209 883',
        customerName: 'Ana Paula Bernardo',
        description: 'Serviço de Teste - Reembolsado',
        createdAt: Date.now() - 86400000 * 3,
        paidAt: Date.now() - 86400000 * 2.8,
        reconciled: true,
        refundAmount: 25000,
        refundedAt: Date.now() - 86400000 * 1,
        message: 'Cobrança reembolsada integralmente'
      }
    ];

    mockCharges.forEach((c) => this.chargesMap.set(c.chargeId, c));

    this.webhooksList = [
      {
        id: 'wh-01',
        event: 'charge.succeeded',
        chargeId: 'chg_appypay_001',
        payload: { chargeId: 'chg_appypay_001', amount: 150000, status: 'succeeded' },
        status: 'DELIVERED',
        responseCode: 200,
        timestamp: Date.now() - 3600000 * 1.9
      },
      {
        id: 'wh-02',
        event: 'reconciliation.matched',
        chargeId: 'chg_appypay_001',
        payload: { reference: '918 273 401', bank: 'BAI', matchConfidence: 1.0 },
        status: 'DELIVERED',
        responseCode: 200,
        timestamp: Date.now() - 3600000 * 1.8
      },
      {
        id: 'wh-03',
        event: 'refund.created',
        chargeId: 'chg_appypay_004',
        payload: { chargeId: 'chg_appypay_004', refundAmount: 25000 },
        status: 'DELIVERED',
        responseCode: 200,
        timestamp: Date.now() - 86400000 * 1
      }
    ];

    this.reconciliationList = [
      {
        id: 'rec-01',
        chargeId: 'chg_appypay_001',
        smsId: 'sms-bai-99182',
        bankName: 'BAI',
        amountAoa: 150000,
        referenceCode: '918 273 401',
        status: 'MATCHED',
        confidence: 0.99,
        timestamp: Date.now() - 3600000 * 1.9
      },
      {
        id: 'rec-02',
        chargeId: 'chg_appypay_003',
        smsId: 'sms-bfa-10293',
        bankName: 'BFA',
        amountAoa: 85000,
        referenceCode: '773 992 101',
        status: 'MATCHED',
        confidence: 0.98,
        timestamp: Date.now() - 86000000
      }
    ];
  }

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
    const chargeId = `chg_appypay_${Math.random().toString(36).substring(2, 8)}`;
    const refNum = Math.floor(100000000 + Math.random() * 900000000).toString().replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');

    const response: ChargeResponse = {
      chargeId,
      status: 'pending',
      amount: params.amount,
      currency: params.currency || 'AOA',
      provider: 'AppyPay',
      paymentMethod: params.paymentMethod || 'multicaixa_express',
      entityCode: '00124',
      referenceCode: refNum,
      customerName: params.customerName || 'Cliente Geral',
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      description: params.description || 'Cobrança AppyPay',
      createdAt: Date.now(),
      reconciled: false,
      paymentUrl: `https://sandbox.appypay.ao/checkout/${chargeId}`,
      message: `Referência Multicaixa Express gerada com sucesso via AppyPay (${this.mode.toUpperCase()})`
    };

    this.chargesMap.set(chargeId, response);

    this.webhooksList.unshift({
      id: `wh-${Date.now()}`,
      event: 'reference.created',
      chargeId,
      payload: { chargeId, referenceCode: refNum, amount: params.amount },
      status: 'DELIVERED',
      responseCode: 200,
      timestamp: Date.now()
    });

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
      paymentMethod: 'multicaixa_express',
      entityCode: '00124',
      referenceCode: `998 877 112`,
      description: 'Consulta de estado da cobrança',
      createdAt: Date.now() - 3600000,
      reconciled: true,
      message: 'Cobrança confirmada pelo Webhook AppyPay'
    };
  }

  async confirmPaymentManually(chargeId: string): Promise<ChargeResponse> {
    const existing = this.chargesMap.get(chargeId);
    if (existing) {
      existing.status = 'succeeded';
      existing.paidAt = Date.now();
      existing.reconciled = true;
      existing.message = 'Confirmado manualmente via Console AppyPay';

      this.webhooksList.unshift({
        id: `wh-${Date.now()}`,
        event: 'charge.succeeded',
        chargeId,
        payload: { chargeId, amount: existing.amount, status: 'succeeded' },
        status: 'DELIVERED',
        responseCode: 200,
        timestamp: Date.now()
      });

      this.reconciliationList.unshift({
        id: `rec-${Date.now()}`,
        chargeId,
        smsId: `sms-manual-${Date.now()}`,
        bankName: 'BAI',
        amountAoa: existing.amount,
        referenceCode: existing.referenceCode || 'REF-MCX',
        status: 'MATCHED',
        confidence: 1.0,
        timestamp: Date.now()
      });
    }

    return existing || this.status(chargeId);
  }

  async refund(chargeId: string, amount?: number, reason?: string): Promise<RefundResponse> {
    const existing = this.chargesMap.get(chargeId);
    if (existing) {
      existing.status = 'refunded';
      existing.refundAmount = amount || existing.amount;
      existing.refundedAt = Date.now();
      existing.message = `Reembolso de ${existing.refundAmount} Kz efetuado: ${reason || 'Solicitação do utilizador'}`;
    }

    const refundResp: RefundResponse = {
      refundId: `ref_${Math.random().toString(36).substring(2, 8)}`,
      chargeId,
      amount: amount || existing?.amount || 0,
      status: 'succeeded',
      reason: reason || 'Reembolso efetuado via Console',
      timestamp: Date.now()
    };

    this.webhooksList.unshift({
      id: `wh-${Date.now()}`,
      event: 'refund.created',
      chargeId,
      payload: refundResp,
      status: 'DELIVERED',
      responseCode: 200,
      timestamp: Date.now()
    });

    return refundResp;
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

  getAllCharges(): ChargeResponse[] {
    return Array.from(this.chargesMap.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getWebhooks(): WebhookLog[] {
    return [...this.webhooksList];
  }

  getReconciliations(): ReconciliationMatch[] {
    return [...this.reconciliationList];
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
