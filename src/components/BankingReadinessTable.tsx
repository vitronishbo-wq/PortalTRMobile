import React, { useState } from 'react';
import { BankingCapabilityVerifier, BankCapabilityRecord, BankingReadinessState } from '../engine/BankingCapabilityVerifier';
import { Landmark, ShieldAlert, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export const BankingReadinessTable: React.FC = () => {
  const [banks, setBanks] = useState<BankCapabilityRecord[]>(
    BankingCapabilityVerifier.getAllBankStatuses()
  );
  const [filter, setFilter] = useState<'ALL' | BankingReadinessState>('ALL');

  const renderBadge = (val: boolean) => (
    val ? (
      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
        SIM
      </span>
    ) : (
      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 border border-slate-700 text-[9px] font-bold">
        NÃO
      </span>
    )
  );

  const renderStatus = (status: BankingReadinessState) => {
    if (status === 'READY') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
          <span>🟢</span>
          <span>READY</span>
        </span>
      );
    }
    if (status === 'PARTIAL') {
      return (
        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
          <span>🟡</span>
          <span>PARTIAL</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
        <span>🔴</span>
        <span>BLOCKED</span>
      </span>
    );
  };

  const filteredBanks = banks.filter((b) => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="bg-slate-900/95 p-4 rounded-2xl border border-slate-800 shadow-xl space-y-4 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/30">
            BANKING
          </span>
          <div>
            <h3 className="text-xs font-black text-slate-100 uppercase tracking-wide">
              Banking Readiness Table (EMIS / Multicaixa)
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Status de integração em Sandbox e Produção, autenticação MFA e capacidade transacional.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-1 text-[10px]">
          {(['ALL', 'READY', 'PARTIAL', 'BLOCKED'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded cursor-pointer transition-all ${
                filter === f
                  ? 'bg-slate-700 text-white font-bold border border-slate-600'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Dense Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
              <th className="py-2 px-2.5">Banco</th>
              <th className="py-2 px-2 text-center">Sandbox</th>
              <th className="py-2 px-2 text-center">API</th>
              <th className="py-2 px-2 text-center">MFA</th>
              <th className="py-2 px-2 text-center">Consulta</th>
              <th className="py-2 px-2 text-center">Transferência</th>
              <th className="py-2 px-2 text-center">Produção</th>
              <th className="py-2 px-2.5">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredBanks.map((b) => (
              <tr key={b.bankId} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-2 px-2.5 font-bold text-slate-200">
                  {b.bankName}
                  <span className="block text-[9px] text-slate-500 font-normal">{b.notes}</span>
                </td>
                <td className="py-2 px-2 text-center">{renderBadge(b.sandbox)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(b.apiConfigured)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(b.mfaEnforced)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(b.balanceQuery)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(b.transferOperational)}</td>
                <td className="py-2 px-2 text-center">{renderBadge(b.productionReady)}</td>
                <td className="py-2 px-2.5 whitespace-nowrap">{renderStatus(b.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
