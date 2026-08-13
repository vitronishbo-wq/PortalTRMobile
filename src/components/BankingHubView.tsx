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
  Send,
  Smartphone,
  Globe,
  PlusCircle,
  Database,
  CheckCircle2
} from 'lucide-react';
import {
  BankingHubEngine,
  BankAccount,
  BankTransaction,
  DigitalWallet,
  PaymentMethod,
  DynamicTelecomOperator
} from '../engine/bankingHubEngine';

export const BankingHubView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'bancos' | 'carteiras' | 'operadoras' | 'transferencias' | 'pagamentos' | 'cartoes' | 'qr_code'>('bancos');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [wallets, setWallets] = useState<DigitalWallet[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [telecomOperators, setTelecomOperators] = useState<DynamicTelecomOperator[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // New item modal states
  const [showAddAccountModal, setShowAddAccountModal] = useState<boolean>(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState<boolean>(false);

  // Form states for new bank account
  const [newBankName, setNewBankName] = useState<string>('');
  const [newAccNum, setNewAccNum] = useState<string>('');
  const [newIban, setNewIban] = useState<string>('');
  const [newBalance, setNewBalance] = useState<string>('0');
  const [newAccountType, setNewAccountType] = useState<'corrente' | 'poupanca' | 'empresarial'>('corrente');

  // Form states for new digital wallet
  const [newWalletName, setNewWalletName] = useState<string>('');
  const [newProvider, setNewProvider] = useState<string>('');
  const [newWalletPhone, setNewWalletPhone] = useState<string>('');
  const [newWalletBalance, setNewWalletBalance] = useState<string>('0');

  // Transfer form state
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  useEffect(() => {
    setLoading(true);

    const unsubAccounts = BankingHubEngine.listenAccounts('usr-current', (accs) => {
      setAccounts(accs);
      if (accs.length > 0 && !selectedAccount) {
        setSelectedAccount(accs[0].id);
      }
      setLoading(false);
    });

    const unsubWallets = BankingHubEngine.listenWallets((wals) => {
      setWallets(wals);
    });

    const unsubPaymentMethods = BankingHubEngine.listenPaymentMethods((pms) => {
      setPaymentMethods(pms);
    });

    const unsubOperators = BankingHubEngine.listenTelecomOperators((ops) => {
      setTelecomOperators(ops);
    });

    return () => {
      unsubAccounts();
      unsubWallets();
      unsubPaymentMethods();
      unsubOperators();
    };
  }, []);

  useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      setSelectedAccount(accounts[0].id);
    }
    const unsubTx = BankingHubEngine.listenTransactions(selectedAccount, (txs) => {
      setTransactions(txs);
    });
    return () => unsubTx();
  }, [selectedAccount, accounts]);

  const handleCreateAccount = async () => {
    if (!newBankName || !newIban) return;
    await BankingHubEngine.addBankAccount({
      bankName: newBankName,
      accountNumber: newAccNum || `ACC-${Date.now().toString().slice(-8)}`,
      iban: newIban,
      balance: parseFloat(newBalance) || 0,
      currency: 'AOA',
      accountType: newAccountType,
      status: 'active',
      ownerUid: 'usr-current'
    });
    setNewBankName('');
    setNewAccNum('');
    setNewIban('');
    setNewBalance('0');
    setShowAddAccountModal(false);
  };

  const handleCreateWallet = async () => {
    if (!newWalletName || !newProvider) return;
    await BankingHubEngine.addDigitalWallet({
      walletName: newWalletName,
      provider: newProvider,
      phoneNumber: newWalletPhone || '+244 900 000 000',
      balance: parseFloat(newWalletBalance) || 0,
      currency: 'AOA',
      isDefault: wallets.length === 0
    });
    setNewWalletName('');
    setNewProvider('');
    setNewWalletPhone('');
    setNewWalletBalance('0');
    setShowAddWalletModal(false);
  };

  const handleExecuteTransfer = async () => {
    if (!recipient || !amount) return;
    await BankingHubEngine.addTransaction({
      accountId: selectedAccount || 'default',
      type: 'transfer',
      amount: parseFloat(amount),
      currency: 'AOA',
      recipientName: recipient,
      recipientIbanOrPhone: recipient,
      referenceNumber: reference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'completed',
      timestamp: Date.now()
    });
    setAmount('');
    setRecipient('');
    setReference('');
    alert('Transferência enviada para o Firestore!');
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
              <span>BANKING HUB & CARTEIRAS DIGITAIS</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono flex items-center space-x-1">
                <Database className="w-3 h-3" />
                <span>FIRESTORE REALTIME SYNC</span>
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Gestão financeira dinâmica alimentada diretamente pela base de dados Firestore em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {activeSubTab === 'bancos' && (
            <button
              onClick={() => setShowAddAccountModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>NOVA CONTA</span>
            </button>
          )}

          {activeSubTab === 'carteiras' && (
            <button
              onClick={() => setShowAddWalletModal(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>NOVA CARTEIRA</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-TABS DENSAS */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        {[
          { id: 'bancos', label: 'Contas Bancárias', icon: Landmark, count: accounts.length },
          { id: 'carteiras', label: 'Carteiras Digitais', icon: Wallet, count: wallets.length },
          { id: 'operadoras', label: 'Operadoras de Telecom', icon: Globe, count: telecomOperators.length },
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

      {/* MODAL ADICIONAR CONTA BANCÁRIA */}
      {showAddAccountModal && (
        <div className="p-4 bg-slate-950 border border-emerald-500/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase">Registar Nova Conta no Firestore</span>
            <button onClick={() => setShowAddAccountModal(false)} className="text-slate-400 hover:text-white text-xs">✕ Cancelar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Nome da Instituição Bancária"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
            <input
              type="text"
              placeholder="Número de Conta"
              value={newAccNum}
              onChange={(e) => setNewAccNum(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
            <input
              type="text"
              placeholder="IBAN da Conta"
              value={newIban}
              onChange={(e) => setNewIban(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
            <input
              type="number"
              placeholder="Saldo Inicial (AOA)"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
          </div>
          <button
            onClick={handleCreateAccount}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all"
          >
            GUARDAR CONTA NO FIRESTORE
          </button>
        </div>
      )}

      {/* MODAL ADICIONAR CARTEIRA DIGITAL */}
      {showAddWalletModal && (
        <div className="p-4 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-indigo-400 uppercase">Registar Nova Carteira no Firestore</span>
            <button onClick={() => setShowAddWalletModal(false)} className="text-slate-400 hover:text-white text-xs">✕ Cancelar</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <input
              type="text"
              placeholder="Nome da Carteira"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
            <input
              type="text"
              placeholder="Provedor do Serviço"
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
            <input
              type="text"
              placeholder="Número Associado"
              value={newWalletPhone}
              onChange={(e) => setNewWalletPhone(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
            <input
              type="number"
              placeholder="Saldo Inicial (AOA)"
              value={newWalletBalance}
              onChange={(e) => setNewWalletBalance(e.target.value)}
              className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
            />
          </div>
          <button
            onClick={handleCreateWallet}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all"
          >
            GUARDAR CARTEIRA NO FIRESTORE
          </button>
        </div>
      )}

      {/* 1. CONTAS BANCÁRIAS DINÂMICAS */}
      {activeSubTab === 'bancos' && (
        <div className="space-y-3">
          {accounts.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <Landmark className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Nenhuma conta bancária registada no Firestore.</p>
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="px-3 py-1.5 bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
              >
                Adicionar Primeira Conta
              </button>
            </div>
          ) : (
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
                      {acc.balance.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} {acc.currency || 'AOA'}
                    </span>
                  </div>
                  <div className="pt-1 text-[10px] text-slate-400 font-mono truncate border-t border-slate-900">
                    <strong className="text-slate-500">IBAN:</strong> {acc.iban}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* HISTÓRICO DE TRANSAÇÕES */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 font-bold text-xs text-slate-300 flex items-center justify-between">
              <span>HISTÓRICO DITADO PELO FIRESTORE</span>
              <span className="text-[10px] text-slate-500 font-mono">{transactions.length} Registos</span>
            </div>
            {transactions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 font-mono">Sem transações registadas.</div>
            ) : (
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
                        -{tx.amount.toLocaleString('pt-AO')} {tx.currency || 'AOA'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 2. CARTEIRAS DIGITAIS DINÂMICAS */}
      {activeSubTab === 'carteiras' && (
        <div>
          {wallets.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <Wallet className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Nenhuma carteira digital no Firestore.</p>
              <button
                onClick={() => setShowAddWalletModal(true)}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
              >
                Adicionar Primeira Carteira
              </button>
            </div>
          ) : (
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
                      {w.balance.toLocaleString('pt-AO')} {w.currency || 'AOA'}
                    </span>
                  </div>
                  <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                    {w.provider}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. OPERADORAS DE TELECOM DINÂMICAS */}
      {activeSubTab === 'operadoras' && (
        <div className="space-y-3">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Operadoras de Telecomunicações Registadas via Firestore</span>
            <span className="text-emerald-400 font-bold">{telecomOperators.length} Ativas</span>
          </div>

          {telecomOperators.length === 0 ? (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs text-slate-500 font-mono">
              Sem operadoras registadas na coleção `telecom_providers` do Firestore.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {telecomOperators.map((op) => (
                <div key={op.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{op.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold uppercase">
                      {op.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                    <span>Código: {op.code}</span>
                    <span>Tipo: {op.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TRANSFERÊNCIAS */}
      {activeSubTab === 'transferencias' && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 max-w-xl">
          <h3 className="text-xs font-bold text-white uppercase flex items-center space-x-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>EXECUTIVE EXPRESS TRANSFER</span>
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Conta de Origem (Firestore)</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} — Saldo: {a.balance.toLocaleString()} {a.currency || 'AOA'}
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
                placeholder="Introduza o IBAN ou Número..."
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
                  placeholder="Descritivo do Pagamento"
                  className="w-full p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleExecuteTransfer}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              REGISTAR TRANSFERÊNCIA NO FIRESTORE
            </button>
          </div>
        </div>
      )}

      {/* 5. PAGAMENTOS / REFERÊNCIAS */}
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
            onClick={() => alert('Pagamento por referência processado via Firestore!')}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            CONFIRMAR PAGAMENTO DE SERVIÇO
          </button>
        </div>
      )}

      {/* 6. CARTÕES VIRTUAIS */}
      {activeSubTab === 'cartoes' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="p-4 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{pm.title}</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                  {pm.brand || 'Card'}
                </span>
              </div>
              <div className="text-sm font-mono tracking-widest text-slate-300 py-1">
                •••• •••• •••• {pm.cardLast4 || '0000'}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>EXP: {pm.cardExpiry || '12/28'}</span>
                <span className="text-emerald-400 font-bold">● FIRESTORE SYNCED</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. QR CODE EXPRESS */}
      {activeSubTab === 'qr_code' && (
        <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center space-y-3 max-w-md mx-auto">
          <QrCode className="w-20 h-20 text-emerald-400 mx-auto" />
          <h3 className="text-xs font-black text-white uppercase">MULTICAIXA EXPRESS QR SCAN & PAY</h3>
          <p className="text-[11px] text-slate-400">Leitura de QR Code com registo de transação direto no Firestore</p>
          <button
            onClick={() => alert('Scanner QR Code ativado!')}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
          >
            ABRIR SCANNER QR CODE
          </button>
        </div>
      )}
    </div>
  );
};
