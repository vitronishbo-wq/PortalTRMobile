import { useState, useEffect, useCallback } from 'react';
import { ApiKey } from '../types/cpaas';
import { generateApiKey, listApiKeys, deleteApiKey, revokeApiKey } from '../services/apiKeyService';
import { Key, Plus, Trash2, Copy, Check, Shield, Activity, RefreshCw } from 'lucide-react';

interface APIKeysManagerProps {
  workspaceId?: string;
}

export function APIKeysManager({ workspaceId = 'ws-vitronis-default' }: APIKeysManagerProps) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listApiKeys(workspaceId);
      setKeys(data);
    } catch (err) {
      console.error('[APIKeysManager] Erro ao carregar chaves:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const handleGenerate = async () => {
    if (!newKeyName.trim()) return;
    try {
      await generateApiKey(workspaceId, newKeyName.trim());
      setNewKeyName('');
      loadKeys();
    } catch (err) {
      console.error('[APIKeysManager] Erro ao gerar chave:', err);
    }
  };

  const handleRevoke = async (key: string) => {
    try {
      await revokeApiKey(key);
      loadKeys();
    } catch (err) {
      console.error('[APIKeysManager] Erro ao revogar chave:', err);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await deleteApiKey(key);
      loadKeys();
    } catch (err) {
      console.error('[APIKeysManager] Erro ao eliminar chave:', err);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard?.writeText(key).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 font-sans shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">API Keys & Autenticação CPaaS</h3>
            <p className="text-[11px] text-slate-400">Gestão de credenciais de acesso para clientes empresariais</p>
          </div>
        </div>
        <button
          onClick={loadKeys}
          disabled={loading}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/60 rounded-xl border border-slate-700/60 hover:bg-slate-700 transition-all cursor-pointer"
          title="Recarregar"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Formulário de Criação */}
      <div className="flex flex-col sm:flex-row gap-2 mb-5">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Nome da aplicação/cliente (ex: Sistema ERP, CRM Integrado)"
          className="bg-slate-950/80 border border-slate-800 focus:border-amber-500/50 text-xs text-white p-2.5 rounded-xl flex-1 outline-none transition-all placeholder:text-slate-600 font-mono"
        />
        <button
          onClick={handleGenerate}
          disabled={!newKeyName.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Gerar Nova API Key</span>
        </button>
      </div>

      {/* Lista de Chaves */}
      {keys.length === 0 ? (
        <div className="text-center py-8 bg-slate-950/40 rounded-xl border border-dashed border-slate-800/80">
          <Shield className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-slate-400">Nenhuma API Key ativa gerada para este workspace.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {keys.map((k) => (
            <div
              key={k.key}
              className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl border transition-all gap-3 ${
                k.isActive
                  ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  : 'bg-red-950/10 border-red-900/30 opacity-60'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-xs text-amber-300">{k.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono border ${
                    k.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {k.isActive ? 'ATIVA' : 'REVOGADA'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[11px] text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800 select-all truncate max-w-xs sm:max-w-md">
                    {k.key}
                  </span>
                  <button
                    onClick={() => copyToClipboard(k.key)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-all cursor-pointer shrink-0"
                    title="Copiar Chave"
                  >
                    {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-500 font-mono">
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3 h-3 text-slate-400" />
                    <span>Rate Limit: {k.rateLimit?.limit || 60} req/min</span>
                  </span>
                  <span>•</span>
                  <span>Criada: {new Date(k.createdAt).toLocaleDateString()}</span>
                  {k.lastUsed && (
                    <>
                      <span>•</span>
                      <span>Último Uso: {new Date(k.lastUsed).toLocaleTimeString()}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                {k.isActive && (
                  <button
                    onClick={() => handleRevoke(k.key)}
                    className="px-2.5 py-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-all cursor-pointer"
                  >
                    Revogar
                  </button>
                )}
                <button
                  onClick={() => handleDelete(k.key)}
                  className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-all cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
