import React, { useState } from 'react';
import { 
  Search, Filter, Star, CheckCheck, Trash2, Smartphone, 
  AlertCircle, MessageSquare, PhoneCall, Bell, Shield, RefreshCw, X, Download 
} from 'lucide-react';
import { PortalEvent, EventPriority, Device } from '../types';
import { exportEventsToCsv } from '../lib/csvExporter';

interface TimelineViewProps {
  events: PortalEvent[];
  devices: Device[];
  loading: boolean;
  onRefresh: () => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onMarkRead: (id: string, current: boolean) => void;
  onMarkAllRead: () => void;
  onDeleteEvent: (id: string) => void;
  onClearAll: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  devices,
  loading,
  onRefresh,
  onToggleFavorite,
  onMarkRead,
  onDeleteEvent,
  onMarkAllRead,
  onClearAll
}) => {
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PortalEvent | null>(null);

  // Filter Logic
  const filteredEvents = events.filter((e) => {
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const matches =
        e.title.toLowerCase().includes(q) ||
        e.text.toLowerCase().includes(q) ||
        e.app.toLowerCase().includes(q) ||
        (e.sender && e.sender.toLowerCase().includes(q));
      if (!matches) return false;
    }

    if (selectedApp !== 'all' && e.app !== selectedApp) return false;
    if (selectedPriority !== 'all' && e.priority !== selectedPriority) return false;
    if (selectedType !== 'all' && e.type !== selectedType) return false;
    if (favoritesOnly && !e.favorite) return false;
    if (unreadOnly && e.read) return false;

    return true;
  });

  const appList = Array.from(new Set(events.map((e) => e.app)));

  const getPriorityStyle = (p: EventPriority) => {
    switch (p) {
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'normal':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'low':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-amber-400" />;
      case 'system':
        return <Shield className="w-3.5 h-3.5 text-slate-400" />;
      case 'notification':
      default:
        return <Bell className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  const formatRelativeTime = (ts: number) => {
    const diffSeconds = Math.floor((Date.now() - ts) / 1000);
    if (diffSeconds < 60) return 'Agora mesmo';
    if (diffSeconds < 3600) return `Há ${Math.floor(diffSeconds / 60)} min`;
    if (diffSeconds < 86400) return `Há ${Math.floor(diffSeconds / 3600)} h`;
    return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls & Filters */}
      <div className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por mensagem, remetente, aplicativo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => exportEventsToCsv(filteredEvents)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-500/40 transition-all cursor-pointer shadow-sm shadow-amber-500/10"
              title="Baixar eventos filtrados em formato CSV"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Exportar CSV ({filteredEvents.length})</span>
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/60 cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={onMarkAllRead}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-all cursor-pointer"
              title="Marcar todas como lidas"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Marcar Lidas</span>
            </button>

            <button
              onClick={onClearAll}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium border border-rose-500/30 transition-all cursor-pointer"
              title="Limpar todos os eventos"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          </div>
        </div>

        {/* Filter Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-1 text-xs text-slate-400 mr-2">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filtros:</span>
          </div>

          {/* App Selector */}
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos Apps ({appList.length})</option>
            {appList.map((app) => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>

          {/* Priority Selector */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todas Prioridades</option>
            <option value="critical">🚨 Crítica</option>
            <option value="high">⚠️ Alta</option>
            <option value="normal">🔹 Normal</option>
            <option value="low">▫️ Baixa</option>
          </select>

          {/* Type Selector */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos Tipos</option>
            <option value="notification">Notificação</option>
            <option value="sms">SMS</option>
            <option value="call">Chamada</option>
            <option value="system">Sistema</option>
          </select>

          {/* Favorites Filter */}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              favoritesOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>Favoritos</span>
          </button>

          {/* Unread Filter */}
          <button
            onClick={() => setUnreadOnly(!unreadOnly)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              unreadOnly
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Não Lidos</span>
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <div className="bg-slate-900/50 rounded-2xl p-12 text-center border border-slate-800/60">
            <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-slate-300 font-medium text-base">Nenhum evento encontrado</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              {search || selectedApp !== 'all' || favoritesOnly
                ? 'Tente ajustar os filtros de busca para visualizar outros registros.'
                : 'Aguardando sincronização de novas notificações do aplicativo Android.'}
            </p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className={`group relative rounded-xl p-4 border transition-all cursor-pointer ${
                !evt.read
                  ? 'bg-slate-900 border-indigo-500/30 shadow-md ring-1 ring-indigo-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                  
                  {/* App Type Icon */}
                  <div className="w-10 h-10 rounded-xl bg-slate-800/90 flex items-center justify-center shrink-0 border border-slate-700/60">
                    {getTypeIcon(evt.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {evt.app}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityStyle(evt.priority)}`}>
                        {evt.priority.toUpperCase()}
                      </span>
                      {evt.deviceName && (
                        <span className="flex items-center text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/40">
                          <Smartphone className="w-3 h-3 mr-1" />
                          {evt.deviceName}
                        </span>
                      )}
                      {!evt.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                      )}
                    </div>

                    <h4 className="text-sm font-medium text-slate-100 mt-1 truncate">
                      {evt.title || 'Sem título'}
                    </h4>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {evt.text}
                    </p>

                    <div className="flex items-center space-x-3 mt-2 text-[11px] text-slate-500">
                      <span>{formatRelativeTime(evt.timestamp)}</span>
                      {evt.sender && <span>• Remetente: <strong className="text-slate-400">{evt.sender}</strong></span>}
                    </div>
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onToggleFavorite(evt.id, evt.favorite)}
                    className={`p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer ${
                      evt.favorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-300'
                    }`}
                    title={evt.favorite ? 'Remover dos favoritos' : 'Favoritar evento'}
                  >
                    <Star className={`w-4 h-4 ${evt.favorite ? 'fill-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => onMarkRead(evt.id, evt.read)}
                    className={`p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer ${
                      evt.read ? 'text-slate-600 hover:text-slate-300' : 'text-indigo-400'
                    }`}
                    title={evt.read ? 'Marcar como não lida' : 'Marcar como lida'}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteEvent(evt.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-all cursor-pointer"
                    title="Excluir evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detailed Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                {getTypeIcon(selectedEvent.type)}
              </div>
              <div>
                <span className="text-xs text-indigo-400 font-semibold">{selectedEvent.app}</span>
                <h3 className="text-base font-bold text-slate-100">{selectedEvent.title}</h3>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed max-h-60 overflow-y-auto">
              {selectedEvent.text}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-800/40 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">Pacote Android:</span>
                <span className="text-slate-300 font-mono truncate block">{selectedEvent.packageName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Horário do Disparo:</span>
                <span className="text-slate-300 block">{new Date(selectedEvent.timestamp).toLocaleString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Dispositivo:</span>
                <span className="text-slate-300 block">{selectedEvent.deviceName || selectedEvent.deviceId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Prioridade / Tipo:</span>
                <span className="text-slate-300 block capitalize">{selectedEvent.priority} • {selectedEvent.type}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  onToggleFavorite(selectedEvent.id, selectedEvent.favorite);
                  setSelectedEvent({ ...selectedEvent, favorite: !selectedEvent.favorite });
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium cursor-pointer"
              >
                {selectedEvent.favorite ? '★ Remover Favorito' : '☆ Favoritar'}
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
