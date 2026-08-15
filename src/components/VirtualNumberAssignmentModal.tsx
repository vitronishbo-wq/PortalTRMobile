import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export type VirtualNumberType = 'MOBILE' | 'FIXED' | 'CORPORATE' | 'TEMPORARY' | 'INTERNATIONAL';

export interface VirtualNumberAssignmentData {
  carrier: string;
  country: string;
  type: VirtualNumberType;
  number: string;
  expirationDate: string;
  isActive: boolean;
  sms: boolean;
  voice: boolean;
  sip: boolean;
  ims: boolean;
  esim: boolean;
}

interface VirtualNumberAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VirtualNumberAssignmentData) => void;
}

export const VirtualNumberAssignmentModal: React.FC<VirtualNumberAssignmentModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [carrier, setCarrier] = useState('Unitel');
  const [country, setCountry] = useState('AO (+244)');
  const [type, setType] = useState<VirtualNumberType>('MOBILE');
  const [number, setNumber] = useState('+244 923 000 000');
  const [expirationDate, setExpirationDate] = useState('2027-12-31');
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      carrier,
      country,
      type,
      number,
      expirationDate,
      isActive,
      sms: true,
      voice: true,
      sip: true,
      ims: carrier === 'Unitel' || carrier === 'Africell',
      esim: type === 'MOBILE' || type === 'CORPORATE'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-bold">DID</span>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Atribuir Número Virtual
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Operadora (Select)
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="Unitel">Unitel Angola</option>
              <option value="Movicel">Movicel Telecom</option>
              <option value="Africell">Africell Angola</option>
              <option value="WebRTC-Core">WebRTC Core / CPaaS Gateway</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              País / Prefixo (Select)
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="AO (+244)">Angola (+244)</option>
              <option value="PT (+351)">Portugal (+351)</option>
              <option value="MZ (+258)">Moçambique (+258)</option>
              <option value="BR (+55)">Brasil (+55)</option>
              <option value="US (+1)">Estados Unidos (+1)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Tipo (Select)
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VirtualNumberType)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
            >
              <option value="MOBILE">MOBILE (Móvel)</option>
              <option value="FIXED">FIXED (Fixo)</option>
              <option value="CORPORATE">CORPORATE (Corporativo / PBX)</option>
              <option value="TEMPORARY">TEMPORARY (Temporário / 2FA)</option>
              <option value="INTERNATIONAL">INTERNATIONAL (Internacional)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Número E.164 (Input)
            </label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-cyan-300 font-bold outline-none focus:border-cyan-500"
              placeholder="+244 923 000 000"
              required
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
              Data de Expiração (DatePicker)
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-slate-200 block text-xs">Ativar Imediatamente</span>
              <span className="text-[10px] text-slate-500">Provisionar roteamento e canal SIP ativo</span>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                isActive ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <div className="bg-white w-3.5 h-3.5 rounded-full shadow-md" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold inline-flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Guardar & Ativar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
