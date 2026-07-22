import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/Toast';
import api from '../utils/api';
import { 
  User, FileText, Settings, Compass, Phone, Star, Gauge, MapPin,
  Zap, CreditCard, ArrowUpRight, CheckCircle2, ShieldCheck, Download,
  Clock, PauseCircle, HelpCircle, AlertTriangle, RefreshCw, ChevronRight,
  Tv, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import { EngineerTrackingMap } from '../components/features/EngineerTrackingMap';
import { SpeedTestWidget } from '../components/features/SpeedTestWidget';
import { JourneyTimeline } from '../components/features/JourneyTimeline';
import { InvoiceDrawer } from '../components/features/InvoiceDrawer';
import { RechargeModal } from '../components/features/RechargeModal';

export const SelfCarePortal: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const locationState = useLocation().state as { openTracking?: boolean } | null;
  const { customer, login, logout, token } = useAuth();

  // Authentication states if not logged in
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard content states
  const [activeTab, setActiveTab] = useState<'overview' | 'recharge' | 'plans' | 'billing' | 'actions' | 'support' | 'engineer'>('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

  // Service Requests states
  const [relocationAddress, setRelocationAddress] = useState('');
  const [relocateSuccess, setRelocateSuccess] = useState(false);
  const [relocateError, setRelocateError] = useState('');
  
  // Vacation hold states
  const [holdDays, setHoldDays] = useState(14);
  const [holdReason, setHoldReason] = useState('Vacation / Out of town');
  const [holdSuccess, setHoldSuccess] = useState(false);
  const [holdError, setHoldError] = useState('');

  // Support ticket states
  const [ticketCategory, setTicketCategory] = useState('SLOW_SPEED');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');

  // Feedback states
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Track map state (Technician ETA simulation)
  const [technician, setTechnician] = useState<any>(null);

  // Initial load
  useEffect(() => {
    if (token) {
      loadDashboard();
      loadPayments();
    }
  }, [token]);

  useEffect(() => {
    if (locationState?.openTracking) {
      setActiveTab('engineer');
    }
  }, [locationState]);

  // Handle engineer tracking refresh
  useEffect(() => {
    let interval: any;
    if (activeTab === 'engineer' && dashboardData?.ticket) {
      interval = setInterval(() => {
        api.get('/customer/ticket/track')
          .then(res => {
            if (res.data?.success) setTechnician(res.data.data);
          })
          .catch(() => {});
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [activeTab, dashboardData]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customer/portal/dashboard');
      if (res.data?.success) {
        setDashboardData(res.data.data);
        if (res.data.data.ticket) {
          setTechnician(res.data.data.ticket);
        }
      }
    } catch (err) {
      // Handled globally
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await api.get('/customer/portal/payments');
      if (res.data?.success) {
        setPaymentHistory(res.data.data || []);
      }
    } catch (err) {}
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await api.post('/auth/otp/send', { mobileNumber });
      setOtpSent(true);
      toast.success("OTP Dispatched", `A 6-digit login code has been sent to ${mobileNumber}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Error dispatching OTP.";
      setAuthError(msg);
      toast.error("OTP Error", msg);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.post('/auth/otp/verify', { mobileNumber, otp: otpCode });
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.customer);
        toast.success("Welcome Back!", "Logged into Self Care Portal successfully.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid OTP code.";
      setAuthError(msg);
      toast.error("Login Failed", msg);
    }
  };

  const handleRelocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setRelocateError('');
    try {
      const res = await api.post('/customer/portal/relocate', { newAddress: relocationAddress });
      if (res.data?.success) {
        setRelocateSuccess(true);
        setRelocationAddress('');
        toast.success("Relocation Submitted", "Our field engineering team will process your shift request within 24 hours.");
      } else {
        const msg = res.data?.message || "Relocation request failed.";
        setRelocateError(msg);
        toast.error("Request Error", msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Address relocation error.";
      setRelocateError(msg);
      toast.error("Request Error", msg);
    }
  };

  const handleVacationHold = async (e: React.FormEvent) => {
    e.preventDefault();
    setHoldError('');
    try {
      const res = await api.post('/customer/portal/suspend', { durationDays: holdDays, reason: holdReason });
      if (res.data?.success) {
        setHoldSuccess(true);
        loadDashboard();
        toast.success("Vacation Hold Activated", `Account paused for ${holdDays} days without extra billing.`);
      } else {
        const msg = res.data?.message || "Hold request failed.";
        setHoldError(msg);
        toast.error("Hold Error", msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Validation failed on server.";
      setHoldError(msg);
      toast.error("Hold Error", msg);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError('');
    setTicketSuccess('');
    try {
      const res = await api.post('/customer/portal/ticket/create', {
        category: ticketCategory,
        description: ticketDescription
      });
      if (res.data?.success) {
        const tNum = res.data.data?.ticketNumber || '';
        setTicketSuccess(`Support Ticket #${tNum} created successfully.`);
        setTicketDescription('');
        loadDashboard();
        toast.success("Ticket Generated", `Support Ticket #${tNum} has been assigned to priority dispatch.`);
      } else {
        const msg = res.data?.message || "Could not create ticket.";
        setTicketError(msg);
        toast.error("Ticket Creation Failed", msg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Server validation error creating ticket.";
      setTicketError(msg);
      toast.error("Ticket Creation Failed", msg);
    }
  };

  const handlePlanUpgrade = async (planId: number) => {
    try {
      const res = await api.post('/customer/portal/plan/change', { planId });
      if (res.data?.success) {
        const planName = res.data.data?.plan?.name || 'Selected Plan';
        toast.success("Plan Upgraded!", `Your broadband plan has been successfully switched to ${planName}.`);
        loadDashboard();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Plan change failed.";
      toast.error("Upgrade Failed", msg);
    }
  };

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/customer/portal/feedback', { rating, comments });
      setFeedbackSuccess(true);
      toast.success("Thank You!", "Your feedback has been submitted to customer experience team.");
      loadDashboard();
    } catch (err: any) {
      toast.error("Submission Error", "Failed to submit feedback.");
    }
  };

  const openInvoice = (paymentItem: any) => {
    setSelectedInvoice(paymentItem);
    setIsInvoiceDrawerOpen(true);
  };

  // Days remaining calculation
  const calculateDaysRemaining = () => {
    if (!dashboardData?.subscription?.endDate) return 24; // fallback
    const endDate = new Date(dashboardData.subscription.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // If not authenticated, display clean Portal Authentication
  if (!token || !customer) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="clay-modal p-8 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Customer Self Care</h2>
            <p className="text-xs text-slate-400">Login with your registered mobile number using OTP</p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Mobile Number</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit number"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                />
              </div>
              <button type="submit" className="w-full py-2.5 font-bold text-xs text-white gradient-bg rounded-xl hover:opacity-90">
                Send Verification OTP
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
              <p className="text-xs text-slate-400">Enter OTP sent to {mobileNumber}. Bypass code is 123456.</p>
              <input
                type="text"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="OTP Code"
                className="border dark:border-slate-800 text-center tracking-[6px] bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-sm dark:text-white w-40 focus:outline-none"
              />
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-300 dark:border-slate-800"
                >
                  Back
                </button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl text-white font-bold text-xs gradient-bg hover:opacity-90">
                  Verify & Log In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const daysLeft = calculateDaysRemaining();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Profile Header & Account Summary */}
      <div className="glass-panel border rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        
        <div className="flex items-center gap-4 text-left z-10">
          <div className="w-14 h-14 rounded-2xl gradient-bg text-white flex items-center justify-center font-extrabold text-xl shadow-lg">
            {customer.firstName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white">{customer.firstName} {customer.lastName}</h2>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase tracking-wider ${
                customer.status === 'SUSPENDED'
                  ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
              }`}>
                {customer.status || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Customer ID: <span className="font-bold text-slate-700 dark:text-slate-300">{customer.customerId}</span> | Account: <span className="font-bold text-slate-700 dark:text-slate-300">{customer.accountNumber}</span></p>
          </div>
        </div>

        {/* Quick Recharge Button Header */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setIsRechargeModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl font-black text-xs text-white gradient-bg hover:opacity-90 flex items-center gap-2 shadow-lg glow-card-hover transition transform active:scale-95"
          >
            <Zap size={16} /> Quick Recharge
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className="px-4 py-2.5 rounded-2xl border font-bold text-xs text-slate-700 dark:text-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 glow-card-hover"
          >
            <Sparkles size={16} className="text-tpf-pink" /> Upgrade Plan
          </button>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center gap-2 border transition ${
              activeTab === 'overview'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <Gauge size={16} /> Customer Dashboard
          </button>

          <button
            onClick={() => setActiveTab('recharge')}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center justify-between border transition ${
              activeTab === 'recharge'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <span className="flex items-center gap-2"><CreditCard size={16} /> Recharge Account</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tpf-pink text-white font-black">NEW</span>
          </button>

          <button
            onClick={() => setActiveTab('plans')}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center gap-2 border transition ${
              activeTab === 'plans'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <Sparkles size={16} /> Broadband Plans
          </button>

          <button
            onClick={() => { setActiveTab('billing'); loadPayments(); }}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center gap-2 border transition ${
              activeTab === 'billing'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <FileText size={16} /> Bills & Invoices
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center gap-2 border transition ${
              activeTab === 'actions'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <Settings size={16} /> Service Requests
          </button>

          <button
            onClick={() => setActiveTab('engineer')}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center gap-2 border transition ${
              activeTab === 'engineer'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <Compass size={16} /> Track Installation
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`w-full px-4 py-3 rounded-2xl font-bold text-xs text-left flex items-center gap-2 border transition ${
              activeTab === 'support'
                ? 'gradient-bg text-white border-transparent shadow-md'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800/60'
            }`}
          >
            <Phone size={16} /> Support Desk
          </button>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3">
          <div className="glass-panel border rounded-3xl p-8 shadow-sm text-left min-h-[450px]">
            
            {/* ─── TAB 1: OVERVIEW / DASHBOARD ─────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  {/* Validity Days Left Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-2 relative overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-tpf-purple tracking-wider block">Validity Remaining</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{daysLeft}</span>
                      <span className="text-xs font-extrabold text-slate-500">Days</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Renews on: {dashboardData?.subscription?.endDate ? new Date(dashboardData.subscription.endDate).toLocaleDateString() : 'Active'}
                    </p>
                  </div>

                  {/* Active Plan Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 space-y-2 relative overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-tpf-pink tracking-wider block">Active Connection Speed</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {dashboardData?.subscription?.plan?.speedMbps || 300}
                      </span>
                      <span className="text-xs font-bold text-slate-500">Mbps</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {dashboardData?.subscription?.plan?.name || 'Superfast Fiber'} (Symmetric)
                    </p>
                  </div>

                  {/* Data FUP Consumption Meter */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2 relative overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider block">Data Used (Monthly FUP)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">840</span>
                      <span className="text-xs font-bold text-slate-500">/ 3,300 GB</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2">
                      <div className="bg-emerald-500 h-2 rounded-full w-[25%]"></div>
                    </div>
                  </div>

                </div>

                {/* Active Subscription Details Grid */}
                <div className="p-6 rounded-2xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 dark:text-white">
                        {dashboardData?.subscription?.plan?.name || 'Superfast Fiber 100 Mbps Plan'}
                      </h4>
                      <p className="text-xs text-slate-400">High-Speed Fiber with Unlimited Broadband & Low-Latency Routing</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">₹{dashboardData?.subscription?.plan?.price || 999}</span>
                      <span className="text-xs text-slate-400"> / month</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bandwidth Speed:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{dashboardData?.subscription?.plan?.speedMbps || 100} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Installation Address:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                          {dashboardData?.address ? `${dashboardData.address.houseNumber}, ${dashboardData.address.area}` : 'Mumbai HQ'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">OTT Streaming Apps:</span>
                        <span className="font-extrabold text-tpf-pink">
                          {dashboardData?.subscription?.plan?.ottBenefits || 'Disney+ Hotstar, TelcoBridge Binge'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Connection Status:</span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={14} /> ONLINE & HEALTHY
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Shortcuts */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold">
                    
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      className="p-4 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-2 transition group"
                    >
                      <Zap size={22} className="text-tpf-purple group-hover:scale-110 transition" />
                      <span>Recharge Now</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('plans')}
                      className="p-4 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-pink-50 dark:hover:bg-pink-950/30 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-2 transition group"
                    >
                      <Sparkles size={22} className="text-tpf-pink group-hover:scale-110 transition" />
                      <span>Upgrade Plan</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('billing'); loadPayments(); }}
                      className="p-4 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-2 transition group"
                    >
                      <FileText size={22} className="text-indigo-500 group-hover:scale-110 transition" />
                      <span>Invoices & Dues</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('actions')}
                      className="p-4 rounded-2xl border dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center gap-2 transition group"
                    >
                      <PauseCircle size={22} className="text-emerald-500 group-hover:scale-110 transition" />
                      <span>Vacation Hold</span>
                    </button>

                  </div>
                </div>

                {/* Recent Payments Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Transactions</h4>
                    <button onClick={() => setActiveTab('billing')} className="text-xs font-bold text-tpf-purple hover:underline">
                      View All Receipts →
                    </button>
                  </div>

                  {paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto border dark:border-slate-800 rounded-2xl">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-900/50 uppercase text-[10px] font-bold">
                            <th className="p-3">Txn ID</th>
                            <th className="p-3">Mode</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-800">
                          {paymentHistory.slice(0, 3).map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.transactionId}</td>
                              <td className="p-3 text-slate-500">{item.paymentMode}</td>
                              <td className="p-3 font-extrabold text-slate-900 dark:text-white">₹{item.amount}</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => openInvoice(item)}
                                  className="text-xs font-bold text-tpf-purple hover:underline"
                                >
                                  Tax Invoice
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center border dark:border-slate-800 rounded-2xl">No transaction records found.</p>
                  )}
                </div>

              </div>
            )}

            {/* ─── TAB 2: RECHARGE ACCOUNT ──────────────────────────────────── */}
            {activeTab === 'recharge' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Recharge Your Connection</h3>
                  <p className="text-xs text-slate-400">Choose validity tenure to get up to 20% discount on plan renewals.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Option 1: Monthly */}
                  <div className="p-6 rounded-3xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-4 text-center">
                    <span className="text-xs font-bold text-slate-400 uppercase">1 Month Validity</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">₹{dashboardData?.subscription?.plan?.price || 999}<span className="text-xs font-normal text-slate-400">/mo</span></h4>
                    <p className="text-xs text-slate-500">Standard monthly billing cycle with full high-speed bandwidth.</p>
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs border text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Select 1 Month
                    </button>
                  </div>

                  {/* Option 2: 6 Months (15% OFF) */}
                  <div className="p-6 rounded-3xl border-2 border-tpf-purple bg-gradient-to-b from-purple-500/10 to-transparent space-y-4 text-center relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black bg-tpf-purple text-white uppercase">
                      POPULAR - 15% OFF
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">6 Months Validity</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">₹{Math.round((dashboardData?.subscription?.plan?.price || 999) * 6 * 0.85)}</h4>
                    <p className="text-xs text-slate-500">Save up to ₹900 on 6-month advance recharge.</p>
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white gradient-bg hover:opacity-90 shadow-md"
                    >
                      Recharge 6 Months
                    </button>
                  </div>

                  {/* Option 3: Annual (20% OFF) */}
                  <div className="p-6 rounded-3xl border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-4 text-center relative">
                    <span className="text-xs font-bold text-tpf-pink uppercase font-extrabold">BEST VALUE - 20% OFF</span>
                    <span className="text-xs font-bold text-slate-400 uppercase block">12 Months Validity</span>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">₹{Math.round((dashboardData?.subscription?.plan?.price || 999) * 12 * 0.80)}</h4>
                    <p className="text-xs text-slate-500">Includes free router installation & zero maintenance charge.</p>
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs border text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      Recharge 1 Year
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ─── TAB 3: BROADBAND PLANS ──────────────────────────────────── */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">TelcoBridge Broadband Plans</h3>
                  <p className="text-xs text-slate-400">100% Fiber Optic network with 99.9% uptime SLA.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Plan 1 */}
                  <div className="p-6 rounded-3xl border dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                    <span className="text-xs font-extrabold text-slate-400 uppercase">Starter Fiber</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">100</span>
                      <span className="text-xs font-bold text-slate-400">Mbps</span>
                    </div>
                    <p className="text-2xl font-black gradient-text">₹799 <span className="text-xs text-slate-400 font-medium">/mo</span></p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t dark:border-slate-800 pt-3">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Unlimited Broadband FUP</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Free Dual-Band Router</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> TelcoBridge Binge Included</li>
                    </ul>
                    <button
                      onClick={() => handlePlanUpgrade(1)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs border border-tpf-purple text-tpf-purple hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    >
                      Migrate to 100 Mbps
                    </button>
                  </div>

                  {/* Plan 2 */}
                  <div className="p-6 rounded-3xl border-2 border-tpf-pink bg-white dark:bg-slate-900 space-y-4 relative shadow-lg">
                    <span className="text-xs font-black text-tpf-pink uppercase">MOST POPULAR</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">300</span>
                      <span className="text-xs font-bold text-slate-400">Mbps</span>
                    </div>
                    <p className="text-2xl font-black gradient-text">₹1,149 <span className="text-xs text-slate-400 font-medium">/mo</span></p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t dark:border-slate-800 pt-3">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Unlimited 4K Streaming</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Disney+ Hotstar & Prime Video</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Zero Static Latency for Gaming</li>
                    </ul>
                    <button
                      onClick={() => handlePlanUpgrade(2)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white gradient-bg hover:opacity-90 shadow-md"
                    >
                      Upgrade to 300 Mbps
                    </button>
                  </div>

                  {/* Plan 3 */}
                  <div className="p-6 rounded-3xl border dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
                    <span className="text-xs font-extrabold text-slate-400 uppercase">Giga Extreme</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">1,000</span>
                      <span className="text-xs font-bold text-slate-400">Mbps</span>
                    </div>
                    <p className="text-2xl font-black gradient-text">₹2,499 <span className="text-xs text-slate-400 font-medium">/mo</span></p>
                    <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 border-t dark:border-slate-800 pt-3">
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> 1 Gbps Ultra-speed</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Netflix + 22 OTT Apps included</li>
                      <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Priority VIP Engineer SLA</li>
                    </ul>
                    <button
                      onClick={() => handlePlanUpgrade(3)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs border border-tpf-purple text-tpf-purple hover:bg-purple-50 dark:hover:bg-purple-950/40"
                    >
                      Upgrade to 1 Gbps
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* ─── TAB 4: BILLS & INVOICES ─────────────────────────────────── */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Billing History & GST Tax Invoices</h3>
                  <p className="text-xs text-slate-400">Download official tax invoices for your broadband bill reimbursements.</p>
                </div>

                {paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto border dark:border-slate-800 rounded-2xl">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b dark:border-slate-800 text-slate-400 bg-slate-50 dark:bg-slate-900/50 uppercase text-[10px] font-bold">
                          <th className="p-3">Transaction ID</th>
                          <th className="p-3">Payment Date</th>
                          <th className="p-3">Mode</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Tax Invoice</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-slate-800">
                        {paymentHistory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{item.transactionId}</td>
                            <td className="p-3 text-slate-500">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}</td>
                            <td className="p-3 text-slate-500">{item.paymentMode}</td>
                            <td className="p-3 font-extrabold text-slate-900 dark:text-white">₹{item.amount}</td>
                            <td className="p-3">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                {item.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => openInvoice(item)}
                                className="px-3 py-1 rounded-lg bg-purple-50 text-tpf-purple dark:bg-purple-950/40 dark:text-purple-300 font-bold hover:underline text-[11px] flex items-center gap-1 ml-auto"
                              >
                                <Download size={12} /> View Tax Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 border dark:border-slate-800 rounded-3xl space-y-3">
                    <FileText size={32} className="text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">No payment receipts yet. Perform a quick recharge to generate an invoice.</p>
                    <button
                      onClick={() => setIsRechargeModalOpen(true)}
                      className="px-4 py-2 rounded-xl text-white font-bold text-xs gradient-bg"
                    >
                      Recharge Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 5: SERVICE REQUESTS ─────────────────────────────────── */}
            {activeTab === 'actions' && (
              <div className="space-y-8">
                
                {/* Section A: Address Relocation */}
                <div className="p-6 rounded-3xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">Shift Connection Address</h4>
                    <p className="text-xs text-slate-400">Relocate your optical fiber line to a new home or office address.</p>
                  </div>

                  {relocateSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
                      Relocation request submitted! Field technician will visit within 24 hours.
                    </div>
                  )}

                  {relocateError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                      {relocateError}
                    </div>
                  )}

                  <form onSubmit={handleRelocation} className="space-y-4">
                    <textarea
                      required
                      value={relocationAddress}
                      onChange={(e) => setRelocationAddress(e.target.value)}
                      placeholder="Enter complete new installation address with flat no, street, area & pincode"
                      className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                      rows={3}
                    />
                    <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-bold text-xs gradient-bg hover:opacity-90">
                      Submit Relocation Request
                    </button>
                  </form>
                </div>

                {/* Section B: Vacation Hold */}
                <div className="p-6 rounded-3xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">Vacation Mode / Connection Hold</h4>
                    <p className="text-xs text-slate-400">Temporarily pause connection billing for 7 to 90 days while traveling.</p>
                  </div>

                  {holdSuccess && (
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold">
                      Connection successfully placed on Vacation Hold. Zero rental will apply.
                    </div>
                  )}

                  {holdError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                      {holdError}
                    </div>
                  )}

                  <form onSubmit={handleVacationHold} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Hold Duration (Days)</label>
                      <input
                        type="number"
                        min={7}
                        max={90}
                        value={holdDays}
                        onChange={(e) => setHoldDays(Number(e.target.value))}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Hold</label>
                      <input
                        type="text"
                        value={holdReason}
                        onChange={(e) => setHoldReason(e.target.value)}
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button type="submit" className="px-5 py-2.5 rounded-xl border border-amber-500 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40">
                        Enable Vacation Hold Mode
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}

            {/* ─── TAB 6: TRACK INSTALLATION RADAR ─────────────────────────── */}
            {activeTab === 'engineer' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Field Engineer Installation Radar</h3>
                  <p className="text-xs text-slate-400">Track real-time GPS coordinates of assigned field technician.</p>
                </div>

                {dashboardData?.ticket ? (
                  <div className="space-y-6">
                    <EngineerTrackingMap
                      engineerName={technician?.engineerName || dashboardData.ticket?.engineerName}
                      engineerPhone={technician?.engineerContact || dashboardData.ticket?.engineerContact}
                      ticketNumber={technician?.ticketNumber || dashboardData.ticket?.ticketNumber}
                    />
                    <JourneyTimeline currentStep={3} />
                  </div>
                ) : (
                  <div className="text-center py-12 border dark:border-slate-800 rounded-3xl space-y-3">
                    <Compass size={32} className="text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-400">No active field installation ticket in progress.</p>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB 7: SUPPORT DESK ─────────────────────────────────────── */}
            {activeTab === 'support' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">TelcoBridge Support Desk</h3>
                  <p className="text-xs text-slate-400">24x7 Enterprise priority customer assistance with guaranteed SLA.</p>
                </div>

                {/* Ticket Creation Box */}
                <div className="p-6 rounded-3xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Raise Support Ticket</h4>

                  {ticketSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold">
                      {ticketSuccess}
                    </div>
                  )}

                  {ticketError && (
                    <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold">
                      {ticketError}
                    </div>
                  )}

                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Issue Category</label>
                        <select
                          value={ticketCategory}
                          onChange={(e) => setTicketCategory(e.target.value)}
                          className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white"
                        >
                          <option value="SLOW_SPEED">Speed & Bandwidth Drop</option>
                          <option value="FIBER_CUT">Red Optical Light / Fiber Cut</option>
                          <option value="ROUTER_FAULT">Router Power / WiFi Signal Fault</option>
                          <option value="BILLING">Billing & Payment Query</option>
                          <option value="RELOCATION">Relocation Assistance</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                      <textarea
                        required
                        value={ticketDescription}
                        onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Describe your query or issue in detail..."
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                        rows={3}
                      />
                    </div>

                    <button type="submit" className="px-5 py-2.5 rounded-xl text-white font-bold text-xs gradient-bg hover:opacity-90">
                      Submit Ticket
                    </button>
                  </form>
                </div>

                {/* Feedback Box */}
                <div className="p-6 rounded-3xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-4">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Rate Your Fiber Connection</h4>
                  
                  {feedbackSuccess ? (
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold text-center">
                      Thank you for your rating!
                    </div>
                  ) : (
                    <form onSubmit={handleFeedback} className="space-y-4">
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`p-2 rounded-xl transition ${rating >= star ? 'text-amber-400' : 'text-slate-300'}`}
                          >
                            <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>

                      <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Leave feedback for our engineers..."
                        className="w-full border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl p-4 text-xs dark:text-white"
                        rows={2}
                      />

                      <button type="submit" className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs">
                        Submit Feedback
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* Quick Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        currentPlan={dashboardData?.subscription?.plan}
        onSuccess={() => {
          loadDashboard();
          loadPayments();
        }}
      />

      {/* Invoice Viewer Drawer Modal */}
      <InvoiceDrawer
        isOpen={isInvoiceDrawerOpen}
        onClose={() => setIsInvoiceDrawerOpen(false)}
        customer={customer}
        payment={selectedInvoice}
        subscription={dashboardData?.subscription}
      />

    </div>
  );
};
