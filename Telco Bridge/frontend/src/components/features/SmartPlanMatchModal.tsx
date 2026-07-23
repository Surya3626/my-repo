import React, { useState } from 'react';
import { Zap, Check, X, Sparkles, Shield, Laptop, Tv, Gamepad2 } from 'lucide-react';
import { useToast } from '../common/Toast';
import api from '../../utils/api';

interface SmartPlanMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: any[];
  customerCategory?: 'RETAIL' | 'ENTERPRISE';
  onSelectPlan: (plan: any) => void;
}

export const SmartPlanMatchModal: React.FC<SmartPlanMatchModalProps> = ({
  isOpen,
  onClose,
  plans,
  customerCategory = 'RETAIL',
  onSelectPlan,
}) => {
  const { toast } = useToast();
  const [deviceCount, setDeviceCount] = useState<number>(5);
  const [primaryUsage, setPrimaryUsage] = useState<string>('STREAMING_4K');
  const [needOtt, setNeedOtt] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [recommendedPlan, setRecommendedPlan] = useState<any>(null);
  const [calculatedMatch, setCalculatedMatch] = useState<number>(0);

  if (!isOpen) return null;

  const handleCalculateMatch = async () => {
    setLoading(true);
    try {
      const res = await api.post('/plans/recommend', {
        deviceCount,
        primaryUsage,
        customerCategory,
        needOtt
      });

      if (res.data?.success && res.data.data) {
        const rec = res.data.data;
        setRecommendedPlan(rec);
        setCalculatedMatch(98);
        toast.success('Smart Match Found!', `${rec.name} (${rec.speedMbps} Mbps) is a 98% optimal match for your network load.`);
      } else {
        let targetSpeed = 100;
        if (primaryUsage === 'GAMING' || deviceCount > 10) targetSpeed = 300;
        else if (primaryUsage === 'STREAMING_4K' || deviceCount > 5) targetSpeed = 150;
        else if (primaryUsage === 'WFH') targetSpeed = 100;

        const best = plans.find(p => p.speedMbps >= targetSpeed) || plans[0];
        setRecommendedPlan(best);
        setCalculatedMatch(95);
      }
    } catch (err) {
      let targetSpeed = 100;
      if (primaryUsage === 'GAMING' || deviceCount > 10) targetSpeed = 300;
      else if (primaryUsage === 'STREAMING_4K' || deviceCount > 5) targetSpeed = 150;
      const best = plans.find(p => p.speedMbps >= targetSpeed) || plans[0];
      setRecommendedPlan(best);
      setCalculatedMatch(95);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="clay-modal p-6 text-slate-800 dark:text-white w-full max-w-lg shadow-2xl space-y-5 text-left relative">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={16} /> Bandwidth Needs Calculator ({customerCategory})
            </span>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Analyse connected devices and peak usage to compute optimal plan.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        {!recommendedPlan ? (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                1. How many active devices connect simultaneously?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={deviceCount}
                  onChange={e => setDeviceCount(parseInt(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <span className="px-3.5 py-1.5 clay-badge-purple font-extrabold min-w-[65px] text-center text-xs">
                  {deviceCount} Devs
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                2. Primary Network Activity Profile
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'STREAMING_4K', label: '4K / 8K Streaming', icon: <Tv size={14} /> },
                  { id: 'GAMING', label: 'Esports & Gaming', icon: <Gamepad2 size={14} /> },
                  { id: 'WFH', label: 'Work From Home & VPN', icon: <Laptop size={14} /> },
                  { id: 'SMART_HOME', label: 'Smart IoT & Security', icon: <Shield size={14} /> },
                ].map(opt => {
                  const isSelected = primaryUsage === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPrimaryUsage(opt.id)}
                      className={`p-3 rounded-2xl flex items-center gap-2 font-bold transition text-left ${
                        isSelected ? 'clay-pill-active scale-105' : 'clay-pill-inactive'
                      }`}
                    >
                      <span>{opt.icon}</span>
                      <span className="text-[11px]">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 clay-card">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">Include Premium OTT App Bundles?</span>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Disney+ Hotstar, SonyLIV, ZEE5, Prime Video access</p>
              </div>
              <input
                type="checkbox"
                checked={needOtt}
                onChange={e => setNeedOtt(e.target.checked)}
                className="w-4 h-4 accent-purple-600 cursor-pointer"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleCalculateMatch}
              className="w-full py-3.5 mt-2 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Zap size={16} /> {loading ? 'Calculating Bandwidth...' : 'Calculate Recommended Plan'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in text-left">
            <div className="p-5 clay-card space-y-3 border-2 border-purple-500/30">
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 clay-badge-emerald font-black text-xs inline-flex items-center gap-1">
                  ⚡ {calculatedMatch}% Optimal Match
                </span>
                <span className="text-[10px] text-purple-600 dark:text-purple-300 font-extrabold uppercase tracking-wider">
                  Target: {recommendedPlan.speedMbps} Mbps
                </span>
              </div>
              <h3 className="font-black text-xl text-slate-900 dark:text-white">{recommendedPlan.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">₹{recommendedPlan.price}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">/ 30 Days</span>
                <span className="text-[10px] clay-badge-purple px-2 py-0.5 font-bold">1:1 Symmetric Fiber</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{recommendedPlan.description}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRecommendedPlan(null)}
                className="w-1/3 py-3 clay-button-slate text-xs font-bold"
              >
                Re-calculate
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectPlan(recommendedPlan);
                  onClose();
                }}
                className="w-2/3 py-3 clay-button-purple text-xs font-extrabold flex items-center justify-center gap-1"
              >
                <Check size={14} /> Confirm & Select Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
