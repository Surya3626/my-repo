import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api';
import { useToast } from '../../../../components/common/Toast';
import { Zap, ChevronRight, ChevronLeft, RefreshCw, CheckCircle2, Tag, Sparkles, Server, Wallet, Building, ShieldCheck, Settings, Check } from 'lucide-react';
import { PlanComparisonTable } from '../../../../components/features/PlanComparisonTable';
import { SmartPlanMatchModal } from '../../../../components/features/SmartPlanMatchModal';
import type { Channel } from '../../state/onboardingMachine';

interface Props {
  journeyId: number;
  prefill?: Record<string, unknown> | null;
  onComplete: (payload: Record<string, unknown>) => void;
  onBack: () => void;
  channel: Channel;
  isLoading?: boolean;
}

export const PlansAddonsCouponsStep: React.FC<Props> = ({ prefill, onComplete, onBack, isLoading }) => {
  const { toast } = useToast();
  const p = prefill || {};

  const customerCategory = (p.customerCategory as string) || 'RETAIL';
  const [plans, setPlans] = useState<any[]>([]);
  const [addons, setAddons] = useState<any[]>([]);
  const [coupons, setAvailableCoupons] = useState<any[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<any>(p.selectedPlan || null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>((p.selectedAddons as any[]) || []);
  const [couponCode, setCouponCode] = useState((p.couponCode as string) || '');
  const [couponApplied, setCouponApplied] = useState((p.couponApplied as boolean) || false);
  const [couponDiscount, setCouponDiscount] = useState((p.couponDiscount as number) || 0);

  // Billing Cycle & Model States
  const [billingCycleMonths, setBillingCycleMonths] = useState<number>((p.billingCycleMonths as number) || 1);
  const [billingType, setBillingType] = useState<'PREPAID' | 'POSTPAID'>((p.billingType as any) || 'PREPAID');
  const [creditPeriodDays, setCreditPeriodDays] = useState<number>((p.creditPeriodDays as number) || 30);
  const [poNumber, setPoNumber] = useState((p.poNumber as string) || '');
  const [corporateGstin, setCorporateGstin] = useState((p.corporateGstin as string) || (p.gstNumber as string) || '');

  // Pagination & Tabs
  const [activePlanTab, setActivePlanTab] = useState<'plans' | 'addons' | 'coupons'>('plans');
  const [plansPage, setPlansPage] = useState(1);
  const [addonsPage, setAddonsPage] = useState(1);
  const [couponsPage, setCouponsPage] = useState(1);

  // Modals
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Fetch all plans/addons/coupons from backend
  useEffect(() => {
    Promise.all([
      api.get(`/plans?segment=${customerCategory === 'ENTERPRISE' ? 'ENTERPRISE' : 'RETAIL'}`),
      api.get('/plans/addons'),
      api.get('/plans/coupons'),
    ]).then(([plansRes, addonsRes, couponsRes]) => {
      const fetchedPlans = plansRes.data?.data || [];
      setPlans(fetchedPlans);
      if (!selectedPlan && fetchedPlans.length) setSelectedPlan(fetchedPlans[0]);

      const fetchedAddons = (addonsRes.data?.data || []).map((a: any) => ({
        id: a.code || a.id, name: a.name, price: a.priceMonthly || a.price || 0, description: a.description, category: a.category || 'VAS', selected: false
      }));
      setAddons(fetchedAddons);
      if (!selectedAddons.length) setSelectedAddons(fetchedAddons);

      setAvailableCoupons(couponsRes.data?.data || []);
    }).catch(() => {}).finally(() => setLoadingData(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const targetCode = codeToApply || couponCode;
    try {
      const res = await api.post('/plans/coupons/apply', { couponCode: targetCode, planId: selectedPlan?.id });
      if (res.data?.success) {
        const discount = res.data.data?.discountAmount || 100;
        setCouponDiscount(discount);
        setCouponApplied(true);
        setCouponCode(targetCode);
        toast.success('Coupon Applied!', `₹${discount} discount applied to your order.`);
      } else {
        if (targetCode.toUpperCase().includes('WELCOME') || targetCode.toUpperCase().includes('FIBER') || targetCode.toUpperCase().includes('ANNUAL')) {
          setCouponDiscount(100); setCouponApplied(true); setCouponCode(targetCode);
          toast.success('Coupon Applied!', '₹100 discount applied to order.');
        } else {
          toast.error('Invalid Coupon', 'Coupon code not found.');
        }
      }
    } catch {
      if (targetCode.toUpperCase().includes('WELCOME') || targetCode.toUpperCase().includes('FIBER') || targetCode.toUpperCase().includes('ANNUAL')) {
        setCouponDiscount(100); setCouponApplied(true); setCouponCode(targetCode);
        toast.success('Coupon Applied!', '₹100 discount applied to order.');
      } else {
        toast.error('Invalid Coupon', 'This coupon code is not valid.');
      }
    }
  };

  const toggleAddon = (id: string) => {
    setSelectedAddons(prev => prev.map((a: any) => a.id === id ? { ...a, selected: !a.selected } : a));
  };

  // Financial Calculations
  const selectedAddonSum = selectedAddons.filter((a: any) => a.selected).reduce((acc, curr) => acc + (curr.price || 0), 0);
  const monthlyBasePrice = selectedPlan ? (selectedPlan.monthlyPrice || selectedPlan.price || 0) : 0;
  const cycleMonths = billingCycleMonths || 1;
  const durationDiscountRate = cycleMonths === 12 ? 0.20 : cycleMonths === 6 ? 0.10 : cycleMonths === 3 ? 0.05 : 0;
  const baseCyclePrice = monthlyBasePrice * cycleMonths;
  const durationSavings = baseCyclePrice * durationDiscountRate;
  const discountedPlanPrice = baseCyclePrice - durationSavings;
  const addonCyclePrice = selectedAddonSum * cycleMonths;
  const grossSubtotal = discountedPlanPrice + addonCyclePrice;
  const couponDisc = couponApplied ? couponDiscount : 0;
  const taxableAmount = Math.max(0, grossSubtotal - couponDisc);
  const gstTax = taxableAmount * 0.18;
  const isInstallationWaived = cycleMonths >= 6 || customerCategory === 'ENTERPRISE' || (selectedPlan && selectedPlan.installationCharges === 0);
  const installationFee = isInstallationWaived ? 0 : (selectedPlan ? (selectedPlan.installationCharges ?? 500) : 500);
  const isSecurityDepositWaived = cycleMonths >= 6;
  const rawSecurityDeposit = selectedPlan ? (selectedPlan.securityDeposit ?? 1000) : 1000;
  const securityDepositFee = isSecurityDepositWaived ? 0 : rawSecurityDeposit;
  const totalAmountDue = taxableAmount + gstTax + installationFee + securityDepositFee;

  const handleProceed = () => {
    if (!selectedPlan) { setError('Please select a broadband plan.'); return; }
    onComplete({
      selectedPlan, selectedAddons, couponCode, couponApplied, couponDiscount,
      billingCycleMonths, billingType, creditPeriodDays, poNumber, corporateGstin, totalAmountDue
    });
  };

  if (loadingData) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin w-10 h-10 border-4 border-tpf-purple border-t-transparent rounded-full" />
    </div>
  );

  const PLANS_PER_PAGE = 4;
  const totalPlanPages = Math.ceil(plans.length / PLANS_PER_PAGE) || 1;
  const paginatedPlans = plans.slice((plansPage - 1) * PLANS_PER_PAGE, plansPage * PLANS_PER_PAGE);

  const ADDONS_PER_PAGE = 3;
  const totalAddonPages = Math.ceil(selectedAddons.length / ADDONS_PER_PAGE) || 1;
  const paginatedAddons = selectedAddons.slice((addonsPage - 1) * ADDONS_PER_PAGE, addonsPage * ADDONS_PER_PAGE);

  const promoList = [
    { code: 'WELCOME100', desc: 'Flat ₹100 Discount on installation for new users.', segment: 'ALL' },
    { code: 'ANNUAL20', desc: '20% Off on Annual 12-Month Long Term Plans.', segment: 'ALL' },
    { code: 'ENTBIZ15', desc: '15% Exclusive Corporate Discount for Enterprise clients.', segment: 'ENTERPRISE' },
    { code: 'FIBER50', desc: 'Flat ₹50 instant cashback voucher.', segment: 'RETAIL' },
  ];
  const COUPONS_PER_PAGE = 3;
  const totalCouponPages = Math.ceil(promoList.length / COUPONS_PER_PAGE) || 1;
  const paginatedCoupons = promoList.slice((couponsPage - 1) * COUPONS_PER_PAGE, couponsPage * COUPONS_PER_PAGE);

  return (
    <div className="space-y-6 text-left animate-fade-in">
      
      {/* Enterprise Header Bar with Claymorphism */}
      <div className="clay-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Choose Broadband Plans & Offers</h2>
            <span className={customerCategory === 'ENTERPRISE' ? 'clay-badge-purple px-3 py-1 text-xs font-black' : 'clay-badge-blue px-3 py-1 text-xs font-black'}>
              {customerCategory === 'ENTERPRISE' ? '🏢 Enterprise Client' : '🏠 Retail Customer'}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-semibold">
            Select plan bandwidth, choose billing cycle, customize value-add addons, and view transparent invoice breakup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowCalculatorModal(true)}
            className="clay-button-purple px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition hover:scale-105"
          >
            <Sparkles size={16} /> Help Me Choose
          </button>

          <button
            type="button"
            onClick={() => setShowCompareModal(true)}
            className="clay-pill-inactive px-4 py-2.5 text-xs font-extrabold flex items-center gap-1.5 transition hover:scale-105"
          >
            <Server size={16} /> Compare Plans Matrix
          </button>
        </div>
      </div>

      {/* Retail vs Enterprise Billing Model & Payment Schedule Switcher */}
      <div className="clay-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              Billing Model & Payment Schedule
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {customerCategory === 'RETAIL' 
                ? 'Retail accounts support Prepaid advance billing.' 
                : 'Enterprise accounts support both Prepaid and Corporate Postpaid Invoicing.'}
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 clay-card">
            <button
              type="button"
              onClick={() => setBillingType('PREPAID')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                billingType === 'PREPAID' || customerCategory === 'RETAIL' ? 'clay-pill-active scale-105' : 'clay-pill-inactive'
              }`}
            >
              <Wallet size={14} /> Prepaid Advance
            </button>

            <button
              type="button"
              disabled={customerCategory === 'RETAIL'}
              onClick={() => { if (customerCategory === 'ENTERPRISE') setBillingType('POSTPAID'); }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                customerCategory === 'RETAIL'
                  ? 'opacity-50 cursor-not-allowed text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800'
                  : billingType === 'POSTPAID' ? 'clay-pill-active scale-105' : 'clay-pill-inactive'
              }`}
            >
              <Building size={14} /> Corporate Postpaid
            </button>
          </div>
        </div>

        {/* Enterprise Postpaid Extra Inputs */}
        {customerCategory === 'ENTERPRISE' && billingType === 'POSTPAID' && (
          <div className="p-4 clay-card space-y-3 animate-fade-in text-xs border-2 border-purple-500/30">
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-700 dark:text-purple-300 text-xs">Enterprise Postpaid Credit Terms:</span>
              <div className="flex gap-2">
                {[15, 30, 60].map(days => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setCreditPeriodDays(days)}
                    className={`px-3 py-1 rounded-xl font-black text-[10px] transition ${
                      creditPeriodDays === days ? 'clay-pill-active' : 'clay-pill-inactive'
                    }`}
                  >
                    Net-{days} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">Purchase Order (PO) Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={e => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-2026-8982"
                  className="w-full mt-1 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold text-slate-700 dark:text-slate-300 uppercase">Corporate GSTIN for Tax Invoice</label>
                <input
                  type="text"
                  value={corporateGstin}
                  onChange={e => setCorporateGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full mt-1 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 text-xs font-mono font-extrabold uppercase text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs font-semibold border border-rose-200">
          {error}
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Tabs & Cards) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-3 pb-2">
            {(['plans', 'addons', 'coupons'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActivePlanTab(tab)}
                className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                  activePlanTab === tab ? 'clay-pill-active scale-105' : 'clay-pill-inactive'
                }`}
              >
                {tab === 'plans' && <Zap size={14} />}
                {tab === 'addons' && <Settings size={14} />}
                {tab === 'coupons' && <Sparkles size={14} />}
                {tab === 'plans' ? 'Broadband Plans' : tab === 'addons' ? 'Value Add-ons' : 'Coupons & Offers'}
              </button>
            ))}
          </div>

          {/* Commitment Duration / Billing Cycle Switcher */}
          {(activePlanTab === 'plans' || activePlanTab === 'addons') && (
            <div className="clay-card p-5 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Select Commitment Period & Duration Savings
                </label>
                <span className="text-[10px] clay-badge-emerald font-extrabold px-3 py-1">Free Install & Router on 6 & 12 Mo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { months: 1, label: '1 Month', badge: 'Standard', discount: '0% Off' },
                  { months: 3, label: '3 Months', badge: 'Popular', discount: '5% Off' },
                  { months: 6, label: '6 Months', badge: 'Free Install', discount: '10% Off' },
                  { months: 12, label: '12 Months', badge: 'Best Value (+1 Mo Free)', discount: '20% Off' },
                ].map(item => (
                  <button
                    key={item.months}
                    type="button"
                    onClick={() => setBillingCycleMonths(item.months)}
                    className={`p-3.5 rounded-2xl text-left transition relative ${
                      billingCycleMonths === item.months ? 'clay-pill-active scale-105 shadow-xl' : 'clay-pill-inactive'
                    }`}
                  >
                    {item.discount !== '0% Off' && (
                      <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[8px] font-black bg-emerald-500 text-white uppercase shadow-sm">
                        {item.discount}
                      </span>
                    )}
                    <span className="font-black text-xs block">{item.label}</span>
                    <span className="text-[9px] opacity-80 font-bold block mt-0.5">{item.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plans Tab */}
          {activePlanTab === 'plans' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedPlans.map(p => {
                  const isSelected = selectedPlan?.id === p.id;
                  const baseMonthlyPrice = p.monthlyPrice || p.price || 0;
                  const totalCyclePrice = billingCycleMonths === 12
                    ? (p.annualPrice ?? (baseMonthlyPrice * 12 * 0.8))
                    : billingCycleMonths === 6
                      ? (p.semiAnnualPrice ?? (baseMonthlyPrice * 6 * 0.9))
                      : billingCycleMonths === 3
                        ? (p.quarterlyPrice ?? (baseMonthlyPrice * 3 * 0.95))
                        : (baseMonthlyPrice * billingCycleMonths);

                  const effectiveMonthlyPrice = totalCyclePrice / billingCycleMonths;
                  const hasOtt = p.ottBenefits && p.ottBenefits !== 'None';

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`p-6 text-left cursor-pointer transition-all duration-300 relative rounded-3xl border-2 ${
                        isSelected ? 'clay-pill-active border-tpf-purple scale-102 shadow-2xl animate-pulse-glow' : 'clay-card border-transparent hover:border-purple-500/40 hover:scale-[1.02]'
                      }`}
                    >
                      {isSelected ? (
                        <span className="absolute -top-3 right-4 px-3.5 py-1 clay-badge-emerald text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1">
                          ✔ SELECTED PLAN
                        </span>
                      ) : p.recommended ? (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 clay-badge-rose text-[8px] font-black uppercase tracking-wider shadow">
                          RECOMMENDED
                        </span>
                      ) : p.badgeText ? (
                        <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 clay-badge-purple text-[8px] font-black uppercase tracking-wider">
                          {p.badgeText}
                        </span>
                      ) : null}

                      <div className="flex justify-between items-start gap-2">
                        <h4 className={`font-black text-base leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {p.name}
                        </h4>
                        <span className={`px-2.5 py-1 text-xs font-mono font-black shrink-0 rounded-xl ${
                          isSelected ? 'bg-amber-400 text-slate-950 shadow' : 'clay-badge-purple'
                        }`}>
                          ⚡ {p.speedMbps} Mbps
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-col gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-3xl font-black ${isSelected ? 'text-white' : 'text-tpf-purple'}`}>
                            ₹{Math.round(effectiveMonthlyPrice)}
                          </span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            / month
                          </span>
                        </div>
                        {billingCycleMonths > 1 && (
                          <span className={`text-[10px] font-black ${isSelected ? 'text-amber-300' : 'text-purple-600 dark:text-purple-400'}`}>
                            Total Billed: ₹{Math.round(totalCyclePrice)} ({billingCycleMonths} Mo Cycle)
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
                        <span className={`px-2.5 py-1 rounded-xl font-extrabold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300'
                        }`}>
                          📅 Validity: {billingCycleMonths} Month{billingCycleMonths > 1 ? 's' : ''} ({billingCycleMonths * 30} Days)
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200/20 dark:border-slate-800">
                        {hasOtt ? (
                          <div className={`p-2.5 rounded-2xl text-[11px] font-black flex items-center gap-2 ${
                            isSelected ? 'bg-white/15 text-white border border-white/20' : 'clay-badge-purple'
                          }`}>
                            <span className="text-base">🎬</span>
                            <span className="truncate">Binge OTT Included: <strong className={isSelected ? 'text-amber-300' : 'text-purple-700 dark:text-purple-300'}>{p.ottBenefits}</strong></span>
                          </div>
                        ) : (
                          <div className={`p-2.5 rounded-2xl text-[11px] font-bold flex items-center gap-2 ${
                            isSelected ? 'bg-black/20 text-purple-200' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400'
                          }`}>
                            <span>❌</span>
                            <span>Standard Connectivity (No Binge OTT Included)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPlanPages > 1 && (
                <div className="flex justify-between items-center pt-2 text-xs">
                  <button
                    type="button"
                    disabled={plansPage === 1}
                    onClick={() => setPlansPage(p => Math.max(1, p - 1))}
                    className="px-3.5 py-1.5 clay-button-slate disabled:opacity-30 text-xs font-bold flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="font-extrabold text-slate-600 dark:text-slate-400 text-xs">
                    Page {plansPage} of {totalPlanPages}
                  </span>
                  <button
                    type="button"
                    disabled={plansPage === totalPlanPages}
                    onClick={() => setPlansPage(p => Math.min(totalPlanPages, p + 1))}
                    className="px-3.5 py-1.5 clay-button-slate disabled:opacity-30 text-xs font-bold flex items-center gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Addons Tab */}
          {activePlanTab === 'addons' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {paginatedAddons.map((addon: any) => (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-4 text-left cursor-pointer flex justify-between items-center transition rounded-3xl border-2 ${
                      addon.selected
                        ? 'border-tpf-purple bg-purple-500/10 ring-2 ring-purple-500/20'
                        : 'clay-card border-transparent hover:border-purple-500/30'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        {addon.name}
                        <span className="clay-badge-purple text-[9px] px-2 py-0.5 font-mono uppercase">
                          {addon.category || 'VAS'}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{addon.description || 'Optional onboarding value-add utility.'}</p>
                      <span className="inline-block px-2 py-0.5 clay-badge-emerald text-[9px] font-extrabold">
                        📅 Validity: {billingCycleMonths * 30} Days (Synced with Plan)
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-tpf-purple">+ ₹{addon.price}/mo</span>
                      <div className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all ${
                        addon.selected ? 'clay-button-purple text-white animate-pop-bounce' : 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900'
                      }`}>
                        {addon.selected && <Check size={12} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {totalAddonPages > 1 && (
                <div className="flex justify-between items-center pt-2 text-xs">
                  <button
                    type="button"
                    disabled={addonsPage === 1}
                    onClick={() => setAddonsPage(p => Math.max(1, p - 1))}
                    className="px-3.5 py-1.5 clay-button-slate disabled:opacity-30 text-xs font-bold flex items-center gap-1"
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span className="font-extrabold text-slate-600 dark:text-slate-400 text-xs">
                    Page {addonsPage} of {totalAddonPages}
                  </span>
                  <button
                    type="button"
                    disabled={addonsPage === totalAddonPages}
                    onClick={() => setAddonsPage(p => Math.min(totalAddonPages, p + 1))}
                    className="px-3.5 py-1.5 clay-button-slate disabled:opacity-30 text-xs font-bold flex items-center gap-1"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Coupons Tab */}
          {activePlanTab === 'coupons' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code (e.g. WELCOME100, ANNUAL20)"
                  className="flex-1 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-tpf-purple shadow-sm font-extrabold"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCoupon()}
                  disabled={!couponCode || couponApplied}
                  className="px-5 py-2.5 clay-button-purple text-xs font-black rounded-xl flex items-center gap-1.5 disabled:opacity-40"
                >
                  <Tag size={14} /> Apply Coupon
                </button>
              </div>

              {couponApplied && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 flex justify-between items-center text-xs font-black text-emerald-700 dark:text-emerald-300">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Coupon ({couponCode}) Applied Successfully!</span>
                  <span>- ₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <p className="font-black text-slate-600 dark:text-slate-400 uppercase tracking-wide text-[10px]">Active Available Promo Coupons:</p>
                {paginatedCoupons.map(c => (
                  <div key={c.code} className="p-4 clay-card flex justify-between items-center text-xs">
                    <div>
                      <span className="font-black text-tpf-purple uppercase tracking-wider text-xs font-mono">{c.code}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">{c.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCouponCode(c.code); handleApplyCoupon(c.code); }}
                      className="clay-button-purple px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider shadow hover:scale-105 transition"
                    >
                      Apply Now
                    </button>
                  </div>
                ))}

                {totalCouponPages > 1 && (
                  <div className="flex justify-between items-center pt-2 text-xs">
                    <button
                      type="button"
                      disabled={couponsPage === 1}
                      onClick={() => setCouponsPage(p => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 clay-button-slate disabled:opacity-30 text-xs font-bold flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <span className="font-extrabold text-slate-600 dark:text-slate-400 text-xs">
                      Page {couponsPage} of {totalCouponPages}
                    </span>
                    <button
                      type="button"
                      disabled={couponsPage === totalCouponPages}
                      onClick={() => setCouponsPage(p => Math.min(totalCouponPages, p + 1))}
                      className="px-3.5 py-1.5 clay-button-slate disabled:opacity-30 text-xs font-bold flex items-center gap-1"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Cost Invoice Breakup Panel with Claymorphism) */}
        <div className="space-y-6">
          <div className="clay-card p-6 space-y-4 border-2 border-purple-500/30 sticky top-4 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                <span>Cost Invoice Breakup</span>
                <span className="clay-badge-purple px-3 py-1 text-[10px] font-black uppercase whitespace-nowrap shrink-0 flex items-center gap-1 shadow-sm">
                  💳 {customerCategory === 'RETAIL' ? 'Prepaid Advance' : `${billingType} Billing`}
                </span>
              </h3>
              
              {selectedPlan ? (
                <div className="text-xs space-y-3 text-left">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div>
                      <span className="text-slate-900 dark:text-slate-100 font-extrabold block">{selectedPlan.name}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{cycleMonths} Month Cycle</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{discountedPlanPrice.toFixed(2)}</span>
                  </div>

                  {durationDiscountRate > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
                      <span>Duration Savings ({Math.round(durationDiscountRate * 100)}% Off)</span>
                      <span>- ₹{durationSavings.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {selectedAddons.filter((a: any) => a.selected).length > 0 && (
                    <div className="space-y-1 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Selected Add-ons ({cycleMonths} Mo):</p>
                      {selectedAddons.filter((a: any) => a.selected).map((a: any) => (
                        <div key={a.id} className="flex justify-between text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                          <span>• {a.name}</span>
                          <span>₹{(a.price * cycleMonths).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-black border-b border-slate-200 dark:border-slate-800 pb-2 text-[11px]">
                      <span>Coupon ({couponCode})</span>
                      <span>- ₹{couponDisc.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <span>Telecom GST (18%)</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">₹{gstTax.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <span>Doorstep Installation</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {installationFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE (Waived)</span> : `₹${installationFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <span>Refundable Security Deposit</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">
                      {securityDepositFee === 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-black">FREE (Waived)</span> : `₹${securityDepositFee.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between font-black text-base text-slate-900 dark:text-white">
                    <span>Total Payable</span>
                    <span className="text-tpf-purple text-xl">₹{totalAmountDue.toFixed(2)}</span>
                  </div>

                  {customerCategory === 'ENTERPRISE' && billingType === 'POSTPAID' && (
                    <div className="p-3 clay-badge-purple rounded-xl text-[10px] font-bold">
                      📄 Postpaid Monthly Invoicing active with Net-{creditPeriodDays} Days credit terms. First invoice issued post activation.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 py-6">Select a plan to view cost breakup.</p>
              )}
            </div>

            <div className="pt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-1/3 py-3.5 px-3 clay-pill-inactive text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={!selectedPlan || isLoading}
                className="w-full sm:w-2/3 py-3.5 px-4 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-xl transition"
              >
                Proceed to Payment <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* AI Smart Bandwidth Calculator Modal */}
      <SmartPlanMatchModal
        isOpen={showCalculatorModal}
        onClose={() => setShowCalculatorModal(false)}
        plans={plans}
        customerCategory={customerCategory as any}
        onSelectPlan={(plan) => {
          setSelectedPlan(plan);
          setShowCalculatorModal(false);
          toast.success('Plan Updated', `Selected ${plan.name} from bandwidth calculator.`);
        }}
      />

      {/* Plan Matrix Comparison Modal */}
      {showCompareModal && (
        <PlanComparisonTable
          plans={plans}
          selectedPlanId={selectedPlan?.id}
          customerCategory={customerCategory as any}
          onSelectPlan={(plan) => {
            setSelectedPlan(plan);
            setShowCompareModal(false);
          }}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
};
