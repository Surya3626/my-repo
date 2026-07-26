import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import api from '../utils/api';
import { 
  CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Zap, Activity, HelpCircle, UserCheck, X, Mail,
  Gauge, Wifi, Play, Tv, Sparkles, Check, PhoneCall, Star, Globe, Clock, RefreshCw, Cpu, Compass, Search,
  SendHorizontal, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartCoverageScanner } from '../components/features/SmartCoverageScanner';
import { SpeedTestWidget } from '../components/features/SpeedTestWidget';
import { OtpVortexAnimator } from '../components/features/OtpVortexAnimator';
import { checkJourneyExists } from '../onboarding/shared/state/journeyApi';

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
  category?: string;
}

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pincode, setPincode] = useState('');
  const [checking, setChecking] = useState(false);
  const [feasibilityResult, setFeasibilityResult] = useState<{ checked: boolean; feasible: boolean; msg: string } | null>(null);
  const [showFeasibilityModal, setShowFeasibilityModal] = useState(false);
  const [plans, setPlans] = useState<BroadbandPlan[]>([]);
  
  // Interactive Plan Billing Cycle Toggle: MONTHLY (Default) vs ANNUAL (20% OFF + Free Wi-Fi 6 Router)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [selectedPlanCategory, setSelectedPlanCategory] = useState<'ALL' | 'OTT' | 'GAMING' | 'ENTERPRISE'>('ALL');

  // Notify me state variables
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySuccess, setNotifySuccess] = useState(false);

  // RMN + OTP Resume Booking Modal State
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [resumeMobile, setResumeMobile] = useState('');
  const [resumeOtpStep, setResumeOtpStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  const [resumeOtpCode, setResumeOtpCode] = useState('');
  const [resumeTimer, setResumeTimer] = useState(60);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [isVerifyingResumeOtp, setIsVerifyingResumeOtp] = useState(false);

  // OTP Countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (resumeOtpStep === 'OTP' && resumeTimer > 0) {
      interval = setInterval(() => {
        setResumeTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resumeOtpStep, resumeTimer]);

  // Fallback Broadband Plans Catalog for Client Demo
  const defaultPlans: BroadbandPlan[] = [
    {
      id: 1,
      name: "TelcoBridge 100 Mbps Starter Fiber",
      speedMbps: 100,
      price: 499,
      validityDays: 30,
      description: "Symmetric 100 Mbps download & upload, unlimited data, Dual-band Wi-Fi 5 router.",
      installationCharges: 0,
      routerIncluded: true,
      ottBenefits: "SonyLIV, Zee5, ShemarooMe",
      recommended: false,
      category: "ALL"
    },
    {
      id: 2,
      name: "TelcoBridge 300 Mbps Ultra Stream",
      speedMbps: 300,
      price: 799,
      validityDays: 30,
      description: "High-speed 300 Mbps fiber, zero lag 4K streaming, Wi-Fi 6 dual-band ONT router.",
      installationCharges: 0,
      routerIncluded: true,
      ottBenefits: "Disney+ Hotstar, Prime Video, SonyLIV, Zee5, Lionsgate Play",
      recommended: true,
      category: "OTT"
    },
    {
      id: 3,
      name: "TelcoBridge 500 Mbps GigaPro OTT",
      speedMbps: 500,
      price: 999,
      validityDays: 30,
      description: "Ultra-fast 500 Mbps speed, 16+ OTT apps included, Static IP option available.",
      installationCharges: 0,
      routerIncluded: true,
      ottBenefits: "Netflix Basic, Disney+ Hotstar, Prime Video, SonyLIV, Zee5",
      recommended: false,
      category: "OTT"
    },
    {
      id: 4,
      name: "TelcoBridge 1 Gbps Extreme Gamer",
      speedMbps: 1000,
      price: 1499,
      validityDays: 30,
      description: "Maximum 1 Gbps symmetric speed, < 2ms latency ping, Wi-Fi 6E Mesh router included.",
      installationCharges: 0,
      routerIncluded: true,
      ottBenefits: "All 20+ OTT Apps + 4K Prime Gaming Pass + Static IP",
      recommended: false,
      category: "GAMING"
    }
  ];

  useEffect(() => {
    api.get('/plans')
      .then(res => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setPlans(res.data.data);
        } else {
          setPlans(defaultPlans);
        }
      })
      .catch(() => {
        setPlans(defaultPlans);
      });
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

  // 1. Send OTP to RMN
  const handleSendResumeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeMobile || resumeMobile.length < 10) {
      toast.warning("Invalid Mobile", "Please enter a valid 10-digit registered mobile number.");
      return;
    }
    setResumeLoading(true);
    try {
      // Pre-check journey existence BEFORE sending OTP
      const check = await checkJourneyExists(resumeMobile);
      if (!check.exists) {
        toast.error(
          "No Active Booking Found",
          `We couldn't find an existing onboarding application for +91 ${resumeMobile}. Please start a new application.`
        );
        return;
      }

      await api.post('/auth/otp/send', { mobileNumber: resumeMobile });
      setResumeOtpStep('OTP');
      setResumeTimer(60);
      toast.success("Verification OTP Sent!", `6-digit security code dispatched to ${resumeMobile}`);
    } catch (err: any) {
      toast.error(
        "No Active Booking Found",
        err.response?.data?.message || `No existing application found for +91 ${resumeMobile}.`
      );
    } finally {
      setResumeLoading(false);
    }

  };

  // 2. Verify OTP & Launch Resumed Wizard
  const handleVerifyResumeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resumeOtpCode.length !== 6) {
      toast.warning("Invalid OTP", "Please enter 6-digit verification code.");
      return;
    }
    setResumeLoading(true);
    setIsVerifyingResumeOtp(true);

    setTimeout(async () => {
      try {
        const check = await checkJourneyExists(resumeMobile);
        if (!check.exists) {
          toast.error("No Active Booking Found", `No in-progress application found for +91 ${resumeMobile}.`);
          setShowResumeModal(false);
          navigate('/onboard/resume');
          return;
        }

        const response = await api.post('/auth/otp/verify', { mobileNumber: resumeMobile, otp: resumeOtpCode });
        const data = response.data?.data;
        const newToken = data?.token || 'TOKEN-' + resumeMobile;
        const newCust = data?.customer || { mobileNumber: resumeMobile, firstName: 'Subscriber' };

        login(newToken, newCust);
        localStorage.setItem('tpf_resume_mobile', resumeMobile);
        toast.success("OTP Verified!", "Restoring saved onboarding draft session...");
        setShowResumeModal(false);
        navigate('/onboard', {
          state: {
            resumeMobile: resumeMobile,
          }
        });
      } catch (err: any) {
        toast.error("Verification Error", err.response?.data?.message || "OTP verification failed.");
      } finally {
        setResumeLoading(false);
        setIsVerifyingResumeOtp(false);
      }
    }, 1400);
  };


  // Filter display plans by Category
  const displayedPlans = plans.filter(p => {
    if (selectedPlanCategory === 'ALL') return true;
    if (selectedPlanCategory === 'OTT') return p.ottBenefits && p.ottBenefits.length > 5;
    if (selectedPlanCategory === 'GAMING') return p.speedMbps >= 500;
    if (selectedPlanCategory === 'ENTERPRISE') return p.speedMbps >= 300;
    return true;
  });

  return (
    <div className="space-y-20 pb-20 text-left">
      
      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-8 md:pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Glow ambient halos */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full filter blur-[140px] opacity-25 dark:opacity-35 pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-500 rounded-full filter blur-[150px] opacity-20 dark:opacity-25 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Content Left */}
          <div className="space-y-6 text-left relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="clay-badge-purple px-3.5 py-1 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow">
                <Sparkles size={14} className="text-amber-400" /> Next-Gen FTTH Fiber Optics
              </span>
              <span className="clay-badge-emerald px-3.5 py-1 text-xs font-black uppercase tracking-wider">
                99.9% SLA Uptime Guarantee
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Telco<span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-500">Bridge</span> Broadband
              <br />
              <span className="text-3xl sm:text-5xl font-extrabold text-slate-800 dark:text-slate-200">
                Ultra-Speed Fiber to Your Home
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg font-medium leading-relaxed">
              Experience symmetric download &amp; upload speeds up to <strong>1 Gbps</strong>. Zero installation charges, free Wi-Fi 6 router, 20+ OTT app subscriptions, and 24/7 smart field technician support.
            </p>

            {/* Quick Action CTA Buttons */}
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/onboard"
                className="px-7 py-4 font-black text-xs uppercase tracking-wider text-white clay-button-purple rounded-2xl flex items-center gap-2 shadow-2xl scale-105"
              >
                Book Connection <ArrowRight size={18} />
              </Link>
              <a
                href="#feasibility"
                className="px-6 py-4 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 clay-button-slate rounded-2xl flex items-center gap-2"
              >
                <Compass size={18} /> Check Feasibility
              </a>
              <button
                type="button"
                onClick={() => {
                  setShowResumeModal(true);
                  setResumeOtpStep('MOBILE');
                  setResumeOtpCode('');
                }}
                className="px-6 py-4 font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 clay-button-slate rounded-2xl flex items-center gap-2 shadow-md hover:scale-105 transition"
              >
                <UserCheck size={18} /> Resume Booking
              </button>
            </div>

            {/* Key Trust Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400 block font-mono">1.2M+</span>
                <span className="text-slate-500 font-bold text-[11px]">Active Subscribers</span>
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-500 block font-mono">&lt; 2ms</span>
                <span className="text-slate-500 font-bold text-[11px]">Ultra-Low Latency</span>
              </div>
              <div>
                <span className="text-2xl font-black text-pink-500 block font-mono">20+ OTT</span>
                <span className="text-slate-500 font-bold text-[11px]">Apps Included</span>
              </div>
            </div>
          </div>

          {/* Hero Banner Feature Card Right (With Restored 3D Router Image) */}
          <div className="relative group text-left">
            <div className="clay-card border-2 border-purple-500/40 p-6 md:p-8 rounded-3xl shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 space-y-6">
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-xs font-black uppercase tracking-wide">
                  <Zap size={14} className="animate-pulse text-amber-400" /> Wi-Fi 6E Mesh Supercharged
                </div>
                <span className="clay-badge-emerald px-3 py-1 text-[11px] font-black uppercase">
                  Symmetric Gigabit
                </span>
              </div>

              {/* RESTORED 3D Banner Showcase Image Container */}
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-purple-500/30 shadow-2xl bg-slate-950 group-hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/gbps_3d_banner.png" 
                  alt="TelcoBridge 1 Gbps 3D Router Concept" 
                  className="w-full h-full object-cover object-center transform transition duration-700 group-hover:scale-105"
                />
                
                {/* Overlay Speed Badge */}
                <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 flex justify-between items-center text-white shadow-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-300 font-mono">
                      1 Gbps
                    </span>
                    <span className="text-[10px] uppercase font-black text-slate-300 leading-tight">
                      Ultra Speed<br/>Fiber Optics
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-cyan-400 block font-mono">&lt; 2ms Latency</span>
                    <span className="text-[10px] font-bold text-slate-400">Zero Lag Gaming</span>
                  </div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Reliability</span>
                  <span className="font-black text-slate-900 dark:text-white flex items-center gap-1 mt-1">
                    <CheckCircle2 size={13} className="text-emerald-500" /> 99.9% SLA
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">OTT Bundle</span>
                  <span className="font-black text-purple-600 dark:text-purple-400 mt-1 block">
                    20+ Top Apps
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Installation</span>
                  <span className="font-black text-emerald-500 mt-1 block">
                    FREE Fiber Laying
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE FIBER FEASIBILITY SEARCH RADAR SCANNER ─────────────────── */}
      <section id="feasibility" className="max-w-6xl mx-auto px-4 sm:px-6">
        <SmartCoverageScanner onBookNow={(pin) => navigate('/onboard', { state: { pincode: pin } })} />
      </section>

      {/* ─── INTERACTIVE INTERNET SPEED TEST WIDGET ────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <SpeedTestWidget />
      </section>

      {/* ─── BROADBAND TARIFF PLANS CATALOG ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-left">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="space-y-2">
            <span className="clay-badge-purple px-3 py-1 text-[10px] font-black uppercase">TRANSPARENT TARIFFS</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Unlimited Fiber Broadband Plans</h2>
            <p className="text-xs text-slate-500 font-medium max-w-xl">
              No hidden fees, no data caps. Enjoy symmetric gigabit connectivity with free Wi-Fi 6 ONT router and OTT apps.
            </p>
          </div>

          {/* Billing Cycle Toggle (Monthly vs Annual 20% OFF) */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl clay-card bg-slate-100 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition ${
                billingCycle === 'MONTHLY'
                  ? 'clay-button-purple text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-4 py-2 text-xs font-black rounded-xl transition flex items-center gap-1.5 ${
                billingCycle === 'ANNUAL'
                  ? 'clay-button-purple text-white shadow'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Annual Billing <span className="px-2 py-0.5 rounded bg-emerald-500 text-white text-[9px] font-black">SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Plan Category Filter Buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { id: 'ALL', label: 'All Fiber Plans' },
            { id: 'OTT', label: '🎬 OTT Entertainment Bundles' },
            { id: 'GAMING', label: '⚡ 1 Gbps Ultra Gaming' },
            { id: 'ENTERPRISE', label: '🏢 Business Enterprise Fiber' },
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedPlanCategory(cat.id as any)}
              className={`px-4 py-2 text-xs font-black rounded-2xl border transition ${
                selectedPlanCategory === cat.id
                  ? 'clay-button-purple text-white shadow'
                  : 'clay-modal bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedPlans.map(plan => {
            const finalPrice = billingCycle === 'ANNUAL' ? Math.round(plan.price * 0.8) : plan.price;
            return (
              <div
                key={plan.id}
                className={`clay-card p-6 flex flex-col justify-between relative transition-all duration-300 hover:scale-[1.02] ${
                  plan.recommended ? 'border-2 border-purple-500 shadow-2xl shadow-purple-500/20' : ''
                }`}
              >
                {plan.recommended && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 clay-badge-purple font-black text-[10px] uppercase tracking-wider shadow">
                    ⭐ MOST POPULAR
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1 border-y border-slate-200 dark:border-slate-800 py-3">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">₹{finalPrice}</span>
                    <span className="text-xs text-slate-500 font-bold">/ month</span>
                    {billingCycle === 'ANNUAL' && (
                      <span className="ml-auto text-[10px] font-black text-emerald-500">20% Off Applied</span>
                    )}
                  </div>

                  <div className="space-y-2.5 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Symmetric Speed:</span>
                      <span className="font-black text-purple-600 dark:text-purple-400 font-mono">{plan.speedMbps} Mbps</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Data Limit:</span>
                      <span className="font-extrabold text-emerald-500">TRULY UNLIMITED</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Installation Fee:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {plan.installationCharges === 0 ? 'FREE (₹0)' : `₹${plan.installationCharges}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Wi-Fi Router:</span>
                      <span className="font-extrabold text-purple-600 dark:text-purple-400">Wi-Fi 6 ONT Included</span>
                    </div>

                    {plan.ottBenefits && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-left">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Included OTT Apps:</span>
                        <span className="text-[11px] font-extrabold text-pink-500 block leading-snug">
                          {plan.ottBenefits}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/onboard', { state: { selectedPlanId: plan.id } })}
                  className="mt-6 w-full py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5"
                >
                  Book Connection <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── FREQUENTLY ASKED QUESTIONS (FAQ) ───────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-left">
        <h2 className="text-2xl font-black text-center text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <HelpCircle className="text-purple-500" /> Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div className="clay-card p-6 space-y-2 text-left">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">What documents are required for E-KYC verification?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              You only need a Proof of Identity (Aadhaar Card, Passport, or Voter ID) and a live passport-size photo. Scanned files can be uploaded or captured directly via webcam during our digital onboarding.
            </p>
          </div>
          <div className="clay-card p-6 space-y-2 text-left">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">How fast is the fiber installation process?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Once you complete connection booking and select your appointment slot, a field engineer is dispatched. Setup and Wi-Fi ONT activation are completed within 24 hours of booking.
            </p>
          </div>
          <div className="clay-card p-6 space-y-2 text-left">
            <h3 className="font-black text-sm text-slate-900 dark:text-white">Are there any hidden installation or router charges?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              No hidden fees. Dual-band Wi-Fi 6 routers and optical fiber installation are 100% free on 100 Mbps plans and above.
            </p>
          </div>
        </div>
      </section>

      {/* ─── MODAL 1: STUNNING CLAYMORPHIC RMN + OTP RESUME BOOKING MODAL ─────── */}
      <AnimatePresence>
        {showResumeModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-modal p-8 max-w-md w-full space-y-6 text-left border-2 border-purple-500/40 shadow-2xl relative backdrop-blur-xl bg-white/95 dark:bg-slate-900/95"
            >
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30 ring-4 ring-purple-500/20">
                    <UserCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">Resume Connection Booking</h3>
                    <p className="text-xs text-slate-500 font-medium">Verify registered mobile via OTP to restore draft</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowResumeModal(false);
                    setResumeOtpStep('MOBILE');
                    setResumeOtpCode('');
                  }} 
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              {resumeOtpStep === 'MOBILE' ? (
                /* Step 1: Mobile RMN Input */
                <form onSubmit={handleSendResumeOtp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider">
                      Registered Mobile Number (RMN)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Smartphone size={18} />
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        pattern="[6-9][0-9]{9}"
                        value={resumeMobile}
                        onChange={e => setResumeMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full clay-input pl-11 pr-4 py-3.5 font-mono font-bold text-sm dark:text-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">
                      We will send a 6-digit security OTP to verify ownership of this booking.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={resumeLoading || resumeMobile.length < 10}
                    className="w-full py-4 clay-button-purple text-xs font-black uppercase tracking-wider shadow-xl flex items-center justify-center gap-2"
                  >
                    {resumeLoading ? <RefreshCw size={16} className="animate-spin" /> : <SendHorizontal size={16} />} Send Verification OTP Code
                  </button>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification */
                <form onSubmit={handleVerifyResumeOtp} className="space-y-5">
                  <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block">OTP Dispatched To</span>
                      <strong className="text-slate-900 dark:text-white font-mono text-sm">+91 {resumeMobile}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeOtpStep('MOBILE')}
                      className="text-xs font-bold text-purple-600 dark:text-purple-400 underline hover:opacity-80"
                    >
                      Change Number
                    </button>
                  </div>

                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setResumeOtpCode('123456')}
                      className="px-3.5 py-1.5 rounded-full text-[10px] font-black clay-badge-purple flex items-center gap-1.5 shadow hover:scale-105 transition"
                    >
                      <Zap size={12} className="text-amber-500 fill-amber-500" /> Auto-fill Demo Code (123456)
                    </button>
                  </div>

                  <OtpVortexAnimator
                    otpCode={resumeOtpCode}
                    onChange={(code) => setResumeOtpCode(code)}
                    isValidating={isVerifyingResumeOtp}
                    label="6-Digit Verification OTP Code"
                    sublabel={`Code dispatched to +91 ${resumeMobile}`}
                  />

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-400">
                      {resumeTimer > 0 ? `Resend code in ${resumeTimer}s` : 'Didn\'t receive OTP?'}
                    </span>
                    {resumeTimer === 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setResumeTimer(60);
                          toast.info("OTP Resent", `New verification code sent to ${resumeMobile}`);
                        }}
                        className="font-bold text-purple-600 dark:text-purple-400 underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={resumeLoading || resumeOtpCode.length !== 6}
                    className="w-full py-4 clay-button-purple text-xs font-black uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 scale-105 disabled:opacity-40"
                  >
                    {resumeLoading ? <RefreshCw size={16} className="animate-spin" /> : <ShieldCheck size={18} />} Verify OTP &amp; Resume Booking
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL 2: FEASIBILITY RESULT MODAL ───────────────────────────── */}
      <AnimatePresence>
        {showFeasibilityModal && feasibilityResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="clay-modal p-8 max-w-md w-full text-center space-y-6 relative overflow-hidden border-2 border-purple-500/40 shadow-2xl backdrop-blur-xl bg-white/95 dark:bg-slate-900/95"
            >
              <button
                onClick={() => setShowFeasibilityModal(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-100 dark:bg-slate-800"
              >
                <X size={18} />
              </button>

              {feasibilityResult.feasible ? (
                <div className="space-y-4 text-left">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 size={36} className="animate-bounce" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Gigabit Fiber Available!</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Pincode <span className="font-bold text-slate-900 dark:text-white font-mono">{pincode}</span> is fully Ready-For-Service (RFS).
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowFeasibilityModal(false);
                      navigate('/onboard', { state: { pincode } });
                    }}
                    className="w-full py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
                  >
                    Book Connection Now <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-4 text-left">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto shadow-lg">
                    <AlertTriangle size={36} className="animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">Coverage Expanding Soon</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Pincode <span className="font-bold text-slate-900 dark:text-white font-mono">{pincode}</span> is queued for fiber deployment. Register to get notified when service goes live.
                    </p>
                  </div>

                  {!notifySuccess ? (
                    <form onSubmit={handleNotifyMe} className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Email Address</label>
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
                        className="w-full py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider shadow"
                      >
                        Notify Me
                      </button>
                    </form>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold text-center">
                      ✓ Successfully registered for network rollout updates!
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
