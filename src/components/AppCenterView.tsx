import React, { useState } from 'react';
import {
  Grid,
  MessageSquare,
  PhoneCall,
  Contact,
  Send,
  Camera,
  Share2,
  Landmark,
  Mail,
  Calendar,
  FileText,
  FolderArchive,
  Star,
  Pin,
  EyeOff,
  Download,
  Check,
  MoveUp,
  MoveDown,
  Sparkles,
  Smartphone
} from 'lucide-react';

export interface AppCenterItem {
  id: string;
  name: string;
  category: string;
  icon: any;
  color: string;
  isInstalled: boolean;
  isHidden: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  order: number;
}

export const AppCenterView: React.FC = () => {
  const [apps, setApps] = useState<AppCenterItem[]>([
    { id: 'sms', name: 'SMS', category: 'Comunicação', icon: MessageSquare, color: 'text-cyan-400', isInstalled: true, isHidden: false, isFavorite: true, isPinned: true, order: 1 },
    { id: 'chamadas', name: 'Chamadas / Dial', category: 'Telefonia', icon: PhoneCall, color: 'text-emerald-400', isInstalled: true, isHidden: false, isFavorite: true, isPinned: true, order: 2 },
    { id: 'contactos', name: 'Contactos', category: 'Telefonia', icon: Contact, color: 'text-indigo-400', isInstalled: true, isHidden: false, isFavorite: false, isPinned: true, order: 3 },
    { id: 'whatsapp', name: 'WhatsApp Web Cloud', category: 'Redes Sociais', icon: Send, color: 'text-emerald-500', isInstalled: true, isHidden: false, isFavorite: true, isPinned: false, order: 4 },
    { id: 'telegram', name: 'Telegram Bridge', category: 'Redes Sociais', icon: Send, color: 'text-cyan-500', isInstalled: true, isHidden: false, isFavorite: true, isPinned: false, order: 5 },
    { id: 'instagram', name: 'Instagram Direct', category: 'Redes Sociais', icon: Camera, color: 'text-rose-400', isInstalled: true, isHidden: false, isFavorite: false, isPinned: false, order: 6 },
    { id: 'facebook', name: 'Facebook Messenger', category: 'Redes Sociais', icon: Share2, color: 'text-blue-500', isInstalled: false, isHidden: false, isFavorite: false, isPinned: false, order: 7 },
    { id: 'banking', name: 'Aplicações Bancárias (BFA / BAI)', category: 'Finanças', icon: Landmark, color: 'text-amber-400', isInstalled: true, isHidden: false, isFavorite: true, isPinned: true, order: 8 },
    { id: 'email', name: 'E-mail Empresarial', category: 'Produtividade', icon: Mail, color: 'text-purple-400', isInstalled: true, isHidden: false, isFavorite: false, isPinned: false, order: 9 },
    { id: 'calendario', name: 'Calendário de Eventos', category: 'Produtividade', icon: Calendar, color: 'text-sky-400', isInstalled: true, isHidden: false, isFavorite: false, isPinned: false, order: 10 },
    { id: 'notas', name: 'Bloco de Notas Cloud', category: 'Produtividade', icon: FileText, color: 'text-amber-300', isInstalled: true, isHidden: false, isFavorite: false, isPinned: false, order: 11 },
    { id: 'ficheiros', name: 'Gestor de Ficheiros', category: 'Sistema', icon: FolderArchive, color: 'text-slate-300', isInstalled: true, isHidden: false, isFavorite: false, isPinned: false, order: 12 }
  ]);

  const toggleInstall = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isInstalled: !a.isInstalled } : a));
  };

  const toggleHide = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isHidden: !a.isHidden } : a));
  };

  const toggleFavorite = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
  };

  const togglePin = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  };

  const moveOrder = (id: string, direction: 'up' | 'down') => {
    setApps(prev => {
      const idx = prev.findIndex(a => a.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 text-slate-100 font-sans shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight flex items-center space-x-2">
              <span>APP CENTER — APLICAÇÕES NATIVAS E EMULADAS 4.0</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-mono">
                DESKTOP & MOBILE ISOLATION
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Instalação, ocultação, pinning e gestão de ordem do ecossistema do smartphone virtual</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {apps.map((app, index) => {
          const Icon = app.icon;
          return (
            <div
              key={app.id}
              className={`p-3 bg-slate-950 border rounded-2xl space-y-2 transition-all ${
                app.isHidden ? 'opacity-40 border-slate-800' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${app.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{app.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono uppercase">{app.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {app.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                  {app.isPinned && <Pin className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />}
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono">
                <button
                  onClick={() => toggleInstall(app.id)}
                  className={`px-2 py-1 rounded-lg font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
                    app.isInstalled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                  }`}
                >
                  {app.isInstalled ? <Check className="w-3 h-3" /> : <Download className="w-3 h-3" />}
                  <span>{app.isInstalled ? 'INSTALADO' : 'INSTALAR'}</span>
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleFavorite(app.id)}
                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                      app.isFavorite ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title="Favoritar"
                  >
                    <Star className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => togglePin(app.id)}
                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                      app.isPinned ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title="Fixar na barra"
                  >
                    <Pin className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => toggleHide(app.id)}
                    className={`p-1 rounded-lg border transition-all cursor-pointer ${
                      app.isHidden ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-slate-900 text-slate-500 border-slate-800'
                    }`}
                    title="Ocultar Aplicação"
                  >
                    <EyeOff className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => moveOrder(app.id, 'up')}
                    disabled={index === 0}
                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
                  >
                    <MoveUp className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => moveOrder(app.id, 'down')}
                    disabled={index === apps.length - 1}
                    className="p-1 bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 rounded-lg cursor-pointer disabled:opacity-30"
                  >
                    <MoveDown className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
