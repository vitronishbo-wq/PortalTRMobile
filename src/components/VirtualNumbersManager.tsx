import { useState, useEffect, useCallback } from 'react';
import { VirtualNumber } from '../types/cpaas';
import { listVirtualNumbers, buyNumber, assignNumberToNode, deleteNumber, releaseNumber } from '../services/virtualNumberService';
import { Phone, Plus, Trash2, Smartphone, Globe, RefreshCw, CheckCircle2 } from 'lucide-react';

interface VirtualNumbersManagerProps {
  workspaceId?: string;
}

export function VirtualNumbersManager({ workspaceId = 'ws-vitronis-default' }: VirtualNumbersManagerProps) {
  const [numbers, setNumbers] = useState<VirtualNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [areaCode, setAreaCode] = useState('244');
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [targetNodeId, setTargetNodeId] = useState('node-angola-luanda-01');

  const loadNumbers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listVirtualNumbers(workspaceId);
      setNumbers(data);
    } catch (err) {
      console.error('[VirtualNumbersManager] Erro ao carregar números:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadNumbers();
  }, [loadNumbers]);

  const handleBuy = async () => {
    try {
      await buyNumber(workspaceId, areaCode);
      loadNumbers();
    } catch (err) {
      console.error('[VirtualNumbersManager] Erro ao comprar número:', err);
    }
  };

  const handleAssign = async (numberId: string) => {
    if (!targetNodeId.trim()) return;
    try {
      await assignNumberToNode(numberId, targetNodeId.trim());
      setAssigningId(null);
      loadNumbers();
    } catch (err) {
      console.error('[VirtualNumbersManager] Erro ao atribuir número:', err);
    }
  };

  const handleRelease = async (numberId: string) => {
    try {
      await releaseNumber(numberId);
      loadNumbers();
    } catch (err) {
      console.error('[VirtualNumbersManager] Erro ao libertar número:', err);
    }
  };

  const handleDelete = async (numberId: string) => {
    try {
      await deleteNumber(numberId);
      loadNumbers();
    } catch (err) {
      console.error('[VirtualNumbersManager] Erro ao eliminar número:', err);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 font-sans shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Números Virtuais & Trunking SMS/Voz</h3>
            <p className="text-[11px] text-slate-400">Atribuição de números virtuais E.164 aos nós do ecossistema</p>
          </div>
        </div>
        <button
          onClick={loadNumbers}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl border border-slate-700/60 hover:bg-slate-700 transition-all cursor-pointer"
          title="Recarregar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Formulário de Aprovisionamento */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 flex-1">
          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-400 font-mono">+</span>
          <input
            type="text"
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value)}
            placeholder="Indicativo (ex: 244 para Angola, 351 para Portugal)"
            className="bg-transparent text-xs text-white font-mono w-full outline-none placeholder:text-slate-600"
          />
        </div>
        <button
          onClick={handleBuy}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Adquirir Novo Número Virtual</span>
        </button>
      </div>

      {/* Lista de Números */}
      {numbers.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
          <Phone className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-slate-400">Nenhum número virtual atribuído neste workspace.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {numbers.map((num) => (
            <div
              key={num.id}
              className="p-3 bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-xl transition-all"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-extrabold text-white tracking-tight">{num.number}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                      num.status === 'assigned'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {num.status.toUpperCase()}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      PROVEDOR: {num.provider.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center space-x-1 text-slate-300">
                      <Smartphone className="w-3 h-3 text-amber-400" />
                      <span>Atribuído a: {num.assignedTo || 'Nenhum nó associado'}</span>
                    </span>
                    <span>•</span>
                    <span>Custo: ${(num.monthlyCost / 100).toFixed(2)}/mês</span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Capacidade: {Object.keys(num.capabilities).filter(c => (num.capabilities as any)[c]).join(', ')}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  {assigningId === num.id ? (
                    <div className="flex items-center space-x-1.5 bg-slate-900 p-1 rounded-lg border border-slate-700">
                      <input
                        type="text"
                        value={targetNodeId}
                        onChange={(e) => setTargetNodeId(e.target.value)}
                        placeholder="ID do Nó"
                        className="bg-slate-950 text-[11px] text-white p-1 rounded font-mono w-32 border border-slate-800 outline-none"
                      />
                      <button
                        onClick={() => handleAssign(num.id)}
                        className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold rounded"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => setAssigningId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAssigningId(num.id)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      Associar a Nó
                    </button>
                  )}

                  {num.assignedTo && (
                    <button
                      onClick={() => handleRelease(num.id)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all cursor-pointer"
                    >
                      Libertar
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(num.id)}
                    className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all cursor-pointer"
                    title="Eliminar Número"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
