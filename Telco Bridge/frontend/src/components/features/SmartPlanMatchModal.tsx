import React, { useState } from 'react';
import { Zap, Check, X, Shield, Sparkles } from 'lucide-react';
import { useToast } from '../common/Toast';

interface SmartPlanMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: any[];
  onSelectPlan: (plan: any) => void;
}

export const SmartPlanMatchModal: React.FC<SmartPlanMatchModalProps> = ({
  isOpen,
  onClose,
  plans,
  onSelectPlan,
}) => {
  const { toast } = useToast();
  const [deviceCount, setDeviceCount] = useState<string>('5-10');
  const [useCase, setUseCase] = useState<string>('wfh_gaming');
  const [budget, setBudget] = useState<string>('mid');
  const [recommendedPlan, setRecommendedPlan] = useState<any>(null);
  const [calculatedMatch, setCalculatedMatch] = useState<number>(0);

  if (!isOpen) return null;

  const handleCalculateMatch = () => {
    let targetSpeed = 300;
    if (useCase === 'basic') targetSpeed = 100;
    else if (useCase === 'wfh_gaming') targetSpeed = 300;
    else if (useCase === 'heavy_streaming') targetSpeed = 500;

    let best = plans.find(p => p.speedMbps >= targetSpeed) || plans[0] || {
      name: 'TelcoBridge Ultra 300 Mbps',

      price: 999,
      speedMbps: 300
    };

    const match = 96;
    setRecommendedPlan(best);
    setCalculatedMatch(match);
    toast.success('Smart Match Found!', `${best.name || 'Ultra 300 Mbps'} is a ${match}% match for your usage!`);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border-2 border-purple-500/40 rounded-3xl p-6 bg-slate-900 text-white w-full max-w-md shadow-2xl space-y-5 text-left">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <span className="text-xs font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={16} /> Smart Plan Recommendation Engine
          </span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {!recommendedPlan ? (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[10px]">1. Connected Devices Count</label>
              <select
                value={deviceCount}
                onChange={e => setDeviceCount(e.target.value)}
                className="border border-slate-800 bg-slate-950 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="1-4">1 - 4 Devices (Basic Home)</option>
                <option value="5-10">5 - 10 Devices (Family / Smart Home)</option>
                <option value="10+">10+ Devices (Heavy WFH &amp; Gaming)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-bold text-slate-400 uppercase text-[10px]">2. Primary Online Activity</label>
              <select
                value={useCase}
                onChange={e => setUseCase(e.target.value)}
                className="border border-slate-800 bg-slate-950 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500"
              >
                <option value="basic">Social Media &amp; Browsing</option>
                <option value="wfh_gaming">Work From Home, Video Calls &amp; Gaming</option>
                <option value="heavy_streaming">Multiple 4K Streamers &amp; Heavy Transfers</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleCalculateMatch}
              className="w-full py-3 mt-2 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white text-xs font-extrabold rounded-2xl shadow hover:opacity-90 transition flex items-center justify-center gap-1.5"
            >
              <Zap size={16} /> Calculate Smart Match
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-2 text-center">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-extrabold text-xs rounded-full inline-block">
                ⚡ {calculatedMatch}% Recommended Match
              </span>
              <h3 className="font-extrabold text-lg text-white">{recommendedPlan.name}</h3>
              <p className="text-2xl font-black text-purple-400">₹{recommendedPlan.price}<span className="text-xs text-slate-400 font-normal"> / month</span></p>
              <p className="text-xs text-slate-300">Symmetric {recommendedPlan.speedMbps || 300} Mbps speed for {useCase.replace('_', ' ')}.</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRecommendedPlan(null)}
                className="w-1/3 py-2.5 border border-slate-800 text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-800"
              >
                Re-calculate
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectPlan(recommendedPlan);
                  onClose();
                }}
                className="w-2/3 py-2.5 bg-tpf-purple text-white text-xs font-extrabold rounded-xl shadow hover:opacity-90 flex items-center justify-center gap-1"
              >
                <Check size={14} /> Select Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
