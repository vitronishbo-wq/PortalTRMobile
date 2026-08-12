import React, { useState, useEffect } from 'react';
import {
  virtualPhoneEngine,
  VirtualPhoneState,
  TelecomProviderType,
  VirtualPhoneContact,
  VirtualPhoneSmsMessage,
  VirtualPhoneCallLog,
  VirtualPhoneDeviceMeshNode,
  VirtualPhoneVirtualAppRuntime
} from '../engine/virtualPhoneEngine';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  Disc,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  Shield,
  Smartphone,
  Server,
  Activity,
  QrCode,
  Globe,
  Radio,
  Cpu,
  Lock,
  Key,
  Users,
  Check,
  X,
  Volume2
} from 'lucide-react';

export const VirtualPhoneCloudWorkspace: React.FC = () => {
  const [vp, setVp] = useState<VirtualPhoneState>(virtualPhoneEngine.getState());
  const [activeTab, setActiveTab] = useState<
    'phone' | 'sms' | 'contacts' | 'identity' | 'telecom' | 'mesh' | 'agent' | 'runtime'
  >('phone');

  // Phone keypad dialer state
  const [dialNumber, setDialNumber] = useState<string>('');

  // SMS input state
  const [smsTarget, setSmsTarget] = useState<string>('');
  const [smsBody, setSmsBody] = useState<string>('');

  // Contact modal / form state
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactNumber, setNewContactNumber] = useState<string>('');

  // Pairing Modal state
  const [newDevName, setNewDevName] = useState<string>('');
  const [newDevPlatform, setNewDevPlatform] = useState<'android' | 'iphone' | 'ipad' | 'web' | 'windows' | 'macos' | 'linux'>('android');

  // App launch state
  const [appPkg, setAppPkg] = useState<string>('com.whatsapp.w4b');
  const [appNameInput, setAppNameInput] = useState<string>('WhatsApp Business');

  // MFA code state
  const [mfaCodeInput, setMfaCodeInput] = useState<string>('');

  useEffect(() => {
    const unsubscribe = virtualPhoneEngine.subscribe((state) => {
      setVp(state);
    });
    return () => unsubscribe();
  }, []);

  const handleDialPress = (digit: string) => {
    setDialNumber((prev) => prev + digit);
  };

  const handleStartCall = () => {
    const num = dialNumber || vp.msisdn;
    virtualPhoneEngine.startCall(num);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsTarget || !smsBody) return;
    virtualPhoneEngine.sendSms(smsTarget, smsBody);
    setSmsBody('');
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactNumber) return;
    virtualPhoneEngine.addContact(newContactName, newContactNumber);
    setNewContactName('');
    setNewContactNumber('');
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName) return;
    virtualPhoneEngine.addDeviceNode(newDevName, newDevPlatform);
    setNewDevName('');
  };

  const handleLaunchApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appPkg || !appNameInput) return;
    virtualPhoneEngine.launchVirtualApp(appPkg, appNameInput);
  };

  return (
    <div className="w-full min-h-screen bg-neutral-950 text-neutral-100 font-mono text-xs p-2 select-none">
      {/* HEADER CONTROL BAR - ZERO CARDS, ZERO EXPLANATIONS */}
      <div className="w-full border-b border-neutral-800 pb-2 mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold uppercase tracking-wider text-[11px]">
            PORTALTR CLOUD PHONE
          </span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-300 font-bold">{vp.msisdn}</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-neutral-900 border border-neutral-700 text-emerald-400 uppercase">
            {vp.provider}
          </span>
          <span className="px-1.5 py-0.2 text-[10px] bg-neutral-900 border border-neutral-700 text-cyan-400 uppercase">
            {vp.role}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => virtualPhoneEngine.setProviderModal(true)}
            className="px-2 py-1 text-[10px] border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 uppercase font-bold"
          >
            PROVIDER
          </button>
          <button
            onClick={() => virtualPhoneEngine.setPairingModal(true)}
            className="px-2 py-1 text-[10px] border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 uppercase font-bold"
          >
            PAIR DEVICE
          </button>
          <button
            onClick={() => virtualPhoneEngine.setMfaModal(true)}
            className="px-2 py-1 text-[10px] border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-emerald-400 uppercase font-bold"
          >
            MFA ({vp.mfaEnabled ? 'ON' : 'OFF'})
          </button>
        </div>
      </div>

      {/* OPERATIONAL NAVIGATION TABS - INLINE DENSE BAR */}
      <div className="w-full flex border-b border-neutral-800 mb-2 overflow-x-auto text-[11px]">
        {(
          [
            ['phone', 'VOIP PHONE'],
            ['sms', 'SMS & MESSAGING'],
            ['contacts', 'CONTACTS & LOGS'],
            ['mesh', 'DEVICE MESH'],
            ['agent', 'ANDROID AGENT'],
            ['runtime', 'APP RUNTIME'],
            ['identity', 'IDENTITY & RBAC'],
            ['telecom', 'TELECOM & OPERATORS']
          ] as const
        ).map(([tabId, label]) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`px-3 py-1.5 font-bold uppercase tracking-wider border-b-2 whitespace-nowrap ${
              activeTab === tabId
                ? 'border-emerald-500 text-emerald-400 bg-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: VOIP CLOUD PHONE */}
      {activeTab === 'phone' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* DIALER KEYPAD & IN-CALL STATE */}
          <div className="md:col-span-5 border border-neutral-800 bg-neutral-950 p-2">
            <div className="w-full mb-2 border border-neutral-800 bg-black p-2 flex items-center justify-between">
              <input
                type="text"
                value={dialNumber}
                onChange={(e) => setDialNumber(e.target.value)}
                placeholder="+244..."
                className="bg-transparent text-emerald-400 text-sm font-bold w-full outline-none"
              />
              {dialNumber && (
                <button
                  onClick={() => setDialNumber('')}
                  className="px-1.5 py-0.5 text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-100"
                >
                  CLR
                </button>
              )}
            </div>

            {/* DTMF KEYPAD GRID */}
            <div className="grid grid-cols-3 gap-1 mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDialPress(digit)}
                  className="py-2 bg-neutral-900 border border-neutral-800 text-neutral-100 hover:border-emerald-500 hover:text-emerald-400 font-bold text-sm"
                >
                  {digit}
                </button>
              ))}
            </div>

            {/* CALL CONTROLS */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              {vp.voice.state === 'idle' ? (
                <button
                  onClick={handleStartCall}
                  className="col-span-2 py-2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-bold uppercase hover:bg-emerald-900 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" /> DIAL CALL
                </button>
              ) : (
                <button
                  onClick={() => virtualPhoneEngine.endCall()}
                  className="col-span-2 py-2 bg-rose-950 border border-rose-600 text-rose-400 font-bold uppercase hover:bg-rose-900 flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" /> HANGUP
                </button>
              )}
            </div>

            {/* ACTIVE CALL STATE CONTROL TABLE */}
            <table className="w-full text-[11px] border-collapse border border-neutral-800">
              <tbody>
                <tr className="border-b border-neutral-800">
                  <td className="p-1 text-neutral-500 uppercase">STATE</td>
                  <td className="p-1 text-emerald-400 font-bold uppercase">{vp.voice.state}</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-1 text-neutral-500 uppercase">REMOTE</td>
                  <td className="p-1 font-bold">{vp.voice.remoteNumber || 'NONE'}</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="p-1 text-neutral-500 uppercase">DURATION</td>
                  <td className="p-1 font-bold">{vp.voice.durationSeconds}s</td>
                </tr>
                <tr>
                  <td className="p-1 text-neutral-500 uppercase">ACTIONS</td>
                  <td className="p-1 flex gap-1">
                    <button
                      onClick={() => virtualPhoneEngine.toggleMute()}
                      className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase ${
                        vp.voice.isMuted
                          ? 'bg-amber-950 border-amber-600 text-amber-400'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      MUTE
                    </button>
                    <button
                      onClick={() => virtualPhoneEngine.toggleHold()}
                      className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase ${
                        vp.voice.isHeld
                          ? 'bg-amber-950 border-amber-600 text-amber-400'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      HOLD
                    </button>
                    <button
                      onClick={() => virtualPhoneEngine.toggleRecord()}
                      className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase ${
                        vp.voice.isRecording
                          ? 'bg-rose-950 border-rose-600 text-rose-400'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      REC
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VOICEMAIL & SPEED DIAL TABLE */}
          <div className="md:col-span-7 border border-neutral-800 bg-neutral-950 p-2">
            <div className="text-emerald-400 font-bold uppercase mb-1 border-b border-neutral-800 pb-1">
              VOICEMAIL & SPEED DIAL REGISTRY
            </div>
            <table className="w-full text-left text-[11px] border-collapse border border-neutral-800 mb-2">
              <thead>
                <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                  <th className="p-1">CONTACT</th>
                  <th className="p-1">MSISDN</th>
                  <th className="p-1">SPEED DIAL</th>
                  <th className="p-1">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {vp.contacts.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                    <td className="p-1 font-bold">{c.name}</td>
                    <td className="p-1">{c.number}</td>
                    <td className="p-1 text-cyan-400">#{c.speedDial || '-'}</td>
                    <td className="p-1">
                      <button
                        onClick={() => {
                          setDialNumber(c.number);
                          virtualPhoneEngine.startCall(c.number);
                        }}
                        className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-400 text-[10px] font-bold uppercase hover:bg-emerald-900"
                      >
                        CALL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-emerald-400 font-bold uppercase mb-1 border-b border-neutral-800 pb-1">
              VOICEMAIL RECORDINGS
            </div>
            <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
              <thead>
                <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                  <th className="p-1">CALLER</th>
                  <th className="p-1">TIMESTAMP</th>
                  <th className="p-1">DURATION</th>
                  <th className="p-1">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {vp.voicemails.map((vm) => (
                  <tr key={vm.id} className="border-b border-neutral-800">
                    <td className="p-1 font-bold">{vm.caller}</td>
                    <td className="p-1 text-neutral-400">{new Date(vm.timestamp).toLocaleTimeString()}</td>
                    <td className="p-1">{vm.durationSeconds}s</td>
                    <td className="p-1">
                      <button
                        onClick={() => alert(`PLAY AUDIO STREAM: ${vm.id}`)}
                        className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-cyan-400 text-[10px] font-bold uppercase"
                      >
                        PLAY
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SMS & MESSAGING */}
      {activeTab === 'sms' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* SMS COMPOSER FORM */}
          <div className="md:col-span-4 border border-neutral-800 bg-neutral-950 p-2">
            <div className="text-emerald-400 font-bold uppercase mb-2 border-b border-neutral-800 pb-1">
              SEND SMS GATEWAY
            </div>
            <form onSubmit={handleSendSms} className="flex flex-col gap-2">
              <div>
                <label className="text-neutral-500 uppercase block mb-1">RECIPIENT MSISDN</label>
                <input
                  type="text"
                  value={smsTarget}
                  onChange={(e) => setSmsTarget(e.target.value)}
                  placeholder="+244923000000"
                  className="w-full bg-black border border-neutral-800 p-1.5 text-emerald-400 outline-none"
                />
              </div>
              <div>
                <label className="text-neutral-500 uppercase block mb-1">MESSAGE PAYLOAD</label>
                <textarea
                  rows={4}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  placeholder="Texto do SMS..."
                  className="w-full bg-black border border-neutral-800 p-1.5 text-neutral-100 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-bold uppercase hover:bg-emerald-900"
              >
                DISPATCH SMS
              </button>
            </form>
          </div>

          {/* SMS THREADS & MESSAGES TABLE */}
          <div className="md:col-span-8 border border-neutral-800 bg-neutral-950 p-2">
            <div className="text-emerald-400 font-bold uppercase mb-1 border-b border-neutral-800 pb-1">
              SMS OUTBOX / INBOX LOGS
            </div>
            <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
              <thead>
                <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                  <th className="p-1">DIR</th>
                  <th className="p-1">SENDER</th>
                  <th className="p-1">RECIPIENT</th>
                  <th className="p-1">TEXT</th>
                  <th className="p-1">STATUS</th>
                  <th className="p-1">TIME</th>
                </tr>
              </thead>
              <tbody>
                {vp.smsMessages.map((m) => (
                  <tr key={m.id} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                    <td
                      className={`p-1 font-bold uppercase ${
                        m.direction === 'inbound' ? 'text-cyan-400' : 'text-emerald-400'
                      }`}
                    >
                      {m.direction}
                    </td>
                    <td className="p-1">{m.sender}</td>
                    <td className="p-1">{m.recipient}</td>
                    <td className="p-1 text-neutral-200">{m.text}</td>
                    <td className="p-1 text-emerald-400 font-bold">{m.status}</td>
                    <td className="p-1 text-neutral-500">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTACTS & CALL HISTORY */}
      {activeTab === 'contacts' && (
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-2">
          {/* CONTACT ADD FORM & DENSE TABLE */}
          <div className="md:col-span-6 border border-neutral-800 bg-neutral-950 p-2">
            <div className="text-emerald-400 font-bold uppercase mb-2 border-b border-neutral-800 pb-1">
              CONTACT REGISTRY
            </div>
            <form onSubmit={handleAddContact} className="flex gap-1 mb-2">
              <input
                type="text"
                placeholder="NOME"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="w-1/2 bg-black border border-neutral-800 p-1 text-neutral-100 outline-none"
              />
              <input
                type="text"
                placeholder="MSISDN"
                value={newContactNumber}
                onChange={(e) => setNewContactNumber(e.target.value)}
                className="w-1/2 bg-black border border-neutral-800 p-1 text-emerald-400 outline-none"
              />
              <button
                type="submit"
                className="px-2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-bold uppercase"
              >
                ADD
              </button>
            </form>

            <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
              <thead>
                <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                  <th className="p-1">NOME</th>
                  <th className="p-1">MSISDN</th>
                  <th className="p-1">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {vp.contacts.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                    <td className="p-1 font-bold">{c.name}</td>
                    <td className="p-1 text-emerald-400">{c.number}</td>
                    <td className="p-1 flex gap-1">
                      <button
                        onClick={() => {
                          setDialNumber(c.number);
                          setActiveTab('phone');
                          virtualPhoneEngine.startCall(c.number);
                        }}
                        className="px-1 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-400 text-[10px] font-bold uppercase"
                      >
                        CALL
                      </button>
                      <button
                        onClick={() => {
                          setSmsTarget(c.number);
                          setActiveTab('sms');
                        }}
                        className="px-1 py-0.5 bg-neutral-900 border border-neutral-700 text-cyan-400 text-[10px] font-bold uppercase"
                      >
                        SMS
                      </button>
                      <button
                        onClick={() => virtualPhoneEngine.deleteContact(c.id)}
                        className="px-1 py-0.5 bg-rose-950 border border-rose-600 text-rose-400 text-[10px] font-bold uppercase"
                      >
                        DEL
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CALL HISTORY TABLE */}
          <div className="md:col-span-6 border border-neutral-800 bg-neutral-950 p-2">
            <div className="text-emerald-400 font-bold uppercase mb-2 border-b border-neutral-800 pb-1">
              CALL HISTORY LOG
            </div>
            <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
              <thead>
                <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                  <th className="p-1">TYPE</th>
                  <th className="p-1">PEER</th>
                  <th className="p-1">PROVIDER</th>
                  <th className="p-1">DURATION</th>
                  <th className="p-1">TIME</th>
                </tr>
              </thead>
              <tbody>
                {vp.callHistory.map((ch) => (
                  <tr key={ch.id} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                    <td
                      className={`p-1 font-bold uppercase ${
                        ch.type === 'incoming'
                          ? 'text-cyan-400'
                          : ch.type === 'outgoing'
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {ch.type}
                    </td>
                    <td className="p-1 font-bold">{ch.peerNumber}</td>
                    <td className="p-1 text-neutral-400 uppercase">{ch.provider}</td>
                    <td className="p-1">{ch.durationSeconds}s</td>
                    <td className="p-1 text-neutral-500">{new Date(ch.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEVICE MESH */}
      {activeTab === 'mesh' && (
        <div className="w-full border border-neutral-800 bg-neutral-950 p-2">
          <div className="flex items-center justify-between mb-2 border-b border-neutral-800 pb-1">
            <span className="text-emerald-400 font-bold uppercase">DEVICE MESH REGISTRY</span>
            <button
              onClick={() => virtualPhoneEngine.setPairingModal(true)}
              className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-400 text-[10px] font-bold uppercase"
            >
              PAIR NEW DEVICE
            </button>
          </div>

          <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                <th className="p-1">DEVICE ID</th>
                <th className="p-1">NAME</th>
                <th className="p-1">PLATFORM</th>
                <th className="p-1">TRUST SCORE</th>
                <th className="p-1">STATUS</th>
                <th className="p-1">HANDOVER</th>
                <th className="p-1">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {vp.devicesMesh.map((dev) => (
                <tr key={dev.deviceId} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="p-1 font-bold text-neutral-300">{dev.deviceId}</td>
                  <td className="p-1">{dev.name}</td>
                  <td className="p-1 uppercase text-cyan-400">{dev.platform}</td>
                  <td className="p-1 font-bold text-emerald-400">{dev.trustScore}%</td>
                  <td className="p-1">
                    <span className={`px-1 text-[10px] uppercase ${dev.isOnline ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-neutral-900 text-neutral-500'}`}>
                      {dev.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </td>
                  <td className="p-1">
                    {dev.hasActiveHandover ? (
                      <span className="px-1 text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800 uppercase font-bold">
                        ACTIVE SESSION
                      </span>
                    ) : (
                      <button
                        onClick={() => virtualPhoneEngine.handoverCall(dev.deviceId)}
                        className="px-1 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] uppercase hover:border-cyan-500 hover:text-cyan-400"
                      >
                        TRANSFER
                      </button>
                    )}
                  </td>
                  <td className="p-1">
                    <button
                      onClick={() => virtualPhoneEngine.revokeDeviceNode(dev.deviceId)}
                      className="px-1.5 py-0.5 bg-rose-950 border border-rose-600 text-rose-400 text-[10px] font-bold uppercase"
                    >
                      REVOKE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: ANDROID AGENT */}
      {activeTab === 'agent' && (
        <div className="w-full border border-neutral-800 bg-neutral-950 p-2">
          <div className="text-emerald-400 font-bold uppercase mb-2 border-b border-neutral-800 pb-1">
            ANDROID NATIVE AGENT TELEMETRY & CAPABILITIES
          </div>

          <table className="w-full text-left text-[11px] border-collapse border border-neutral-800 mb-2">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                <th className="p-1">CAPABILITY MODULE</th>
                <th className="p-1">STATUS</th>
                <th className="p-1">PERMISSION</th>
                <th className="p-1">AUTO-HEAL</th>
                <th className="p-1">COMMAND TRIGGER</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['NOTIFICATION LISTENER', 'ACTIVE', 'GRANTED', 'ENABLED', 'PING_LISTENER'],
                ['SMS GATEWAY RECEIVER', 'ACTIVE', 'GRANTED', 'ENABLED', 'FLUSH_SMS_QUEUE'],
                ['CALL LISTENER & DIALER', 'ACTIVE', 'GRANTED', 'ENABLED', 'SYNC_CALL_STATE'],
                ['ACCESSIBILITY ENGINE', 'ACTIVE', 'GRANTED', 'ENABLED', 'RESTART_SERVICE'],
                ['TELEMETRY & BATTERY', 'HEALTHY', 'GRANTED', 'ENABLED', 'FORCE_HEARTBEAT']
              ].map(([mod, status, perm, heal, cmd]) => (
                <tr key={mod} className="border-b border-neutral-800">
                  <td className="p-1 font-bold">{mod}</td>
                  <td className="p-1 text-emerald-400 font-bold">{status}</td>
                  <td className="p-1 text-cyan-400">{perm}</td>
                  <td className="p-1 text-neutral-400">{heal}</td>
                  <td className="p-1">
                    <button
                      onClick={() => alert(`EXECUTED AGENT COMMAND: ${cmd}`)}
                      className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-emerald-400 text-[10px] font-bold uppercase"
                    >
                      {cmd}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: APP RUNTIME (VIRTUAL SMARTPHONE) */}
      {activeTab === 'runtime' && (
        <div className="w-full border border-neutral-800 bg-neutral-950 p-2">
          <div className="flex items-center justify-between mb-2 border-b border-neutral-800 pb-1">
            <span className="text-emerald-400 font-bold uppercase">ANDROID VIRTUAL RUNTIME CONTAINERS</span>
            <button
              onClick={() => virtualPhoneEngine.setAppLaunchModal(true)}
              className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-400 text-[10px] font-bold uppercase"
            >
              LAUNCH VIRTUAL APP
            </button>
          </div>

          <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                <th className="p-1">CONTAINER ID</th>
                <th className="p-1">APP NAME</th>
                <th className="p-1">PACKAGE</th>
                <th className="p-1">STATUS</th>
                <th className="p-1">CPU</th>
                <th className="p-1">RAM</th>
                <th className="p-1">FPS</th>
                <th className="p-1">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {vp.virtualApps.map((app) => (
                <tr key={app.containerId} className="border-b border-neutral-800 hover:bg-neutral-900/50">
                  <td className="p-1 font-bold text-neutral-300">{app.containerId}</td>
                  <td className="p-1 font-bold text-emerald-400">{app.appName}</td>
                  <td className="p-1 text-neutral-400">{app.packageName}</td>
                  <td className="p-1">
                    <span className={`px-1 text-[10px] uppercase font-bold ${app.status === 'running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-1">{app.cpuUsagePct}%</td>
                  <td className="p-1">{app.memoryMb} MB</td>
                  <td className="p-1 text-cyan-400">{app.fps}</td>
                  <td className="p-1 flex gap-1">
                    {app.status === 'running' ? (
                      <button
                        onClick={() => virtualPhoneEngine.stopVirtualApp(app.containerId)}
                        className="px-1 py-0.5 bg-neutral-900 border border-neutral-700 text-amber-400 text-[10px] uppercase font-bold"
                      >
                        STOP
                      </button>
                    ) : (
                      <button
                        onClick={() => virtualPhoneEngine.launchVirtualApp(app.packageName, app.appName)}
                        className="px-1 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-400 text-[10px] uppercase font-bold"
                      >
                        START
                      </button>
                    )}
                    <button
                      onClick={() => virtualPhoneEngine.killVirtualApp(app.containerId)}
                      className="px-1 py-0.5 bg-rose-950 border border-rose-600 text-rose-400 text-[10px] uppercase font-bold"
                    >
                      KILL
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 7: IDENTITY & RBAC */}
      {activeTab === 'identity' && (
        <div className="w-full border border-neutral-800 bg-neutral-950 p-2">
          <div className="text-emerald-400 font-bold uppercase mb-2 border-b border-neutral-800 pb-1">
            IDENTITY ENGINE & AUTHENTICATION AUDIT
          </div>

          <table className="w-full text-left text-[11px] border-collapse border border-neutral-800 mb-2">
            <tbody>
              <tr className="border-b border-neutral-800">
                <td className="p-1 text-neutral-500 uppercase w-1/4">FIREBASE UID</td>
                <td className="p-1 font-bold text-neutral-200">{vp.uid}</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="p-1 text-neutral-500 uppercase">IDENTITY HASH</td>
                <td className="p-1 font-mono text-cyan-400">{vp.identityHash}</td>
              </tr>
              <tr className="border-b border-neutral-800">
                <td className="p-1 text-neutral-500 uppercase">ACTIVE ROLE</td>
                <td className="p-1">
                  <select
                    value={vp.role}
                    onChange={(e) => virtualPhoneEngine.setRole(e.target.value as any)}
                    className="bg-black border border-neutral-800 text-emerald-400 font-bold uppercase p-0.5"
                  >
                    <option value="founder">FOUNDER (ROOT AUTHORITY)</option>
                    <option value="admin">ADMINISTRATOR</option>
                    <option value="user">STANDARD USER</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td className="p-1 text-neutral-500 uppercase">MFA ENFORCEMENT</td>
                <td className="p-1">
                  <button
                    onClick={() => virtualPhoneEngine.toggleMFA(!vp.mfaEnabled)}
                    className={`px-2 py-0.5 border text-[10px] font-bold uppercase ${
                      vp.mfaEnabled ? 'bg-emerald-950 border-emerald-600 text-emerald-400' : 'bg-rose-950 border-rose-600 text-rose-400'
                    }`}
                  >
                    {vp.mfaEnabled ? 'ENFORCED' : 'DISABLED'}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 8: TELECOM & OPERATORS */}
      {activeTab === 'telecom' && (
        <div className="w-full border border-neutral-800 bg-neutral-950 p-2">
          <div className="text-emerald-400 font-bold uppercase mb-2 border-b border-neutral-800 pb-1">
            TELECOM PROVIDER INTEGRATIONS & WEBHOOKS
          </div>

          <table className="w-full text-left text-[11px] border-collapse border border-neutral-800 mb-2">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                <th className="p-1">OPERATOR / ADAPTER</th>
                <th className="p-1">TYPE</th>
                <th className="p-1">STATUS</th>
                <th className="p-1">SELECT PROVIDER</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['UNITEL ANGOLA', 'unitel', 'DIRECT IMS / API'],
                ['AFRICELL ANGOLA', 'africell', 'SIP TRUNK'],
                ['MOVICEL ANGOLA', 'movicel', 'SMPP / VOICE'],
                ['SIP / IMS GENERIC', 'sip_ims', 'CUSTOM SIP'],
                ['TWILIO CPaaS', 'twilio', 'GLOBAL REST API'],
                ['LOCAL ANDROID AGENT', 'local_agent', 'HARDWARE GATEWAY']
              ].map(([label, providerKey, typeDesc]) => (
                <tr key={providerKey} className="border-b border-neutral-800">
                  <td className="p-1 font-bold">{label}</td>
                  <td className="p-1 text-neutral-400">{typeDesc}</td>
                  <td className="p-1">
                    <span
                      className={`px-1 text-[10px] uppercase font-bold ${
                        vp.provider === providerKey ? 'text-emerald-400' : 'text-neutral-500'
                      }`}
                    >
                      {vp.provider === providerKey ? 'ACTIVE' : 'STANDBY'}
                    </span>
                  </td>
                  <td className="p-1">
                    <button
                      onClick={() => virtualPhoneEngine.setProvider(providerKey as TelecomProviderType)}
                      className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase ${
                        vp.provider === providerKey
                          ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                          : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                      }`}
                    >
                      CONNECT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-emerald-400 font-bold uppercase mb-1 border-b border-neutral-800 pb-1">
            REGISTERED TELECOM WEBHOOKS
          </div>
          <table className="w-full text-left text-[11px] border-collapse border border-neutral-800">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 uppercase">
                <th className="p-1">EVENT</th>
                <th className="p-1">WEBHOOK URL</th>
                <th className="p-1">STATE</th>
                <th className="p-1">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {vp.webhooks.map((wh) => (
                <tr key={wh.id} className="border-b border-neutral-800">
                  <td className="p-1 font-bold text-cyan-400">{wh.event}</td>
                  <td className="p-1 text-neutral-300">{wh.url}</td>
                  <td className="p-1 font-bold">{wh.active ? 'ENABLED' : 'DISABLED'}</td>
                  <td className="p-1">
                    <button
                      onClick={() => virtualPhoneEngine.toggleWebhook(wh.id)}
                      className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-700 text-emerald-400 text-[10px] font-bold uppercase"
                    >
                      TOGGLE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL SELECTOR 1: PROVIDER SELECTION */}
      {vp.providerModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 z-50">
          <div className="bg-neutral-950 border border-neutral-800 p-3 w-full max-w-md font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
              <span className="text-emerald-400 font-bold uppercase">SELECT TELECOM PROVIDER</span>
              <button
                onClick={() => virtualPhoneEngine.setProviderModal(false)}
                className="text-neutral-500 hover:text-neutral-200"
              >
                [X]
              </button>
            </div>
            <div className="flex flex-col gap-1 mb-2">
              {(
                [
                  ['unitel', 'UNITEL ANGOLA (IMS/API)'],
                  ['africell', 'AFRICELL ANGOLA (SIP TRUNK)'],
                  ['movicel', 'MOVICEL ANGOLA (SMPP)'],
                  ['sip_ims', 'GENERIC SIP/IMS GATEWAY'],
                  ['twilio', 'TWILIO CPaAS'],
                  ['local_agent', 'ANDROID HARDWARE AGENT']
                ] as const
              ).map(([provKey, label]) => (
                <button
                  key={provKey}
                  onClick={() => virtualPhoneEngine.setProvider(provKey)}
                  className={`p-2 text-left border uppercase font-bold text-[11px] ${
                    vp.provider === provKey
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR 2: DEVICE PAIRING */}
      {vp.pairingModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 z-50">
          <div className="bg-neutral-950 border border-neutral-800 p-3 w-full max-w-md font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
              <span className="text-emerald-400 font-bold uppercase">PAIR NEW DEVICE NODE</span>
              <button
                onClick={() => virtualPhoneEngine.setPairingModal(false)}
                className="text-neutral-500 hover:text-neutral-200"
              >
                [X]
              </button>
            </div>
            <form onSubmit={handleAddDevice} className="flex flex-col gap-2">
              <div>
                <label className="text-neutral-500 uppercase block mb-1">DEVICE NAME</label>
                <input
                  type="text"
                  value={newDevName}
                  onChange={(e) => setNewDevName(e.target.value)}
                  placeholder="e.g. Workstation PC"
                  className="w-full bg-black border border-neutral-800 p-1.5 text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="text-neutral-500 uppercase block mb-1">PLATFORM</label>
                <select
                  value={newDevPlatform}
                  onChange={(e) => setNewDevPlatform(e.target.value as any)}
                  className="w-full bg-black border border-neutral-800 p-1.5 text-emerald-400 outline-none uppercase font-bold"
                >
                  <option value="android">ANDROID</option>
                  <option value="iphone">IPHONE</option>
                  <option value="ipad">IPAD</option>
                  <option value="windows">WINDOWS</option>
                  <option value="macos">MACOS</option>
                  <option value="linux">LINUX</option>
                  <option value="web">WEB BROWSER</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-bold uppercase hover:bg-emerald-900"
              >
                PAIR DEVICE
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR 3: VIRTUAL APP LAUNCH */}
      {vp.appLaunchModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 z-50">
          <div className="bg-neutral-950 border border-neutral-800 p-3 w-full max-w-md font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
              <span className="text-emerald-400 font-bold uppercase">LAUNCH VIRTUAL APP CONTAINER</span>
              <button
                onClick={() => virtualPhoneEngine.setAppLaunchModal(false)}
                className="text-neutral-500 hover:text-neutral-200"
              >
                [X]
              </button>
            </div>
            <form onSubmit={handleLaunchApp} className="flex flex-col gap-2">
              <div>
                <label className="text-neutral-500 uppercase block mb-1">APP DISPLAY NAME</label>
                <input
                  type="text"
                  value={appNameInput}
                  onChange={(e) => setAppNameInput(e.target.value)}
                  placeholder="WhatsApp Business"
                  className="w-full bg-black border border-neutral-800 p-1.5 text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="text-neutral-500 uppercase block mb-1">PACKAGE NAME</label>
                <input
                  type="text"
                  value={appPkg}
                  onChange={(e) => setAppPkg(e.target.value)}
                  placeholder="com.whatsapp.w4b"
                  className="w-full bg-black border border-neutral-800 p-1.5 text-emerald-400 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-bold uppercase hover:bg-emerald-900"
              >
                START CONTAINER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SELECTOR 4: MFA VERIFICATION */}
      {vp.mfaModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-2 z-50">
          <div className="bg-neutral-950 border border-neutral-800 p-3 w-full max-w-md font-mono text-xs">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1 mb-2">
              <span className="text-emerald-400 font-bold uppercase">MFA TOTP VERIFICATION</span>
              <button
                onClick={() => virtualPhoneEngine.setMfaModal(false)}
                className="text-neutral-500 hover:text-neutral-200"
              >
                [X]
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                maxLength={6}
                value={mfaCodeInput}
                onChange={(e) => setMfaCodeInput(e.target.value)}
                placeholder="000000"
                className="w-full bg-black border border-neutral-800 p-2 text-center text-lg text-emerald-400 font-bold outline-none tracking-widest"
              />
              <button
                onClick={() => virtualPhoneEngine.verifyMfaCode(mfaCodeInput)}
                className="w-full py-2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-bold uppercase hover:bg-emerald-900"
              >
                VERIFY CODE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
