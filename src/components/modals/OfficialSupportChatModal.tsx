// src/components/modals/OfficialSupportChatModal.tsx — Canal de Apoio Oficial Direto (PortalTRMobile)

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  ShieldCheck, 
  Headphones, 
  PhoneCall, 
  PhoneOff, 
  CheckCircle2, 
  HelpCircle, 
  Download, 
  Keyboard, 
  GitBranch, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  Check, 
  Volume2
} from 'lucide-react';
import { SupportEngine } from '../../services/support/SupportEngine';
import { SupportMessage, SupportFAQItem, SupportTicket, SupportTicketStatus, SupportCallSession } from '../../services/support/types';
import { InstallEngine } from '../../engine/installEngine';

interface OfficialSupportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialSupportChatModal: React.FC<OfficialSupportChatModalProps> = ({
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [faqTopics, setFaqTopics] = useState<SupportFAQItem[]>([]);
  const [callSession, setCallSession] = useState<SupportCallSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Carrega tópicos FAQ determinísticos
    setFaqTopics(SupportEngine.faq.getTopics());

    // Assina histórico de mensagens
    const unsubscribeChat = SupportEngine.chat.subscribe((msgs) => {
      setMessages(msgs);
    });

    // Assina tickets ativos
    const unsubscribeTickets = SupportEngine.tickets.subscribe((tickets) => {
      const nonClosed = tickets.filter(t => t.userId === 'USER_LOCAL' && t.status !== 'FECHADO');
      if (nonClosed.length > 0) {
        setActiveTicket(nonClosed[nonClosed.length - 1]);
      } else {
        const anyLast = tickets.filter(t => t.userId === 'USER_LOCAL');
        if (anyLast.length > 0) {
          setActiveTicket(anyLast[anyLast.length - 1]);
        } else {
          setActiveTicket(null);
        }
      }
    });

    // Assina chamadas de voz WebRTC
    const unsubscribeCalls = SupportEngine.calls.subscribeSession((session) => {
      setCallSession(session);
    });

    return () => {
      unsubscribeChat();
      unsubscribeTickets();
      unsubscribeCalls();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSelectFAQ = (topic: SupportFAQItem) => {
    SupportEngine.handleFAQSelection(topic.id, activeTicket?.id);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    SupportEngine.sendMessage(text, activeTicket?.id);
    setInputText('');
  };

  const handleEscalateOperator = () => {
    const ticket = SupportEngine.requestHumanAgent(
      activeTicket?.id || `TCK-${Date.now().toString(36).toUpperCase()}`,
      'Solicitação direta pelo utilizador no chat'
    );
    setActiveTicket(ticket);
  };

  const handleCloseTicket = () => {
    if (activeTicket) {
      SupportEngine.tickets.closeTicket(activeTicket.id);
      SupportEngine.chat.sendSystemMessage(
        `✅ Atendimento referente ao ticket #${activeTicket.id} concluído com sucesso. Se precisar de mais alguma ajuda, basta selecionar um tópico ou enviar uma nova mensagem.`,
        activeTicket.id,
        'SYSTEM_EVENT'
      );
    }
  };

  const handleStartVoiceCall = async () => {
    await SupportEngine.calls.requestCall('USER_LOCAL', activeTicket?.id);
  };

  const handleEndVoiceCall = () => {
    SupportEngine.calls.endCall();
  };

  const handleTriggerInstall = async () => {
    await InstallEngine.install();
  };

  const getFAQIcon = (actionCode?: string) => {
    switch (actionCode) {
      case 'TRIGGER_INSTALL':
        return <Download className="w-3.5 h-3.5 text-emerald-400" />;
      case 'CHECK_NUMLOCK':
        return <Keyboard className="w-3.5 h-3.5 text-cyan-400" />;
      case 'VIEW_REPO':
        return <GitBranch className="w-3.5 h-3.5 text-indigo-400" />;
      case 'ESCALATE_OPERATOR':
        return <UserCheck className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const renderStatusBadge = (status?: SupportTicketStatus) => {
    switch (status) {
      case 'AGUARDANDO_OPERADOR':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold animate-pulse">
            <Clock className="w-3 h-3" />
            <span>Fila: Aguardando Operador</span>
          </span>
        );
      case 'ATENDIDO':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
            <UserCheck className="w-3 h-3" />
            <span>Operador Conectado</span>
          </span>
        );
      case 'FECHADO':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Concluído</span>
          </span>
        );
      case 'ABERTO':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
            <ShieldCheck className="w-3 h-3" />
            <span>Auto-Resolução Ativa</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl h-[90vh] max-h-[720px] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* TOP BAR / CABEÇALHO OFICIAL */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-white tracking-tight truncate">
                  Apoio Oficial PortalTRMobile
                </h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider shrink-0">
                  🛡️ OFICIAL • 24/7
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="truncate">Canal Direto (SUPPORT-COS)</span>
                {activeTicket && renderStatusBadge(activeTicket.status)}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Botão de Chamada WebRTC Gratuita */}
            <button
              onClick={handleStartVoiceCall}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Iniciar Chamada de Voz IP WebRTC (P2P Sem Custos)"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voz IP</span>
            </button>

            {/* Finalizar Ticket */}
            {activeTicket && activeTicket.status !== 'FECHADO' ? (
              <button
                onClick={handleCloseTicket}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Concluir e fechar ticket atual"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Finalizar</span>
              </button>
            ) : null}

            {/* Chamar Operador */}
            <button
              onClick={handleEscalateOperator}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
              title="Solicitar Atendimento de Operador Humano"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chamar Operador</span>
            </button>

            {/* Fechar Modal */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Fechar Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PAINEL ATIVO DE CHAMADA WEBRTC (P2P) */}
        {callSession && callSession.state !== 'CALL_ENDED' && (
          <div className={`px-3.5 py-2.5 border-b flex items-center justify-between text-xs shrink-0 transition-colors ${
            callSession.state === 'CALL_CONNECTED'
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-200'
              : callSession.state === 'CALL_FAILED'
              ? 'bg-rose-950/60 border-rose-800/60 text-rose-200'
              : 'bg-indigo-950/60 border-indigo-800/60 text-indigo-200'
          }`}>
            <div className="flex items-center space-x-2.5 min-w-0">
              <Volume2 className={`w-4 h-4 shrink-0 ${callSession.state === 'CALL_CONNECTED' ? 'animate-bounce text-emerald-400' : 'animate-pulse text-indigo-400'}`} />
              <div className="min-w-0">
                <span className="font-bold block truncate">
                  {callSession.state === 'CALL_CONNECTED' && '📞 Em Chamada de Voz P2P com Suporte Oficial'}
                  {callSession.state === 'CALL_REQUESTED' && 'Conectando microfone e sinalização WebRTC...'}
                  {callSession.state === 'CALL_RINGING' && 'Chamando Operador Técnico...'}
                  {callSession.state === 'CALL_ACCEPTED' && 'Operador conectado. Estabelecendo áudio...'}
                  {callSession.state === 'CALL_FAILED' && `Chamada não conectada: ${callSession.failureReason || 'Tentativa P2P falhou'}`}
                </span>
                <span className="text-[10px] opacity-75 font-mono">
                  {callSession.state === 'CALL_CONNECTED' ? 'Áudio Bidirecional • Custo Zero' : 'STUN Google • Sem Gateways Pagos'}
                </span>
              </div>
            </div>

            <button
              onClick={handleEndVoiceCall}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center space-x-1.5 cursor-pointer transition-colors shadow shrink-0"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>{callSession.state === 'CALL_FAILED' ? 'Fechar' : 'Desligar'}</span>
            </button>
          </div>
        )}

        {/* STATUS BAR DINÂMICA DO TICKET */}
        {activeTicket && activeTicket.status === 'AGUARDANDO_OPERADOR' && (
          <div className="bg-amber-950/40 border-b border-amber-800/50 px-3 py-2 flex items-center justify-between text-xs text-amber-200 shrink-0">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Solicitação na fila de espera. Notificação enviada à equipa técnica.</span>
            </div>
            <span className="font-mono font-bold text-[11px] text-amber-300">Ticket #{activeTicket.id}</span>
          </div>
        )}

        {activeTicket && activeTicket.status === 'ATENDIDO' && (
          <div className="bg-emerald-950/40 border-b border-emerald-800/50 px-3 py-2 flex items-center justify-between text-xs text-emerald-200 shrink-0">
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Operador conectado ao canal. Conversa em andamento.</span>
            </div>
            <span className="font-mono font-bold text-[11px] text-emerald-300">Ticket #{activeTicket.id}</span>
          </div>
        )}

        {/* FAQ QUICK ACTIONS BAR / CHIPS DETERMINÍSTICOS */}
        <div className="bg-slate-950/60 border-b border-slate-800/80 p-2.5 shrink-0 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 px-1">
            <span className="flex items-center space-x-1">
              <HelpCircle className="w-3 h-3 text-cyan-400" />
              <span>Auto-Resolução Rápida (Selecione um tópico)</span>
            </span>
            <span className="text-slate-500">Respostas Oficiais de Sistema</span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {faqTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleSelectFAQ(topic)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer hover:border-slate-600 active:scale-95"
              >
                {getFAQIcon(topic.actionCode)}
                <span>{topic.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ÁREA PRINCIPAL DE MENSAGENS */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-slate-950/30">
          {messages.map((msg) => {
            const isUser = msg.senderRole === 'USER';
            const isOperator = msg.senderRole === 'OPERATOR';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-full`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[75%] space-y-1.5 text-xs shadow-md ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : isOperator
                      ? 'bg-amber-950/40 text-amber-200 border border-amber-800/50 rounded-bl-none'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none'
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-75 font-mono border-b border-white/10 pb-1">
                    <span className="font-bold flex items-center space-x-1">
                      {!isUser && <ShieldCheck className="w-3 h-3 text-emerald-400 inline" />}
                      <span>
                        {isUser ? 'Você' : isOperator ? 'Operador Técnico' : 'PortalTRMobile Sistema'}
                      </span>
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">
                    {msg.content}
                  </div>

                  {/* Ações Específicas se contiver gatilho de instalação */}
                  {msg.content.includes('Instalar PWA Agora') && (
                    <div className="pt-2">
                      <button
                        onClick={handleTriggerInstall}
                        className="w-full px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer shadow transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Disparar Instalação PWA Agora</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DE MENSAGEM */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center space-x-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite a sua dúvida ou mensagem para a equipa oficial..."
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs uppercase flex items-center space-x-1.5 cursor-pointer transition-all shadow-md active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>

      </div>
    </div>
  );
};
