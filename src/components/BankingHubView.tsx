import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  Wallet,
  Receipt,
  Plus,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Send,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { BankingHubEngine, BankAccount, BankTransaction, DigitalWallet, PaymentMethod } from '../engine/bankingHubEngine';

export const BankingHubView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'bancos' | 'carteiras' | 'transferencias' | 'pagamentos' | 'cartoes' | 'qr_code'>('bancos');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [wallets, setWallets] = useState<DigitalWallet[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Transfer form state
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('acc-bfa-01');
  const [reference, setReference] = useState<string>('');

  useEffect(() => {
    loadBankingData();
  }, []);

  const loadBankingData = async () => {
    setLoading(true);
    try {
      const accs = await BankingHubEngine.getAccounts('usr-dev-root-001');
      setAccounts(accs);
      if (accs.length > 0) {
        const txs = await BankingHubEngine.getTransactions(accs[0].id);
        setTransactions(txs);
      }
      const wals = await BankingHubEngine.getWallets();
      setWallets(wals);
      const pms = await BankingHubEngine.getPaymentMethods();
      setPaymentMethods(pms);
    } catch (e) {
      console.warn('[BankingHubView] Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransfer = () => {
    if (!recipient || !amount) return;
    const newTx: BankTransaction = {
      id: `tx-${Date.now()}`,
      accountId: selectedAccount,
      type: 'transfer',
      amount: parseFloat(amount),
      currency: 'AOA',
      recipientName: recipient,
      recipientIbanOrPhone: recipient,
      referenceNumber: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'completed',
      timestamp: Date.now()
    };
    setTransactions(prev => [newTx, ...prev]);
    setAmount('');
    setRecipient('');
    setReference('');
    alert('Transferência executada com sucesso!');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 font-sans shadow-2xl space-y-4">
      {/* HEADER DAS BANCAS & CARTEIRAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center space-x-2">
              <span>BANKING HUB & CARTEIRAS DIGITAIS 4.0</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono">
                AO06 MULTICAIXA / SWIFT
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Gestão financeira consolidada, pagamentos por referência, QR Code e carteiras mobile</p>
          </div>
        </div>

        <button
          onClick={loadBankingData}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>ATUALIZAR</span>
        </button>
      </div>

      {/* SUB-TABS DENSAS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        {[
          { id: 'bancos', label: 'Contas Bancárias', icon: Landmark, count: accounts.length },
          { id: 'carteiras', label: 'Carteiras Digitais', icon: Wallet, count: wallets.length },
          { id: 'transferencias', label: 'Transferências & Envios', icon: ArrowRightLeft },
          { id: 'pagamentos', label: 'Pagamentos / Referências', icon: Receipt },
          { id: 'cartoes', label: 'Cartões Virtuais', icon: CreditCard, count: paymentMethods.length },
          { id: 'qr_code', label: 'QR Code Express', icon: QrCode }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-slate-950 shadow-md shadow-emerald-600/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  isActive ? 'bg-slate-950 text-emerald-400' : 'bg-slate-900 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. CONTAS BANCÁRIAS */}
      {activeSubTab === 'bancos' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-xs font-black text-white block">{acc.bankName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Conta: {acc.accountNumber}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase">
                    {acc.accountType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Saldo Disponível</span>
                  <span className="text-lg font-mono font-black text-emerald-400">
                    {acc.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {acc.currency}
                  </span>
                </div>
                <div className="pt-1 text-[10px] text-slate-400 font-mono truncate border-t border-slate-900">
                  <strong className="text-slate-500">IBAN:</strong> {acc.iban}
                </div>
              </div>
            ))}
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 font-bold text-xs text-slate-300">
              HISTÓRICO DE TRANSAÇÕES RECENTES
            </div>
            <table className="w-full text-left text-[11px] font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">Data/Hora</th>
                  <th className="p-2.5">Tipo</th>
                  <th className="p-2.5">Destinatário</th>
                  <th className="p-2.5">Referência</th>
                  <th className="p-2.5 text-right">Montante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50">
                    <td className="p-2.5 text-slate-400">{new Date(tx.timestamp).toLocaleString()}</td>
                    <td className="p-2.5 font-bold uppercase text-indigo-400">{tx.type}</td>
                    <td className="p-2.5 text-slate-200">{tx.recipientName}</td>
                    <td className="p-2.5 text-slate-400">{tx.referenceNumber || 'N/A'}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">
                      -{tx.amount.toLocaleString('pt-AO')} {tx.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CARTEIRAS DIGITAIS */}
      {activeSubTab === 'carteiras' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wallets.map((w) => (
            <div key={w.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">{w.walletName}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Nº {w.phoneNumber}</span>
                <span className="text-base font-mono font-black text-emerald-400 block">
                  {w.balance.toLocaleString('pt-AO')} {w.currency}
                </span>
              </div>
              <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                {w.provider}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. TRANSFERÊNCIAS */}
      {activeSubTab === 'transferencias' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 max-w-xl">
          <h3 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>EXECUTIVE EXPRESS TRANSFER — AO06 / MCX</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Conta de Origem</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} — Saldo: {a.balance.toLocaleString()} {a.currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">IBAN / Telefone do Destinatário</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="AO06.0006.0000... ou +244 923..."
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Montante (AOA)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1">Referência / Descrição</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Pagamento de Serviço"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteTransfer}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              EXECUTAR TRANSFERÊNCIA INSTANTÂNEA
            </button>
          </div>
        </div>
      )}

      {/* 4. PAGAMENTOS / REFERÊNCIAS */}
      {activeSubTab === 'pagamentos' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 max-w-xl">
          <h3 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>PAGAMENTO POR REFERÊNCIA MULTICAIXA</span>
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <input type="text" placeholder="Entidade (5 dígitos)" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono" />
            <input type="text" placeholder="Referência (9 dígitos)" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono" />
            <input type="number" placeholder="Montante (AOA)" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono" />
          </div>
          <button
            onClick={() => alert('Pagamento por referência processado com sucesso!')}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            CONFIRMAR PAGAMENTO DE SERVIÇO
          </button>
        </div>
      )}

      {/* 5. CARTÕES VIRTUAIS */}
      {activeSubTab === 'cartoes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="p-4 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{pm.title}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                  {pm.brand}
                </span>
              </div>
              <div className="text-sm font-mono tracking-widest text-slate-300 py-1">
                •••• •••• •••• {pm.cardLast4}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>EXP: {pm.cardExpiry}</span>
                <span className="text-emerald-400 font-bold">● ATIVO NO PWA</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. QR CODE EXPRESS */}
      {activeSubTab === 'qr_code' && (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3 max-w-md mx-auto">
          <QrCode className="w-20 h-20 text-emerald-400 mx-auto" />
          <h3 className="text-xs font-black text-white uppercase">MULTICAIXA EXPRESS QR SCAN & PAY</h3>
          <p className="text-[11px] text-slate-400">Aponte a câmara do seu nó ou escaneie o código para pagar instantaneamente</p>
          <button
            onClick={() => alert('Câmara ativada para leitura de QR Code Multicaixa Express!')}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            ABRIR SCANNER QR CODE
          </button>
        </div>
      )}
    </div>
  );
};
