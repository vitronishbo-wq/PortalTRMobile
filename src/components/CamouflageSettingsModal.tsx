import React, { useState } from 'react';
import { Shield, Key, Eye, Lock, Smartphone, Check, X, AlertCircle } from 'lucide-react';

interface CamouflageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  secretPin: string;
  onSavePin: (pin: string) => void;
  startCamouflaged: boolean;
  onSaveStartCamouflaged: (val: boolean) => void;
  hideUnlockBtn: boolean;
  onSaveHideUnlockBtn: (val: boolean) => void;
  calcTitle: string;
  onSaveCalcTitle: (title: string) => void;
}

export const CamouflageSettingsModal: React.FC<CamouflageSettingsModalProps> = ({
  isOpen,
  onClose,
  secretPin,
  onSavePin,
  startCamouflaged,
  onSaveStartCamouflaged,
  hideUnlockBtn,
  onSaveHideUnlockBtn,
  calcTitle,
  onSaveCalcTitle
}) => {
  const [pinInput, setPinInput] = useState(secretPin);
  const [titleInput, setTitleInput] = useState(calcTitle);
  const [startCamouflagedVal, setStartCamouflagedVal] = useState(startCamouflaged);
  const [hideUnlockBtnVal, setHideUnlockBtnVal] = useState(hideUnlockBtn);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{3,8}$/.test(pinInput)) {
      setErrorMsg('O PIN deve conter entre 3 e 8 dígitos numéricos.');
      return;
    }

    setErrorMsg('');
    onSavePin(pinInput);
    onSaveCalcTitle(titleInput || 'Calculadora Padrão');
    onSaveStartCamouflaged(startCamouflagedVal);
    onSaveHideUnlockBtn(hideUnlockBtnVal);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 text-slate-100 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Perfil de Camuflagem</h3>
              <p className="text-xs text-slate-400">Disfarce de Calculadora para o Smartphone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <p className="font-bold text-emerald-400 text-sm">Configurações salvas com sucesso!</p>
            <p className="text-xs text-slate-400">A camuflagem de calculadora foi atualizada.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Secret PIN */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>PIN Secreto de Desbloqueio</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Ex: 12345 ou 8888</span>
              </label>
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Digite o PIN numérico"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
              <p className="text-[11px] text-slate-400 leading-tight">
                Ao digitar essa sequência numérica na calculadora, a app desbloqueia automaticamente.
              </p>
            </div>

            {/* Disguise Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Nome Exibido no Cabeçalho da Calculadora</span>
              </label>
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Ex: Calculadora Padrão, Math Calc"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Checkbox 1: Start Camouflaged */}
            <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startCamouflagedVal}
                  onChange={(e) => setStartCamouflagedVal(e.target.checked)}
                  className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Iniciar Sempre em Modo Calculadora</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sempre que abrir a aplicação ou o ícone do telemóvel, abre primeiro a tela de Calculadora. Quem mexer no telefone verá apenas uma calculadora comum.
                  </p>
                </div>
              </label>
            </div>

            {/* Checkbox 2: Hide Unlock Button */}
            <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideUnlockBtnVal}
                  onChange={(e) => setHideUnlockBtnVal(e.target.checked)}
                  className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ocultar Botão de Cadeado 🔓 (Modo 100% Disfarçado)</span>
                  </span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Remove o ícone de cadeado. A calculadora aparenta ser 100% genuína e abre apenas ao digitar a sequência do PIN no teclado numérico.
                  </p>
                </div>
              </label>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Salvar Camuflagem
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
