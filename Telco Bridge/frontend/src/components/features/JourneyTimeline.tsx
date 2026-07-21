import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, User, ShieldCheck, CreditCard, Calendar, Zap, FileText, MapPin, Circle } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────

interface JourneyStep {
  step: number;
  stepName: string;
  role: string;
  actorId?: string;
  actorName: string;
  timestamp: string;
}

interface JourneyTimelineProps {
  mobileNumber?: string;
  stepHistory?: JourneyStep[];
  currentStep?: number;
}

const STEP_CONFIG = [
  { num: 1, label: 'Feasibility Check', icon: <MapPin size={14} />, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { num: 2, label: 'Customer Details', icon: <User size={14} />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { num: 3, label: 'KYC Documents', icon: <FileText size={14} />, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { num: 4, label: 'Profile & Address', icon: <User size={14} />, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { num: 5, label: 'Plan Selection', icon: <Zap size={14} />, color: 'text-green-400', bg: 'bg-green-400/10' },
  { num: 6, label: 'Payment', icon: <CreditCard size={14} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { num: 7, label: 'OTP Consent', icon: <ShieldCheck size={14} />, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { num: 8, label: 'CAF Generated', icon: <FileText size={14} />, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { num: 9, label: 'Scheduled', icon: <Calendar size={14} />, color: 'text-orange-400', bg: 'bg-orange-400/10' },
];

// ─── Component ─────────────────────────────────────────────────────────────

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ stepHistory = [], currentStep = 0 }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const getStepConfig = (num: number) => STEP_CONFIG.find(s => s.num === num) || STEP_CONFIG[0];

  // Build timeline: merge step history with all 9 steps
  const timeline = STEP_CONFIG.map(sc => {
    const history = stepHistory.find(h => h.step === sc.num);
    const isDone = currentStep > sc.num;
    const isCurrent = currentStep === sc.num;

    return {
      ...sc,
      isDone,
      isCurrent,
      history,
    };
  });

  return (
    <div className={`space-y-2 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Journey Timeline
        </h4>
        {currentStep > 0 && (
          <span className="text-[10px] font-bold text-tpf-purple dark:text-purple-400">
            Step {currentStep}/9 Active
          </span>
        )}
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-1">
          {timeline.map((item, idx) => (
            <div
              key={item.num}
              className={`relative flex items-start gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                item.isCurrent
                  ? 'bg-purple-500/5 border border-purple-500/20'
                  : item.isDone
                  ? 'opacity-80'
                  : 'opacity-40'
              }`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Node */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                item.isDone
                  ? 'bg-emerald-500 border-emerald-400 text-white'
                  : item.isCurrent
                  ? 'bg-tpf-purple border-purple-400 text-white shadow-lg shadow-purple-500/20 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
              }`}>
                {item.isDone ? <CheckCircle size={14} /> : item.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    item.isCurrent ? 'text-tpf-purple dark:text-purple-400' :
                    item.isDone ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                  {item.isDone && (
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold rounded">
                      DONE
                    </span>
                  )}
                  {item.isCurrent && (
                    <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-bold rounded animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>

                {item.history && (
                  <div className="mt-0.5 space-y-0.5">
                    <p className="text-[10px] text-slate-400">
                      <span className="font-bold text-slate-500 dark:text-slate-400">{item.history.actorName}</span>
                      {' · '}
                      <span className={`px-1 py-0.5 rounded text-[9px] font-bold ${
                        item.history.role === 'SOC_ADMIN'
                          ? 'bg-purple-500/10 text-purple-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {item.history.role === 'SOC_ADMIN' ? 'Admin' : 'Customer'}
                      </span>
                    </p>
                    <p className="text-[9px] text-slate-400 flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(item.history.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
