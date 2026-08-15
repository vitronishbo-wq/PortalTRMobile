import React, { useState, useEffect } from 'react';
import { VirtualNumberAssignmentModal, VirtualNumberAssignmentData, VirtualNumberType } from './VirtualNumberAssignmentModal';
import { Phone, Plus, RefreshCw, Trash2, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

export interface DetailedVirtualNumber {
  id: string;
  number: string;
  carrier: string;
  type: VirtualNumberType;
  sms: boolean;
  voice: boolean;
  sip: boolean;
  ims: boolean;
  esim: boolean;
  status: 'ACTIVE' | 'PENDING' | 'RELEASED' | 'BLOCKED';
  expirationDate: string;
}

export const VirtualNumbersManager: React.FC = () => {
  const [numbers, setNumbers] = useState<DetailedVirtualNumber[]>(() => {
    try {
      const stored = localStorage.getItem('portal_assigned_virtual_numbers');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('portal_assigned_virtual_numbers', JSON.stringify(numbers));
    } catch (e) {
      // ignore
    }
  }, [numbers]);

  const handleAddNumber = (data: VirtualNumberAssignmentData) => {
    const newNum: DetailedVirtualNumber = {
      id: `vn_${Date.now()}`,
      number: data.number,
      carrier: data.carrier,
      type: data.type,
      sms: data.sms,
      voice: data.voice,
      sip: data.sip,
      ims: data.ims,
      esim: data.esim,
      status: data.isActive ? 'ACTIVE' : 'PENDING',
      expirationDate: data.expirationDate
    };
    setNumbers((prev) => [newNum, ...prev]);
  };

  const handleDelete = (id: string) => {
    setNumbers((prev) => prev.filter((n) => n.id !== id));
  };

  const renderBadge = (val: boolean) => (
    val ? (
      <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
        SIM
      </span>
    ) : (
      <span className="px-1 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700 text-[9px] font-bold">
        NÃO
      </span>
    )
  );

  return (
    <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
            NUMERATION
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
              Gestão de Números Virtuais (DID / Trunking)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Mapeamento de rotas de voz, SMS, troncos SIP e núcleos IMS para números locais e internacionais.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Atribuir Número</span>
        </button>
      </div>

      {/* Dense Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-2.5">Número</th>
              <th className="py-2 px-2">Operadora</th>
              <th className="py-2 px-2">Tipo</th>
              <th className="py-2 px-1.5 text-center">SMS</th>
              <th className="py-2 px-1.5 text-center">Voz</th>
              <th className="py-2 px-1.5 text-center">SIP</th>
              <th className="py-2 px-1.5 text-center">IMS</th>
              <th className="py-2 px-1.5 text-center">eSIM</th>
              <th className="py-2 px-2">Estado</th>
              <th className="py-2 px-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {numbers.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-500 text-xs">
                  Nenhum número virtual atribuído ainda. Clique em "Atribuir Número" para provisionar um DID ou tronco real.
                </td>
              </tr>
            ) : (
              numbers.map((n) => (
                <tr key={n.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2 px-2.5 font-bold text-cyan-300 whitespace-nowrap">
                    {n.number}
                    <span className="block text-[9px] text-slate-500 font-normal">Exp: {n.expirationDate}</span>
                  </td>
                  <td className="py-2 px-2 font-bold text-slate-200">{n.carrier}</td>
                  <td className="py-2 px-2">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                      {n.type}
                    </span>
                  </td>
                  <td className="py-2 px-1.5 text-center">{renderBadge(n.sms)}</td>
                  <td className="py-2 px-1.5 text-center">{renderBadge(n.voice)}</td>
                  <td className="py-2 px-1.5 text-center">{renderBadge(n.sip)}</td>
                  <td className="py-2 px-1.5 text-center">{renderBadge(n.ims)}</td>
                  <td className="py-2 px-1.5 text-center">{renderBadge(n.esim)}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      n.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded border border-rose-500/30 cursor-pointer"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <VirtualNumberAssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddNumber}
      />
    </div>
  );
};
