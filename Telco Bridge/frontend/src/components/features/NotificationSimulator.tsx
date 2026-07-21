import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, Bell, CheckCheck, Smartphone, X } from 'lucide-react';
import api from '../../utils/api';
import { useToast } from '../common/Toast';

interface NotificationSimulatorProps {
  mobileNumber?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationItem {
  id: string;
  channel: 'WHATSAPP' | 'SMS';
  message: string;
  timestamp: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
}

export const NotificationSimulator: React.FC<NotificationSimulatorProps> = ({ mobileNumber, isOpen, onClose }) => {
  const { toast } = useToast();
  const [activeChannel, setActiveChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');
  const [customMsg, setCustomMsg] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      channel: 'WHATSAPP',
      message: '👋 Welcome to TelcoBridge! Your onboarding has been initiated. Tracking ID: TB-' + (mobileNumber?.slice(-4) || '9900'),
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString(),
      status: 'READ',
    },
    {
      id: '2',
      channel: 'SMS',
      message: 'OTP 123456 is your verification code for TelcoBridge onboarding. Valid for 10 mins. Do not share with anyone.',

      timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
      status: 'DELIVERED',
    },
  ]);

  if (!isOpen) return null;

  const handleSendSimulatedNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      channel: activeChannel,
      message: customMsg,
      timestamp: new Date().toLocaleTimeString(),
      status: 'SENT',
    };

    setNotifications(prev => [newNotif, ...prev]);
    setCustomMsg('');
    toast.success(`${activeChannel} Dispatched`, `Simulated notification sent to ${mobileNumber || 'Customer'}.`);

    // Simulate update to delivered/read
    setTimeout(() => {
      setNotifications(prev =>
        prev.map(n => (n.id === newNotif.id ? { ...n, status: 'DELIVERED' } : n))
      );
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel border-2 border-purple-500/30 rounded-3xl p-6 bg-slate-900 text-white w-full max-w-md shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <MessageSquare size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">WhatsApp & SMS Simulator</h3>
              <p className="text-[10px] text-slate-400">Target: {mobileNumber || '9876543210'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveChannel('WHATSAPP')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeChannel === 'WHATSAPP'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={14} /> WhatsApp
          </button>
          <button
            type="button"
            onClick={() => setActiveChannel('SMS')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeChannel === 'SMS'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone size={14} /> SMS Feed
          </button>
        </div>

        {/* Message Log */}
        <div className="h-56 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {notifications
            .filter(n => n.channel === activeChannel)
            .map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border ${
                  n.channel === 'WHATSAPP'
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100'
                    : 'bg-blue-950/40 border-blue-500/30 text-blue-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span className="font-extrabold uppercase">{n.channel}</span>
                  <div className="flex items-center gap-1">
                    <span>{n.timestamp}</span>
                    <CheckCheck size={12} className={n.status === 'READ' ? 'text-blue-400' : 'text-slate-400'} />
                  </div>
                </div>
                <p className="leading-relaxed">{n.message}</p>
              </div>
            ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendSimulatedNotification} className="flex gap-2 pt-2 border-t border-slate-800">
          <input
            type="text"
            value={customMsg}
            onChange={e => setCustomMsg(e.target.value)}
            placeholder={`Type ${activeChannel} notification...`}
            className="flex-1 border border-slate-700 bg-slate-950 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white rounded-xl text-xs font-bold shadow hover:opacity-90 flex items-center gap-1"
          >
            <Send size={14} /> Send
          </button>
        </form>
      </div>
    </div>
  );
};
