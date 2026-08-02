import React from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'motion/react';
import { Trash2, Star, MessageSquare, PhoneCall, Smartphone } from 'lucide-react';

export interface DeviceEvent {
  id: string;
  type: 'sms' | 'whatsapp' | 'system' | 'call';
  title: string;
  detail: string;
  timestamp: string;
  isFavorite?: boolean;
}

interface SwipeableEventCardProps {
  event: DeviceEvent;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const SwipeableEventCard: React.FC<SwipeableEventCardProps> = ({
  event,
  onDelete,
  onToggleFavorite
}) => {
  const x = useMotionValue(0);

  // Dynamic background opacity based on drag distance
  const favoriteBgOpacity = useTransform(x, [0, 80], [0, 1]);
  const deleteBgOpacity = useTransform(x, [-80, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 70) {
      onToggleFavorite(event.id);
    } else if (info.offset.x < -70) {
      onDelete(event.id);
    }
  };

  const getEventIcon = () => {
    switch (event.type) {
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-emerald-300 shrink-0" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'call':
        return <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 touch-pan-y select-none w-full max-w-full">
      {/* Background Actions Layer revealed on swipe */}
      <div className="absolute inset-0 flex justify-between items-center px-4 font-mono text-xs font-bold pointer-events-none">
        {/* Favorite action reveal (Swiping Right) */}
        <motion.div
          style={{ opacity: favoriteBgOpacity }}
          className="flex items-center space-x-1.5 text-amber-400 font-bold"
        >
          <Star className={`w-4 h-4 ${event.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{event.isFavorite ? 'Remover' : 'Favoritar'}</span>
        </motion.div>

        {/* Delete action reveal (Swiping Left) */}
        <motion.div
          style={{ opacity: deleteBgOpacity }}
          className="flex items-center space-x-1.5 text-rose-400 font-bold ml-auto"
        >
          <span>Excluir</span>
          <Trash2 className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Swipeable Foreground Card */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className="relative z-10 bg-slate-950 py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-xl border border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing transition-colors hover:border-slate-700 w-full max-w-full overflow-hidden"
      >
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0 pr-2 flex-1">
          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
            {getEventIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="font-bold text-slate-200 text-xs truncate block max-w-full leading-tight">
                {event.title}
              </span>
              {event.isFavorite && (
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
              )}
            </div>
            {event.detail && event.detail.toLowerCase() !== event.title.toLowerCase() && (
              <span className="text-slate-400 text-[10px] sm:text-[11px] truncate block mt-0.5 max-w-full leading-tight">
                {event.detail.replace(new RegExp(`^${event.title}[:\\s-]*`, 'i'), '') || event.detail}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0 space-y-0.5 pl-2 font-mono">
          <span className="text-[10px] text-slate-500 font-mono truncate leading-none">{event.timestamp}</span>
          <span className="text-[9px] text-slate-600 font-mono hidden sm:inline leading-none">👈 Deslizar 👉</span>
        </div>
      </motion.div>
    </div>
  );
};
