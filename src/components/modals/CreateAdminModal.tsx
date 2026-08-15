import React, { useState } from 'react';
import { AdminProvisioningEngine, AdminAccount } from '../../engine/adminProvisioningEngine';
import { UserRole } from '../../engine/permissionEngine';
import { UserPlus, Shield, X, Key, Smartphone, Calendar, Check } from 'lucide-react';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (admin: AdminAccount) => void;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [secretCode, setSecretCode] = useState('*#ADMIN#');
  const [pin, setPin] = useState('1234');
  const [permissions, setPermissions] = useState<string[]>(['TELECOM', 'DEVICES']);
  const [authorizedDevice, setAuthorizedDevice] = useState('samsung_s22_primary');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const expiresAt = expiresInDays ? Date.now() + parseInt(expiresInDays, 10) * 86400000 : undefined;

    const created = AdminProvisioningEngine.createAdmin({
      name,
      email,
      role,
      secretCode,
      pin,
      permissions,
      authorizedDevice,
      trustedDevices: [authorizedDevice || 'node_master'],
      expiresAt,
      status: 'ACTIVE'
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onSuccess) onSuccess(created);
      onClose();
    }, 800);
  };

  const togglePerm = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono text-slate-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Provisionamento de Administrador (*#CREATEADMIN#)
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário Denso Inline */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">E-mail Operacional</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: joao@portaltr.ao"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Função / Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white focus:border-indigo-500 outline-none"
              >
                <option value="ROOT_ADMIN">Root Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="OPERATOR">Operator</option>
                <option value="SUPPORT">Support</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Código Secreto (USSD)</label>
              <input
                type="text"
                required
                value={secretCode}
                onChange={e => setSecretCode(e.target.value)}
                placeholder="*#JOAO2026#"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-400 font-bold focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">PIN Numérico</label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="4 a 6 dígitos"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Dispositivo Autorizado</label>
              <input
                type="text"
                value={authorizedDevice}
                onChange={e => setAuthorizedDevice(e.target.value)}
                placeholder="samsung_s22_primary"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">Expiração (Dias)</label>
              <input
                type="number"
                value={expiresInDays}
                onChange={e => setExpiresInDays(e.target.value)}
                placeholder="30"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1.5">Permissões Módulos</label>
            <div className="flex flex-wrap gap-2">
              {['TELECOM', 'DEVICES', 'SMS', 'CALLS', 'AUDIT', 'BANKING'].map(perm => (
                <button
                  type="button"
                  key={perm}
                  onClick={() => togglePerm(perm)}
                  className={`px-2.5 py-1 rounded border text-[11px] font-bold transition ${
                    permissions.includes(perm)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-950 text-slate-500 border-slate-800'
                  }`}
                >
                  {perm}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Botões */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saved}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-lg shadow-indigo-500/20"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Shield className="w-4 h-4" />}
              <span>{saved ? 'Provisionado!' : 'Salvar Administrador'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
