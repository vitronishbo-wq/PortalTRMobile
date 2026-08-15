/* TelecomCredentialModal — Modal para configuração e auditoria de credenciais reais da operadora */

import React, { useState, useEffect } from 'react';
import { TelecomProviderRealityStatus } from '../telecom/TelecomCapabilityVerifier';
import { X, Check, Key, Shield, Radio, Server } from 'lucide-react';
import { db } from '../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface TelecomCredentialModalProps {
  provider: TelecomProviderRealityStatus;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TelecomCredentialModal: React.FC<TelecomCredentialModalProps> = ({
  provider,
  isOpen,
  onClose,
  onSaved
}) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [sipServer, setSipServer] = useState('');
  const [sipUser, setSipUser] = useState('');
  const [sipPassword, setSipPassword] = useState('');
  const [assignedNumber, setAssignedNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (provider) {
      try {
        const stored = localStorage.getItem(`telecom_creds_${provider.providerId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setApiKey(parsed.apiKey || '');
          setApiSecret(parsed.apiSecret || '');
          setSipServer(parsed.sipServer || provider.endpointUrl || '');
          setSipUser(parsed.sipUser || '');
          setSipPassword(parsed.sipPassword || '');
          setAssignedNumber(parsed.assignedNumber || provider.assignedNumber || '');
        } else {
          setSipServer(provider.endpointUrl || '');
          setAssignedNumber(provider.assignedNumber || '');
        }
      } catch (e) {
        setSipServer(provider.endpointUrl || '');
        setAssignedNumber(provider.assignedNumber || '');
      }
    }
  }, [provider]);

  if (!isOpen || !provider) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const creds = {
      providerId: provider.providerId,
      providerName: provider.providerName,
      apiKey,
      apiSecret: apiSecret ? '********' : '',
      sipServer,
      sipUser,
      assignedNumber,
      hasSipPassword: !!sipPassword,
      updatedAt: Date.now()
    };

    try {
      localStorage.setItem(`telecom_creds_${provider.providerId}`, JSON.stringify({
        apiKey,
        apiSecret,
        sipServer,
        sipUser,
        sipPassword,
        assignedNumber
      }));

      if (db) {
        await setDoc(doc(db, 'provider_credentials', provider.providerId), creds, { merge: true });
      }
    } catch (e) {
      console.warn('[TelecomCredentialModal] Erro ao salvar credenciais:', e);
    } finally {
      setIsSaving(false);
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-500/10 text-cyan-400 font-bold text-xs border border-cyan-500/30">
              CREDENCIAIS REAIS
            </span>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              {provider.providerName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-slate-200 font-bold">Configuração de Trunking & Conectividade</div>
            <div className="text-[10px] text-slate-400">
              Insira as credenciais fornecidas pela operadora para habilitar roteamento real de chamadas e SMS.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                API Key (REST / SMPP)
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="unitel_live_key_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                API Secret
              </label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Endpoint SIP / Trunk Host
              </label>
              <input
                type="text"
                value={sipServer}
                onChange={(e) => setSipServer(e.target.value)}
                placeholder="sip.carrier.ao:5060"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Número Vinculado (E.164)
              </label>
              <input
                type="text"
                value={assignedNumber}
                onChange={(e) => setAssignedNumber(e.target.value)}
                placeholder="+244 9XX XXX XXX"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-300 font-bold outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                SIP Auth Username
              </label>
              <input
                type="text"
                value={sipUser}
                onChange={(e) => setSipUser(e.target.value)}
                placeholder="trunk_user_01"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                SIP Auth Password
              </label>
              <input
                type="password"
                value={sipPassword}
                onChange={(e) => setSipPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500 text-xs font-mono"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white inline-flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Credenciais</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
