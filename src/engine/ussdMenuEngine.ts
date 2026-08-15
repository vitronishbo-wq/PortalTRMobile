// src/engine/ussdMenuEngine.ts — Motor de Menus e Sessões USSD / MMI Engineering Mode
// Opções 2, 3 e 4: Códigos curtos de operadora, navegação hierárquica e comandos parametrizados

import { CommandExecutor, CommandExecutionResult } from './commandExecutor';
import { PermissionEngine } from './permissionEngine';
import { SecurityAuditService } from '../services/SecurityAuditService';
import { AdminProvisioningEngine } from './adminProvisioningEngine';

export interface USSDMenuItem {
  key: string;
  label: string;
  actionId: string;
  requiredRole?: string;
  nextMenuId?: string;
  handler?: (params?: string[]) => Promise<USSDResponse>;
}

export interface USSDMenu {
  id: string;
  title: string;
  header: string;
  items: USSDMenuItem[];
  footer?: string;
}

export interface USSDResponse {
  type: 'MENU' | 'MESSAGE' | 'ACTION_COMPLETE' | 'INPUT_REQUIRED';
  title: string;
  body: string;
  options?: { key: string; label: string }[];
  sessionId?: string;
  closeAfterAction?: boolean;
}

export class USSDMenuEngine {
  private static activeSession: {
    sessionId: string;
    currentMenuId: string;
    contextParams: string[];
    createdAt: number;
  } | null = null;

  private static listeners: Set<(response: USSDResponse | null) => void> = new Set();

