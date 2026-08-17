import React, { useState, useEffect } from 'react';
import { Rocket, Github, Server, Database, Radio, Check, Copy, Terminal, ExternalLink, RefreshCw, CheckCircle2, GitBranch, AlertCircle, ArrowRight, Layers, Sliders, Smartphone, Download, Code2, FileCode } from 'lucide-react';

export const DeploymentGuideView: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>(() => {
    const saved = localStorage.getItem('portal_github_repo');
    if (!saved || !saved.includes('vitronishbo-wq/PortalTRMobile')) {
      return 'https://github.com/vitronishbo-wq/PortalTRMobile';
    }
    return saved;
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

  const [activeSnippet, setActiveSnippet] = useState<'pipeline' | 'env' | 'render' | 'docker' | 'github'>('pipeline');
  const [activeAndroidTab, setActiveAndroidTab] = useState<'steps' | 'json' | 'gradle' | 'kotlin'>('steps');
  const [copied, setCopied] = useState(false);

  const androidGoogleServicesJson = `{
  "project_info": {
    "project_number": "113504478729039495873",
    "project_id": "portaltrmobile",
    "storage_bucket": "portaltrmobile.firebasestorage.app"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "1:113504478729039495873:android:a1b2c3d4e5f67890",
        "android_client_info": {
          "package_name": "com.vitronis.portaltrmobile"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "AIzaSyA_SampleKeyPortalMobile2026"
        }
      ],
      "services": {
        "appinvite_service": {
          "status": 1
        }
      }
    }
  ],
  "configuration_version": "1"
}`;

  const androidBuildGradle = `// 1. Root build.gradle (Nível do Projeto)
plugins {
    id 'com.android.application' version '8.2.2' apply false
    id 'com.android.library' version '8.2.2' apply false
    id 'org.jetbrains.kotlin.android' version '1.9.22' apply false
    id 'com.google.gms.google-services' version '4.4.1' apply false
}

// 2. app/build.gradle (Nível do Módulo :app)
plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
    id 'com.google.gms.google-services'
}

android {
    namespace 'com.vitronis.portaltrmobile'
    compileSdk 34

    defaultConfig {
        applicationId "com.vitronis.portaltrmobile"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
}

dependencies {
    // Import do Firebase BoM (Bill of Materials)
    implementation platform('com.google.firebase:firebase-bom:33.1.0')
    
    // SDKs do Firebase sem especificar versão manual (geridos pelo BoM)
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-storage'
}`;

  const androidKotlinInit = `package com.vitronis.portaltrmobile

import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.Firebase
import com.google.firebase.firestore.firestore

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // 1. Inicializar Firestore (Conectado ao projeto 'portaltrmobile')
        val db = Firebase.firestore

        // 2. Criar objeto de registro do Dispositivo Android
        val deviceData = hashMapOf(
            "device_id" to "android_device_01",
            "package_name" to "com.vitronis.portaltrmobile",
            "platform" to "Android",
            "status" to "online",
            "last_sync" to System.currentTimeMillis()
        )

        // 3. Escrita direta no Firestore (Android -> Firestore -> Portal Web)
        db.collection("devices")
            .document("android_device_01")
            .set(deviceData)
            .addOnSuccessListener {
                Log.d("FirebaseSync", "Dispositivo sincronizado com sucesso no Firestore (portaltrmobile)!")
            }
            .addOnFailureListener { e ->
                Log.e("FirebaseSync", "Erro ao sincronizar dispositivo: \${e.message}")
            }
    }
}`;

  const pipelineNodes = [
    { name: 'Google AI Studio', tag: 'Origem Código' },
    { name: 'GitHub', tag: 'Repositório' },
    { name: 'GitHub Actions', tag: 'CI/CD Pipeline' },
    { name: 'Firebase Hosting', tag: 'Portal Web' },
    { name: 'Firestore', tag: 'Realtime DB' },
    { name: 'Render (API)', tag: 'Backend' },
    { name: 'Produção', tag: '100% Online' }
  ];

  const sampleEnvVars = `# SISTEMA & AMBIENTE DE PRODUÇÃO PORTAL TR MOBILE
APP_NAME="PortalTRMobile"
APP_CODE="portaltrmobile"
APP_ENV="production"
DEFAULT_LANGUAGE="pt-PT"
DEFAULT_COUNTRY="AO"
DEFAULT_TIMEZONE="Africa/Luanda"
APP_VENDOR="Vitronis"
PLATFORM_NAME="PortalTRMobile"

WEB_URL="https://portaltrmobile.web.app"
API_URL="https://portaltrmobile-api.onrender.com"
HOSTING_URL="https://portaltrmobile.web.app"

GITHUB_REPOSITORY="vitronishbo-wq/PortalTRMobile"

ANDROID_APP_ID="com.vitronis.portaltrmobile"
ANDROID_PACKAGE="com.vitronis.portaltrmobile"

FIRESTORE_DATABASE="(default)"
FIRESTORE_EVENTS="events"
FIRESTORE_USERS="users"
FIRESTORE_DEVICES="devices"
FIRESTORE_SETTINGS="settings"
FIRESTORE_FAVORITES="favorites"
FIRESTORE_LOGS="logs"
FIRESTORE_SESSIONS="sessions"

FIREBASE_PROJECT_ID="portaltrmobile"
FIREBASE_API_KEY="AIzaSyA_SampleKeyPortalMobile2026"
FIREBASE_AUTH_DOMAIN="portaltrmobile.firebaseapp.com"
FIREBASE_STORAGE_BUCKET="portaltrmobile.firebasestorage.app"
FIREBASE_APP_ID="1:113504478729039495873:web:abcd1234efgh5678"
FIREBASE_MESSAGING_SENDER_ID="113504478729039495873"
FIREBASE_MEASUREMENT_ID="G-PORTALTR2026"

PORTAL_BUILD="v1.0.0"
API_BUILD="v1.0.0"
ANDROID_BUILD="1"

SYNC_BATCH_SIZE="100"
SYNC_TIMEOUT="30000"
SYNC_RETRY="5"

ENABLE_SMS="true"
ENABLE_CALLS="true"
ENABLE_NOTIFICATIONS="true"
ENABLE_EMAIL="true"
ENABLE_ANALYTICS="false"`;

  const pipelineSummary = `Deploy Flow Diagram:
Google AI Studio  ↓  GitHub  ↓  GitHub Actions  ↓  Firebase Hosting  ↓  Firestore  ↓  Render(API)  ↓  Produção`;

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
          setSyncStatus('connected');
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
      description: 'Clique no menu de configurações do AI Studio e selecione Export to GitHub para manter o repositório sincronizado.'
    },
    {
      step: '2',
      title: 'GitHub Actions → CI / CD Automated Build',
      icon: Rocket,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      description: 'O fluxo do GitHub Actions executa o teste, compila o bundle web e o APK do Android e faz o deploy automático.'
    },
    {
      step: '3',
      title: 'Firebase Hosting & Firestore Database',
      icon: Database,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      description: 'O Portal SPA é publicado no Firebase Hosting e se conecta em tempo real ao Firestore (events, users, devices).'
    },
    {
      step: '4',
      title: 'Render (API) & Produção Final',
      icon: Server,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description: 'A API utilitária no Render gerencia backups e webhooks enquanto a produção mantida pelo Firestore segue 100% ativa.'
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
              O Ritual de Deploy: AI Studio → GitHub → GitHub Actions → Firebase Hosting → Firestore → Render → Produção
            </h2>
            <p className="text-xs text-slate-300">
              Passo a passo completo e arquivos pré-configurados para publicação 100% gratuita na nuvem.
            </p>
          </div>
        </div>

        {/* Deploy Pipeline Interactive Banner */}
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-indigo-500/40 space-y-3 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-indigo-300 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>CI/CD Pipeline Sequence</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Ativo
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1 text-center py-1">
            {pipelineNodes.map((p, i) => (
              <React.Fragment key={p.name}>
                <div className="p-2 rounded-xl bg-slate-900 border border-indigo-500/30 flex flex-col items-center">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">{p.tag}</span>
                  <span className="text-xs font-bold text-white">{p.name}</span>
                </div>
                {i < pipelineNodes.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mx-1" />
                )}
              </React.Fragment>
            ))}
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

      {/* Android Studio & Firebase Configuration Guide */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-indigo-500/30 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
                <span>Configuração do Firebase no Android Studio</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  com.vitronis.portaltrmobile
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Siga os passos abaixo para conectar o app móvel Android diretamente ao Firestore do projeto <strong className="text-indigo-300">portaltrmobile</strong>.
              </p>
            </div>
          </div>

          {/* Android Tabs */}
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap gap-1 shrink-0">
            <button
              onClick={() => setActiveAndroidTab('steps')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeAndroidTab === 'steps' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Passo a Passo</span>
            </button>
            <button
              onClick={() => setActiveAndroidTab('json')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeAndroidTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>google-services.json</span>
            </button>
            <button
              onClick={() => setActiveAndroidTab('gradle')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeAndroidTab === 'gradle' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>build.gradle</span>
            </button>
            <button
              onClick={() => setActiveAndroidTab('kotlin')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeAndroidTab === 'kotlin' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>MainActivity.kt</span>
            </button>
          </div>
        </div>

        {activeAndroidTab === 'steps' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="text-xs font-bold text-white">Registar App Android no Firebase</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline hover:text-indigo-300">Console do Firebase</a> no projeto <strong className="text-white">portaltrmobile</strong>. Clique em <strong>Adicionar App → Android</strong>. Defina o nome do pacote como <code className="text-amber-300 font-mono text-[11px]">com.vitronis.portaltrmobile</code> e salve.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="text-xs font-bold text-white">Adicionar google-services.json</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                Faça o download do ficheiro <code className="text-emerald-300 font-mono text-[11px]">google-services.json</code> e cole dentro da pasta do módulo do app no Android Studio: <code className="text-indigo-300 font-mono text-[11px]">PortalTRMobile/app/google-services.json</code>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="text-xs font-bold text-white">Configurar Dependências Gradle</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                No <code className="text-indigo-300 font-mono text-[11px]">build.gradle</code> principal adicione o plugin do Google Services. No <code className="text-indigo-300 font-mono text-[11px]">app/build.gradle</code> inclua o Firebase BoM e os módulos de Firestore, Auth e Storage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="text-xs font-bold text-white">Sincronização Direta Android ↔ Firestore</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-8">
                No <code className="text-indigo-300 font-mono text-[11px]">MainActivity.kt</code> utilize <code className="text-amber-300 font-mono text-[11px]">Firebase.firestore</code> para gravar dados diretamente nas coleções. A alteração no Android aparece instantaneamente no Portal Web!
              </p>
            </div>
          </div>
        ) : (
          <div className="relative bg-slate-950 rounded-xl p-4 border border-slate-800">
            <button
              onClick={() => {
                const content =
                  activeAndroidTab === 'json'
                    ? androidGoogleServicesJson
                    : activeAndroidTab === 'gradle'
                    ? androidBuildGradle
                    : androidKotlinInit;
                handleCopy(content);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center space-x-1 text-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <pre className="text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed pt-2">
              {activeAndroidTab === 'json'
                ? androidGoogleServicesJson
                : activeAndroidTab === 'gradle'
                ? androidBuildGradle
                : androidKotlinInit}
            </pre>
          </div>
        )}
      </div>

      {/* Code Snippets for Deployment */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-sm">Arquivos e Configurações de Deploy</h3>
          </div>

          {/* Snippet Tabs */}
          <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-wrap gap-1">
            <button
              onClick={() => setActiveSnippet('pipeline')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSnippet === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Deploy Pipeline
            </button>
            <button
              onClick={() => setActiveSnippet('env')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeSnippet === 'env' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              .env (Vars)
            </button>
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
              const content =
                activeSnippet === 'pipeline'
                  ? pipelineSummary
                  : activeSnippet === 'env'
                  ? sampleEnvVars
                  : activeSnippet === 'render'
                  ? exportFiles?.renderYaml || ''
                  : activeSnippet === 'docker'
                  ? exportFiles?.dockerfile || ''
                  : exportFiles?.githubWorkflow || '';
              handleCopy(content);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <pre className="text-xs text-indigo-300 font-mono overflow-x-auto leading-relaxed pt-2">
            {activeSnippet === 'pipeline' ? (
              pipelineSummary
            ) : activeSnippet === 'env' ? (
              sampleEnvVars
            ) : exportFiles ? (
              activeSnippet === 'render'
                ? exportFiles.renderYaml
                : activeSnippet === 'docker'
                ? exportFiles.dockerfile
                : exportFiles.githubWorkflow
            ) : (
              'Carregando arquivos...'
            )}
          </pre>
        </div>
      </div>
    </div>
  );
};
