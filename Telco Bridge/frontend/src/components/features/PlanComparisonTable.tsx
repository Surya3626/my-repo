import React from 'react';
import { Check, X, Zap, Shield, Tv, Router } from 'lucide-react';

interface PlanComparisonTableProps {
  plans: any[];
  selectedPlanId?: number;
  onSelectPlan: (plan: any) => void;
}

export const PlanComparisonTable: React.FC<PlanComparisonTableProps> = ({
  plans,
  selectedPlanId,
  onSelectPlan,
}) => {
  const [speedFilter, setSpeedFilter] = React.useState<number | 'ALL'>('ALL');

  if (!plans || plans.length === 0) return null;

  const filteredPlans = speedFilter === 'ALL' 
    ? plans 
    : plans.filter(p => p.speedMbps === speedFilter);

  const features = [
    { key: 'speedMbps', label: 'Download / Upload Speed', icon: <Zap size={14} /> },
    { key: 'validityDays', label: 'Billing Validity (Days)', icon: null },
    { key: 'routerIncluded', label: 'Dual-Band Wi-Fi 6 Router', icon: <Router size={14} /> },
    { key: 'ottIncluded', label: 'TelcoBridge Binge (15+ OTT Apps)', icon: <Tv size={14} /> },

    { key: 'staticIpAvailable', label: 'Static IP Support', icon: <Shield size={14} /> },
    { key: 'installationFee', label: 'Free Doorstep Installation', icon: null },
  ];

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Side-by-Side Broadband Plan Comparison
          </h4>
          <span className="text-[10px] text-purple-400 font-bold">Symmetric Ultra Fiber High Speed</span>
        </div>

        {/* Speed Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-[10px]">
          {['ALL', 100, 200, 300, 500, 1000].map(spd => (
            <button
              key={spd}
              type="button"
              onClick={() => setSpeedFilter(spd as any)}
              className={`px-2.5 py-1 rounded-lg font-extrabold transition ${
                speedFilter === spd
                  ? 'bg-tpf-purple text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd === 'ALL' ? 'All Plans' : `${spd} Mbps`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border dark:border-slate-800 bg-slate-900/60 p-1 backdrop-blur-md">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b dark:border-slate-800 text-slate-300">
              <th className="p-3 font-extrabold uppercase text-[10px] text-slate-400">Feature</th>
              {(filteredPlans.length > 0 ? filteredPlans : plans).map(p => (
                <th key={p.id} className={`p-3 min-w-[140px] text-center transition ${selectedPlanId === p.id ? 'bg-purple-900/20' : ''}`}>
                  {p.price >= 999 && (
                    <span className="mb-1 inline-block px-2 py-0.5 bg-gradient-to-r from-pink-500 to-purple-600 text-[8px] font-black text-white uppercase rounded-full tracking-wider shadow">
                      Best Value Binge
                    </span>
                  )}
                  <span className="font-extrabold text-sm text-white block">{p.name}</span>
                  <span className="text-purple-400 font-black text-lg block">₹{p.price}</span>
                  <button
                    type="button"
                    onClick={() => onSelectPlan(p)}
                    className={`mt-2 w-full py-1.5 rounded-xl text-[10px] font-extrabold uppercase transition glow-card-hover ${
                      selectedPlanId === p.id
                        ? 'bg-gradient-to-r from-tpf-purple to-tpf-pink text-white shadow-lg'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {selectedPlanId === p.id ? 'Selected Plan' : 'Select Plan'}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-slate-800 text-slate-300">
            {features.map(f => (
              <tr key={f.key} className="hover:bg-slate-800/40 transition">
                <td className="p-3 font-bold text-slate-400 flex items-center gap-1.5 text-xs">
                  {f.icon && <span className="text-tpf-purple">{f.icon}</span>}
                  {f.label}
                </td>
                {plans.map(p => {
                  let val: any = p[f.key];
                  if (f.key === 'speedMbps') val = `${p.speedMbps} Mbps`;
                  if (f.key === 'validityDays') val = `${p.validityDays || 30} Days`;
                  if (f.key === 'routerIncluded') val = p.routerIncluded ?? true;
                  if (f.key === 'ottIncluded') val = p.price >= 999;
                  if (f.key === 'staticIpAvailable') val = true;
                  if (f.key === 'installationFee') val = p.price >= 999;

                  return (
                    <td key={p.id} className="p-3 text-center font-semibold">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 mx-auto">
                            <X size={12} />
                          </span>
                        )
                      ) : (
                        <span>{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
