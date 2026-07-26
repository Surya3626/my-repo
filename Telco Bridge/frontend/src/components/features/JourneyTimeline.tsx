import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, User, ShieldCheck, CreditCard, Calendar, Zap, FileText, MapPin } from 'lucide-react';

interface JourneyTimelineProps {
  mobileNumber?: string;
  stepHistory?: any[];
  currentStep?: any;
  status?: string;
  auditTrail?: any[];
}

const STEP_CONFIG = [
  { stepKey: 'FEASIBILITY_CHECK', num: 1, label: 'Feasibility Check', icon: <MapPin size={14} /> },
  { stepKey: 'CUSTOMER_DETAILS', num: 2, label: 'Customer Details', icon: <User size={14} /> },
  { stepKey: 'OTP_VERIFICATION', num: 3, label: 'OTP Verification', icon: <ShieldCheck size={14} /> },
  { stepKey: 'DOCUMENT_COLLECTION', num: 4, label: 'Document Collection', icon: <FileText size={14} /> },
  { stepKey: 'BUILD_PROFILE', num: 5, label: 'Profile & Address', icon: <User size={14} /> },
  { stepKey: 'PLANS_ADDONS_COUPONS', num: 6, label: 'Plan Selection', icon: <Zap size={14} /> },
  { stepKey: 'PAYMENT', num: 7, label: 'Payment', icon: <CreditCard size={14} /> },
  { stepKey: 'CUSTOMER_CONSENT', num: 8, label: 'Customer Consent', icon: <ShieldCheck size={14} /> },
  { stepKey: 'CAF_GENERATION', num: 9, label: 'CAF Generated', icon: <FileText size={14} /> },
  { stepKey: 'EKYC_INITIATION', num: 10, label: 'Field Installation & E-KYC', icon: <Calendar size={14} /> },
];

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  mobileNumber = '',
  stepHistory = [],
  currentStep = 1,
  status = 'IN_PROGRESS',
  auditTrail = [],
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const isJourneyCompleted = status === 'COMPLETED';

  // Normalize audit trail records
  const completedStepKeys = new Set<string>();
  const auditMap = new Map<string, any>();

  // Process backend auditTrail if available
  if (Array.isArray(auditTrail) && auditTrail.length > 0) {
    auditTrail.forEach((item: any) => {
      const stepStr = item.step || item.stepName;
      if (item.status === 'COMPLETED' || item.status === 'DONE') {
        completedStepKeys.add(stepStr);
      }
      auditMap.set(stepStr, item);
    });
  }

  // Process legacy stepHistory array if available
  if (Array.isArray(stepHistory) && stepHistory.length > 0) {
    stepHistory.forEach((item: any) => {
      const matched = STEP_CONFIG.find(sc => sc.num === item.step || sc.stepKey === item.step);
      if (matched) {
        completedStepKeys.add(matched.stepKey);
        if (!auditMap.has(matched.stepKey)) {
          auditMap.set(matched.stepKey, item);
        }
      }
    });
  }

  // Build 10-step timeline
  const timeline = STEP_CONFIG.map(sc => {
    const history = auditMap.get(sc.stepKey);
    const isDone = isJourneyCompleted || completedStepKeys.has(sc.stepKey);
    
    let isCurrent = false;
    if (!isJourneyCompleted) {
      if (typeof currentStep === 'number') {
        isCurrent = currentStep === sc.num;
      } else if (typeof currentStep === 'string') {
        isCurrent = currentStep === sc.stepKey;
      }
    }

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
          Subscriber Journey Execution Pipeline
        </h4>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isJourneyCompleted ? 'bg-emerald-500/10 text-emerald-500' : 'text-tpf-purple dark:text-purple-400'}`}>
          {isJourneyCompleted ? '✓ Journey 100% Completed' : `Active Status: ${status}`}
        </span>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

        <div className="space-y-1">
          {timeline.map((item, idx) => (
            <div
              key={item.stepKey}
              className={`relative flex items-start gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                item.isCurrent
                  ? 'bg-purple-500/10 border border-purple-500/30'
                  : item.isDone
                  ? 'opacity-90'
                  : 'opacity-40'
              }`}
              style={{ animationDelay: `${idx * 40}ms` }}
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
                    item.isCurrent ? 'text-tpf-purple dark:text-purple-400 font-black' :
                    item.isDone ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                  }`}>
                    {item.num}. {item.label}
                  </span>
                  {item.isDone && (
                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded">
                      DONE
                    </span>
                  )}
                  {item.isCurrent && (
                    <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded animate-pulse">
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Actor & Historical Step Execution Timestamp */}
                {(item.isDone || item.isCurrent) && (
                  <div className="mt-1 space-y-0.5 text-left">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {item.history?.performedById || item.history?.actorName || item.history?.prospectMobile || mobileNumber || 'CUSTOMER'}
                      </span>
                      <span>·</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        item.history?.performedByType === 'SALES_AGENT' || item.history?.role === 'SOC_ADMIN'
                          ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-300'
                      }`}>
                        {item.history?.performedByType || item.history?.role || 'CUSTOMER'}
                      </span>
                    </p>

                    {/* Render exact step completion timestamp if recorded in audit log */}
                    {(() => {
                      const ts = item.history?.performedAt || item.history?.createdAt || item.history?.timestamp || item.history?.updatedAt || item.history?.date;
                      return ts ? (
                        <p className="text-[9.5px] font-mono text-purple-600 dark:text-purple-300 font-bold flex items-center gap-1 mt-0.5">
                          <Clock size={11} className="text-purple-500 shrink-0" />
                          <span>
                            {new Date(ts).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                            })} IST
                          </span>
                        </p>
                      ) : null;
                    })()}
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
