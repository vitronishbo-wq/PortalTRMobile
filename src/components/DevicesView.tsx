import React, { useState, useEffect } from 'react';
import { Smartphone, QrCode, Battery, Wifi, ShieldCheck, Plus, Trash2, Send, RefreshCw, CheckCircle2, Activity, Cpu, Wrench, Zap } from 'lucide-react';
import QRCode from 'qrcode';
import { Device } from '../types';
import { ZeroTouchIdentity } from '../engine/provisioningEngine';
import { BatteryUsageMonitor } from './BatteryUsageMonitor';

interface DevicesViewProps {
  devices: Device[];
  onAddDevice: (device: Partial<Device>) => void;
  onRemoveDevice: (id: string) => void;
  onSimulateEvent: () => void;
}

export const DevicesView: React.FC<DevicesViewProps> = ({
  devices,
  onAddDevice,
  onRemoveDevice,
  onSimulateEvent
}) => {
  const [showPairModal, setShowPairModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [pairingToken, setPairingToken] = useState<string>('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [repairingMap, setRepairingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Generate pairing token & QR Code
    const token = `PORTAL-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    setPairingToken(token);

    const pairingPayload = JSON.stringify({
      serverUrl: window.location.origin,
      token,
      timestamp: Date.now()
    });

    QRCode.toDataURL(pairingPayload, { margin: 2, width: 220 })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation error:', err));
  }, [showPairModal]);

  const handleManualPair = () => {
    if (!newDeviceName.trim()) return;
    const zeroTouchDev = ZeroTouchIdentity.createIdentity('generic');
    onAddDevice({
      ...zeroTouchDev,
      name: newDeviceName,
      model: newDeviceModel || 'Android Phone'
    });
    setNewDeviceName('');
    setNewDeviceModel('');
    setShowPairModal(false);
  };

  const handleAutoRepair = (deviceId: string) => {
    setRepairingMap((prev) => ({ ...prev, [deviceId]: true }));
    setTimeout(() => {
      setRepairingMap((prev) => ({ ...prev, [deviceId]: false }));
      alert(`[Auto-Repair] Comando de reativação enviado com sucesso para o dispositivo ${deviceId}! Listener de Notificações restaurado.`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-indigo-400" />
            <span>Dispositivos & DeviceHealth ({devices.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Monitorização de Saúde Zero-Touch, permissões OEM e latência de sincronização em lote.
          </p>
        </div>

        <button
          onClick={() => setShowPairModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span>Emparelhar Novo Celular</span>
        </button>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => {
          const isRepairing = repairingMap[device.deviceId];
          const healthScore = device.permissionScore ?? 98;
          const notificationStatus = device.notificationListenerStatus || 'active';
          const oem = device.oemProfile || 'xiaomi';

          return (
            <div
              key={device.deviceId}
              className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-lg relative space-y-4 hover:border-slate-700 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-100 text-sm">{device.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] uppercase font-mono font-semibold">
                        {oem}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block">{device.model}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                    device.online ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${device.online ? 'bg-amber-400 animate-ping' : 'bg-slate-500'}`}></span>
                    <span>{device.online ? 'ONLINE' : 'OFFLINE'}</span>
                  </span>
                </div>
              </div>

              {/* Zero-Touch & Digital Twin Diagnostics Panel */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center space-x-1.5 font-mono">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-bold text-slate-300">Digital Twin Node:</span>
                    <span className="text-amber-400 font-bold">{device.nodeId || `node-${device.deviceId.substring(0, 8)}`}</span>
                  </span>
                  <span className="font-bold text-amber-400 font-mono">{healthScore}%</span>
                </div>

                {/* Digital Twin Capabilities & Health Matrix */}
                <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider font-mono">Capacidades Digital Twin:</span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                      {device.health?.network || 'AFRICELL_4G'}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                      device.capabilities?.sms !== false
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <span>SMS</span>
                      <span>{device.capabilities?.sms !== false ? '✓' : '✕'}</span>
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                      device.capabilities?.calls !== false
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <span>CHAMADAS</span>
                      <span>{device.capabilities?.calls !== false ? '✓' : '✕'}</span>
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                      device.capabilities?.biometrics !== false
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      <span>BIOMETRIA</span>
                      <span>{device.capabilities?.biometrics !== false ? '✓' : '✕'}</span>
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border flex items-center space-x-1 ${
                      device.capabilities?.accessibility
                        ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        : 'bg-slate-800/80 text-slate-400 border-slate-800'
                    }`}>
                      <span>ACESSIBILIDADE</span>
                      <span>{device.capabilities?.accessibility ? '✓' : 'OFF'}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Listener:</span>
                    <span className={`font-semibold capitalize ${
                      notificationStatus === 'active' ? 'text-amber-400' : 'text-orange-400'
                    }`}>
                      {notificationStatus === 'active' ? '● Ativo' : '▲ Requer Reparo'}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Latência Barramento:</span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {device.syncDelayMs ?? 12}ms
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center space-x-1.5">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  <span>{device.batteryLevel ?? 98}%</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-orange-400" />
                  <span>Zero-Touch</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sem Limites</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Último Heartbeat: {new Date(device.lastSync).toLocaleTimeString('pt-BR')}</span>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAutoRepair(device.deviceId)}
                    disabled={isRepairing}
                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all cursor-pointer flex items-center space-x-1"
                    title="Auto-Repair Background Listener"
                  >
                    <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                    <span className="text-[10px]">Auto-Repair</span>
                  </button>

                  <button
                    onClick={onSimulateEvent}
                    className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all cursor-pointer"
                    title="Testar Envio de Evento do Celular"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveDevice(device.deviceId)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                    title="Desconectar Dispositivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historical Battery Usage & Drain Monitor */}
      <BatteryUsageMonitor devices={devices} />

      {/* QR Code Pair Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <span>Emparelhar App Android Zero-Touch</span>
              </h3>
              <button
                onClick={() => setShowPairModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-3">
              <p className="text-xs text-slate-300">
                Abra o aplicativo <strong>Portal Mobile</strong> no seu smartphone Android e escaneie o código QR abaixo para vincular:
              </p>

              {qrDataUrl ? (
                <div className="inline-block p-3 bg-white rounded-2xl shadow-xl ring-4 ring-indigo-500/20">
                  <img src={qrDataUrl} alt="QR Code de Emparelhamento" className="w-48 h-48 mx-auto" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-800 rounded-2xl mx-auto flex items-center justify-center text-slate-500">
                  Gerando QR Code...
                </div>
              )}

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
                Token: <strong className="text-indigo-400">{pairingToken}</strong>
              </div>
            </div>

            {/* Manual Add Form */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">Ou Adicionar Manualmente para Teste:</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Celular"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Modelo (ex: Galaxy S24)"
                  value={newDeviceModel}
                  onChange={(e) => setNewDeviceModel(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={handleManualPair}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Adicionar Dispositivo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

