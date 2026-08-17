// src/services/support/SupportFAQService.ts — Triagem Determinística e Base de Conhecimento Oficial

import { SupportFAQItem } from './types';

export class SupportFAQService {
  private static readonly FAQ_ITEMS: SupportFAQItem[] = [
    {
      id: 'FAQ_INSTALL_PWA',
      title: 'Como instalar no Laptop (Windows/Mac) ou Smartphone',
      category: 'INSTALACAO',
      summary: 'Instalação nativa em 1 toque sem app stores.',
      content: 
        'O PortalTRMobile é um PWA instalável diretamente pelo navegador:\n' +
        '• Laptop/PC (Chrome/Edge): Clique no botão "1- Instalar PWA Agora" na barra superior para adicionar a janela nativa ao Windows/macOS.\n' +
        '• Android: Toque em "Instalar PWA" para receber o atalho standalone com suporte a notificações e service worker.\n' +
        '• URL Pública Oficial: https://portaltrmobile.web.app/',
      actionCode: 'TRIGGER_INSTALL'
    },
    {
      id: 'FAQ_NUMPAD_INPUT',
      title: 'Teclado Físico / Numpad / Estado do NumLock',
      category: 'TECLADO_NUMPAD',
      summary: 'Operação do Dialer via teclado do computador.',
      content:
        'O discador suporta entrada pelo teclado físico e Numpad lateral:\n' +
        '• Teclas 0-9, * e # acionam o dialer instantaneamente.\n' +
        '• Caso os números laterais não digitem, certifique-se de que a tecla NUMLOCK está ativada (o sistema exibe indicador em tempo real no topo do dialer).\n' +
        '• Enter disca/executa comando; Backspace apaga dígitos; Escape limpa o ecrã.',
      actionCode: 'CHECK_NUMLOCK'
    },
    {
      id: 'FAQ_ANDROID_COMPANION',
      title: 'Sincronização e Permissões do Android Companion',
      category: 'ANDROID_COMPANION',
      summary: 'Configuração do agente Android (Zero-Touch).',
      content:
        'Para sincronizar chamadas e SMS reais com o agente nativo Android:\n' +
        '1. Instale o APK do Companion no dispositivo Android.\n' +
        '2. Conceda permissão de Notificações, Acesso a SMS e Otimização de Bateria.\n' +
        '3. Conecte pelo QR Code na aba Dispositivos do Founder Console.\n' +
        'O pipeline valida a conectividade automaticamente sem configurações manuais.',
      actionCode: 'VIEW_REPO'
    },
    {
      id: 'FAQ_DEPLOY_GITHUB',
      title: 'Repositório GitHub Oficial & Deploy',
      category: 'DEPLOY_GITHUB',
      summary: 'Informações do código-fonte e integração com Render.',
      content:
        'Repositório oficial verificado:\n' +
        '• Organização/Proprietário: vitronishbo-wq\n' +
        '• Repositório: PortalTRMobile\n' +
        '• URL: https://github.com/vitronishbo-wq/PortalTRMobile\n' +
        'Qualquer sincronização de CI/CD ou Render deve apontar para esta URL oficial.',
      actionCode: 'VIEW_REPO'
    },
    {
      id: 'FAQ_HUMAN_OPERATOR',
      title: 'Falar com Operador Humano (Escalação)',
      category: 'OUTRO',
      summary: 'Transferir atendimento para a equipa técnica em tempo real.',
      content:
        'Se o seu problema não constar nos tópicos acima, você pode abrir um ticket direto para o pool de operadores.\n' +
        'O sistema alertará o operador disponível via console e push notification.',
      actionCode: 'ESCALATE_OPERATOR'
    }
  ];

  /**
   * Retorna todos os tópicos disponíveis para seleção no chat
   */
  public static getTopics(): SupportFAQItem[] {
    return [...this.FAQ_ITEMS];
  }

  /**
   * Busca um tópico específico por ID
   */
  public static getTopicById(id: string): SupportFAQItem | undefined {
    return this.FAQ_ITEMS.find(item => item.id === id);
  }

  /**
   * Pesquisa determinística por palavras-chave
   */
  public static searchTopics(query: string): SupportFAQItem[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getTopics();

    return this.FAQ_ITEMS.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }
}
