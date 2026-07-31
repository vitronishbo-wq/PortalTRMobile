export * from '../services/paymentEngine';
import { PaymentRegistry, AppyPayProvider, ChargeRequest, ChargeResponse } from '../services/paymentEngine';

export class PaymentEngine {
  static getProvider(id: string = 'appypay') {
    return PaymentRegistry.get(id);
  }

  static async processPayment(params: ChargeRequest): Promise<ChargeResponse> {
    const provider = PaymentRegistry.get('appypay') || new AppyPayProvider();
    return await provider.charge(params);
  }

  static getRegisteredProviders() {
    return PaymentRegistry.getAll();
  }
}
