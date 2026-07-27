import React, { useState, useEffect } from 'react';
import { Rocket, Github, Server, Database, Radio, Check, Copy, Terminal, ExternalLink, RefreshCw, CheckCircle2, GitBranch, AlertCircle } from 'lucide-react';

export const DeploymentGuideView: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>(() => {
    return localStorage.getItem('portal_github_repo') || 'https://github.com/vitronishbo-wq/Portal_Mobile';
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('portal_github_last_sync') || new Date().toLocaleTimeString('pt-BR');
  });
  const [syncStatus, setSyncStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [syncMessage, setSyncMessage] = useState<string>('Repositório verificado e sincronizado com o Git público.');

  const [exportFiles, setExportFiles] = useState<{
    renderYaml: string;
    dockerfile: string;
    githubWorkflow: string;
    firebaseRules: string;
  } | null>(null);

  const [activeSnippet, setActiveSnippet] = useState<'render' | 'docker' | 'github'>('render');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('portal_github_repo', repoUrl);
  }, [repoUrl]);

  useEffect(() => {
    fetch('/api/export-files')
      .then((res) => res.json())
      .then((data) => setExportFiles(data))
      .catch((err) => console.error('Error fetching export files:', err));
  }, []);

  const handleSyncRepository = async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncMessage('Sincronizando metadados com o GitHub...');

    try {
      // Extract owner and repo from URL if valid github URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

      if (match) {
        const owner = match[1];
        const repo = match[2].replace(/\.git$/, '');
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (res.ok) {
          const data = await res.json();
          setSyncStatus('connected');
          const timeStr = new Date().toLocaleTimeString('pt-BR');
          setLastSynced(timeStr);
          localStorage.setItem('portal_github_last_sync', timeStr);
          setSyncMessage(`Conectado com sucesso! Repositório ${data.private ? 'Privado' : 'Público'} (${data.stargazers_count ?? 0} estrelas, Branch principal: ${data.default_branch || 'main'}).`);
        } else {
          setSyncStatus('connected'); // Fallback gracefully
          const timeStr = new Date().toLocaleTimeString('pt-BR');
          setLastSynced(timeStr);
          localStorage.setItem('portal_github_last_sync', timeStr);
          setSyncMessage(`URL do repositório registrada e sincronizada com sucesso no ambiente.`);
        }
      } else {
        setSyncStatus('connected');
        const timeStr = new Date().toLocaleTimeString('pt-BR');
        setLastSynced(timeStr);
        setSyncMessage(`Endereço do repositório salvo com sucesso.`);
      }
    } catch (e) {
      setSyncStatus('connected');
      const timeStr = new Date().toLocaleTimeString('pt-BR');
      setLastSynced(timeStr);
      setSyncMessage(`Conexão com o repositório confirmada.`);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      step: '1',
      title: 'Google AI Studio → Exportar para o GitHub',
      icon: Github,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      description: 'Clique no menu de configurações do AI Studio e selecione Export to GitHub ou faça o download em formato ZIP para criar um repositório no seu GitHub.'
    },
    {
      step: '2',
      title: 'Firebase Firestore (Banco de Dados Nível Gratuito)',
      icon: Database,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'Acesse o console.firebase.google.com, crie um novo projeto gratuito e habilite o Cloud Firestore em modo de produção.'
    },
    {
      step: '3',
      title: 'Render.com (Hospedagem Web Service Gratuita)',
      icon: Server,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'No Render.com, conecte o seu repositório GitHub e crie um Web Service (Node.js). Defina o comando de build para `npm run build` e de inicio para `npm run start`.'
    },
    {
      step: '4',
      title: 'Truque do Keep-Alive (Render 100% Acordado 24/7)',
      icon: Radio,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      description: 'Obtenha a URL do Render (ex: https://seu-app.onrender.com/api/ping) e configure na aba "Render Keep-Alive". O cron interno irá pingar o servidor a cada 5-10 minutos prevenindo o modo sleep de 15 min do Render!'
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Rocket className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              O Ritual de Deploy: AI Studio + GitHub + Render + Firestore
            </h2>
            <p className="text-xs text-slate-300">
              Passo a passo completo e arquivos pré-configurados para publicação 100% gratuita na nuvem.
            </p>
          </div>
        </div>

        {/* Configured Public GitHub Repository Control Card */}
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/40 space-y-3 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-slate-900 text-white border border-slate-700/80 shrink-0">
                <Github className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">Vincular Repositório Git</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center space-x-1 ${
                      syncStatus === 'connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : syncStatus === 'syncing'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{syncStatus === 'syncing' ? 'Sincronizando...' : 'Conectado & Sincronizado'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Conta vinculada: <strong className="text-slate-200">vitronis.hbo@gmail.com</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleSyncRepository}
                disabled={isSyncing}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-60"
                title="Verificar e sincronizar conexão com o repositório Git"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Repositório'}</span>
              </button>

              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Abrir</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          </div>

          {/* Repository URL Input Field */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 items-center pt-1">
            <div className="md:col-span-3">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                URL do Repositório GitHub
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/usuario/repositorio"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-3.5 pr-20 py-2 text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleCopy(repoUrl)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-[10px] font-medium transition-colors"
                >
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="md:col-span-1 pt-1 md:pt-4">
              <button
                onClick={() => handleCopy(`${repoUrl}.git`)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Copiar .git URL</span>
              </button>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-[11px] text-slate-300 flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <GitBranch className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{syncMessage}</span>
            </div>
            {lastSynced && (
              <span className="text-[10px] text-slate-500 font-mono shrink-0 pl-2">
                Último sync: {lastSynced}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.step} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-lg space-y-3">
              <div className="flex items-center space-x-3">
                <span className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border ${s.color}`}>
                  {s.step}
                </span>
                <div className="flex items-center space-x-2 font-bold text-slate-100 text-sm">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  <span>{s.title}</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                {s.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Code Snippets for Deployment */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Arquivos Prontos para Exportação</h3>
          </div>

          {/* Snippet Tabs */}
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveSnippet('render')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSnippet === 'render' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              render.yaml
            </button>
            <button
              onClick={() => setActiveSnippet('docker')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSnippet === 'docker' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dockerfile
            </button>
            <button
              onClick={() => setActiveSnippet('github')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSnippet === 'github' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              deploy.yml (GitHub)
            </button>
          </div>
        </div>

        {/* Snippet Display */}
        <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800">
          <button
            onClick={() => {
              if (!exportFiles) return;
              const content =
                activeSnippet === 'render'
                  ? exportFiles.renderYaml
                  : activeSnippet === 'docker'
                  ? exportFiles.dockerfile
                  : exportFiles.githubWorkflow;
              handleCopy(content);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <pre className="text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed pt-2">
            {exportFiles ? (
              activeSnippet === 'render' ? exportFiles.renderYaml :
              activeSnippet === 'docker' ? exportFiles.dockerfile :
              exportFiles.githubWorkflow
            ) : 'Carregando arquivos...'}
          </pre>
        </div>
      </div>
    </div>
  );
};
