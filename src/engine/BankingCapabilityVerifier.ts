/* BankingCapabilityVerifier — Verificador Estrutural de Prontidão Bancária */

export type BankingReadinessState = 'READY' | 'PARTIAL' | 'NOT_CONFIGURED' | 'NOT_VERIFIED' | 'BLOCKED';

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
  public static getAllBankStatuses(): BankCapabilityRecord[] {
    const getStoredBankCreds = (bId: string) => {
      try {
        if (typeof window === 'undefined') return null;
        const item = localStorage.getItem(`banking_creds_${bId}`);
        return item ? JSON.parse(item) : null;
      } catch {
        return null;
      }
    };

    const bfaCreds = getStoredBankCreds('bfa');
    const baiCreds = getStoredBankCreds('bai');
    const bicCreds = getStoredBankCreds('bic');
    const bpcCreds = getStoredBankCreds('bpc');
    const appypayCreds = getStoredBankCreds('appypay');

    const evaluateBank = (
      bankId: string,
      bankName: string,
      creds: any,
      defaultNotes: string
    ): BankCapabilityRecord => {
      if (!creds || !creds.apiKey) {
        return {
          bankId,
          bankName,
          sandbox: false,
          apiConfigured: false,
          mfaEnforced: false,
          balanceQuery: false,
          transferOperational: false,
          productionReady: false,
          status: 'NOT_CONFIGURED',
          notes: 'Sem contrato ou credenciais bancárias registradas (NOT_CONFIGURED).'
        };
      }

      const isVerified = creds.verified === true;
      return {
        bankId,
        bankName,
        sandbox: !!creds.sandbox,
        apiConfigured: true,
        mfaEnforced: !!creds.mfaEnabled,
        balanceQuery: isVerified,
        transferOperational: isVerified && !!creds.production,
        productionReady: isVerified && !!creds.production,
        status: isVerified ? (creds.production ? 'READY' : 'PARTIAL') : 'NOT_VERIFIED',
        notes: isVerified ? defaultNotes : 'Credenciais inseridas mas sem handshake/dispositivo validado (NOT_VERIFIED).'
      };
    };

    return [
      evaluateBank('bfa', 'Banco de Fomento Angola (BFA)', bfaCreds, 'Gateway BFA Directo / Multicaixa verificado.'),
      evaluateBank('bai', 'Banco Angolano de Investimentos (BAI)', baiCreds, 'BAI Directo / Open Banking API verificado.'),
      evaluateBank('bic', 'Banco BIC Angola', bicCreds, 'Consulta e transferências homologadas.'),
      evaluateBank('bpc', 'Banco de Poupança e Crédito (BPC)', bpcCreds, 'Gateway institucional homologado.'),
      evaluateBank('appypay', 'AppyPay / EMIS Multicaixa GPO', appypayCreds, 'Gateway EMIS Multicaixa homologado.')
    ];
  }
}