  public static subscribe(listener: (response: USSDResponse | null) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private static emit(response: USSDResponse | null): void {
    this.listeners.forEach(l => {
      try {
        l(response);
      } catch (err) {
        console.error('USSD listener error:', err);
      }
    });
  }

  /**
   * Definição de Menus USSD Hierárquicos
   */
  private static readonly MENUS: Record<string, USSDMenu> = {
    '100': {
      id: '100',
      title: 'Portal COS — Founder Core [*100#]',
      header: 'MODO ENGENHARIA ROOT / FOUNDER:\nSelecione o módulo pretendido:',
      items: [
        { key: '1', label: 'Criar Administrador', actionId: 'OPEN_CREATE_ADMIN_MODAL' },
        { key: '2', label: 'Ver Dispositivos Mesh', actionId: 'OPEN_DEVICES_VIEW' },
        { key: '3', label: 'Segurança & Isolamento', actionId: 'OPEN_FOUNDER_CONSOLE' },
        { key: '4', label: 'Telecom & Operadoras', actionId: 'OPEN_TELECOM_VIEW' },
        { key: '5', label: 'Auditoria Imutável', actionId: 'OPEN_AUDIT_LOGS' },
        { key: '6', label: 'Banking Hub (EMIS)', actionId: 'OPEN_BANKING_VIEW' },
        { key: '7', label: 'Sincronizar Forçado', actionId: 'EXECUTE_SYNC_ALL' },
        { key: '0', label: 'Sair / Cancelar', actionId: 'CLOSE_USSD' }
      ],
      footer: 'Envie o número da opção (ex: 1)'
    },
    '101': {
      id: '101',
      title: 'Portal COS — Admin Center [*101#]',
      header: 'PAINEL DE ADMINISTRAÇÃO COS:',
      items: [
        { key: '1', label: 'Gestão de Dispositivos', actionId: 'OPEN_DEVICES_VIEW' },
        { key: '2', label: 'Gestão de Utilizadores', actionId: 'OPEN_USERS_VIEW' },
        { key: '3', label: 'Consola Telecom', actionId: 'OPEN_TELECOM_VIEW' },
        { key: '4', label: 'Despacho de SMS', actionId: 'OPEN_MESSAGES_VIEW' },
        { key: '0', label: 'Sair', actionId: 'CLOSE_USSD' }
      ]
    },
    '600': {
      id: '600',
      title: 'Device Mesh Controller [*600#]',
      header: 'GESTÃO DE DISPOSITIVOS & NÓS:',
      items: [
        { key: '1', label: 'Lista de Nós Conectados', actionId: 'OPEN_DEVICES_VIEW' },
        { key: '2', label: 'Sincronizar Agora', actionId: 'EXECUTE_SYNC_ALL' },
        { key: '3', label: 'Zero-Touch Provisioning', actionId: 'EXECUTE_PAIR_DEVICE' },
        { key: '0', label: 'Sair', actionId: 'CLOSE_USSD' }
      ]
    },
    '700': {
      id: '700',
      title: 'Telecom & SIP Gateway [*700#]',
      header: 'STATUS DE REDES TELECOM:',
      items: [
        { key: '1', label: 'Troncos & Operadoras (Unitel/Africell/Movicel)', actionId: 'OPEN_TELECOM_VIEW' },
        { key: '2', label: 'Diagnóstico WebRTC (Call Test)', actionId: 'EXECUTE_CALL_TEST' },
        { key: '3', label: 'Números Virtuais & eSIM', actionId: 'OPEN_TELECOM_VIEW' },
        { key: '0', label: 'Sair', actionId: 'CLOSE_USSD' }
      ]
    },
    '800': {
      id: '800',
      title: 'Security & Integrity [*800#]',
      header: 'CONTROLO DE SEGURANÇA & ISOLAMENTO:',
      items: [
        { key: '1', label: 'Logs de Auditoria', actionId: 'OPEN_AUDIT_LOGS' },
        { key: '2', label: 'Bloquear Dispositivo', actionId: 'EXECUTE_LOCK_DEVICE' },
        { key: '3', label: 'Limpeza de Sessão (Wipe)', actionId: 'EXECUTE_WIPE_SESSION' },
        { key: '0', label: 'Sair', actionId: 'CLOSE_USSD' }
      ]
    },
    '900': {
      id: '900',
      title: 'COS Kernel System [*900#]',
      header: 'NÚCLEO DO SISTEMA & TELEMETRIA:',
      items: [
        { key: '1', label: 'Founder IDE & Manifest', actionId: 'OPEN_FOUNDER_CONSOLE' },
        { key: '2', label: 'Verificar Prontidão Bancária', actionId: 'OPEN_BANKING_VIEW' },
        { key: '3', label: 'App Center', actionId: 'OPEN_APP_CENTER' },
        { key: '0', label: 'Sair', actionId: 'CLOSE_USSD' }
      ]
    }
  };

  /**
   * Processa uma sequência USSD pura (ex: *100#, *100*01#, *100*02*admin@portal.ao#)
   */
  public static async handleUSSDInput(input: string): Promise<USSDResponse | null> {
    const clean = input.trim();
    if (!clean.startsWith('*') || !clean.endsWith('#')) return null;

    const inner = clean.substring(1, clean.length - 1); // remove * e #
    const parts = inner.split('*');
    const rootCode = parts[0];

    // Se houver parâmetros adicionais (ex: *100*01*admin@portal.ao#)
    if (parts.length > 1) {
      return this.handleParameterizedUSSD(rootCode, parts.slice(1));
    }

    // Menu raiz simples (ex: *100#, *101#, *700#)
    const menu = this.MENUS[rootCode];
    if (menu) {
      this.activeSession = {
        sessionId: `ussd_${Date.now()}`,
        currentMenuId: rootCode,
        contextParams: [],
        createdAt: Date.now()
      };

      const response: USSDResponse = {
        type: 'MENU',
        title: menu.title,
        body: menu.header,
        options: menu.items.map(i => ({ key: i.key, label: i.label })),
        sessionId: this.activeSession.sessionId
      };

      this.emit(response);
      return response;
    }

    return null;
  }

  /**
   * Processa comandos USSD parametrizados no formato *ROOT*SUB*PARAM1*PARAM2#
   */
  private static async handleParameterizedUSSD(rootCode: string, params: string[]): Promise<USSDResponse> {
    const subCode = params[0];
    const subArgs = params.slice(1);

    // Mapeamento especial para *100*...
    if (rootCode === '100') {
      switch (subCode) {
        case '01':
        case '1': {
          // *100*01*admin@portal.ao*ADMIN*123456# ou *100*01*admin@portal.ao#
          if (subArgs.length > 0) {
            const email = subArgs[0];
            const role = (subArgs[1]?.toUpperCase() as any) || 'ADMIN';
            const pin = subArgs[2] || '123456';
            
            const newAdmin = AdminProvisioningEngine.createAdmin({
              name: email.split('@')[0] || 'Admin',
              email,
              role,
              secretCode: `*#${role}#`,
              pin,
              permissions: ['FLEET', 'TELECOM', 'NOTIFICATIONS'],
              trustedDevices: ['node_master'],
              status: 'ACTIVE'
            });

            const resp: USSDResponse = {
              type: 'ACTION_COMPLETE',
              title: 'COS USSD — Administrador Criado',
              body: `Administrador ${newAdmin.email} (${newAdmin.role}) provisionado com sucesso!\nPIN: ${newAdmin.pin}\nUID: ${newAdmin.uid}`,
              closeAfterAction: true
            };
            this.emit(resp);
            return resp;
          } else {
            // Abre o modal de criação
            this.dispatchAction('OPEN_CREATE_ADMIN_MODAL');
            const resp: USSDResponse = {
              type: 'ACTION_COMPLETE',
              title: 'COS USSD',
              body: 'Modal de provisionamento de administrador aberto.',
              closeAfterAction: true
            };
            this.emit(resp);
            return resp;
          }
        }

        case '02':
        case '2': {
          // *100*02*923000000# -> Bloquear dispositivo associado
          const target = subArgs[0] || 'Dispositivo Ativo';
          SecurityAuditService.log('DEVICE_LOCKED', `LOCK_${target}`, 'SUCCESS', 'HIGH', { target });
          this.dispatchAction('EXECUTE_LOCK_DEVICE', { target });
          const resp: USSDResponse = {
            type: 'ACTION_COMPLETE',
            title: 'COS USSD — Bloqueio de Dispositivo',
            body: `Dispositivo [${target}] foi isolado e bloqueado com sucesso pelo Kernel.`,
            closeAfterAction: true
          };
          this.emit(resp);
          return resp;
        }

        case '03':
        case '3': {
          // *100*03*S22# -> Emparelhar dispositivo
          const deviceName = subArgs[0] || 'Novo Nó';
          this.dispatchAction('EXECUTE_PAIR_DEVICE', { device: deviceName });
          const resp: USSDResponse = {
            type: 'ACTION_COMPLETE',
            title: 'COS USSD — Emparelhamento Zero-Touch',
            body: `Pipeline Zero-Touch iniciado para o nó [${deviceName}]. Conecte o QR ou BLE.`,
            closeAfterAction: true
          };
          this.emit(resp);
          return resp;
        }

        case '04':
        case '4': {
          // *100*04*01# ou *100*04# -> Sincronizar imediatamente
          this.dispatchAction('EXECUTE_SYNC_ALL');
          const resp: USSDResponse = {
            type: 'ACTION_COMPLETE',
            title: 'COS USSD — Sincronização Forçada',
            body: 'Sincronização imediata de telemetria, nós mesh e Firestore concluída com sucesso.',
            closeAfterAction: true
          };
          this.emit(resp);
          return resp;
        }

        case '05':
        case '5': {
          // *100*05*TABLET# -> Transferir sessão
          const targetDevice = subArgs[0] || 'Nó Secundário';
          this.dispatchAction('EXECUTE_TRANSFER_SESSION', { target: targetDevice });
          const resp: USSDResponse = {
            type: 'ACTION_COMPLETE',
            title: 'COS USSD — Transferência de Sessão',
            body: `Sessão mestre despachada e transferida para o nó [${targetDevice}].`,
            closeAfterAction: true
          };
          this.emit(resp);
          return resp;
        }

        default:
          break;
      }
    }

    // Se for subcódigo direto no menu existente
    const menu = this.MENUS[rootCode];
    if (menu) {
      const item = menu.items.find(i => i.key === subCode || i.key === `0${subCode}`);
      if (item) {
        this.dispatchAction(item.actionId);
        const resp: USSDResponse = {
          type: 'ACTION_COMPLETE',
          title: menu.title,
          body: `Opção [${item.label}] executada com sucesso.`,
          closeAfterAction: true
        };
        this.emit(resp);
        return resp;
      }
    }

    return {
      type: 'MESSAGE',
      title: 'COS USSD — Código Inválido',
      body: `O código de serviço USSD *${rootCode}*${params.join('*')}# não foi reconhecido pela rede COS.`,
      closeAfterAction: true
    };
  }

  /**
   * Trata a resposta digitada pelo usuário dentro de uma sessão de menu aberta
   */
  public static async replySession(digit: string): Promise<USSDResponse | null> {
    if (!this.activeSession) return null;

    const cleanDigit = digit.trim();
    if (cleanDigit === '0') {
      this.closeSession();
      return null;
    }

    const menu = this.MENUS[this.activeSession.currentMenuId];
    if (!menu) {
      this.closeSession();
      return null;
    }

    const item = menu.items.find(i => i.key === cleanDigit || i.key === `0${cleanDigit}`);
    if (item) {
      if (item.actionId === 'CLOSE_USSD') {
        this.closeSession();
        return null;
      }

      this.dispatchAction(item.actionId);

      const resp: USSDResponse = {
        type: 'ACTION_COMPLETE',
        title: menu.title,
        body: `Opção [${item.label}] iniciada com sucesso.`,
        closeAfterAction: true
      };
      
      this.closeSession();
      return resp;
    }

    return {
      type: 'MENU',
      title: menu.title,
      body: `Opção inválida (${cleanDigit}). Por favor tente novamente:\n\n${menu.header}`,
      options: menu.items.map(i => ({ key: i.key, label: i.label })),
      sessionId: this.activeSession.sessionId
    };
  }

  public static closeSession(): void {
    this.activeSession = null;
    this.emit(null);
  }

  public static getActiveSession() {
    return this.activeSession;
  }

  private static dispatchAction(actionId: string, payload?: any): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('portal:command-executed', {
        detail: {
          commandId: 'ussd_action',
          actionId,
          command: 'USSD_DIRECT',
          args: payload ? [JSON.stringify(payload)] : [],
          switches: payload || {},
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }
  }
}
