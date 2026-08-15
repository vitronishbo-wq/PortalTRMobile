// src/components/modals/USSDDialogModal.tsx — Diálogo Interativo de Menus USSD / MMI Engineering Mode
// Opções 2, 3 e 4: Diálogo autêntico de operadora com respostas instantâneas via teclado DTMF

import React, { useState, useEffect, useRef } from 'react';
import { USSDMenuEngine, USSDResponse } from '../../engine/ussdMenuEngine';
import { Radio, Send, X, ShieldAlert, Cpu, CheckCircle2, Hash } from 'lucide-react';

export const USSDDialogModal: React.FC = () => {
  const [response, setResponse] = useState<USSDResponse | null>(null);
  const [inputVal, setInputVal] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = USSDMenuEngine.subscribe((resp) => {
      setResponse(resp);
      setInputVal('');
      if (resp && resp.options && resp.options.length > 0) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    });
    return () => unsub();
  }, []);

  if (!response) return null;

  const handleSend = async (valToSend?: string) => {
    const code = valToSend || inputVal;
    if (!code) return;
    setIsSubmitting(true);
    try {
      await USSDMenuEngine.replySession(code);
    } finally {
      setIsSubmitting(false);
      setInputVal('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      USSDMenuEngine.closeSession();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden font-mono text-xs text-neutral-200">
        {/* Header Estilo MMI / Engineering Mode */}
        <div className="bg-neutral-800 px-4 py-2.5 border-b border-neutral-700 flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-neutral-100 uppercase tracking-wider text-[11px]">
              {response.title || 'COS USSD Network Protocol'}
            </span>
          </div>
          <button
            onClick={() => USSDMenuEngine.closeSession()}
            className="text-neutral-400 hover:text-white p-1 hover:bg-neutral-700 rounded"
            title="Fechar (0)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Diálogo */}
        <div className="p-4 space-y-3">
          {/* Mensagem do Header */}
          <div className="bg-neutral-950/80 p-3 rounded border border-neutral-800 text-neutral-300 whitespace-pre-line leading-relaxed text-[11px]">
            {response.body}
          </div>

          {/* Lista de Opções Numéricas Clicáveis */}
          {response.options && response.options.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1">
                <Hash className="w-3 h-3 text-neutral-400" />
                Opções DTMF Disponíveis:
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                {response.options.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleSend(opt.key)}
                    className="w-full text-left px-2.5 py-1.5 rounded bg-neutral-800/60 hover:bg-neutral-750 hover:border-emerald-500/50 border border-neutral-700/60 flex items-center justify-between group transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 flex items-center justify-center rounded bg-neutral-900 border border-neutral-700 text-emerald-400 font-bold text-[10px] group-hover:border-emerald-500">
                        {opt.key}
                      </span>
                      <span className="text-neutral-200 text-[11px]">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-emerald-400">Enviar ↵</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campo de Input de Dígito / Resposta */}
          {response.type !== 'ACTION_COMPLETE' && (
            <div className="pt-2">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Introduza a opção (ex: 1)"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded px-3 py-1.5 text-neutral-100 text-xs focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputVal || isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer com Status */}
        <div className="bg-neutral-950 px-4 py-2 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-400" />
            Sessão MMI: {response.sessionId ? response.sessionId.substring(0, 16) : 'Ativa'}
          </span>
          <button
            onClick={() => USSDMenuEngine.closeSession()}
            className="text-neutral-400 hover:text-neutral-200 underline"
          >
            {response.type === 'ACTION_COMPLETE' ? 'OK / Fechar' : 'Cancelar (0)'}
          </button>
        </div>
      </div>
    </div>
  );
};
