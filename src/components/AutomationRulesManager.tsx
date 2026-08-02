import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Play,
  Plus,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Tag,
  ArrowRight,
  RefreshCw,
  Sliders,
  Terminal,
  ShieldCheck,
  Building2,
  Cpu
} from 'lucide-react';
import {
  AutomationEngine,
  AutomationRule,
  AutomationExecutionLog,
  RuleCondition
} from '../services/automationEngine';
import { classifyEventHeuristically, AIClassificationResult } from '../services/aiClassifier';

export const AutomationRulesManager: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>(AutomationEngine.getRules());
  const [logs, setLogs] = useState<AutomationExecutionLog[]>(AutomationEngine.getExecutionLogs());

  // Rule Creator State
  const [isCreating, setIsCreating] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [triggerEvent, setTriggerEvent] = useState('SMS');
  const [condField, setCondField] = useState<'payload.body' | 'aiCategory' | 'payload.sender' | 'type'>('payload.body');
  const [condOperator, setCondOperator] = useState<'CONTAINS' | 'EQUALS' | 'STARTS_WITH' | 'NOT_CONTAINS'>('CONTAINS');
  const [condValue, setCondValue] = useState('BAI');
  const [actionType, setActionType] = useState<'WEBHOOK' | 'NOTIFY_FOUNDER' | 'GEMINI_CLASSIFY'>('WEBHOOK');
  const [webhookUrl, setWebhookUrl] = useState('https://minhaempresa.co.ao/api/pagamentos');

  // AI Classification Tester State
  const [smsTestInput, setSmsTestInput] = useState(
    'BAI Directo: Transferencia de 50.000 Kz recebida de SILA JANEIRO.'
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiResult, setAiResult] = useState<AIClassificationResult | null>(null);
  const [matchedTestLogs, setMatchedTestLogs] = useState<AutomationExecutionLog[]>([]);

  // Sample presets for quick testing
  const samplePresets = [
    {
      label: 'SMS BAI (Pagamento)',
      text: 'BAI Directo: Transferencia de 50.000 Kz recebida de SILA JANEIRO.'
    },
    {
      label: 'SMS BFA (Código OTP)',
      text: 'BFA Net: O seu codigo de confirmacao de operacao e 849201. Valido por 5 min.'
    },
    {
      label: 'SMS SPAM (Jogo/Aposta)',
      text: 'GANHE 100.000 Kz no jogo da sorte hoje! Clique aqui: www.aposta-sorte.co.ao'
    },
    {
      label: 'ProxyPay Multicaixa Express',
      text: 'ProxyPay: Pagamento de Referencia 9928172 referente a Fatura #1092 aprovado com sucesso.'
    }
  ];

  const handleRefresh = () => {
    setRules(AutomationEngine.getRules());
    setLogs(AutomationEngine.getExecutionLogs());
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    const condition: RuleCondition = {
      field: condField,
      operator: condOperator,
      value: condValue.trim()
    };

    AutomationEngine.createRule({
      name: ruleName.trim(),
      triggerEvent,
      conditions: [condition],
      actionType,
      webhookUrl: actionType === 'WEBHOOK' ? webhookUrl.trim() : undefined
    });

    setRules(AutomationEngine.getRules());
    setIsCreating(false);
    setRuleName('');
  };

  const handleDeleteRule = (id: string) => {
    AutomationEngine.deleteRule(id);
    setRules(AutomationEngine.getRules());
  };

  const handleToggleRule = (id: string, active: boolean) => {
    AutomationEngine.toggleRule(id, active);
    setRules(AutomationEngine.getRules());
  };

  const handleRunAiAndRulesTest = async () => {
    setIsClassifying(true);
    setAiResult(null);

    let classification: AIClassificationResult;

    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: smsTestInput,
          sender: 'AUTOMATION_TESTER',
          title: 'SMS Teste'
        })
      });

      if (res.ok) {
        const data = await res.json();
        classification = data.classification;
      } else {
        classification = classifyEventHeuristically(smsTestInput, 'SMS Teste', 'AUTOMATION_TESTER');
      }
    } catch (e) {
      classification = classifyEventHeuristically(smsTestInput, 'SMS Teste', 'AUTOMATION_TESTER');
    }

    setAiResult(classification);

    // Evaluate test event in Rule Engine
    const mockEvent = {
      eventId: `evt-test-${Date.now().toString(36)}`,
      type: 'SMS',
      aiCategory: classification.category,
      payload: {
        body: smsTestInput,
        sender: 'BAI',
        title: 'Notificação SMS'
      }
    };

    const matched = await AutomationEngine.evaluateEvent(mockEvent);
    setMatchedTestLogs(matched);
    setLogs(AutomationEngine.getExecutionLogs());
    setRules(AutomationEngine.getRules());
    setIsClassifying(false);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* Header Banner */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <Zap className="w-6 h-6" />
          </span>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-slate-100">MOTOR DE AUTOMAÇÃO & IA (DECISION ENGINE)</h2>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded-md border border-indigo-500/30 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Gemini 2.5 + IF/THEN</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Classificação inteligente de SMS/Eventos + Disparo de Webhooks em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Atualizar Regras"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Regra</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: AI CLASSIFICATION & DECISION ENGINE PLAYGROUND */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Simulador & Classificador IA (Gemini SMS Engine)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Pipeline Automático Ativo
          </span>
        </div>

        {/* Quick Sample Presets */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">Exemplos rápidos de teste:</span>
          <div className="flex flex-wrap gap-2">
            {samplePresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setSmsTestInput(preset.text)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-800 transition-all cursor-pointer truncate max-w-xs"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Box & Test Button */}
        <div className="space-y-2">
          <textarea
            value={smsTestInput}
            onChange={(e) => setSmsTestInput(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50"
            placeholder="Digite o texto do SMS recebido para simulação..."
          />

          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-mono">
              O evento será classificado pelo Gemini AI e processado contra todas as regras IF/THEN ativas.
            </span>
            <button
              onClick={handleRunAiAndRulesTest}
              disabled={isClassifying || !smsTestInput.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {isClassifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Classificando...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Executar Classificação & Regras</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Classification Result Display */}
        {aiResult && (
          <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span className="font-extrabold text-slate-200">Resultado da Análise IA</span>
              </div>
              <span className="text-[10px] text-slate-500">Motor: {aiResult.classifiedBy}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Categoria</span>
                <span className="text-sm font-black text-amber-400 uppercase">{aiResult.category}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Confiança</span>
                <span className="text-sm font-bold text-emerald-400">
                  {Math.round(aiResult.confidence * 100)}%
                </span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Regras Disparadas</span>
                <span className="text-sm font-bold text-sky-400">{matchedTestLogs.length} Regra(s)</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs italic bg-slate-900/60 p-2.5 rounded border border-slate-800">
              "{aiResult.summary}"
            </p>

            {/* Matched Rules Details */}
            {matchedTestLogs.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ações Executadas pelo Rule Engine:</span>
                </span>
                {matchedTestLogs.map((mLog) => (
                  <div
                    key={mLog.id}
                    className="p-2 bg-emerald-950/30 border border-emerald-500/30 rounded text-[11px] text-emerald-300 space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>REGRA: {mLog.ruleName}</span>
                      <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.2 rounded">
                        {mLog.result} ({mLog.latencyMs}ms)
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300">{mLog.actionOutput}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: CREATE NEW RULE FORM (TOGGLEABLE) */}
      {isCreating && (
        <form
          onSubmit={handleCreateRule}
          className="bg-slate-900 p-5 rounded-2xl border border-amber-500/40 space-y-4 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Criar Regra de Automação "IF THIS THEN THAT"</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-slate-500 hover:text-slate-300"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Nome da Regra</label>
              <input
                type="text"
                required
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="Ex: SMS BAI -> Webhook Pagamentos"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Evento Gatilho (WHEN)</label>
              <select
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500/50"
              >
                <option value="SMS">SMS Recebido</option>
                <option value="NOTIFICATION">Notificação de App</option>
                <option value="CALL">Chamada Telefónica</option>
                <option value="ANY">Qualquer Evento</option>
              </select>
            </div>
          </div>

          {/* Condition Builder */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-indigo-400 block">Condição de Disparo (IF)</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Campo Alvo</label>
                <select
                  value={condField}
                  onChange={(e) => setCondField(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="payload.body">payload.body (Corpo do SMS)</option>
                  <option value="aiCategory">aiCategory (Categoria IA)</option>
                  <option value="payload.sender">payload.sender (Remetente)</option>
                  <option value="type">type (Tipo do Evento)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Operador</label>
                <select
                  value={condOperator}
                  onChange={(e) => setCondOperator(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="CONTAINS">CONTAINS (Contém)</option>
                  <option value="EQUALS">EQUALS (Igual)</option>
                  <option value="STARTS_WITH">STARTS_WITH (Começa com)</option>
                  <option value="NOT_CONTAINS">NOT_CONTAINS (Não contém)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Valor do Filtro</label>
                <input
                  type="text"
                  required
                  value={condValue}
                  onChange={(e) => setCondValue(e.target.value)}
                  placeholder="Ex: BAI, OTP, 50.000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Action Builder */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-emerald-400 block">Ação do Sistema (THEN)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Tipo de Ação</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                >
                  <option value="WEBHOOK">Disparar Webhook (HTTP POST)</option>
                  <option value="NOTIFY_FOUNDER">Notificar Founder & PWA</option>
                  <option value="GEMINI_CLASSIFY">Enriquecer com Gemini AI</option>
                </select>
              </div>

              {actionType === 'WEBHOOK' && (
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">URL do Webhook (Endpoint Target)</label>
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://minhaempresa.co.ao/api/pagamentos"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Regra de Automação</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 3: RULES LIST & EXECUTION LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
        {/* Active Rules List */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
              <Sliders className="w-4 h-4" />
              <span>Regras de Automação Ativas ({rules.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500">Auto-Evaluated</span>
          </div>

          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  rule.active
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-200 mb-2">
                  <div className="flex items-center space-x-2 min-w-0">
                    <Zap
                      className={`w-3.5 h-3.5 shrink-0 ${
                        rule.active ? 'text-amber-400' : 'text-slate-600'
                      }`}
                    />
                    <span className="truncate">{rule.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={rule.active}
                      onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                      className="rounded text-amber-500 cursor-pointer"
                    />
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                      title="Eliminar Regra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800 text-[10px] space-y-1">
                  <div className="text-indigo-400 font-bold flex items-center space-x-1">
                    <span>WHEN: {rule.triggerEvent}</span>
                    <span>•</span>
                    <span>IF ({rule.condition})</span>
                  </div>
                  <div className="text-emerald-400 font-bold flex items-center space-x-1 truncate">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">THEN: {rule.action}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-2">
                  <span>Disparos: {rule.triggerCount}</span>
                  <span>
                    Último: {rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleTimeString('pt-BR') : 'Nunca'}
                  </span>
                  <button
                    onClick={() => {
                      AutomationEngine.triggerRule(rule.id);
                      setLogs(AutomationEngine.getExecutionLogs());
                      setRules(AutomationEngine.getRules());
                    }}
                    className="text-amber-400 hover:underline font-bold cursor-pointer"
                  >
                    Testar Disparo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution Logs Terminal */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
              <Terminal className="w-4 h-4" />
              <span>Logs de Execução & Webhooks</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-500">{logs.length} registros</span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1 font-mono"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-200 truncate max-w-[200px]">{log.ruleName}</span>
                  <span
                    className={`text-[9px] uppercase font-mono px-1.5 py-0.2 rounded ${
                      log.result === 'SUCCESS'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {log.result}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px] break-words">{log.actionOutput}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-900">
                  <span>{new Date(log.triggeredAt).toLocaleTimeString('pt-BR')}</span>
                  {log.latencyMs && <span>Latência: {log.latencyMs}ms</span>}
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-500 font-mono italic">
                Nenhuma execução registrada no momento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
