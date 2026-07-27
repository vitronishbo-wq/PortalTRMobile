import React, { useState } from 'react';
import { Lock, Unlock, Calculator as CalcIcon, Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface DisguisedCalculatorProps {
  onUnlock: () => void;
  secretPin?: string;
  calcTitle?: string;
  hideUnlockBtn?: boolean;
}

export const DisguisedCalculator: React.FC<DisguisedCalculatorProps> = ({
  onUnlock,
  secretPin = '12345',
  calcTitle = 'Calculadora Padrão',
  hideUnlockBtn = false
}) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [inputSequence, setInputSequence] = useState('');
  const [showPinHint, setShowPinHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleInput = (val: string) => {
    setErrorMessage('');

    // Detect secret PIN sequence typed in numeric order
    if (/\d/.test(val)) {
      const nextSeq = (inputSequence + val).slice(-secretPin.length);
      setInputSequence(nextSeq);

      if (nextSeq === secretPin) {
        setInputSequence('');
        onUnlock();
        return;
      }
    }

    if (val === 'C') {
      setDisplay('0');
      setExpression('');
      return;
    }

    if (val === '=') {
      try {
        if (!expression) return;
        // Safe evaluation for basic math expressions
        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
        if (!/^[0-9+\-*/.() ]+$/.test(sanitized)) {
          setDisplay('Erro');
          return;
        }
        // eslint-disable-next-line no-eval
        const result = eval(sanitized);
        setDisplay(String(result));
        setExpression(String(result));
      } catch (e) {
        setDisplay('Erro');
      }
      return;
    }

    const nextExpr = expression === '0' || display === '0' ? val : expression + val;
    setExpression(nextExpr);
    setDisplay(nextExpr);
  };

  const handleManualUnlockWithPrompt = () => {
    const pin = window.prompt('Digite a chave PIN de acesso ao Portal Mobile:');
    if (pin === secretPin || pin === '12345') {
      onUnlock();
    } else if (pin !== null) {
      setErrorMessage(`PIN incorreto. Tente novamente ou digite a sequência secreta no teclado.`);
    }
  };

  const buttons = [
    ['C', '(', ')', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=', hideUnlockBtn ? '%' : '🔓']
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative">
        
        {/* Camouflage Top Title Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <CalcIcon className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-sm text-slate-200">{calcTitle}</span>
          </div>
          <button
            onClick={() => setShowPinHint(!showPinHint)}
            className="text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
            title="Dica de Camuflagem"
          >
            {showPinHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Secret Pin Instruction Tooltip */}
        {showPinHint && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-xs text-indigo-300 space-y-1">
            <div className="flex items-center space-x-1.5 font-bold">
              <Shield className="w-4 h-4" />
              <span>Modo Disfarçado Ativo</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Para desbloquear o painel do <strong>Portal Mobile</strong>, digite a sequência PIN no teclado (PIN Ativo: <strong className="text-white font-mono">{secretPin}</strong>).
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Display Box */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-right space-y-1 shadow-inner min-h-[88px] flex flex-col justify-end">
          <div className="text-xs text-slate-500 font-mono tracking-wider truncate h-4">
            {expression || ' '}
          </div>
          <div className="text-3xl font-extrabold text-white font-mono tracking-tight truncate">
            {display}
          </div>
        </div>

        {/* Calculator Keypad */}
        <div className="grid grid-cols-4 gap-2.5">
          {buttons.map((row, rIdx) =>
            row.map((btn) => {
              const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
              const isClear = btn === 'C';
              const isUnlockBtn = btn === '🔓';

              return (
                <button
                  key={`${rIdx}-${btn}`}
                  onClick={() => {
                    if (isUnlockBtn) {
                      handleManualUnlockWithPrompt();
                    } else {
                      handleInput(btn);
                    }
                  }}
                  className={`h-14 rounded-2xl font-bold text-base transition-all active:scale-95 flex items-center justify-center cursor-pointer shadow-sm ${
                    isUnlockBtn
                      ? 'bg-slate-800/80 hover:bg-slate-700 text-indigo-400 border border-slate-700/60'
                      : isOperator
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                      : isClear
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-100 border border-slate-700/40'
                  }`}
                >
                  {btn}
                </button>
              );
            })
          )}
        </div>

        {/* Bottom Disguised System Status */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <span>v2.4.0 (Serviço de Calculadora)</span>
          <button
            onClick={() => alert('Acesso negado: Aplicativo essencial do sistema.')}
            className="text-slate-500 hover:text-slate-400 hover:underline cursor-pointer"
          >
            Info
          </button>
        </div>
      </div>
    </div>
  );
};

