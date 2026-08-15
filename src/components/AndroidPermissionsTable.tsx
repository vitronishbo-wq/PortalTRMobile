/* AndroidPermissionsTable — Tabela de Permissões Críticas do Agente Android */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { RealTelemetryService } from '../services/RealTelemetryService';

export interface AndroidPermissionItem {
  id: string;
  name: string;
  granted: boolean;
  required: boolean;
  description: string;
}

interface AndroidPermissionsTableProps {
  permissions?: Record<string, boolean>;
  onTogglePermission?: (id: string, value: boolean) => void;
}

export const AndroidPermissionsTable: React.FC<AndroidPermissionsTableProps> = ({
  permissions: initialPermissions,
  onTogglePermission
}) => {
  const [localPermissions, setLocalPermissions] = useState<Record<string, boolean>>({
    notification_listener: true,
    sms: true,
    calls: true,
    contacts: true,
    accessibility: true,
    camera: false,
    microphone: true,
    ...(initialPermissions || {})
  });

  // Query real browser/device permissions on mount
  useEffect(() => {
    const checkRealPermissions = async () => {
      try {
        const notifStatus = await RealTelemetryService.getNotificationListenerStatus();
        setLocalPermissions((prev) => ({
          ...prev,
          notification_listener: notifStatus.granted
        }));

        if (navigator.permissions && navigator.permissions.query) {
          try {
            const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
            setLocalPermissions((prev) => ({ ...prev, microphone: micStatus.state === 'granted' }));
          } catch (e) {}

          try {
            const camStatus = await navigator.permissions.query({ name: 'camera' as any });
            setLocalPermissions((prev) => ({ ...prev, camera: camStatus.state === 'granted' }));
          } catch (e) {}
        }
      } catch (e) {
        console.warn('[AndroidPermissionsTable] Query permissions warning:', e);
      }
    };

    checkRealPermissions();
  }, []);

  const handleRequestNativePermission = async (id: string) => {
    if (id === 'notification_listener') {
      if (typeof Notification !== 'undefined') {
        const res = await Notification.requestPermission();
        const granted = res === 'granted';
        setLocalPermissions((prev) => ({ ...prev, notification_listener: granted }));
        if (onTogglePermission) onTogglePermission('notification_listener', granted);
        return;
      }
    } else if (id === 'microphone') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setLocalPermissions((prev) => ({ ...prev, microphone: true }));
        if (onTogglePermission) onTogglePermission('microphone', true);
        return;
      } catch (e) {
        setLocalPermissions((prev) => ({ ...prev, microphone: false }));
        if (onTogglePermission) onTogglePermission('microphone', false);
        return;
      }
    } else if (id === 'camera') {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        setLocalPermissions((prev) => ({ ...prev, camera: true }));
        if (onTogglePermission) onTogglePermission('camera', true);
        return;
      } catch (e) {
        setLocalPermissions((prev) => ({ ...prev, camera: false }));
        if (onTogglePermission) onTogglePermission('camera', false);
        return;
      }
    }

    const nextVal = !localPermissions[id];
    setLocalPermissions((prev) => ({ ...prev, [id]: nextVal }));
    if (onTogglePermission) onTogglePermission(id, nextVal);
  };

  const permissionRows: AndroidPermissionItem[] = [
    {
      id: 'notification_listener',
      name: 'Notification Listener',
      granted: localPermissions.notification_listener ?? true,
      required: true,
      description: 'Captura de OTP bancário, notificações de operadora e mensagens em background'
    },
    {
      id: 'sms',
      name: 'SMS (RECEIVE & SEND)',
      granted: localPermissions.sms ?? true,
      required: true,
      description: 'Envio, recepção e encaminhamento bidirecional de SMS'
    },
    {
      id: 'calls',
      name: 'Calls (CALL_PHONE & READ_PHONE_STATE)',
      granted: localPermissions.calls ?? true,
      required: true,
      description: 'Discagem direta, monitoramento de chamadas e roteamento SIP/IMS'
    },
    {
      id: 'contacts',
      name: 'Contacts',
      granted: localPermissions.contacts ?? false,
      required: false,
      description: 'Sincronização de lista de contactos na Cloud e catálogo corporativo'
    },
    {
      id: 'accessibility',
      name: 'Accessibility Service',
      granted: localPermissions.accessibility ?? false,
      required: false,
      description: 'Automação de USSD (*111#, *123#) e interações em ecrã protegido'
    },
    {
      id: 'camera',
      name: 'Camera',
      granted: localPermissions.camera ?? false,
      required: false,
      description: 'Leitura de QR codes de pareamento e streaming de vídeo chamada'
    },
    {
      id: 'microphone',
      name: 'Microphone',
      granted: localPermissions.microphone ?? true,
      required: false,
      description: 'Captura de áudio para chamadas WebRTC e chamadas de voz nativas'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs shadow-lg">
      <div className="bg-slate-950 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wide text-[11px]">
            Permissões do Agente Android Nativo
          </span>
        </div>
        <span className="text-[10px] text-slate-400">Zero-Touch Provisioning</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] uppercase text-slate-400 font-bold">
              <th className="py-2 px-3">Permissão</th>
              <th className="py-2 px-3 text-center">Estado (Concedida)</th>
              <th className="py-2 px-3 text-center">Obrigatória</th>
              <th className="py-2 px-3">Finalidade no Sistema</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {permissionRows.map((perm) => (
              <tr key={perm.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-3 font-bold text-slate-200 whitespace-nowrap">
                  {perm.name}
                </td>
                <td className="py-2 px-3 text-center whitespace-nowrap">
                  <button
                    onClick={() => handleRequestNativePermission(perm.id)}
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      perm.granted
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                    }`}
                    title="Alternar / Solicitar Permissão Real Nativa"
                  >
                    {perm.granted ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>{perm.granted ? 'Sim' : 'Não'}</span>
                  </button>
                </td>
                <td className="py-2 px-3 text-center whitespace-nowrap">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    perm.required ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {perm.required ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="py-2 px-3 text-[10px] text-slate-400 font-sans">
                  {perm.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
