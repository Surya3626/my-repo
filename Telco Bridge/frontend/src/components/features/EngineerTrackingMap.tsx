import React, { useState, useEffect } from 'react';
import { Navigation, Phone, ShieldCheck, Clock, MapPin, CheckCircle } from 'lucide-react';

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
  const [techLocation, setTechLocation] = useState({ lat: 19.0760, lng: 72.8777 });
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
    <div className="glass-panel border-2 border-purple-500/30 rounded-3xl p-6 bg-slate-900 text-white space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
            <Navigation size={20} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-400">Live Installation Tracking</span>
            <h3 className="font-extrabold text-sm text-white">{engineerName}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            status === 'ARRIVED' ? 'bg-emerald-500 text-white' :
            status === 'NEARBY' ? 'bg-amber-500 text-white animate-bounce' : 'bg-purple-600 text-white'
          }`}>
            {status === 'ARRIVED' ? 'Technician Arrived' : status === 'NEARBY' ? 'Nearby (1 km)' : `En-Route (${etaMinutes} mins)`}
          </span>
        </div>
      </div>

      {/* Simulated Live Map Canvas Box */}
      <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
        {/* Map Grid Pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        
        {/* Route Line */}
        <svg className="absolute inset-0 w-full h-full stroke-purple-500/40" strokeWidth="3" strokeDasharray="6 4">
          <line x1="20%" y1="70%" x2="75%" y2="35%" />
        </svg>

        {/* Customer Location Pin */}
        <div className="absolute left-[75%] top-[35%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <MapPin size={18} />
          </div>
          <span className="mt-1 px-2 py-0.5 bg-slate-900 border border-slate-700 text-white text-[9px] font-bold rounded shadow">
            Your Location
          </span>
        </div>

        {/* Moving Engineer Marker */}
        <div className="absolute left-[35%] top-[55%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full border-2 border-purple-400 animate-radar-ring pointer-events-none" />
            <div className="w-10 h-10 rounded-full bg-purple-600 border-2 border-white text-white flex items-center justify-center shadow-xl shadow-purple-600/50 relative z-10">
              <Navigation size={20} className="rotate-45" />
            </div>
          </div>
          <span className="mt-1 px-2 py-0.5 bg-purple-600 text-white text-[9px] font-black rounded shadow">
            {engineerName.split(' ')[0]} (Technician)
          </span>
        </div>

        {/* ETA Overlay Badge */}
        <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
          <Clock size={14} className="text-purple-400" />
          <span>Estimated Arrival: <strong className="text-purple-300">{etaMinutes} Mins</strong></span>
        </div>
      </div>

      {/* Technician Info Card & Call Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Ticket Number</p>
          <p className="font-extrabold text-purple-400">{ticketNumber}</p>
          <p className="text-[10px] text-slate-400">Appointment: {appointmentDate}</p>
        </div>

        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Contact Agent</p>
            <p className="font-bold text-white">{engineerPhone}</p>
          </div>
          <a
            href={`tel:${engineerPhone}`}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg transition"
          >
            <Phone size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
