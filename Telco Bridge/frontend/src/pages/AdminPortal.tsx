import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { 
  Users, Layers, Landmark, BarChart3, ShieldCheck, FileCheck, 
  RefreshCw, ClipboardList, Check, X, CheckSquare, Search, UserPlus, PlayCircle, Eye,
  MessageSquare, Radio, Bell
} from 'lucide-react';
import { JourneyTimeline } from '../components/features/JourneyTimeline';
import { NotificationSimulator } from '../components/features/NotificationSimulator';

export const AdminPortal: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Admin security states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return !!localStorage.getItem('tpf_admin_token');
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Active tab within admin portal
  const [adminTab, setAdminTab] = useState<'kpis' | 'kyc' | 'customers' | 'users' | 'logs'>('kpis');
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [operatingCities, setOperatingCities] = useState<any[]>([]);
  const [selectedCityFilter, setSelectedCityFilter] = useState('');

  // Initiate Onboarding Modal state
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [initMobile, setInitMobile] = useState('');
  const [initFirstName, setInitFirstName] = useState('');
  const [initLastName, setInitLastName] = useState('');
  const [initEmail, setInitEmail] = useState('');
  const [initLoading, setInitLoading] = useState(false);

  // Step Audit Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditCustomer, setAuditCustomer] = useState<any>(null);
  const [customerJourney, setCustomerJourney] = useState<any>(null);

  // Notification Simulator State
  const [showNotifSim, setShowNotifSim] = useState(false);
  const [simMobile, setSimMobile] = useState('');
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAllAdminData();
    }
  }, [adminTab, isAdminLoggedIn]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      if (adminTab === 'kpis') {
        const res = await api.get(`/admin/dashboard/stats?city=${selectedCityFilter}`);
        if (res.data?.success) setStats(res.data.data);
      } else if (adminTab === 'kyc') {
        const res = await api.get('/admin/kyc/pending');
        if (res.data?.success) setCustomers(res.data.data);
      } else if (adminTab === 'customers') {
        const res = await api.get('/admin/customers');
        if (res.data?.success) setCustomers(res.data.data);
      } else if (adminTab === 'users') {
        const uRes = await api.get('/admin/users');
        if (uRes.data?.success) setAdminUsers(uRes.data.data);
        const cRes = await api.get('/admin/cities');
        if (cRes.data?.success) setOperatingCities(cRes.data.data);
      } else if (adminTab === 'logs') {
        const res = await api.get('/admin/audit-logs');
        if (res.data?.success) setAuditLogs(res.data.data);
      }
    } catch (err) {
      // authentication errors handled globally
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await api.post('/auth/admin/login', { username: adminUsername, password: adminPassword });
      if (res.data?.success) {
        localStorage.setItem('tpf_admin_token', res.data.data.token);
        setIsAdminLoggedIn(true);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Invalid Admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('tpf_admin_token');
    setIsAdminLoggedIn(false);
  };

  const handleKycApproval = async (docId: number, approved: boolean) => {
    try {
      const res = await api.post(`/admin/kyc/verify?documentId=${docId}&approved=${approved}`);
      if (res.data?.success) {
        alert(approved ? "KYC Document Approved!" : "KYC Document Rejected.");
        loadAllAdminData();
      }
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleInitiateOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initMobile || initMobile.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }
    setInitLoading(true);
    try {
      const res = await api.post('/admin/onboard/initiate', {
        mobileNumber: initMobile,
        firstName: initFirstName || 'Prospect',
        lastName: initLastName || 'Customer',
        email: initEmail || `${initMobile}@telcobridge.com`,

        adminId: adminUsername || 'admin'
      });

      if (res.data?.success) {
        setShowInitiateModal(false);
        // Navigate to dedicated Admin Onboarding Wizard page
        navigate('/admin/onboard', {
          state: {
            adminId: adminUsername || 'admin',
            customerMobile: initMobile,
            prospectData: {
              firstName: initFirstName,
              lastName: initLastName,
              mobileNumber: initMobile,
              email: initEmail
            }
          }
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to initiate onboarding.");
    } finally {
      setInitLoading(false);
    }
  };

  const handleResumeCustomerOnboarding = (cust: any) => {
    navigate('/admin/onboard', {
      state: {
        adminId: adminUsername || 'admin',
        customerMobile: cust.mobileNumber,
        resume: true
      }
    });
  };

  const handleToggleCityTag = async (username: string, city: string, currentAssigned: string[]) => {
    const set = new Set(currentAssigned || []);
    if (set.has(city)) set.delete(city);
    else set.add(city);

    try {
      const res = await api.put(`/admin/users/${username}/cities`, Array.from(set));
      if (res.data?.success) {
        setAdminUsers(adminUsers.map(u => u.username === username ? { ...u, assignedCities: Array.from(set) } : u));
      }
    } catch (e) {}
  };

  const handleGenerateMagicLink = async (mobile: string) => {
    try {
      const res = await api.post(`/admin/customer/${mobile}/magic-link`);
      if (res.data?.success) {
        const url = res.data.data.magicUrl;
        navigator.clipboard.writeText(url);
        alert(`Magic Link copied to clipboard!\n\n${url}`);
      }
    } catch (e) {
      alert("Failed to generate magic link.");
    }
  };

  const handleExportCsv = () => {
    window.open('http://localhost:8080/api/admin/customers/export', '_blank');
  };

  const handleViewStepAudit = async (cust: any) => {
    setAuditCustomer(cust);
    setShowAuditModal(true);
    setCustomerJourney(null);
    try {
      const res = await api.get(`/admin/journey/${cust.mobileNumber}`);
      if (res.data?.success) {
        setCustomerJourney(res.data.data);
      }
    } catch (err) {}
  };

  // Filter customers for Search Query
  const filteredCustomers = customers.filter(cust => {
    const fullName = `${cust.firstName} ${cust.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || 
           cust.mobileNumber.includes(query) || 
           cust.customerId.toLowerCase().includes(query) ||
           cust.status.toLowerCase().includes(query);
  });

  if (!isAdminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 border dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl space-y-6 text-left animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-950/30 rounded-2xl flex items-center justify-center mx-auto text-tpf-purple border border-purple-100 dark:border-purple-800/40">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-850 dark:text-white">Admin Secure Gateway</h2>
          <p className="text-xs text-slate-400 font-medium">Please enter credentials to access administrative dashboard</p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border border-rose-200 dark:border-rose-800/35 text-xs font-bold animate-shake">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <input
              type="text"
              required
              value={adminUsername}
              onChange={e => setAdminUsername(e.target.value)}
              placeholder="e.g. admin"
              className="w-full border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              required
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white gradient-bg hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 mt-2"
          >
            Authenticate Admin
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Admin Portal Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b dark:border-slate-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-tpf-purple dark:text-purple-400">
            <ShieldCheck size={20} />
            <span className="text-xs font-extrabold uppercase tracking-widest">Administrative Control</span>
          </div>
          <h1 className="text-3xl font-black text-slate-850 dark:text-white">Admin Operations Portal</h1>
          <p className="text-xs text-slate-400">SOC Admin Onboarding management, KYC approvals, customer tracking, and audit trails.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setShowInitiateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:opacity-95 transition"
          >
            <UserPlus size={16} /> Initiate Onboarding on Behalf of Customer
          </button>
          <button
            onClick={loadAllAdminData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 dark:bg-slate-900 border dark:border-slate-800/80 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 bg-rose-950/20 text-rose-500 border border-rose-900/30 rounded-xl text-xs font-bold shadow hover:bg-rose-900/10 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation */}
      <div className="flex gap-2 border-b dark:border-slate-800 pb-px text-xs font-bold">
        <button
          onClick={() => setAdminTab('kpis')}
          className={`pb-3 px-2 border-b-2 transition ${
            adminTab === 'kpis' ? 'border-tpf-purple text-tpf-purple dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          KPI Analytics
        </button>
        <button
          onClick={() => setAdminTab('kyc')}
          className={`pb-3 px-2 border-b-2 transition ${
            adminTab === 'kyc' ? 'border-tpf-purple text-tpf-purple dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          KYC Approvals Queue
        </button>
        <button
          onClick={() => setAdminTab('customers')}
          className={`pb-3 px-2 border-b-2 transition ${
            adminTab === 'customers' ? 'border-tpf-purple text-tpf-purple dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Customer Directory &amp; Onboarding
        </button>
        <button
          onClick={() => setAdminTab('users')}
          className={`pb-3 px-2 border-b-2 transition ${
            adminTab === 'users' ? 'border-tpf-purple text-tpf-purple dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Admin Users &amp; Multi-City Rights
        </button>
        <button
          onClick={() => setAdminTab('logs')}
          className={`pb-3 px-2 border-b-2 transition ${
            adminTab === 'logs' ? 'border-tpf-purple text-tpf-purple dark:text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Tab Renderers */}
      <div className="min-h-[400px]">
        {loading && (
          <div className="text-center py-20 text-slate-400 text-xs font-semibold animate-pulse">
            Syncing database details...
          </div>
        )}

        {!loading && adminTab === 'kpis' && stats && (
          <div className="space-y-8 animate-fade-in text-left">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-panel border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Registrations</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{stats.totalCustomers}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/20 text-tpf-purple flex items-center justify-center border border-purple-200 dark:border-purple-800/30">
                  <Users size={18} />
                </div>
              </div>

              <div className="glass-panel border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">KYC Pending</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{stats.pendingKyc}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/20 text-tpf-pink flex items-center justify-center border border-pink-200 dark:border-pink-800/30">
                  <FileCheck size={18} />
                </div>
              </div>

              <div className="glass-panel border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Conversion Rate</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">{stats.paymentSuccessRate.toFixed(1)}%</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/20 text-tpf-blue flex items-center justify-center border border-blue-200 dark:border-blue-800/30">
                  <BarChart3 size={18} />
                </div>
              </div>

              <div className="glass-panel border rounded-2xl p-5 flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Total Revenue</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1 block">₹{stats.totalRevenue.toFixed(0)}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center border border-emerald-200 dark:border-emerald-800/30">
                  <Landmark size={18} />
                </div>
              </div>
            </div>

            {/* Middle Section: Funnel & Popular Plans */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Drop-off Conversion Funnel */}
              <div className="glass-panel border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Conversion Funnel Drop-off Analysis</h3>
                <div className="space-y-3">
                  {Object.entries(stats.dropOffFunnel).map(([stepName, count]: any) => (
                    <div key={stepName} className="text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="uppercase text-slate-400 text-[10px]">{stepName.replace('_', ' ')}</span>
                        <span className="text-slate-800 dark:text-slate-200">{count} Users</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="gradient-bg h-full transition-all duration-500" 
                          style={{ width: `${stats.totalCustomers > 0 ? (count / stats.totalCustomers) * 100 : 0}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Subscription Plans */}
              <div className="glass-panel border rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Popular Subscribed Plans</h3>
                <div className="space-y-4 pt-2">
                  {Object.keys(stats.popularPlans).length > 0 ? (
                    Object.entries(stats.popularPlans).map(([planName, count]: any) => (
                      <div key={planName} className="flex justify-between items-center p-3 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{planName}</span>
                        <span className="px-3 py-1 bg-tpf-purple text-white rounded-full font-extrabold">{count} Subscriptions</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-10">No active subscriptions registered yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && adminTab === 'kyc' && (
          <div className="glass-panel border rounded-3xl p-6 shadow-sm animate-fade-in text-left space-y-4">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">KYC Metadata Verification Queue (PII Protected)</h3>
                <p className="text-[10px] text-slate-400">Customer raw files are hidden for PII privacy. Approve based on rule validation score &amp; masked ID audit.</p>
              </div>
              <span className="px-2.5 py-1 bg-purple-500/10 text-tpf-purple dark:text-purple-300 text-[10px] font-extrabold rounded-lg">
                🔒 PII Privacy Shield Active
              </span>
            </div>
            
            {customers.length > 0 ? (
              <div className="space-y-3">
                {customers.map((d: any) => (
                  <div key={d.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl gap-4">
                    <div className="text-xs space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800 dark:text-white uppercase">{d.docType}</span>
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] rounded">
                          {d.maskedDocNumber || 'XXXX-XXXX-4821'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          d.riskLevel === 'LOW' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          Score: {d.inspectionScore || 98.6}% ({d.riskLevel || 'LOW'} Risk)
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Uploaded by: <span className="font-bold text-slate-600 dark:text-slate-300">{d.uploadedByRole || 'CUSTOMER'}</span> • {d.originalFileName || 'Document.pdf'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleKycApproval(d.id, false)}
                        className="px-3 py-2 border border-rose-200 text-rose-500 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-bold"
                        title="Reject KYC"
                      >
                        <X size={14} className="inline mr-1" /> Reject
                      </button>
                      <button
                        onClick={() => handleKycApproval(d.id, true)}
                        className="px-3 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 text-xs font-bold shadow"
                        title="Approve KYC"
                      >
                        <Check size={14} className="inline mr-1" /> Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-10 text-center">No pending KYC files in queue. Clean state.</p>
            )}
          </div>
        )}

        {!loading && adminTab === 'customers' && (
          <div className="glass-panel border rounded-3xl p-6 shadow-sm animate-fade-in text-left space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Customer Directory &amp; Location Access Control</h3>
                <p className="text-[11px] text-slate-400">Filtered by your assigned cities. Generate magic links or export reports.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border dark:border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <FileCheck size={14} /> Export CSV
                </button>
                <button
                  onClick={() => setShowInitiateModal(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <UserPlus size={14} /> New Customer Onboarding
                </button>
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search customer..."
                    className="w-full pl-8 pr-4 py-2 border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs dark:text-white focus:outline-none"
                  />
                  <Search size={14} className="absolute left-2.5 top-3 text-slate-400" />
                </div>
              </div>
            </div>

            {filteredCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b dark:border-slate-800 text-slate-400">
                      <th className="py-3 px-2">Customer ID</th>
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Mobile</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Lifecycle Status</th>
                      <th className="py-3 px-2 text-right">SOC Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map(cust => (
                      <tr key={cust.id} className="border-b dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        <td className="py-3.5 px-2 font-bold text-tpf-purple dark:text-purple-400">{cust.customerId}</td>
                        <td className="py-3.5 px-2 font-semibold text-slate-800 dark:text-slate-200">{cust.firstName} {cust.lastName}</td>
                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{cust.mobileNumber}</td>
                        <td className="py-3.5 px-2 text-slate-600 dark:text-slate-400">{cust.email}</td>
                        <td className="py-3.5 px-2">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            cust.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>{cust.status}</span>
                        </td>
                        <td className="py-3.5 px-2 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleGenerateMagicLink(cust.mobileNumber)}
                              className="px-2.5 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-[10px] font-bold flex items-center gap-1"
                              title="Generate 1-click customer resume link"
                            >
                              🔗 Magic Link
                            </button>
                            <button
                              onClick={() => handleViewStepAudit(cust)}
                              className="px-2.5 py-1.5 rounded-lg border dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold flex items-center gap-1"
                              title="View step execution audit trail"
                            >
                              <Eye size={12} /> Audit
                            </button>
                            <button
                              onClick={() => handleResumeCustomerOnboarding(cust)}
                              className="px-3 py-1.5 rounded-lg bg-tpf-purple text-white hover:opacity-90 text-[10px] font-extrabold flex items-center gap-1 shadow"
                            >
                              <PlayCircle size={12} /> Onboard
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-10 text-center">No matching records found.</p>
            )}
          </div>
        )}

        {/* TAB: Admin Users & Multi-City Tagging Management */}
        {!loading && adminTab === 'users' && (
          <div className="glass-panel border rounded-3xl p-6 shadow-sm animate-fade-in text-left space-y-6">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">Admin User Accounts &amp; Multi-City Geo-Tagging Permissions</h3>
                <p className="text-[11px] text-slate-400">Assign multiple cities to admin users. Admins can only view &amp; onboard customers in their tagged cities.</p>
              </div>
              <span className="px-3 py-1 bg-purple-500/10 text-tpf-purple dark:text-purple-300 text-xs font-bold rounded-xl">
                Zero Code Changes Dynamic Control
              </span>
            </div>

            <div className="space-y-4">
              {adminUsers.map((user: any) => (
                <div key={user.id} className="p-5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800/80 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-extrabold text-sm text-slate-800 dark:text-white">{user.fullName} ({user.username})</span>
                      <span className="ml-2 text-[10px] text-slate-400 font-mono">{user.email}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      user.isGlobalAdmin ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      {user.isGlobalAdmin ? 'Global Super Admin' : 'Regional Admin'}
                    </span>
                  </div>

                  {!user.isGlobalAdmin && (
                    <div className="space-y-1.5 pt-2 border-t dark:border-slate-800">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Cities (Toggle Multiple):</span>
                      <div className="flex flex-wrap gap-2">
                        {['Mumbai', 'Navi Mumbai', 'Pune', 'New Delhi', 'Bengaluru', 'Surat'].map(city => {
                          const isAssigned = (user.assignedCities || []).includes(city);
                          return (
                            <button
                              key={city}
                              type="button"
                              onClick={() => handleToggleCityTag(user.username, city, user.assignedCities || [])}
                              className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition ${
                                isAssigned
                                  ? 'bg-tpf-purple text-white border-tpf-purple shadow-sm'
                                  : 'bg-slate-100 dark:bg-slate-950 text-slate-400 border-slate-300 dark:border-slate-800 hover:text-white'
                              }`}
                            >
                              {isAssigned ? '✓ ' : '+ '} {city}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && adminTab === 'logs' && (
          <div className="glass-panel border rounded-3xl p-6 shadow-sm animate-fade-in text-left space-y-4">
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4">System-Wide Audit Trails</h3>
            
            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800/80 rounded-xl text-xs flex justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-extrabold text-[9px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          {log.action}
                        </span>
                        <span className="text-slate-400 text-[10px]">Actor: {log.actor} | IP: {log.ipAddress}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{log.description}</p>
                      <p className="text-[10px] text-tpf-pink">Correlation ID: {log.correlationId}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-10 text-center">No audit log entries recorded in database.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal: Initiate Customer Onboarding */}
      {showInitiateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="text-tpf-purple" size={20} />
                <h3 className="font-extrabold text-base text-slate-850 dark:text-white">Initiate Onboarding on Behalf of Customer</h3>
              </div>
              <button onClick={() => setShowInitiateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleInitiateOnboarding} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30 rounded-xl text-[11px] text-tpf-purple dark:text-purple-300">
                SOC Admin will initiate the customer journey. You can complete all steps or save at any point for customer to continue.
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Mobile Number (Required)</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[6-9][0-9]{9}"
                  value={initMobile}
                  onChange={e => setInitMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit customer mobile"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-2.5 dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase text-[10px]">First Name</label>
                  <input
                    type="text"
                    value={initFirstName}
                    onChange={e => setInitFirstName(e.target.value)}
                    placeholder="Rahul"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-2.5 dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-slate-400 uppercase text-[10px]">Last Name</label>
                  <input
                    type="text"
                    value={initLastName}
                    onChange={e => setInitLastName(e.target.value)}
                    placeholder="Sharma"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-2.5 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-slate-400 uppercase text-[10px]">Email Address</label>
                <input
                  type="email"
                  value={initEmail}
                  onChange={e => setInitEmail(e.target.value)}
                  placeholder="rahul.sharma@example.com"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-xl px-4 py-2.5 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInitiateModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-semibold text-slate-600 dark:text-slate-300 dark:border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={initLoading}
                  className="w-1/2 py-2.5 rounded-xl text-white font-bold text-xs gradient-bg hover:opacity-90 flex items-center justify-center gap-1 shadow-md"
                >
                  {initLoading ? 'Launching...' : 'Start Onboarding Wizard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Step Execution Audit */}
      {showAuditModal && auditCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-6 animate-fade-in text-left">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-850 dark:text-white">Step Actor Audit Trail</h3>
                <p className="text-[11px] text-slate-400">Customer: {auditCustomer.firstName} {auditCustomer.lastName} ({auditCustomer.mobileNumber})</p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 text-xs">
              {customerJourney ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border dark:border-slate-800 rounded-xl space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-800 dark:text-white">Current Journey Progress</span>
                      <span className="px-2 py-0.5 bg-tpf-purple/20 text-tpf-purple dark:text-purple-300 rounded font-bold text-[10px]">
                        Step {customerJourney.currentStep} of 8
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">Last Page: {customerJourney.currentPage}</p>
                    <p className="text-slate-400 text-[11px]">
                      Last Performed By: <span className="font-bold text-slate-200">{customerJourney.lastPerformedByName || customerJourney.lastPerformedById || 'Customer'}</span> ({customerJourney.lastPerformedByRole || 'CUSTOMER'})
                    </p>
                    <p className="text-[10px] text-slate-500">Last Active: {new Date(customerJourney.lastActiveAt).toLocaleString()}</p>
                  </div>

                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Step Execution Records</h4>
                  
                  {customerJourney.stepHistoryJson ? (
                    (() => {
                      try {
                        const history = JSON.parse(customerJourney.stepHistoryJson);
                        return (
                          <div className="space-y-2">
                            {history.map((item: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-xl border dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                                <div>
                                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                                    Step {item.step}: {item.stepName}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    Executed by: <span className="font-semibold text-tpf-purple dark:text-purple-400">{item.actorName || item.actorId}</span> ({item.role})
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-slate-400 text-xs">Raw step log: {customerJourney.stepHistoryJson}</p>;
                      }
                    })()
                  ) : (
                    <p className="text-slate-400 py-4 text-center">No individual step audit items recorded yet.</p>
                  )}

                  {/* Render Visual Journey Timeline */}
                  <div className="pt-4 border-t dark:border-slate-800">
                    <JourneyTimeline
                      mobileNumber={auditCustomer.mobileNumber}
                      stepHistory={
                        customerJourney.stepHistoryJson
                          ? (() => { try { return JSON.parse(customerJourney.stepHistoryJson); } catch (e) { return []; } })()
                          : []
                      }
                      currentStep={customerJourney.currentStep || 1}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-slate-400 py-8 text-center animate-pulse">Loading journey tracking details...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp & SMS Notification Simulator Modal */}
      <NotificationSimulator
        isOpen={showNotifSim}
        onClose={() => setShowNotifSim(false)}
        mobileNumber={simMobile}
      />
    </div>
  );
};
