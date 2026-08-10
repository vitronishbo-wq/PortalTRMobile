import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  MessageSquare,
  Search,
  Users,
  Terminal,
  Lock,
  Settings,
  Delete,
  Copy,
  Clipboard,
  X,
  Sparkles,
  History,
  CheckCircle2,
  ChevronDown,
  Volume2,
  Maximize2,
  Grid,
  Hash,
  ChevronUp,
  Globe,
  CornerDownLeft,
  Key,
  User,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { InputEngine, InputContext, KeyboardType, AutocompleteSuggestion } from '../engine/inputEngine';

interface SystemKeyboardProps {
  onCommitValue?: (value: string, context: InputContext) => void;
  onCallInitiated?: (phoneNumber: string) => void;
  onSmsSent?: (recipient: string, message: string) => void;
  onCommandRun?: (command: string) => void;
}

export const SystemKeyboard: React.FC<SystemKeyboardProps> = ({
  onCommitValue,
  onCallInitiated,
  onSmsSent,
  onCommandRun
}) => {
  const [context, setContext] = useState<InputContext>(InputEngine.getActiveContext());
  const [kbType, setKbType] = useState<KeyboardType>(InputEngine.getKeyboardType());
  const [buffer, setBuffer] = useState<string>(InputEngine.getBuffer());
  const [isVisible, setIsVisible] = useState<boolean>(InputEngine.getIsVisible());
  const [history, setHistory] = useState<string[]>(InputEngine.getHistory());
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);

  // Sync state with InputEngine
  useEffect(() => {
    const unsubscribe = InputEngine.subscribe(() => {
      setContext(InputEngine.getActiveContext());
      setKbType(InputEngine.getKeyboardType());
      setBuffer(InputEngine.getBuffer());
      setIsVisible(InputEngine.getIsVisible());
      setHistory(InputEngine.getHistory());
    });
    return unsubscribe;
  }, []);

  // Physical Keyboard listener
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isVisible) return;

      // Avoid double typing if focused on standard text inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Escape') {
        InputEngine.closeKeyboard();
      } else if (e.key === 'Backspace') {
        InputEngine.backspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCommit();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        InputEngine.appendChar(e.key);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        InputEngine.pasteFromClipboard();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        InputEngine.copyToClipboard().then(() => {
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 2000);
        });
      }
    },
    [isVisible, buffer, context]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const suggestions: AutocompleteSuggestion[] = InputEngine.getAutocompleteSuggestions();

  const handleCommit = () => {
    if (!buffer.trim()) return;

    if (context === 'dialer' && onCallInitiated) {
      onCallInitiated(buffer);
    } else if (context === 'commands' && onCommandRun) {
      onCommandRun(buffer);
    } else if (context === 'sms' && onSmsSent) {
      onSmsSent('+244 923 000 111', buffer);
    }

    if (onCommitValue) {
      onCommitValue(buffer, context);
    }

    InputEngine.commit();
  };

  const handleCopy = async () => {
    const success = await InputEngine.copyToClipboard();
    if (success) {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
    }
  };

  const handlePaste = async () => {
    await InputEngine.pasteFromClipboard();
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => InputEngine.toggleKeyboard()}
        className="fixed bottom-4 right-4 z-50 p-3 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center space-x-2 border border-white/20 font-mono text-xs font-bold"
        title="Abrir Teclado Único do Sistema (Physical & Screen Keyboard)"
      >
        <Key className="w-4 h-4" />
        <span className="hidden sm:inline">TECLADO DO SISTEMA</span>
      </button>
    );
  }

  const contextsList: { id: InputContext; label: string; icon: React.ElementType; category: 'Texto' | 'Números' | 'Segurança' }[] = [
    // Texto
    { id: 'sms', label: 'SMS', icon: MessageSquare, category: 'Texto' },
    { id: 'search', label: 'Pesquisa', icon: Search, category: 'Texto' },
    { id: 'contacts', label: 'Contactos', icon: Users, category: 'Texto' },
    { id: 'profile', label: 'Perfil', icon: User, category: 'Texto' },
    { id: 'settings', label: 'Configurações', icon: Settings, category: 'Texto' },
    { id: 'commands', label: 'Comandos', icon: Terminal, category: 'Texto' },
    // Números
    { id: 'dialer', label: 'Dialer', icon: Phone, category: 'Números' },
    { id: 'phone', label: 'Telefone', icon: Smartphone, category: 'Números' },
    { id: 'dtmf', label: 'DTMF', icon: Hash, category: 'Números' },
    { id: 'pin', label: 'PIN', icon: Lock, category: 'Números' },
    { id: 'otp', label: 'Código OTP', icon: Key, category: 'Números' },
    // Segurança
    { id: 'security', label: 'Segurança / Auth', icon: ShieldCheck, category: 'Segurança' }
  ];

  const qwertyRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm']
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-2 sm:p-4 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl font-mono text-slate-100 animate-in slide-in-from-bottom duration-200 select-none">
      <div className="max-w-2xl mx-auto space-y-2.5">
        {/* HEADER BAR: CONTEXT ROUTER & CONTROLS */}
        <div className="flex items-center justify-between bg-slate-900/90 p-2 rounded-2xl border border-slate-800 text-xs">
          {/* Active Context Selector Chips */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {contextsList.map((c) => {
              const IconComponent = c.icon;
              const isActive = context === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => InputEngine.setContext(c.id)}
                  className={`px-2.5 py-1 rounded-xl font-bold flex items-center space-x-1.5 transition-all text-[11px] shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Controls: Type Switcher & Close */}
          <div className="flex items-center space-x-1.5 shrink-0 ml-2">
            {/* Keyboard Type Switcher Button */}
            <button
              onClick={() => {
                const types: KeyboardType[] = ['dtmf', 'textual', 'numeric', 'pin'];
                const nextType = types[(types.indexOf(kbType) + 1) % types.length];
                InputEngine.setKeyboardType(nextType);
              }}
              className="px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-colors cursor-pointer"
              title="Mudar Tipo de Teclado"
            >
              {kbType}
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistoryModal(!showHistoryModal)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                showHistoryModal
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Histórico de Entradas"
            >
              <History className="w-3.5 h-3.5" />
            </button>

            {/* Minimize/Close */}
            <button
              onClick={() => InputEngine.closeKeyboard()}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Fechar Teclado"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* INPUT DISPLAY BUFFER BAR */}
        <div className="relative bg-slate-900 rounded-2xl border border-slate-800 p-2.5 flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-2 flex-1 overflow-x-auto min-w-0 font-mono">
            <span className="text-indigo-400 font-bold text-xs uppercase shrink-0">
              [{context.toUpperCase()}]:
            </span>
            <span className="text-sm font-extrabold text-white tracking-wide truncate">
              {kbType === 'pin' ? '•'.repeat(buffer.length) : buffer || <span className="text-slate-600 font-normal italic text-xs">Digite ou pressione as teclas...</span>}
            </span>
          </div>

          <div className="flex items-center space-x-1 shrink-0 ml-2">
            {copiedNotification && (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Copiado!
              </span>
            )}
            <button
              onClick={handleCopy}
              disabled={!buffer}
              className="p-1.5 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
              title="Copiar para Área de Transferência"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handlePaste}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
              title="Colar da Área de Transferência"
            >
              <Clipboard className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => InputEngine.backspace()}
              disabled={!buffer}
              className="p-1.5 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded hover:bg-slate-800 cursor-pointer"
              title="Apagar Caractere"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AUTOCOMPLETE / SUGGESTIONS RIBBON */}
        {suggestions.length > 0 && (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => InputEngine.setBuffer(s.value)}
                className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-200 hover:text-white rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <span>{s.label}</span>
                {s.category && (
                  <span className="px-1.5 py-0.2 bg-slate-800 text-[9px] text-slate-400 rounded">
                    {s.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* HISTORY MODAL OVERLAY */}
        {showHistoryModal && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-1.5">
              <span>HISTÓRICO RECENTE DE INPUTS</span>
              <button onClick={() => setShowHistoryModal(false)} className="hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-slate-500 italic py-2">Sem histórico guardado.</p>
            ) : (
              <div className="max-h-28 overflow-y-auto space-y-1">
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      InputEngine.setBuffer(h);
                      setShowHistoryModal(false);
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800/80 cursor-pointer flex items-center justify-between text-slate-200 font-mono"
                  >
                    <span className="truncate">{h}</span>
                    <span className="text-[10px] text-indigo-400 font-bold">Usar</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KEYBOARD LAYOUT: DTMF / NUMERIC / PIN DIALPAD */}
        {(kbType === 'dtmf' || kbType === 'numeric' || kbType === 'pin') && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              {[
                { digit: '1', letters: '' },
                { digit: '2', letters: 'ABC' },
                { digit: '3', letters: 'DEF' },
                { digit: '4', letters: 'GHI' },
                { digit: '5', letters: 'JKL' },
                { digit: '6', letters: 'MNO' },
                { digit: '7', letters: 'PQRS' },
                { digit: '8', letters: 'TUV' },
                { digit: '9', letters: 'WXYZ' },
                { digit: '*', letters: '' },
                { digit: '0', letters: '+' },
                { digit: '#', letters: '' }
              ].map((item) => (
                <button
                  key={item.digit}
                  onClick={() => InputEngine.appendChar(item.digit)}
                  className="py-3 bg-slate-900 hover:bg-indigo-600/30 active:bg-indigo-600 text-slate-100 hover:text-white rounded-2xl border border-slate-800 hover:border-indigo-500/50 shadow-md transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95"
                >
                  <span className="text-lg font-black">{item.digit}</span>
                  {item.letters && (
                    <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">
                      {item.letters}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ACTION BUTTON (Call / Submit) */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => InputEngine.clearBuffer()}
                className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-2xl border border-slate-800 font-extrabold text-xs cursor-pointer"
              >
                LIMPAR
              </button>

              <button
                onClick={handleCommit}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
              >
                {context === 'dialer' ? (
                  <>
                    <Phone className="w-4 h-4 fill-current" />
                    <span>INICIAR CHAMADA</span>
                  </>
                ) : (
                  <>
                    <CornerDownLeft className="w-4 h-4" />
                    <span>CONFIRMAR / EXECUTAR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* KEYBOARD LAYOUT: TEXTUAL QWERTY */}
        {kbType === 'textual' && (
          <div className="space-y-1.5">
            {/* QWERTY Rows */}
            {qwertyRows.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center space-x-1">
                {rIdx === 2 && (
                  <button
                    onClick={() => setIsShiftActive(!isShiftActive)}
                    className={`px-3 py-2.5 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                      isShiftActive
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⇧
                  </button>
                )}

                {row.map((key) => {
                  const char = isShiftActive ? key.toUpperCase() : key;
                  return (
                    <button
                      key={key}
                      onClick={() => InputEngine.appendChar(char)}
                      className="flex-1 max-w-[45px] py-2.5 bg-slate-900 hover:bg-indigo-600/30 active:bg-indigo-600 text-slate-100 hover:text-white rounded-xl border border-slate-800 hover:border-indigo-500/50 text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      {char}
                    </button>
                  );
                })}

                {rIdx === 2 && (
                  <button
                    onClick={() => InputEngine.backspace()}
                    className="px-3 py-2.5 bg-slate-900 hover:bg-rose-600/30 border border-slate-800 hover:border-rose-500 text-slate-400 hover:text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
                  >
                    ⌫
                  </button>
                )}
              </div>
            ))}

            {/* Bottom Row (Numbers, Space, Enter) */}
            <div className="flex items-center space-x-1.5 pt-1">
              <button
                onClick={() => InputEngine.setKeyboardType('numeric')}
                className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
              >
                123
              </button>

              <button
                onClick={() => InputEngine.appendChar(' ')}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs cursor-pointer text-center"
              >
                ESPAÇO
              </button>

              <button
                onClick={() => InputEngine.appendChar('.')}
                className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                .
              </button>

              <button
                onClick={handleCommit}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-1 cursor-pointer active:scale-95"
              >
                <span>ENTER</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STATUS FOOTER */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>UNIFIED INPUT ENGINE (DTMF Synthesizer & Physical Keys Listening)</span>
          </div>
          <span>Esc = Fechar</span>
        </div>
      </div>
    </div>
  );
};
