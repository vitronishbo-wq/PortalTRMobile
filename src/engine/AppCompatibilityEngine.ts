/* AppCompatibilityEngine — Verificador de compatibilidade real entre Android, Cloud e Web */

export type AppRuntimeState = 'Pronto' | 'Parcial' | 'Bloqueado';

export interface AppCompatibilityRecord {
  app: string;
  packageName: string;
  android: boolean;
  cloud: boolean;
  web: boolean;
  state: AppRuntimeState;
  notes: string;
}

export class AppCompatibilityEngine {
  private static readonly REGISTRY: AppCompatibilityRecord[] = [
    {
      app: 'WhatsApp',
      packageName: 'com.whatsapp',
      android: true,
      cloud: false,
      web: true,
      state: 'Parcial',
      notes: 'Suporta Web API / QR e emulação Android; bloqueado em Cloud headless sem GUI.'
    },
    {
      app: 'Instagram',
      packageName: 'com.instagram.android',
      android: true,
      cloud: false,
      web: true,
      state: 'Parcial',
      notes: 'Interface Web e Direct disponíveis; automação nativa requer nó Android.'
    },
    {
      app: 'Facebook',
      packageName: 'com.facebook.katana',
      android: true,
      cloud: true,
      web: true,
      state: 'Pronto',
      notes: 'API Graph e PWA totalmente operacionais em Cloud e Web.'
    },
    {
      app: 'Multicaixa Express / Banco',
      packageName: 'ao.emis.mcxexpress',
      android: true,
      cloud: false,
      web: false,
      state: 'Bloqueado',
      notes: 'Segurança EMIS / BNA bloqueia Cloud Runtime. Requer Android Físico com SIM e Certificado.'
    },
    {
      app: 'BFA Net / BAI Directo',
      packageName: 'ao.bfa.mobile',
      android: true,
      cloud: false,
      web: false,
      state: 'Bloqueado',
      notes: 'Bloqueio estrito de emulação por certificados bancários e biometria de hardware.'
    },
    {
      app: 'PortalTR Telecom SIP/IMS Dialer',
      packageName: 'ao.portal.telecom.dialer',
      android: true,
      cloud: true,
      web: true,
      state: 'Pronto',
      notes: 'Nativo, WebRTC e Cloud headless com suporte full duplex.'
    }
  ];

  public static getCompatibilityList(): AppCompatibilityRecord[] {
    return [...this.REGISTRY];
  }

  public static evaluateApp(app: string): AppCompatibilityRecord | undefined {
    return this.REGISTRY.find(r => r.app.toLowerCase().includes(app.toLowerCase()));
  }
}
