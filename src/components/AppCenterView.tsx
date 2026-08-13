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
  ExternalLink,
  Smartphone
} from 'lucide-react';

export interface AppCenterItem {
  id: string;
  name: string;
  category: string;
  icon: any;
  color: string;
  isFavorite: boolean;
  isPinned: boolean;
}

interface AppCenterViewProps {
  onOpenApp?: (appId: string) => void;
}

export const AppCenterView: React.FC<AppCenterViewProps> = ({ onOpenApp }) => {
  const [apps, setApps] = useState<AppCenterItem[]>([
    { id: 'sms', name: 'SMS Cloud', category: 'Comunicação', icon: MessageSquare, color: 'text-cyan-400', isFavorite: true, isPinned: true },
    { id: 'chamadas', name: 'Chamadas / Dial', category: 'Telefonia', icon: PhoneCall, color: 'text-emerald-400', isFavorite: true, isPinned: true },
    { id: 'contactos', name: 'Contactos', category: 'Telefonia', icon: Contact, color: 'text-indigo-400', isFavorite: false, isPinned: true },
    { id: 'whatsapp', name: 'WhatsApp Web Cloud', category: 'Redes Sociais', icon: Send, color: 'text-emerald-500', isFavorite: true, isPinned: false },
    { id: 'telegram', name: 'Telegram Bridge', category: 'Redes Sociais', icon: Send, color: 'text-cyan-500', isFavorite: true, isPinned: false },
    { id: 'instagram', name: 'Instagram Direct', category: 'Redes Sociais', icon: Camera, color: 'text-rose-400', isFavorite: false, isPinned: false },
    { id: 'facebook', name: 'Facebook Messenger', category: 'Redes Sociais', icon: Share2, color: 'text-blue-500', isFavorite: false, isPinned: false },
    { id: 'banking', name: 'Banking Hub', category: 'Finanças', icon: Landmark, color: 'text-amber-400', isFavorite: true, isPinned: true },
    { id: 'email', name: 'E-mail Empresarial', category: 'Produtividade', icon: Mail, color: 'text-purple-400', isFavorite: false, isPinned: false },
    { id: 'calendario', name: 'Calendário de Eventos', category: 'Produtividade', icon: Calendar, color: 'text-sky-400', isFavorite: false, isPinned: false },
    { id: 'notas', name: 'Bloco de Notas Cloud', category: 'Produtividade', icon: FileText, color: 'text-amber-300', isFavorite: false, isPinned: false },
    { id: 'ficheiros', name: 'Gestor de Ficheiros', category: 'Sistema', icon: FolderArchive, color: 'text-slate-300', isFavorite: false, isPinned: false }
  ]);

  const toggleFavorite = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
  };

  const togglePin = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  };

  const handleOpen = (id: string) => {
    if (onOpenApp) {
      onOpenApp(id);
    } else {
      alert(`A abrir aplicação: ${id.toUpperCase()}`);
    }
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
              <span>APP CENTER — CENTRAL DE APLICAÇÕES NATIVAS</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-mono">
                CLOUD NATIVE
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Acesso direto às aplicações do ecossistema: Abrir, Fixar e Favoritar</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {apps.map((app) => {
          const Icon = app.icon;
          return (
            <div
              key={app.id}
              className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl space-y-2 transition-all"
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

              {/* ACTION BAR — ABRIR, FIXAR, FAVORITAR */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px] font-mono">
                <button
                  onClick={() => handleOpen(app.id)}
                  className="px-3 py-1.5 rounded-lg font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-indigo-600/20"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>ABRIR</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => togglePin(app.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      app.isPinned
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                    title="Fixar na barra"
                  >
                    <Pin className="w-3 h-3" />
                    <span>{app.isPinned ? 'FIXADO' : 'FIXAR'}</span>
                  </button>

                  <button
                    onClick={() => toggleFavorite(app.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                      app.isFavorite
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                    }`}
                    title="Favoritar"
                  >
                    <Star className="w-3 h-3" />
                    <span>{app.isFavorite ? 'FAVORITO' : 'FAVORITAR'}</span>
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
