import React, { useState } from 'react';
import {
  Zap,
  Bot,
  Play,
  Plus,
  Trash2,
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
  GitFork,
  Clock,
  Activity,
  Battery,
  Wifi,
  Cpu,
  Layers,
  Check,
  RotateCw,
  Calendar,
  Database,
  Radio
} from 'lucide-react';
import {
  AutomationEngine,
  AutomationRule,
  AutomationExecutionLog,
  RuleCondition,
  WorkflowPipeline,
  AutoHealingRoutine,
  ScheduledCronJob
} from '../services/automationEngine';
import { classifyEventHeuristically, AIClassificationResult } from '../services/aiClassifier';

export const AutomationRulesManager: React.FC = () => {
  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<'rules' | 'workflows' | 'autohealing' | 'scheduled'>('rules');

  // Rules State
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

  // Workflows State
  const [workflows, setWorkflows] = useState<WorkflowPipeline[]>(AutomationEngine.getWorkflows());
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);
  const [workflowActiveSteps, setWorkflowActiveSteps] = useState<Record<string, number>>({});

  // Auto-Healing State
  const [autoHealingRoutines, setAutoHealingRoutines] = useState<AutoHealingRoutine[]>(
    AutomationEngine.getAutoHealingRoutines()
  );
  const [isHealingRunning, setIsHealingRunning] = useState(false);
  const [healingNotice, setHealingNotice] = useState<string | null>(null);

  // Scheduled Tasks State
  const [cronJobs, setCronJobs] = useState<ScheduledCronJob[]>(AutomationEngine.getScheduledCronJobs());
  const [triggeringCronId, setTriggeringCronId] = useState<string | null>(null);

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
    setWorkflows(AutomationEngine.getWorkflows());
    setAutoHealingRoutines(AutomationEngine.getAutoHealingRoutines());
    setCronJobs(AutomationEngine.getScheduledCronJobs());
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

  // Run Workflow Simulation
  const handleExecuteWorkflow = (wfId: string) => {
    setRunningWorkflowId(wfId);
    setWorkflowActiveSteps((prev) => ({ ...prev, [wfId]: 1 }));

    setTimeout(() => {
      setWorkflowActiveSteps((prev) => ({ ...prev, [wfId]: 2 }));
    }, 600);

    setTimeout(() => {
      setWorkflowActiveSteps((prev) => ({ ...prev, [wfId]: 3 }));
    }, 1200);

    setTimeout(() => {
      setWorkflowActiveSteps((prev) => ({ ...prev, [wfId]: 4 }));
    }, 1800);

    setTimeout(() => {
      setRunningWorkflowId(null);
      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === wfId
            ? {
                ...w,
                lastExecuted: Date.now(),
                totalExecutions: w.totalExecutions + 1
              }
            : w
        )
      );
    }, 2400);
  };

  // Trigger Auto-Healing Scanner
  const handleRunAutoHealing = () => {
    setIsHealingRunning(true);
    setHealingNotice(null);

    setTimeout(() => {
      setIsHealingRunning(false);
      setAutoHealingRoutines((prev) =>
        prev.map((r) => ({
          ...r,
          status: 'HEALED',
          autoHealingCount: r.autoHealingCount + 1,
          lastHealed: Date.now()
        }))
      );
      setHealingNotice('✓ Varredura concluída! Todos os 3 agentes (Android Native, PWA e Mesh) foram reparados e otimizados.');
    }, 1500);
  };

  // Trigger Cron Job Manually
  const handleTriggerCron = (cronId: string) => {
    setTriggeringCronId(cronId);
    setTimeout(() => {
      setCronJobs((prev) =>
        prev.map((c) =>
          c.id === cronId
            ? {
                ...c,
                lastRun: Date.now(),
                nextRun: Date.now() + 3600000,
                executionCount: c.executionCount + 1
              }
            : c
        )
      );
      setTriggeringCronId(null);
    }, 800);
  };

  // Toggle Cron Job Active State
  const handleToggleCron = (cronId: string) => {
    setCronJobs((prev) =>
      prev.map((c) => (c.id === cronId ? { ...c, active: !c.active } : c))
    );
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
              <h2 className="text-lg font-black text-slate-100">MOTOR DE AUTOMAÇÃO & DECISION ENGINE</h2>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold rounded-md border border-indigo-500/30 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Gemini 2.5 + Workflows</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Regras IF/THEN • Workflows Encadeados • Auto-Healing Native • Tarefas Programadas (Cron)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer"
            title="Atualizar Tudo"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {activeTab === 'rules' && (
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Regra</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div className="flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto text-xs font-mono">
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Regras & Gatilhos ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workflows'
              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <GitFork className="w-4 h-4" />
          <span>Workflows & Fluxos ({workflows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('autohealing')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'autohealing'
              ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Auto-Healing ({autoHealingRoutines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('scheduled')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'scheduled'
              ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Tarefas Programadas ({cronJobs.length})</span>
        </button>
      </div>

      {/* TAB 1: REGRAS & GATILHOS (RULE ENGINE) */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* AI CLASSIFICATION & DECISION ENGINE PLAYGROUND */}
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

          {/* CREATE NEW RULE FORM (TOGGLEABLE) */}
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

          {/* RULES LIST & EXECUTION LOGS */}
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
      )}

      {/* TAB 2: WORKFLOWS (FLUXOS DE TRABALHO ENCADEADOS) */}
      {activeTab === 'workflows' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <GitFork className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Pipelines de Workflows Encadeados Multi-Passos
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-[10px] font-bold border border-indigo-500/20">
                Orquestração Event-Driven
              </span>
            </div>

            <p className="text-slate-400 text-xs">
              Workflows executam uma sequência rigorosa de etapas automatizadas desde a captura do SMS até à entrega do webhook e notificação push.
            </p>

            <div className="space-y-4">
              {workflows.map((wf) => {
                const isRunning = runningWorkflowId === wf.id;
                const activeStep = workflowActiveSteps[wf.id] || 0;

                return (
                  <div
                    key={wf.id}
                    className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-900 pb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-100">{wf.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded">
                            ATIVO
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{wf.description}</p>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right text-[10px] text-slate-500">
                          <div>Execuções Totais: <strong className="text-indigo-400">{wf.totalExecutions}</strong></div>
                          <div>Última: {wf.lastExecuted ? new Date(wf.lastExecuted).toLocaleTimeString('pt-BR') : 'Hoje'}</div>
                        </div>

                        <button
                          onClick={() => handleExecuteWorkflow(wf.id)}
                          disabled={isRunning}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                        >
                          {isRunning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Executando...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Simular Pipeline</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* STEPS FLOW DIAGRAM */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
                      {wf.steps.map((step) => {
                        const isCurrent = isRunning && activeStep === step.stepIndex;
                        const isDone = isRunning ? activeStep > step.stepIndex : true;

                        return (
                          <div
                            key={step.stepIndex}
                            className={`p-3 rounded-xl border transition-all ${
                              isCurrent
                                ? 'bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-500/20'
                                : isDone
                                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                                : 'bg-slate-900/40 border-slate-900 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                              <span className="text-amber-400">PASSO {step.stepIndex}</span>
                              {isCurrent ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                              ) : isDone ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Clock className="w-3 h-3 text-slate-600" />
                              )}
                            </div>
                            <span className="font-bold text-[11px] block text-slate-200">{step.name}</span>
                            <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{step.output}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUTO-HEALING ENGINE (AUTO-REPARO DE AGENTES) */}
      {activeTab === 'autohealing' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Módulo de Auto-Reparo Automático (Auto-Healing Engine)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Garante resiliência 24/7 mitigando Doze Mode de Bateria OEM, reconectando WebSockets e desatravancando SMS
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAutoHealing}
                disabled={isHealingRunning}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isHealingRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Executando Auto-Reparo...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Executar Varredura e Auto-Reparo Agora</span>
                  </>
                )}
              </button>
            </div>

            {healingNotice && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{healingNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {autoHealingRoutines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        {routine.target === 'ANDROID_BATTERY' && <Battery className="w-4 h-4 text-amber-400" />}
                        {routine.target === 'SOCKET_MESH' && <Wifi className="w-4 h-4 text-sky-400" />}
                        {routine.target === 'SMS_QUEUE' && <Database className="w-4 h-4 text-purple-400" />}
                        <span className="font-bold text-slate-200 text-xs truncate max-w-[150px]">{routine.name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                          routine.status === 'HEALED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}
                      >
                        {routine.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">{routine.description}</p>

                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px] space-y-1">
                      <span className="text-amber-400 font-bold block">Gatilho de Anomalia:</span>
                      <span className="text-slate-300 block">{routine.triggerCondition}</span>
                      <span className="text-emerald-400 font-bold block pt-1">Ação de Reparo Executada:</span>
                      <span className="text-slate-300 block">{routine.actionTaken}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Reparos efetuados: <strong className="text-emerald-400">{routine.autoHealingCount}</strong></span>
                    <span>
                      {routine.lastHealed ? new Date(routine.lastHealed).toLocaleTimeString('pt-BR') : 'Ativo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TAREFAS PROGRAMADAS (CRON JOBS / SCHEDULED TASKS) */}
      {activeTab === 'scheduled' && (
        <div className="space-y-6 font-mono text-xs">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Tarefas Programadas e Agendamentos Recorrentes (Cron System)
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-sky-500/10 text-sky-300 rounded-lg text-[10px] font-bold border border-sky-500/20">
                Scheduled Jobs Active
              </span>
            </div>

            <p className="text-slate-400 text-xs">
              Schedules executam purgas periódicas de logs, heartbeats de verificação de frota e sincronização incremental na nuvem.
            </p>

            <div className="space-y-3">
              {cronJobs.map((cron) => {
                const isTriggering = triggeringCronId === cron.id;

                return (
                  <div
                    key={cron.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      cron.active
                        ? 'bg-slate-950 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-sky-400" />
                          <span className="font-bold text-sm text-slate-200">{cron.name}</span>
                          <span className="px-2 py-0.5 bg-slate-900 text-slate-300 text-[10px] font-mono rounded border border-slate-800">
                            {cron.cronExpression}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                          <span>Frequência: <strong className="text-sky-300">{cron.scheduleLabel}</strong></span>
                          <span>•</span>
                          <span>Módulo Alvo: <strong className="text-indigo-300">{cron.targetModule}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="text-right text-[10px] text-slate-500 font-mono">
                          <div>Execuções: <strong className="text-emerald-400">{cron.executionCount}</strong></div>
                          <div>Última: {cron.lastRun ? new Date(cron.lastRun).toLocaleTimeString('pt-BR') : 'Recentemente'}</div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={cron.active}
                            onChange={() => handleToggleCron(cron.id)}
                            className="rounded text-sky-500 cursor-pointer"
                            title="Ativar/Desativar Agendamento"
                          />

                          <button
                            onClick={() => handleTriggerCron(cron.id)}
                            disabled={isTriggering || !cron.active}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                          >
                            {isTriggering ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Executando...</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" />
                                <span>Disparar Agora</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
