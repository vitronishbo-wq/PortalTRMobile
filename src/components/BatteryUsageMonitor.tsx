import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Zap,
  Clock,
  TrendingDown,
  ShieldAlert,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  Activity,
  ArrowDownRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { Device } from '../types';

import { RealTelemetryService } from '../services/RealTelemetryService';

interface BatteryUsageMonitorProps {
  devices: Device[];
  onUpdateDeviceBattery?: (deviceId: string, newLevel: number) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const BatteryUsageMonitor: React.FC<BatteryUsageMonitorProps> = ({
  devices,
  onUpdateDeviceBattery,
  isExpanded: controlledIsExpanded,
  onToggleExpand: controlledOnToggleExpand
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState<boolean>(false);
  
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : internalIsExpanded;
  const handleToggleExpand = controlledOnToggleExpand || (() => setInternalIsExpanded((prev) => !prev));

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('all');
  const [timeHorizonHours, setTimeHorizonHours] = useState<number>(24);
  const [simulatingEvent, setSimulatingEvent] = useState<boolean>(false);

  // Default fallback devices if array is empty
  const activeDevices = useMemo(() => {
    if (devices && devices.length > 0) return devices;
    return [
      {
        deviceId: 'dev-demo-1',
        name: 'Galaxy S24 Ultra',
        model: 'SM-S928B',
        osVersion: 'Android 14',
        lastSync: Date.now(),
        online: true,
        batteryLevel: 88,
        oemProfile: 'samsung' as const,
        batteryOptimizationStatus: 'unrestricted' as const,
        permissionScore: 98
      },
      {
        deviceId: 'dev-demo-2',
        name: 'Redmi Note 13 Pro',
        model: '2312DRA50G',
        osVersion: 'Android 13',
        lastSync: Date.now() - 120000,
        online: true,
        batteryLevel: 42,
        oemProfile: 'xiaomi' as const,
        batteryOptimizationStatus: 'optimized' as const,
        permissionScore: 82
      }
    ];
  }, [devices]);

  // Generate realistic historical battery telemetry data based on device attributes
  const historicalData = useMemo(() => {
    const pointsCount = Math.min(timeHorizonHours, 24);
    const now = Date.now();
    const data: Array<{
      time: string;
      timestamp: number;
      [key: string]: any;
    }> = [];

    for (let i = pointsCount; i >= 0; i--) {
      const pointTime = new Date(now - i * 3600 * 1000);
      const timeLabel = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const item: any = {
        time: timeLabel,
        timestamp: pointTime.getTime()
      };

      activeDevices.forEach((dev) => {
        const currentBattery = dev.batteryLevel ?? 80;
        // Calculate simulated drain back in time
        // Unrestricted battery uses ~2.5%/hr, optimized uses ~1.2%/hr
        const drainRate = dev.batteryOptimizationStatus === 'unrestricted' ? 2.2 : 1.4;
        const oemFactor = dev.oemProfile === 'xiaomi' ? 1.3 : dev.oemProfile === 'samsung' ? 1.0 : 1.1;
        
        // Add pseudo-random fluctuation (e.g., charging spikes during night hours or high activity)
        let simulatedLevel = Math.min(100, Math.max(5, currentBattery + i * drainRate * oemFactor));
        // Add a small sinus wave for natural jitter
        const jitter = Math.sin(i * 0.8) * 2;
        simulatedLevel = Math.round(Math.min(100, Math.max(3, simulatedLevel + jitter)));

        item[dev.name] = simulatedLevel;
      });

      data.push(item);
    }

    return data;
  }, [activeDevices, timeHorizonHours]);

  // Selected device focus metric computations
  const primaryDevice = useMemo(() => {
    if (selectedDeviceId !== 'all') {
      const found = activeDevices.find((d) => d.deviceId === selectedDeviceId);
      if (found) return found;
    }
    return activeDevices[0];
  }, [activeDevices, selectedDeviceId]);

  // Drain metrics calculation
  const metrics = useMemo(() => {
    const currentLevel = primaryDevice.batteryLevel ?? 75;
    const isRestricted = primaryDevice.batteryOptimizationStatus === 'restricted';
    const isUnrestricted = primaryDevice.batteryOptimizationStatus === 'unrestricted';

    // Drain rate per hour estimation
    const estimatedDrainRatePctPerHour = isUnrestricted ? 2.8 : isRestricted ? 0.9 : 1.6;
    const remainingHours = Math.round(currentLevel / estimatedDrainRatePctPerHour);

    const hoursStr = Math.floor(remainingHours);
    const minutesStr = Math.round((remainingHours - hoursStr) * 60);

    // Health state
    let healthState: 'excelente' | 'normal' | 'critico' = 'excelente';
    if (currentLevel < 20) healthState = 'critico';
    else if (currentLevel < 45) healthState = 'normal';

    return {
      currentLevel,
      drainRate: estimatedDrainRatePctPerHour,
      estimatedRemainingStr: `${hoursStr}h ${minutesStr}m`,
      healthState,
      isRestricted
    };
  }, [primaryDevice]);

  // Bar chart dataset: Compare Drain Rate (%/h) across connected devices
  const comparisonData = useMemo(() => {
    return activeDevices.map((dev) => {
      const lvl = dev.batteryLevel ?? 70;
      const rate = dev.batteryOptimizationStatus === 'unrestricted' ? 2.8 : 1.5;
      return {
        name: dev.name,
        battery: lvl,
        drainRate: rate,
        healthScore: dev.permissionScore ?? 90
      };
    });
  }, [activeDevices]);

  // Real Device Battery Sync
  const handleSyncRealBattery = async () => {
    setSimulatingEvent(true);
    try {
      const realBat = await RealTelemetryService.getRealBattery();
      if (onUpdateDeviceBattery && primaryDevice) {
        onUpdateDeviceBattery(primaryDevice.deviceId, realBat.level);
      }
    } catch (e) {
      console.warn('[BatteryUsageMonitor] Falha ao ler BatteryManager real:', e);
    } finally {
      setSimulatingEvent(false);
    }
  };

  // Line colors for chart series
  const chartColors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-4 font-sans select-none">
      {!isExpanded ? (
        /* Discreet Collapsed Bar */
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/90 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <button
              onClick={handleToggleExpand}
              className="p-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-500/10 transition-all cursor-pointer group active:scale-95"
              title="Clique no ícone de bateria para expandir detalhes de telemetria"
            >
              <Battery className="w-5 h-5 animate-pulse group-hover:scale-110 transition-transform" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-100 tracking-tight">
                  Monitor de Consumo de Bateria
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                  Recolhido
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique no ícone da bateria para expandir a telemetria e o histórico
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="hidden md:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              {activeDevices.slice(0, 3).map((dev) => (
                <span key={dev.deviceId} className="flex items-center space-x-1 text-[11px] text-slate-300 font-mono">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  <span>{dev.name.split(' ')[0]}:</span>
                  <strong className="text-amber-400">{dev.batteryLevel ?? '?'}%</strong>
                </span>
              ))}
            </div>

            <button
              onClick={handleToggleExpand}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-extrabold flex items-center space-x-2 cursor-pointer transition-all active:scale-95 shadow-md"
            >
              <Battery className="w-4 h-4 text-amber-400" />
              <span>Expandir Telemetria</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      ) : (
        /* Full Expanded Telemetry View */
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Header Banner */}
          <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleExpand}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 cursor-pointer transition-all active:scale-95"
                  title="Clique no ícone de bateria para recolher"
                >
                  <BatteryCharging className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-slate-100">
                  Monitor de Consumo de Bateria Zero-Touch
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  Telemetria 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Análise histórica de descarga de bateria, otimizações OEM e previsibilidade de autonomia.
              </p>
            </div>

            {/* Filter Controls & Collapse Button */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Device Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-slate-200">
                    Todos os Dispositivos ({activeDevices.length})
                  </option>
                  {activeDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId} className="bg-slate-900 text-slate-200">
                      {dev.name} ({dev.batteryLevel ?? '?'}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Horizon Selector */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {[6, 12, 24, 48].map((h) => (
                  <button
                    key={h}
                    onClick={() => setTimeHorizonHours(h)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] transition-all cursor-pointer ${
                      timeHorizonHours === h
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>

              {/* Real Battery Sync Trigger */}
              <button
                onClick={handleSyncRealBattery}
                disabled={simulatingEvent}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center space-x-1 cursor-pointer"
                title="Sincronizar dados reais do BatteryManager API"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${simulatingEvent ? 'animate-spin' : ''}`} />
                <span>Sincronizar BatteryManager</span>
              </button>

              {/* Collapse Button */}
              <button
                onClick={handleToggleExpand}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs transition-all flex items-center space-x-1 cursor-pointer"
                title="Recolher painel de bateria"
              >
                <ChevronUp className="w-4 h-4 text-slate-400" />
                <span>Recolher</span>
              </button>
            </div>
          </div>

      {/* Metric Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Nível Atual */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Nível de Bateria ({primaryDevice.name})</span>
            <Battery className={`w-4 h-4 ${metrics.currentLevel < 20 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-100 font-mono">
              {metrics.currentLevel}%
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
              metrics.currentLevel < 20
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {metrics.currentLevel < 20 ? 'Bateria Baixa' : 'Estável'}
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.currentLevel < 20
                  ? 'bg-rose-500'
                  : metrics.currentLevel < 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${metrics.currentLevel}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Taxa de Drenagem Médio */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Consumo Estimado</span>
            <ArrowDownRight className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-100 font-mono">
              -{metrics.drainRate.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">/ hora</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Otimização OEM: <strong className="text-indigo-300 uppercase">{primaryDevice.oemProfile || 'Generic'}</strong>
          </p>
        </div>

        {/* Metric 3: Autonomia Restante */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Autonomia Restante</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {metrics.estimatedRemainingStr}
          </div>
          <p className="text-[11px] text-slate-400">
            Baseado no ritmo atual de sync background.
          </p>
        </div>

        {/* Metric 4: Battery Optimization Status */}
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 shadow-md space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Estado Doze / Otimização</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase font-mono ${
              primaryDevice.batteryOptimizationStatus === 'unrestricted'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {primaryDevice.batteryOptimizationStatus || 'unrestricted'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {primaryDevice.batteryOptimizationStatus === 'unrestricted'
              ? 'Sem restrição: Notificações em tempo real garanitdas.'
              : 'Otimizado pelo OS: Pode haver pequenos atrasos de pings.'}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart: Historical Battery Level Over Time */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Histórico de Descarga de Bateria (% de carga)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Evolução percentual do nível de carga nas últimas {timeHorizonHours} horas.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSyncRealBattery}
                className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold cursor-pointer flex items-center space-x-1"
                title="Sincronizar BatteryManager API"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Atualizar BatteryManager</span>
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {activeDevices.map((dev, idx) => {
                    const color = chartColors[idx % chartColors.length];
                    return (
                      <linearGradient key={dev.deviceId} id={`grad-${dev.deviceId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                      </linearGradient>
                    );
                  })}
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                {/* Critical battery reference line at 20% */}
                <ReferenceLine y={20} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Crítico 20%', fill: '#f43f5e', fontSize: 10, position: 'insideBottomRight' }} />

                {selectedDeviceId === 'all'
                  ? activeDevices.map((dev, idx) => {
                      const color = chartColors[idx % chartColors.length];
                      return (
                        <Area
                          key={dev.deviceId}
                          type="monotone"
                          dataKey={dev.name}
                          stroke={color}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill={`url(#grad-${dev.deviceId})`}
                        />
                      );
                    })
                  : (() => {
                      const dev = primaryDevice;
                      const color = chartColors[0];
                      return (
                        <Area
                          type="monotone"
                          dataKey={dev.name}
                          stroke={color}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill={`url(#grad-${dev.deviceId})`}
                        />
                      );
                    })()}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Bar Chart: Battery Drain Rate comparison */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Taxa de Drenagem (%/h) por Dispositivo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparação do impacto energético entre dispositivos.
            </p>

            <div className="h-48 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="drainRate" name="Consumo (%/h)" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Health Recommendation Box */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/90 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Diagnóstico Zero-Touch de Bateria</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dispositivos com perfil <strong>Sem Restrições</strong> mantém conectividade contínua, porém consomem ~1.2% a mais de bateria. Caso necessite poupar energia, altere a otimização no app do celular.
            </p>
          </div>
        </div>
      </div>
        </motion.div>
      )}
    </div>
  );
};
