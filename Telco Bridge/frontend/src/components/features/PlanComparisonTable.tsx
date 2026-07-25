import React, { useState } from 'react';
import { Check, X, Zap, Shield, Tv, Router, Building, Clock, Server, Search, ArrowRightLeft } from 'lucide-react';

interface PlanComparisonTableProps {
  plans: any[];
  selectedPlanId?: number;
  customerCategory?: 'RETAIL' | 'ENTERPRISE';
  onSelectPlan: (plan: any) => void;
  onClose?: () => void;
}

export const PlanComparisonTable: React.FC<PlanComparisonTableProps> = ({
  plans,
  selectedPlanId,
  customerCategory = 'RETAIL',
  onSelectPlan,
  onClose,
}) => {

  const [speedFilter, setSpeedFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [comparedPlanIds, setComparedPlanIds] = useState<number[]>([]);

  if (!plans || plans.length === 0) return null;

  // 1. Filter by search & speed
  let filteredPlans = plans.filter(p => {
    const matchesSpeed = speedFilter === 'ALL' || p.speedMbps === speedFilter;
    const matchesSearch = !searchQuery.trim() || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      `${p.speedMbps}`.includes(searchQuery) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSpeed && matchesSearch;
  });

  // If dual plan mode is active (exactly 2 checked)
  const isDualCompareActive = comparedPlanIds.length === 2;
  const displayPlans = isDualCompareActive 
    ? plans.filter(p => comparedPlanIds.includes(p.id))
    : (filteredPlans.length > 0 ? filteredPlans : plans);

  const togglePlanCompare = (planId: number) => {
    if (comparedPlanIds.includes(planId)) {
      setComparedPlanIds(comparedPlanIds.filter(id => id !== planId));
    } else {
      if (comparedPlanIds.length >= 2) {
        // Replace oldest
        setComparedPlanIds([comparedPlanIds[1], planId]);
      } else {
        setComparedPlanIds([...comparedPlanIds, planId]);
      }
    }
  };

  const features = [
    { key: 'speedMbps', label: 'Bandwidth (Speed)', icon: <Zap size={14} /> },
    { key: 'billingModel', label: 'Allowed Billing Model', icon: <Building size={14} /> },
    { key: 'technology', label: 'Fiber Wi-Fi Hardware', icon: <Router size={14} /> },
    { key: 'symmetricSpeed', label: '1:1 Upload/Download Symmetry', icon: <Server size={14} /> },
    { key: 'fupLimitGb', label: 'Monthly FUP Quota', icon: <Clock size={14} /> },
    { key: 'ottBenefits', label: 'Included OTT App Suite', icon: <Tv size={14} /> },
    { key: 'staticIp', label: 'Dedicated Static IPv4', icon: <Shield size={14} /> },
    { key: 'installationCharges', label: 'Doorstep Installation Waiver', icon: null },
    { key: 'securityDeposit', label: 'Refundable Security Deposit', icon: <Shield size={14} /> },
  ];

  // Calculate 2-plan price difference if 2 selected
  let priceDelta = 0;
  let speedDelta = 0;
  if (isDualCompareActive) {
    const planA = displayPlans[0];
    const planB = displayPlans[1];
    if (planA && planB) {
      priceDelta = Math.abs(planA.price - planB.price);
      speedDelta = Math.abs(planA.speedMbps - planB.speedMbps);
    }
  }

  const tableContent = (
    <div className="space-y-4 text-left">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            Side-by-Side Enterprise Plan Matrix ({customerCategory})
          </h4>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
            Select any 2 plans to trigger locked dual-plan price & feature comparison.
          </span>
        </div>


        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search plan name / speed..."
              className="clay-input pl-8 pr-3 py-1.5 text-xs font-semibold w-48"
            />
          </div>

          {/* Speed Filter Pills */}
          <div className="flex items-center gap-1 p-1 clay-card text-[10px]">
            {['ALL', 50, 100, 150, 300, 1000].map(spd => (
              <button
                key={spd}
                type="button"
                onClick={() => setSpeedFilter(spd as any)}
                className={`px-2.5 py-1 rounded-xl font-black transition ${
                  speedFilter === spd
                    ? 'clay-pill-active scale-105'
                    : 'clay-pill-inactive'
                }`}
              >
                {spd === 'ALL' ? 'All' : `${spd}M`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Plan Lock Banner */}
      {isDualCompareActive && (
        <div className="p-3.5 clay-badge-purple rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-2 animate-fade-in">
          <div className="flex items-center gap-2 text-xs font-black">
            <ArrowRightLeft size={16} className="text-purple-600 dark:text-purple-300" />
            <span>Comparing: {displayPlans[0]?.name} vs {displayPlans[1]?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-extrabold text-purple-800 dark:text-purple-200">
              Price Difference: ₹{priceDelta}/mo for {speedDelta} Mbps speed difference
            </span>
            <button
              type="button"
              onClick={() => setComparedPlanIds([])}
              className="px-2.5 py-1 clay-button-slate text-[10px] font-black"
            >
              Reset View
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl clay-card p-2">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              <th className="p-3 font-black uppercase text-[10px] text-slate-500 dark:text-slate-400">Technical Metric</th>
              {displayPlans.map(p => {
                const isCompared = comparedPlanIds.includes(p.id);
                const isSelected = selectedPlanId === p.id;
                return (
                  <th key={p.id} className={`p-3 min-w-[170px] text-center transition rounded-2xl ${isSelected ? 'clay-badge-emerald ring-2 ring-emerald-500/60 shadow-xl' : ''}`}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="inline-flex items-center gap-1 cursor-pointer text-[9px] font-black text-slate-500 hover:text-purple-600">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => togglePlanCompare(p.id)}
                          className="accent-purple-600 cursor-pointer w-3.5 h-3.5"
                        />
                        <span>Compare</span>
                      </label>

                      {isSelected ? (
                        <span className="px-2 py-0.5 clay-badge-emerald text-[8px] font-black uppercase tracking-wider shadow">
                          ✔ ACTIVE PLAN
                        </span>
                      ) : p.recommended ? (
                        <span className="px-2 py-0.5 clay-badge-rose text-[8px] font-black uppercase tracking-wider">
                          RECOMMENDED
                        </span>
                      ) : null}
                    </div>

                    <span className="font-extrabold text-sm block text-slate-900 dark:text-white">{p.name}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-black text-lg block">
                      ₹{p.price}<span className="text-[10px] text-slate-500 font-normal">/mo</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onSelectPlan(p)}
                      className={`mt-2 w-full py-2 rounded-xl text-[10px] font-black uppercase transition ${
                        isSelected
                          ? 'clay-button-emerald shadow-lg scale-105'
                          : 'clay-button-slate'
                      }`}
                    >
                      {isSelected ? '✔ Selected Plan' : 'Select Plan'}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {features.map(f => (
              <tr key={f.key} className="hover:bg-purple-50/50 dark:hover:bg-slate-800/40 transition">
                <td className="p-3 font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 text-xs">
                  {f.icon && <span className="text-purple-600 dark:text-purple-400">{f.icon}</span>}
                  {f.label}
                </td>
                {displayPlans.map(p => {
                  let val: any = p[f.key];

                  if (f.key === 'speedMbps') val = `${p.speedMbps} Mbps Symmetrical`;
                  if (f.key === 'billingModel') {
                    val = customerCategory === 'ENTERPRISE' ? 'Prepaid & Postpaid' : 'Prepaid Only';
                  }
                  if (f.key === 'technology') {
                    val = p.technology === 'FTTH_WIFI6' ? 'Dual-Band Wi-Fi 6 AX3000' : 
                          p.technology === 'DEDICATED_ILL' ? 'Dedicated ILL Redundant ONT' : 'Dual-Band Wi-Fi 5 AC1200';
                  }
                  if (f.key === 'symmetricSpeed') val = p.symmetricSpeed ?? true;
                  if (f.key === 'fupLimitGb') val = p.fupLimitGb ? `${p.fupLimitGb} GB Commercial FUP` : '3300 GB';
                  if (f.key === 'ottBenefits') val = p.ottBenefits && p.ottBenefits !== 'None' ? p.ottBenefits : 'Standard Connectivity';
                  if (f.key === 'staticIp') val = p.category === 'ENTERPRISE_LEASED' || p.price >= 1499;
                  if (f.key === 'installationCharges') val = p.installationCharges === 0 ? 'FREE Installation' : `₹${p.installationCharges}`;
                  if (f.key === 'securityDeposit') val = p.securityDeposit ? `₹${p.securityDeposit} (100% Refundable)` : '₹1,000 (100% Refundable)';

                  return (
                    <td key={p.id} className="p-3 text-center font-bold text-[11px]">
                      {typeof val === 'boolean' ? (
                        val ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full clay-badge-emerald mx-auto">
                            <Check size={12} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full clay-badge-rose mx-auto">
                            <X size={12} />
                          </span>
                        )
                      ) : (
                        <span className={f.key === 'billingModel' && customerCategory === 'ENTERPRISE' ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : ''}>
                          {val}
                        </span>
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

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
        <div className="clay-modal p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto space-y-4 relative border-2 border-purple-500/40 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
              <Server size={18} className="text-tpf-purple" /> Enterprise Broadband Plan Matrix & Feature Comparison
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>
          {tableContent}
        </div>
      </div>
    );
  }

  return tableContent;
};


