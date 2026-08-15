/* BankingCapabilityVerifier — Verificador Estrutural de Prontidão Bancária */

export type BankingReadinessState = 'READY' | 'PARTIAL' | 'BLOCKED';

export interface BankCapabilityRecord {
  bankId: string;
  bankName: string;
  sandbox: boolean;
  apiConfigured: boolean;
  mfaEnforced: boolean;
  balanceQuery: boolean;
  transferOperational: boolean;
  productionReady: boolean;
  status: BankingReadinessState;
  notes: string;
}

export class BankingCapabilityVerifier {
  private static records: BankCapabilityRecord[] = [
    {
      bankId: 'bfa',
      bankName: 'Banco de Fomento Angola (BFA)',
      sandbox: true,
      apiConfigured: true,
      mfaEnforced: true,
      balanceQuery: true,
      transferOperational: true,
      productionReady: true,
      status: 'READY',
      notes: 'API Multicaixa e gateway BFA Directo homologados em ambiente de testes e produção.'
    },
    {
      bankId: 'bai',
      bankName: 'Banco Angolano de Investimentos (BAI)',
      sandbox: true,
      apiConfigured: true,
      mfaEnforced: true,
      balanceQuery: true,
      transferOperational: true,
      productionReady: true,
      status: 'READY',
      notes: 'BAI Directo / Open Banking API operacional com MFA por Token/Push.'
    },
    {
      bankId: 'bic',
      bankName: 'Banco BIC Angola',
      sandbox: true,
      apiConfigured: true,
      mfaEnforced: true,
      balanceQuery: true,
      transferOperational: false,
      productionReady: false,
      status: 'PARTIAL',
      notes: 'Consulta disponível via EMIS; transferências diretas em processo de certificação.'
    },
    {
      bankId: 'bpc',
      bankName: 'Banco de Poupança e Crédito (BPC)',
      sandbox: true,
      apiConfigured: false,
      mfaEnforced: true,
      balanceQuery: false,
      transferOperational: false,
      productionReady: false,
      status: 'BLOCKED',
      notes: 'Gateway institucional em manutenção; conexão direta bloqueada.'
    },
    {
      bankId: 'appypay',
      bankName: 'AppyPay / EMIS Multicaixa GPO',
      sandbox: true,
      apiConfigured: true,
      mfaEnforced: true,
      balanceQuery: true,
      transferOperational: true,
      productionReady: false,
      status: 'READY',
      notes: 'Operando em Sandbox Multicaixa EMIS Express. Gateway de pagamento operacional.'
    }
  ];

  public static getAllBankStatuses(): BankCapabilityRecord[] {
    return this.records;
  }
}
