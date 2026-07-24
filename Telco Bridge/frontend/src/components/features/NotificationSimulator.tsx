import React, { useState } from 'react';
import { MessageSquare, Send, Bell, CheckCheck, Smartphone, X, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '../common/Toast';

interface NotificationSimulatorProps {
  mobileNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  subject?: string;
  message: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export const NotificationSimulator: React.FC<NotificationSimulatorProps> = ({ mobileNumber, isOpen, onClose }) => {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<'WHATSAPP' | 'SMS' | 'EMAIL'>('WHATSAPP');
  const [customMsg, setCustomMsg] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      channel: 'WHATSAPP',
      message: '👋 Welcome to TelcoBridge! Your onboarding has been initiated. Active Installation Ticket Ref: TPF-TKT-884920',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'READ',
    },
    {
      id: '2',
      channel: 'SMS',
      message: 'OTP 123456 is your verification code for TelcoBridge onboarding. Valid for 10 mins. Do not share with anyone.',
      timestamp: new Date(Date.now() - 180000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
    },
    {
      id: '3',
      channel: 'EMAIL',
      subject: 'Welcome to Tata Play Fiber - Onboarding & Appointment Confirmed',
      message: 'Dear Subscriber, your high-speed fiber broadband connection onboarding has been successfully processed. Doorstep installation appointment is confirmed for Tomorrow at 10:00 AM.',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
    }
  ]);

  if (!isOpen) return null;

  const handleSendSimulatedNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      channel: activeChannel,
      subject: activeChannel === 'EMAIL' ? (emailSubject || 'TelcoBridge Account Update') : undefined,
      message: customMsg,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT',
    };

    setNotifications(prev => [newNotif, ...prev]);
    setCustomMsg('');
    setEmailSubject('');
    toast.success(`${activeChannel} Dispatched`, `Simulated notification sent to ${mobileNumber || 'Customer'}.`);

    setTimeout(() => {
      setNotifications(prev =>
        prev.map(n => (n.id === newNotif.id ? { ...n, status: 'DELIVERED' } : n))
      );
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="clay-modal p-6 max-w-lg w-full space-y-5 text-left border-2 border-purple-500/40 shadow-2xl relative bg-slate-900 dark:bg-slate-900 text-white rounded-3xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Omni-Channel Notification Engine</h3>
              <p className="text-[11px] text-slate-400 font-medium">Recipient: {mobileNumber || '9900112233'} • Multi-channel simulation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Channel Selector - 3 Channels: WhatsApp, SMS, Email */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveChannel('WHATSAPP')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 transition ${
              activeChannel === 'WHATSAPP'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel('SMS')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 transition ${
              activeChannel === 'SMS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} /> SMS Feed
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel('EMAIL')}
            className={`py-2.5 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-1.5 transition ${
              activeChannel === 'EMAIL'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail size={14} /> Email
          </button>
        </div>

        {/* Notification Stream Feed */}
        <div className="h-60 overflow-y-auto space-y-3 pr-1 text-xs">
          {notifications
            .filter(n => n.channel === activeChannel)
            .map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border space-y-1.5 transition ${
                  n.channel === 'WHATSAPP'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100'
                    : n.channel === 'SMS'
                    ? 'bg-blue-950/40 border-blue-500/30 text-blue-100'
                    : 'bg-purple-950/40 border-purple-500/30 text-purple-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-white/10 pb-1.5">
                  <span className="font-black uppercase tracking-wider flex items-center gap-1">
                    {n.channel === 'WHATSAPP' && <MessageSquare size={12} className="text-emerald-400" />}
                    {n.channel === 'SMS' && <Smartphone size={12} className="text-blue-400" />}
                    {n.channel === 'EMAIL' && <Mail size={12} className="text-purple-400" />}
                    {n.channel} Dispatch
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>{n.timestamp}</span>
                    <CheckCheck size={14} className={n.status === 'READ' ? 'text-blue-400' : 'text-emerald-400'} />
                  </div>
                </div>

                {n.channel === 'EMAIL' && n.subject && (
                  <div className="font-extrabold text-white text-xs block pb-1">
                    Subject: {n.subject}
                  </div>
                )}

                <p className="leading-relaxed font-medium text-slate-200">{n.message}</p>
              </div>
            ))}

          {notifications.filter(n => n.channel === activeChannel).length === 0 && (
            <p className="text-xs text-slate-500 py-10 text-center font-bold">No {activeChannel} messages sent yet.</p>
          )}
        </div>

        {/* Input Form with Email Subject field if Email channel */}
        <form onSubmit={handleSendSimulatedNotification} className="space-y-3 pt-2 border-t border-slate-800">
          {activeChannel === 'EMAIL' && (
            <input
              type="text"
              value={emailSubject}
              onChange={e => setEmailSubject(e.target.value)}
              placeholder="Email Subject (e.g. Installation Appointment Confirmed)"
              className="w-full clay-input px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          )}

          <div className="flex gap-2">
            <input
              type="text"
              required
              value={customMsg}
              onChange={e => setCustomMsg(e.target.value)}
              placeholder={`Type ${activeChannel.toLowerCase()} message text...`}
              className="flex-1 clay-input px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-3 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xl shrink-0"
            >
              <Send size={14} /> Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
