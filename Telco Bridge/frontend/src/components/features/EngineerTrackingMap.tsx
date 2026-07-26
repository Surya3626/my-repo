import React, { useState, useEffect } from 'react';
import { Navigation, Phone, ShieldCheck, Clock, MapPin, CheckCircle, Radio, Sparkles } from 'lucide-react';

interface EngineerTrackingMapProps {
  engineerName?: string;
  engineerPhone?: string;
  ticketNumber?: string;
  appointmentDate?: string;
}

export const EngineerTrackingMap: React.FC<EngineerTrackingMapProps> = ({
  engineerName = 'Rajesh Kumar (Senior Fiber Technician)',
  engineerPhone = '+91 98765 43210',
  ticketNumber = 'TKT-TPF-884920',
  appointmentDate = 'Today, 2:30 PM - 4:00 PM',
}) => {
  const [etaMinutes, setEtaMinutes] = useState(18);
  const [status, setStatus] = useState<'EN_ROUTE' | 'NEARBY' | 'ARRIVED'>('EN_ROUTE');

  useEffect(() => {
    const interval = setInterval(() => {
      setEtaMinutes(prev => {
        if (prev <= 1) {
          setStatus('ARRIVED');
          return 0;
        }
        if (prev <= 5) setStatus('NEARBY');
        return prev - 1;
      });
    }, 4000); // simulation tick

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel border-2 border-purple-500/30 rounded-3xl p-6 bg-slate-950 text-white space-y-5 shadow-2xl text-left relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
            <Radio size={20} className="animate-pulse text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400 block">Live GPS Telemetry &amp; Radar Dispatch</span>
            <h3 className="font-extrabold text-sm text-white">{engineerName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3.5 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 ${
            status === 'ARRIVED' ? 'bg-emerald-500 text-white' :
            status === 'NEARBY' ? 'bg-amber-500 text-white animate-bounce' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
          }`}>
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            {status === 'ARRIVED' ? 'Technician Doorstep Arrived' : status === 'NEARBY' ? 'Nearby Premise (1 km)' : `GPS En-Route (${etaMinutes} mins)`}
          </span>
        </div>
      </div>

      {/* Simulated Live Map Canvas Box */}
      <div className="relative h-56 rounded-3xl overflow-hidden bg-slate-950 border-2 border-purple-500/30 flex items-center justify-center shadow-inner">
        {/* Map Grid Pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-25" />
        
        {/* Optical Fiber Drop Connection Path SVG */}
        <svg className="absolute inset-0 w-full h-full stroke-purple-500/60" strokeWidth="3">
          <line
            x1="25%"
            y1="70%"
            x2="75%"
            y2="35%"
            stroke="url(#techRouteGrad)"
            strokeDasharray="8 6"
            className="animate-fiber-beam"
          />
          <defs>
            <linearGradient id="techRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>

        {/* Customer Location Pin */}
        <div className="absolute left-[75%] top-[35%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-pulse">
            <MapPin size={20} />
          </div>
          <span className="mt-1 px-2.5 py-0.5 bg-slate-900 border border-slate-700 text-white text-[9px] font-black rounded-xl shadow uppercase">
            Installation Premise
          </span>
        </div>

        {/* Moving Engineer Marker with Live Rotating Sonar Radar Sweep */}
        <div className="absolute left-[25%] top-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 transition-all duration-1000">
          <div className="relative flex items-center justify-center">
            {/* 📡 ROTATING SONAR RADAR SWEEP CONE */}
            <div className="absolute w-24 h-24 rounded-full border border-purple-500/40 animate-radar-sweep pointer-events-none flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(168,85,247,0.4)_360deg)]" />
            </div>
            
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 border-2 border-white text-white flex items-center justify-center shadow-2xl shadow-purple-600/60 relative z-10">
              <Navigation size={22} className="rotate-45 text-white" />
            </div>
          </div>
          <span className="mt-1.5 px-2.5 py-0.5 bg-purple-600 text-white text-[9px] font-black rounded-xl shadow uppercase tracking-wider">
            {engineerName.split(' ')[0]} (Technician)
          </span>
        </div>

        {/* ETA Overlay Badge */}
        <div className="absolute top-4 left-4 bg-slate-900/90 border border-purple-500/30 backdrop-blur-md px-3.5 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-lg">
          <Clock size={16} className="text-purple-400" />
          <span>Estimated Doorstep Arrival: <strong className="text-purple-300 font-mono font-black">{etaMinutes} Mins</strong></span>
        </div>
      </div>

      {/* Technician Info Card & Call Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1 text-left">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Work Order Ticket</p>
          <p className="font-extrabold text-purple-400 font-mono text-sm">{ticketNumber}</p>
          <p className="text-[10px] text-slate-400 font-medium">Slot: {appointmentDate}</p>
        </div>

        <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Direct Engineer Hotline</p>
            <p className="font-bold text-white font-mono">{engineerPhone}</p>
          </div>
          <a
            href={`tel:${engineerPhone}`}
            className="p-3 clay-button-emerald text-white rounded-2xl shadow-lg transition flex items-center justify-center"
          >
            <Phone size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};
