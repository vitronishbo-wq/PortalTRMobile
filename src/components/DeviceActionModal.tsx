import React, { useState } from 'react';
import { Device } from '../types';
import { Shield, Lock, Trash2, ArrowRightLeft, QrCode, UserCheck, X, Check, AlertTriangle } from 'lucide-react';

export type DeviceActionType = 'LOCK' | 'WIPE' | 'TRANSFER' | 'PAIR' | 'REMOVE' | 'PROMOTE';

interface DeviceActionModalProps {
  device: Device;
  action: DeviceActionType;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (device: Device, action: DeviceActionType, extraData?: any) => void;
}

export const DeviceActionModal: React.FC<DeviceActionModalProps> = ({
  device,
  action,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [transferTarget, setTransferTarget] = useState('user-founder-primary');

  if (!isOpen) return null;

  const titles: Record<DeviceActionType, { title: string; color: string; desc: string }> = {
    LOCK: {
      title: 'Bloquear Dispositivo Remotamente (LOCK)',
      color: 'text-amber-400',
      desc: `Revogar tokens de sessão e bloquear interface do nó ${device.name}.`
    },
    WIPE: {
      title: 'Limpeza Remota de Dados (WIPE)',
      color: 'text-rose-400',
      desc: `ATENÇÃO: Limpará todo o cache local, chaves de identidade e dados criptografados do dispositivo ${device.name}.`
    },
    TRANSFER: {
      title: 'Transferir Titularidade do Dispositivo (TRANSFER)',
      color: 'text-indigo-400',
      desc: `Transferir o nó ${device.name} (${device.virtualNumber || device.deviceId}) para outra conta de utilizador.`
    },
    PAIR: {
      title: 'Forçar Re-emparelhamento Zero-Touch (PAIR)',
      color: 'text-cyan-400',
      desc: `Emitir novo handshake criptográfico para o nó ${device.name}.`
    },
    REMOVE: {
      title: 'Remover Dispositivo da Frota (REMOVE)',
      color: 'text-rose-400',
      desc: `Remover permanentemente o nó ${device.name} do Firestore e das rotas de telemetria.`
    },
    PROMOTE: {
      title: 'Promover a Dispositivo Principal (PROMOTE)',
      color: 'text-amber-400',
      desc: `Definir ${device.name} como Nó Mestre prioritário para SMS, chamadas e autenticação primária.`
    }
  };

  const current = titles[action];

  const handleExecute = () => {
    onConfirm(device, action, { transferTarget });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className={`p-1 rounded bg-slate-800 font-bold text-xs ${current.color}`}>
              {action}
            </span>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              {current.title}
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
            <div className="text-slate-200 font-bold">{device.name} ({device.model})</div>
            <div className="text-[10px] text-slate-400">ID: {device.deviceId} • OS: {device.osVersion || 'N/A'}</div>
            <div className="text-[10px] text-cyan-400">Número: {device.virtualNumber || 'Sem número associado'}</div>
          </div>

          <p className="text-slate-300 font-sans text-xs">
            {current.desc}
          </p>

          {action === 'TRANSFER' && (
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Destinatário da Titularidade (Select)
              </label>
              <select
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-indigo-500"
              >
                <option value="user-founder-primary">Founder (silajaneiro9@gmail.com)</option>
                <option value="user-sec-admin-01">Admin Secundário 01</option>
                <option value="user-operator-node">Operador de Campo Luanda</option>
              </select>
            </div>
          )}

          {(action === 'WIPE' || action === 'REMOVE') && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] space-y-1">
              <div className="flex items-center space-x-1 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Confirmação de Segurança Requerida</span>
              </div>
              <p className="text-[10px]">Escreva <strong>CONFIRMAR</strong> para executar esta ação destrutiva:</p>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="CONFIRMAR"
                className="w-full bg-slate-950 border border-rose-500/50 rounded px-2 py-1 text-white font-bold outline-none uppercase"
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleExecute}
              disabled={(action === 'WIPE' || action === 'REMOVE') && confirmInput !== 'CONFIRMAR'}
              className={`px-3 py-1.5 rounded-lg font-bold text-white inline-flex items-center space-x-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                action === 'WIPE' || action === 'REMOVE'
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : action === 'PROMOTE'
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar {action}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
