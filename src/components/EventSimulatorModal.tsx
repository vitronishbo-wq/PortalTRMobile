import React, { useState } from 'react';
import { Plus, X, Smartphone, Bell, MessageSquare, PhoneCall, ShieldAlert, Sparkles } from 'lucide-react';
import { EventPriority, EventType } from '../types';

interface EventSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulate: (data: {
    app: string;
    title: string;
    text: string;
    sender: string;
    priority: EventPriority;
    type: EventType;
  }) => void;
}

export const EventSimulatorModal: React.FC<EventSimulatorModalProps> = ({
  isOpen,
  onClose,
  onSimulate
}) => {
  const [app, setApp] = useState('WhatsApp');
  const [title, setTitle] = useState('Carlos Eduardo');
  const [text, setText] = useState('Confirmado o horário da reunião de alinhamento para às 16h.');
  const [sender, setSender] = useState('Carlos Eduardo');
  const [priority, setPriority] = useState<EventPriority>('critical');
  const [type, setType] = useState<EventType>('notification');

  if (!isOpen) return null;

  const handleQuickPreset = (presetApp: string) => {
    switch (presetApp) {
      case 'WhatsApp':
        setApp('WhatsApp');
        setTitle('Dra. Vanessa');
        setText('Os exames ficaram prontos e foram enviados para o seu e-mail.');
        setSender('Dra. Vanessa');
        setPriority('critical');
        setType('notification');
        break;
      case 'Banco do Brasil':
        setApp('Banco do Brasil');
        setTitle('Pix Recebido');
        setText('Você recebeu um Pix de R$ 320,00 de Lucas Santos.');
        setSender('BB Notificações');
        setPriority('critical');
        setType('notification');
        break;
      case 'SMS':
        setApp('SMS');
        setTitle('Código Itaú');
        setText('Seu código iToken temporário é 749-102.');
        setSender('30030');
        setPriority('high');
        setType('sms');
        break;
      case 'Chamada':
        setApp('Chamada Telefônica');
        setTitle('Chamada Perdida');
        setText('Você perdeu uma chamada de +55 11 99820-1122.');
        setSender('+55 11 99820-1122');
        setPriority('high');
        setType('call');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulate({ app, title, text, sender, priority, type });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Simular Notificação / Evento Mobile</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-400 block">Presets Rápidos:</span>
          <div className="grid grid-cols-4 gap-1.5 text-xs">
            {['WhatsApp', 'Banco do Brasil', 'SMS', 'Chamada'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleQuickPreset(p)}
                className="py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-[11px] font-medium transition-all cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Aplicativo / Origem</label>
            <input
              type="text"
              value={app}
              onChange={(e) => setApp(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Título da Notificação</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Conteúdo da Mensagem</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Nível de Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as EventPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="critical">🚨 Crítica</option>
                <option value="high">⚠️ Alta</option>
                <option value="normal">🔹 Normal</option>
                <option value="low">▫️ Baixa</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Tipo de Evento</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="notification">Notificação</option>
                <option value="sms">SMS</option>
                <option value="call">Chamada</option>
                <option value="system">Sistema</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs cursor-pointer shadow-md"
            >
              Disparar Evento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
