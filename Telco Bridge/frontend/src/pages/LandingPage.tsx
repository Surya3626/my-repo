import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../components/common/Toast';
import api from '../utils/api';
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Zap, Activity, HelpCircle, UserCheck, X, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartCoverageScanner } from '../components/features/SmartCoverageScanner';

interface BroadbandPlan {
  id: number;
  name: string;
  speedMbps: number;
  price: number;
  validityDays: number;
  description: string;
  installationCharges: number;
  routerIncluded: boolean;
  ottBenefits: string;
  recommended: boolean;
}

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pincode, setPincode] = useState('');
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState<{ checked: boolean; feasible: boolean; msg: string } | null>(null);
  const [showFeasibilityModal, setShowFeasibilityModal] = useState(false);
  const [plans, setPlans] = useState<BroadbandPlan[]>([]);
  
  // Notify me state variables
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    // Load plans preview on load
    api.get('/plans')
      .then(res => {
        if (res.data?.success) setPlans(res.data.data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  const handleCheckFeasibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length !== 6) {
      toast.warning("Invalid Pincode", "Please enter a valid 6-digit postal pincode.");
      return;
    }

    setChecking(true);
    setFeasibilityResult(null);
    setNotifySuccess(false);

    try {
      const response = await api.get(`/feasibility/check?pincode=${pincode}`);
      const data = response.data?.data;
      if (data) {
        setFeasibilityResult({
          checked: true,
          feasible: data.feasible,
          msg: data.feasible ? t('pinFeasible') : t('pinNotFeasible')
        });
        setShowFeasibilityModal(true);
        if (data.feasible) {
          toast.success("Area Feasible!", `Gigabit connection is active in pincode ${pincode}`);
        } else {
          toast.info("Coverage Expanding", `Pincode ${pincode} is queued for network rollout.`);
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Error validating feasibility.";
      setFeasibilityResult({
        checked: true,
        feasible: false,
        msg: errMsg
      });
      setShowFeasibilityModal(true);
      toast.error("Feasibility Check Failed", errMsg);
    } finally {
      setChecking(false);
    }
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;

    try {
      await api.post(`/feasibility/expansion?email=${notifyEmail}&pincode=${pincode}`);
      setNotifySuccess(true);
      setNotifyEmail('');
      toast.success("Notification Registered", "We will alert you as soon as fiber coverage goes live!");
    } catch (err: any) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error("Registration Error", msg);
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Background glow animations */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 gradient-bg rounded-full filter blur-[120px] opacity-20 dark:opacity-30 animate-ambient-float pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-tpf-pink rounded-full filter blur-[150px] opacity-15 dark:opacity-20 animate-ambient-float pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 text-left relative z-10">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/40 text-tpf-purple border border-purple-200 dark:border-purple-800 uppercase tracking-widest inline-block shadow-sm">
              Next-Gen Broadband
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Telco<span className="bg-clip-text text-transparent bg-gradient-to-r from-tpf-purple to-tpf-pink">Bridge</span>
              <br />
              {t('heroTitle')}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
              {t('heroSub')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/onboard"
                className="px-6 py-3 font-bold text-white rounded-xl gradient-bg hover:opacity-90 flex items-center gap-2 shadow-lg shadow-purple-500/20 glow-card-hover"
              >
                Book Connection <ArrowRight size={18} />
              </Link>
              <a
                href="#feasibility"
                className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition"
              >
                Check Feasibility
              </a>
              <button
                onClick={() => navigate('/onboard', { state: { resume: true } })}
                className="px-6 py-3 font-semibold text-slate-700 dark:text-slate-200 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
              >
                <UserCheck size={18} /> Resume Booking
              </button>
            </div>
          </div>

          <div className="relative group">
            {/* Glowing background halo */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-tpf-purple via-pink-500 to-cyan-500 opacity-40 blur-xl group-hover:opacity-75 transition duration-700"></div>

            <div className="relative w-full rounded-3xl overflow-hidden glass-panel border border-white/20 dark:border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
              {/* Top Banner Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-tpf-purple dark:text-purple-300 text-xs font-black tracking-wide uppercase">
                  <Zap size={14} className="animate-pulse text-amber-400" /> Wi-Fi 6E Supercharged
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Symmetric Speed
                </span>
              </div>

              {/* 3D Banner Showcase Image Container */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-white/30 dark:border-slate-700/50 shadow-inner bg-slate-900 group-hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/gbps_3d_banner.png" 
                  alt="TelcoBridge 1 Gbps 3D Router Concept" 
                  className="w-full h-full object-cover object-center transform transition duration-700 group-hover:scale-105"
                />
                
                {/* Overlay Badge */}
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/75 backdrop-blur-md border border-white/10 flex justify-between items-center text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300">
                      1 Gbps
                    </span>
                    <span className="text-[10px] uppercase font-bold text-slate-300 leading-tight">
                      Ultra Speed<br/>Fiber Optics
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-cyan-400 block">&lt; 2ms Latency</span>
                    <span className="text-[10px] text-slate-400">Zero Lag Gaming</span>
                  </div>
                </div>
              </div>

              {/* Footer specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border dark:border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reliability</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 size={12} className="text-emerald-500" /> 99.9% Uptime
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border dark:border-slate-800 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Streaming</span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    8K Ready Multi-Device
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border dark:border-slate-800 text-left col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Router Included</span>
                  <span className="text-xs font-extrabold text-tpf-purple dark:text-purple-400 mt-0.5 block">
                    Dual Band Mesh
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PIN Check Section with Animated AI Radar Scanner */}
      <section id="feasibility" className="max-w-5xl mx-auto px-4 sm:px-6">
        <SmartCoverageScanner onBookNow={(pin) => navigate('/onboard', { state: { pincode: pin } })} />
      </section>

      {/* Benefits Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Why Choose TelcoBridge Broadband?</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Get ultra-reliable connectivity powered by fiber-to-the-home technology and enjoy premium client perks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="clay-card-interactive p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl clay-button-purple flex items-center justify-center text-white shadow-md">
              <Zap size={24} />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Unlimited High Speed</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Symmetric download & upload speeds. Stream 4K video, join virtual calls, and download massive updates without throttling.
            </p>
          </div>

          <div className="clay-card-interactive p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl clay-button-purple flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Zero Installation Fee</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Standard optical fiber laying, structural configuration, and premium Wi-Fi routers are provided at zero charges for annual terms.
            </p>
          </div>

          <div className="clay-card-interactive p-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl clay-button-purple flex items-center justify-center text-white shadow-md">
              <Activity size={24} />
            </div>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">24/7 Smart SLA Support</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Dedicated field repair teams, digital ticketing portal, and active chatbot helpers resolving issues in under 4 hours.
            </p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">Explore Popular Unlimited Plans</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Transparent pricing without hidden fees. Pick your plan during onboarding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`clay-card-interactive p-6 flex flex-col justify-between relative transition duration-300 ${
                plan.recommended ? 'ring-2 ring-purple-500/50 scale-105' : ''
              }`}
            >
              {plan.recommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 clay-badge-purple font-extrabold text-[11px] uppercase tracking-wider">
                  Recommended
                </span>
              )}
              <div className="space-y-4">
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">₹{plan.price}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{t('pricingLabel')}</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Speed</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{plan.speedMbps} Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Validity</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{plan.validityDays} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Installation</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {plan.installationCharges === 0 ? 'FREE' : `₹${plan.installationCharges}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">OTT Apps</span>
                    <span className="font-bold text-tpf-pink text-right max-w-[65%] truncate">{plan.ottBenefits}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/onboard', { state: { selectedPlanId: plan.id } })}
                className="mt-6 w-full py-3 clay-button-purple font-bold text-xs shadow-md"
              >
                Buy Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-3xl font-extrabold text-center text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <HelpCircle className="text-tpf-purple" /> Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="clay-card p-5 space-y-2 text-left">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">What documents do I need for KYC?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You need a Proof of Identity (Aadhaar Card or PAN Card) and a live passport-size photo. You can upload scanned files and take a webcam photo directly during our onboarding wizard.
            </p>
          </div>
          <div className="clay-card p-5 space-y-2 text-left">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">How long does the installation take?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Once you complete the payment and select an appointment window, an engineer is assigned. In typical circumstances, our technicians complete connection setup within 24 hours of booking.
            </p>
          </div>
          <div className="clay-card p-5 space-y-2 text-left">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">Are there any hidden installation charges?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              No. Our standard routers and cabling are free of cost. Installation charges are waived on 100 Mbps plans and above. For the basic plan, there is a Rs. 500 charge clearly displayed during checkout.
            </p>
          </div>
        </div>
      </section>

      {/* Feasibility Result Modal Popup */}
      <AnimatePresence>
        {showFeasibilityModal && feasibilityResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-modal p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden"
            >
              {/* Decorative top colored bar */}
              <div className={`absolute top-0 inset-x-0 h-2.5 ${feasibilityResult.feasible ? 'bg-emerald-500' : 'bg-amber-500'}`} />

              <button
                onClick={() => setShowFeasibilityModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>

              {feasibilityResult.feasible ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 clay-badge-emerald rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={36} className="animate-bounce" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Congratulations!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    TelcoBridge Broadband is fully feasible and available in your area (Pincode: <span className="font-bold text-slate-800 dark:text-slate-200">{pincode}</span>)! You are eligible for high-speed symmetric internet up to 1 Gbps with Free standard router setup.
                  </p>
                  <button
                    onClick={() => {
                      setShowFeasibilityModal(false);
                      navigate('/onboard', { state: { pincode } });
                    }}
                    className="w-full py-3.5 clay-button-purple font-bold text-sm shadow-lg flex items-center justify-center gap-2"
                  >
                    Book Connection Now <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 clay-badge-amber rounded-full flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={36} className="animate-pulse" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Coverage Expanding Soon!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    We currently don't offer services in Pincode: <span className="font-bold text-slate-800 dark:text-slate-200">{pincode}</span>. However, our field teams are active and expansion is under progress! Register your email below to receive updates when we go live.
                  </p>

                  {!notifySuccess ? (
                    <form onSubmit={handleNotifyMe} className="space-y-3 pt-2 text-left">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                        <input
                          type="email"
                          value={notifyEmail}
                          onChange={e => setNotifyEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full clay-input px-4 py-2.5 text-xs dark:text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 clay-button-emerald font-bold text-sm flex items-center justify-center gap-1 shadow-md"
                      >
                        Notify Me
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 clay-badge-emerald text-xs font-bold flex items-center justify-center gap-1.5 mt-2">
                      <CheckCircle2 size={16} /> Successfully registered for network expansion alerts!
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
