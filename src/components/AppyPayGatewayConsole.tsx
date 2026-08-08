import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  QrCode,
  RefreshCw,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  RotateCcw,
  Globe,
  ShieldCheck,
  Zap,
  Terminal,
  FileText,
  UserCheck,
  Check,
  ArrowRight,
  Sparkles,
  Smartphone,
  Copy,
  Receipt
} from 'lucide-react';
import {
  PaymentRegistry,
  AppyPayProvider,
  ChargeResponse,
  WebhookLog,
  ReconciliationMatch
} from '../services/paymentEngine';

export const AppyPayGatewayConsole: React.FC = () => {
  const provider = (PaymentRegistry.get('appypay') as AppyPayProvider) || new AppyPayProvider();

  // Active Sub-tab
  const [activeTab, setActiveTab] = useState<'transactions' | 'references' | 'reconciliation' | 'webhooks' | 'billing'>('transactions');

  // Provider Data States
  const [charges, setCharges] = useState<ChargeResponse[]>(provider.getAllCharges());
  const [webhooks, setWebhooks] = useState<WebhookLog[]>(provider.getWebhooks());
  const [reconciliations, setReconciliations] = useState<ReconciliationMatch[]>(provider.getReconciliations());
  const [mode, setMode] = useState<'sandbox' | 'live'>(provider.mode);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'succeeded' | 'pending' | 'refunded'>('ALL');

  // New Reference Generator Form State
  const [showNewChargeModal, setShowNewChargeModal] = useState(false);
  const [newAmount, setNewAmount] = useState('25000');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newMethod, setNewMethod] = useState<'multicaixa_express' | 'reference' | 'qr_code'>('multicaixa_express');
  const [newDesc, setNewDesc] = useState('');
  const [isCreatingCharge, setIsCreatingCharge] = useState(false);

  // Refund Action Modal State
  const [selectedChargeForRefund, setSelectedChargeForRefund] = useState<ChargeResponse | null>(null);
  const [refundReason, setRefundReason] = useState('Solicitação do cliente');
  const [isRefunding, setIsRefunding] = useState(false);

  // Copy Feedback
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const refreshData = () => {
    setCharges(provider.getAllCharges());
    setWebhooks(provider.getWebhooks());
    setReconciliations(provider.getReconciliations());
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleToggleMode = () => {
    const nextMode = mode === 'sandbox' ? 'live' : 'sandbox';
    provider.mode = nextMode;
    setMode(nextMode);
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAmount || isNaN(Number(newAmount))) return;

    setIsCreatingCharge(true);
    await provider.charge({
      amount: Number(newAmount),
      currency: 'AOA',
      customerName: newCustomerName || 'Cliente Geral',
      customerPhone: newCustomerPhone || '+244 923 000 000',
      paymentMethod: newMethod,
      description: newDesc || 'Cobrança Criada via Console AppyPay'
    });

    setIsCreatingCharge(false);
    setShowNewChargeModal(false);
    setNewAmount('25000');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewDesc('');
    refreshData();
  };

  const handleConfirmManualPayment = async (chargeId: string) => {
    await provider.confirmPaymentManually(chargeId);
    refreshData();
  };

  const handleExecuteRefund = async () => {
    if (!selectedChargeForRefund) return;
    setIsRefunding(true);

    await provider.refund(
      selectedChargeForRefund.chargeId,
      selectedChargeForRefund.amount,
      refundReason
    );

    setIsRefunding(false);
    setSelectedChargeForRefund(null);
    setRefundReason('Solicitação do cliente');
    refreshData();
  };

  // Metrics Calculation
  const totalVolume = charges
    .filter((c) => c.status === 'succeeded')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingCount = charges.filter((c) => c.status === 'pending').length;
  const succeededCount = charges.filter((c) => c.status === 'succeeded').length;

  const filteredCharges = charges.filter((c) => {
    const matchesSearch =
      c.chargeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.referenceCode && c.referenceCode.includes(searchTerm)) ||
      (c.customerName && c.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* HEADER BANNER & METRICS */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <span className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <CreditCard className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-100">APPYPAY PAYMENT GATEWAY (ANGOLA AOA)</h2>
                <button
                  onClick={handleToggleMode}
                  className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md border transition-all cursor-pointer ${
                    mode === 'sandbox'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {mode === 'sandbox' ? '● SANDBOX MODE' : '● LIVE PRODUCTION'}
                </button>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Multicaixa Express • Referências ProxyPay • Reconciliação SMS • Webhooks REST API
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
              title="Atualizar Dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowNewChargeModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Gerar Referência / Cobrança</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Volume Total Aprovado</span>
            <span className="text-base font-black text-emerald-400">
              {totalVolume.toLocaleString('pt-BR')} Kz
            </span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Transações Aprovadas</span>
            <span className="text-base font-black text-slate-100">{succeededCount} Aprovadas</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Pendentes no Express</span>
            <span className="text-base font-black text-amber-400">{pendingCount} Pendente(s)</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Taxa de Reconciliação</span>
            <span className="text-base font-black text-sky-400">100% Automático</span>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'transactions'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Transações ({charges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('references')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'references'
              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Multicaixa & Referências</span>
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'reconciliation'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Reconciliação SMS ({reconciliations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'webhooks'
              ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Webhooks & REST Logs ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'billing'
              ? 'bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Billing & Planos AOA</span>
        </button>
      </div>

      {/* TAB 1: TRANSAÇÕES (TRANSACTIONS) */}
      {activeTab === 'transactions' && (
        <div className="space-y-4 font-mono text-xs">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar ref, ID, cliente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-slate-400 text-[11px]">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
              >
                <option value="ALL">Todos os Estados</option>
                <option value="succeeded">Aprovadas (Succeeded)</option>
                <option value="pending">Pendentes (Pending)</option>
                <option value="refunded">Reembolsadas (Refunded)</option>
              </select>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="p-3">ID Cobrança / Ref</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Método</th>
                    <th className="p-3">Valor (AOA)</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCharges.map((chg) => (
                    <tr key={chg.chargeId} className="hover:bg-slate-950/40 transition-all">
                      <td className="p-3">
                        <div className="font-bold text-slate-200">{chg.chargeId}</div>
                        {chg.referenceCode && (
                          <div className="text-[10px] text-indigo-400 font-bold flex items-center space-x-1">
                            <span>Ref: {chg.referenceCode}</span>
                            <button
                              onClick={() => handleCopy(chg.referenceCode!)}
                              className="hover:text-white"
                              title="Copiar Referência"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-200">{chg.customerName || 'N/A'}</div>
                        <div className="text-[10px] text-slate-400">{chg.customerPhone || chg.customerEmail || '—'}</div>
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800 text-[10px] uppercase font-bold text-slate-300">
                          {chg.paymentMethod === 'multicaixa_express' && '📱 MCX Express'}
                          {chg.paymentMethod === 'reference' && '🔢 Referência'}
                          {chg.paymentMethod === 'qr_code' && '📷 QR Code'}
                          {chg.paymentMethod === 'credit_card' && '💳 Cartão'}
                        </span>
                      </td>

                      <td className="p-3 font-extrabold text-emerald-400">
                        {chg.amount.toLocaleString('pt-BR')} Kz
                      </td>

                      <td className="p-3">
                        {chg.status === 'succeeded' && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30 flex items-center space-x-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>APROVADA</span>
                          </span>
                        )}
                        {chg.status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/30 flex items-center space-x-1 w-fit animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>PENDENTE</span>
                          </span>
                        )}
                        {chg.status === 'refunded' && (
                          <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 text-[10px] font-bold rounded border border-rose-500/30 flex items-center space-x-1 w-fit">
                            <RotateCcw className="w-3 h-3" />
                            <span>REEMBOLSADA</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-[10px] text-slate-400">
                        {new Date(chg.createdAt).toLocaleDateString('pt-BR')} {new Date(chg.createdAt).toLocaleTimeString('pt-BR')}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {chg.status === 'pending' && (
                            <button
                              onClick={() => handleConfirmManualPayment(chg.chargeId)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[10px] transition-all cursor-pointer"
                              title="Simular Pagamento Aprovado"
                            >
                              Confirmar
                            </button>
                          )}

                          {chg.status === 'succeeded' && (
                            <button
                              onClick={() => setSelectedChargeForRefund(chg)}
                              className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold rounded text-[10px] transition-all cursor-pointer"
                            >
                              Reembolsar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCharges.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500 italic">
                  Nenhuma transação encontrada para os filtros atuais.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MULTICAIXA EXPRESS & REFERÊNCIAS */}
      {activeTab === 'references' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Gerador e Monitor de Referências Multicaixa Express (Entidade 00124)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/30">
                ProxyPay & EMIS Compliant
              </span>
            </div>

            <p className="text-slate-300 text-xs">
              As referências Multicaixa geradas via AppyPay funcionam diretamente no Multicaixa Express, Caixas Automáticos (ATM) e Home Banking de todos os bancos angolanos (BAI, BFA, BIC, Atlântico, Keve, Standard Bank).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Active Reference Display Card */}
              {charges.filter((c) => c.referenceCode).slice(0, 2).map((refChg) => (
                <div
                  key={refChg.chargeId}
                  className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-slate-200 text-xs">GUIÃO DE PAGAMENTO MULTICAIXA</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                      EMIS ATIVO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 block uppercase">Entidade</span>
                      <span className="text-base font-black text-amber-400">{refChg.entityCode || '00124'}</span>
                    </div>

                    <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 block uppercase">Referência</span>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-black text-indigo-300">{refChg.referenceCode}</span>
                        <button
                          onClick={() => handleCopy(refChg.referenceCode!)}
                          className="text-slate-400 hover:text-white"
                          title="Copiar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Montante AOA:</span>
                    <span className="font-extrabold text-emerald-400 text-sm">
                      {refChg.amount.toLocaleString('pt-BR')} Kz
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Validade: 24 Horas</span>
                    <span>Cliente: {refChg.customerName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECONCILIAÇÃO AUTOMÁTICA (SMS INTERCEPTOR MATCHING) */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Reconciliação Automática: Agente Android SMS + AppyPay Gateway
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-500/30">
                Zero Human Intervention
              </span>
            </div>

            <p className="text-slate-300 text-xs">
              Quando o Agente Android capta o SMS bancário (BAI Directo, BFA Net, Keve), a IA faz a reconciliação imediata com a cobrança pendente na AppyPay em menos de 5ms.
            </p>

            <div className="space-y-3 pt-1">
              {reconciliations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-slate-200">Reconciliado: {rec.chargeId}</span>
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded">
                        Banco: {rec.bankName}
                      </span>
                    </div>

                    <span className="text-emerald-400 font-bold">
                      Confiança: {Math.round(rec.confidence * 100)}%
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                    <span>Referência Multicaixa: <strong className="text-indigo-300">{rec.referenceCode}</strong></span>
                    <span>Valor Cruzado: <strong className="text-emerald-400">{rec.amountAoa.toLocaleString('pt-BR')} Kz</strong></span>
                    <span>SMS Event ID: {rec.smsId}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WEBHOOKS & REST LOGS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Webhook Event Dispatcher & Logs de Notificação REST
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-sky-500/20 text-sky-300 rounded-lg text-[10px] font-bold border border-sky-500/30">
                HMAC-SHA256 Signed
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">ENDPOINT CONFIGURADO NO PAINEL APPYPAY</span>
                <span className="text-indigo-300 font-bold">https://portal.minhaempresa.co.ao/api/webhooks/appypay</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded">
                  HTTP 200 OK
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-300 block">Histórico Recente de Disparos Webhook:</span>
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-sky-400">{wh.event}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold rounded">
                      {wh.status} (Code {wh.responseCode})
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 font-mono">
                    {JSON.stringify(wh.payload)}
                  </p>

                  <div className="text-[9px] text-slate-500 text-right">
                    {new Date(wh.timestamp).toLocaleTimeString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: BILLING & PLANOS AOA */}
      {activeTab === 'billing' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Planos de Faturação e Subscrição PortalTRMobile (AOA)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/30">
                Faturação Automatizada
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase block">Plano Starter</span>
                <span className="text-xl font-black text-slate-100">45.000 Kz <span className="text-xs font-normal text-slate-500">/mês</span></span>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>✓ 1 Agente Android Native</li>
                  <li>✓ Interceção SMS Multicaixa</li>
                  <li>✓ Integração AppyPay Gateway</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/50 space-y-3 relative overflow-hidden">
                <span className="px-2 py-0.5 bg-purple-500 text-white text-[9px] font-bold rounded absolute top-2 right-2">MAIS POPULAR</span>
                <span className="text-xs font-bold text-purple-400 uppercase block">Plano Business</span>
                <span className="text-xl font-black text-slate-100">120.000 Kz <span className="text-xs font-normal text-slate-500">/mês</span></span>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>✓ Até 5 Agentes Android (Mesh)</li>
                  <li>✓ Classificação IA Gemini 2.5</li>
                  <li>✓ Webhooks & Reconciliação Tempo Real</li>
                  <li>✓ Suporte Prioritário Founder Console</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase block">Plano Enterprise</span>
                <span className="text-xl font-black text-amber-400">Custom Kz</span>
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  <li>✓ Agentes Android Ilimitados</li>
                  <li>✓ Servidor Privado Cloud SQL / Firebase</li>
                  <li>✓ SLA de 99.9% Garantido</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW CHARGE MODAL */}
      {showNewChargeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCharge}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 font-mono text-xs text-slate-100 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nova Cobrança AppyPay</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewChargeModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Montante (AOA Kwanza)</label>
              <input
                type="number"
                required
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Método de Pagamento</label>
              <select
                value={newMethod}
                onChange={(e) => setNewMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="multicaixa_express">Multicaixa Express (Direct Push)</option>
                <option value="reference">Referência Multicaixa (Entidade 00124)</option>
                <option value="qr_code">QR Code EMIS Pay</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="SILA JANEIRO"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Telemóvel</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="+244 923 000 000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Descrição</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Licença / Serviço de Teste"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewChargeModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isCreatingCharge}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-emerald-600/20"
              >
                {isCreatingCharge ? 'Gerando...' : 'Criar Cobrança'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* REFUND MODAL */}
      {selectedChargeForRefund && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-6 max-w-md w-full space-y-4 font-mono text-xs text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center space-x-2">
                <RotateCcw className="w-4 h-4" />
                <span>Confirmar Reembolso (Refund)</span>
              </h3>
              <button
                onClick={() => setSelectedChargeForRefund(null)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-300 text-xs">
              Você está prestes a reembolsar o valor de{' '}
              <strong className="text-emerald-400">{selectedChargeForRefund.amount.toLocaleString('pt-BR')} Kz</strong>{' '}
              para o cliente <strong>{selectedChargeForRefund.customerName}</strong>.
            </p>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Motivo do Reembolso</label>
              <input
                type="text"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedChargeForRefund(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteRefund}
                disabled={isRefunding}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-rose-600/20"
              >
                {isRefunding ? 'Processando...' : 'Confirmar Reembolso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
