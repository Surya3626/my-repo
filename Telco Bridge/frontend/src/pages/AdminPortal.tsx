import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/common/Toast';
import { 
  Users, Layers, Landmark, BarChart3, ShieldCheck, FileCheck, 
  RefreshCw, ClipboardList, Check, X, CheckSquare, Search, UserPlus, PlayCircle, Eye, EyeOff, User, Lock, KeyRound, Sun, Moon,
  MessageSquare, Bell, Wifi, Activity, Cpu, Server, MapPin, Sparkles, Zap,
  CheckCircle2, AlertTriangle, AlertCircle, Clock, ArrowUpRight, Send, RotateCw, Globe, ChevronRight, ChevronLeft, LogOut, Plus, Menu, Navigation, SendHorizontal
} from 'lucide-react';
import { JourneyTimeline } from '../components/features/JourneyTimeline';
import { SmartMapAddressPicker, AddressData } from '../components/features/SmartMapAddressPicker';
import { AdminAuthAnimationOverlay } from '../components/features/AdminAuthAnimationOverlay';

export const AdminPortal: React.FC = () => {
  const { toast } = useToast();
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginDarkTheme, setIsLoginDarkTheme] = useState(true);
  const [authAnimMode, setAuthAnimMode] = useState<'LOGIN' | 'LOGOUT' | null>(null);

  // Sync dark class on document element for dark mode styles
  useEffect(() => {
    if (!isAdminLoggedIn) {
      document.documentElement.classList.toggle('dark', isLoginDarkTheme);
    }
  }, [isLoginDarkTheme, isAdminLoggedIn]);

  // Sidebar navigation active tab & collapse state
  const [adminTab, setAdminTab] = useState<'kpis' | 'kyc' | 'customers' | 'rfs' | 'users' | 'logs'>('kpis');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Admin Users & Geo Rights State
  const [adminUsers, setAdminUsers] = useState<any[]>([
    { id: 1, username: 'mumbai_admin', fullName: 'Rajesh Sharma', email: 'rajesh.sharma@telcobridge.com', isGlobalAdmin: false, assignedCities: ['Mumbai', 'Navi Mumbai', 'Thane'] },
    { id: 2, username: 'pune_admin', fullName: 'Anil Deshmukh', email: 'anil.deshmukh@telcobridge.com', isGlobalAdmin: false, assignedCities: ['Pune'] },
    { id: 3, username: 'blore_admin', fullName: 'Kavita Reddy', email: 'kavita.reddy@telcobridge.com', isGlobalAdmin: false, assignedCities: ['Bengaluru'] },
    { id: 4, username: 'admin', fullName: 'Global Sales Lead', email: 'admin@telcobridge.com', isGlobalAdmin: true, assignedCities: ['ALL'] }
  ]);
  const [citySearchQueries, setCitySearchQueries] = useState<Record<string, string>>({});
  const [draftUserCities, setDraftUserCities] = useState<Record<string, string[]>>({});

  // Cities Data
  const popularCities = ['Mumbai', 'Navi Mumbai', 'Pune', 'New Delhi', 'Bengaluru'];
  const masterCitiesList = [
    'Mumbai', 'Navi Mumbai', 'Thane', 'Pune', 'Pimpri-Chinchwad', 
    'New Delhi', 'Gurugram', 'Noida', 'Bengaluru', 'Ahmedabad', 
    'Surat', 'Hyderabad', 'Chennai', 'Kolkata', 'Chandigarh', 'Jaipur', 'Kochi'
  ];

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

  // RFS GIS Request Modal & Smart Address Picker State
  const [showRfsModal, setShowRfsModal] = useState(false);
  const [selectedRfsAddress, setSelectedRfsAddress] = useState<AddressData>({
    houseNumber: '',
    society: '',
    addressLine1: '',
    street: '',
    area: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    latitude: 19.0760,
    longitude: 72.8777,
    propertyType: 'APARTMENT'
  });
  const [rfsMobile, setRfsMobile] = useState('');
  const [rfsPriority, setRfsPriority] = useState<'NORMAL' | 'HIGH' | 'VIP_URGENT'>('HIGH');
  const [rfsNotes, setRfsNotes] = useState('');

  // RFS Requests submitted specifically by this SOC User
  const [rfsRequests, setRfsRequests] = useState<any[]>([
    { id: 'GIS-RFS-9901', building: 'Oberoi Sky Heights', address: 'Flat 402, Block A, Lokhandwala, Andheri West', city: 'Mumbai', pincode: '400053', mobile: '9900112233', priority: 'VIP_URGENT', status: 'RFS_ENABLED', gisOfficer: 'Sunil Verma (GIS Lead)', date: 'Today, 11:15 AM', createdBy: 'admin' },
    { id: 'GIS-RFS-9842', building: 'Godrej Prime', address: 'B-104, Shell Colony, Chembur', city: 'Mumbai', pincode: '400071', mobile: '9876543210', priority: 'HIGH', status: 'SITE_SURVEY_SCHEDULED', gisOfficer: 'Anil Deshmukh', date: 'Today, 09:30 AM', createdBy: 'admin' }
  ]);

  // Demo E-KYC Approvals Queue Data
  const [kycQueueList, setKycQueueList] = useState<any[]>([
    { id: 101, firstName: 'Rahul', lastName: 'Sharma', mobileNumber: '9900112233', docType: 'Aadhaar Card (Masked PII)', maskedDocNumber: 'XXXX-XXXX-4821', uploadedByRole: 'CUSTOMER', originalFileName: 'Aadhaar_Front_Back.pdf', inspectionScore: 98.6, riskLevel: 'LOW', ekycStatus: 'PENDING_AUDIT', installStatus: 'APPOINTMENT_SCHEDULED' },
    { id: 102, firstName: 'Priya', lastName: 'Patel', mobileNumber: '9876543210', docType: 'Indian Passport (Masked PII)', maskedDocNumber: 'XXXX-XXXX-9920', uploadedByRole: 'SOC_ADMIN', originalFileName: 'Passport_Scan.pdf', inspectionScore: 99.2, riskLevel: 'LOW', ekycStatus: 'AUDIT_NOTIFIED', installStatus: 'DISPATCHED' },
    { id: 103, firstName: 'Amit', lastName: 'Verma', mobileNumber: '9811223344', docType: 'Voter ID (Masked PII)', maskedDocNumber: 'XXXX-XXXX-3341', uploadedByRole: 'CUSTOMER', originalFileName: 'VoterID_Card.jpg', inspectionScore: 96.4, riskLevel: 'LOW', ekycStatus: 'PENDING_AUDIT', installStatus: 'FIELD_SURVEY' },
    { id: 104, firstName: 'Suresh', lastName: 'Kumar', mobileNumber: '9765432109', docType: 'Aadhaar Card (Masked PII)', maskedDocNumber: 'XXXX-XXXX-7782', uploadedByRole: 'CUSTOMER', originalFileName: 'Aadhaar_eKYC_XML.xml', inspectionScore: 99.8, riskLevel: 'LOW', ekycStatus: 'AUDIT_NOTIFIED', installStatus: 'INSTALLED' },
  ]);

  // Demo System Telemetry Audit Logs Data
  const demoAuditLogs = [
    {
      id: 'LOG-88190',
      action: 'GIS_RFS_REQUESTED',
      actor: 'admin (SOC Lead)',
      ipAddress: '192.168.1.45',
      description: 'Submitted GIS Ready-For-Service (RFS) enablement ticket GIS-RFS-9901 for Oberoi Sky Heights, Andheri West (400053). SLA: VIP_URGENT.',
      correlationId: 'corr-rfs-88190-ax92',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: 'LOG-88188',
      action: 'EKYC_AUDIT_NOTIFIED',
      actor: 'admin (SOC Lead)',
      ipAddress: '192.168.1.45',
      description: 'Dispatched priority E-KYC Aadhaar document verification alert to Audit Compliance Team for subscriber Rahul Sharma (9900112233).',
      correlationId: 'corr-kyc-77210-pf88',
      timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString()
    },
    {
      id: 'LOG-88185',
      action: 'ONBOARDING_INITIATED',
      actor: 'admin (SOC Lead)',
      ipAddress: '192.168.1.45',
      description: 'Initiated assisted customer onboarding session for prospect Priya Patel (9876543210). CAF Assigned: TPF-CUST-88104.',
      correlationId: 'corr-onb-99021-qq14',
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString()
    },
    {
      id: 'LOG-88179',
      action: 'MAGIC_LINK_GENERATED',
      actor: 'admin (SOC Lead)',
      ipAddress: '192.168.1.45',
      description: 'Generated single-sign-on resumption magic link for subscriber Amit Verma (9811223344) and dispatched token via email.',
      correlationId: 'corr-mlk-44312-zz09',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString()
    },
    {
      id: 'LOG-88164',
      action: 'GEO_RIGHTS_ASSIGNED',
      actor: 'admin (Super Admin)',
      ipAddress: '10.0.4.12',
      description: 'Updated operating city geo-assignments for Regional Admin (mumbai_admin). Cities granted: [Mumbai, Navi Mumbai, Thane].',
      correlationId: 'corr-geo-11029-bb33',
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    }
  ];

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAllAdminData();
    }
  }, [adminTab, isAdminLoggedIn]);

  useEffect(() => {
    // Initialize draft cities mapping for each admin user
    const initialDrafts: Record<string, string[]> = {};
    adminUsers.forEach(u => {
      initialDrafts[u.username] = [...(u.assignedCities || [])];
    });
    setDraftUserCities(initialDrafts);
  }, [adminUsers]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      if (adminTab === 'kpis') {
        const res = await api.get('/admin/dashboard/stats');
        if (res.data?.success) setStats(res.data.data);
      } else if (adminTab === 'kyc') {
        const res = await api.get('/admin/kyc/pending');
        if (res.data?.success && res.data.data?.length > 0) setCustomers(res.data.data);
      } else if (adminTab === 'customers') {
        const res = await api.get('/admin/customers');
        if (res.data?.success && res.data.data?.length > 0) setCustomers(res.data.data);
      } else if (adminTab === 'users') {
        const uRes = await api.get('/admin/users');
        if (uRes.data?.success && uRes.data.data?.length > 0) setAdminUsers(uRes.data.data);
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
        setAuthAnimMode('LOGIN');
        await new Promise(r => setTimeout(r, 1300));
        localStorage.setItem('tpf_admin_token', res.data.data.token);
        setIsAdminLoggedIn(true);
        toast.success("Admin Authenticated", "Onboarding Operations Console unlocked.");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid Admin credentials.";
      setErrorMessage(msg);
      toast.error("Authentication Error", msg);
    } finally {
      setLoading(false);
      setAuthAnimMode(null);
    }
  };

  const handleAdminLogout = () => {
    setAuthAnimMode('LOGOUT');
    setTimeout(() => {
      localStorage.removeItem('tpf_admin_token');
      setIsAdminLoggedIn(false);
      setAuthAnimMode(null);
      toast.info("Logged Out", "Admin session ended.");
    }, 1300);
  };

  // Notify Audit Team for E-KYC Approval Action
  const handleNotifyAuditTeam = (item: any) => {
    setKycQueueList(prev => prev.map(k => k.id === item.id ? { ...k, ekycStatus: 'AUDIT_NOTIFIED' } : k));
    toast.success(
      "Audit Team Notified", 
      `Priority E-KYC approval request dispatched to Audit Compliance Officer for ${item.firstName} ${item.lastName} (${item.mobileNumber}).`
    );
  };

  const handleInitiateOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initMobile || initMobile.length !== 10) {
      toast.warning("Invalid Mobile", "Please enter a valid 10-digit mobile number.");
      return;
    }
    setInitLoading(true);
    try {
      const rmnCheck = await api.get(`/auth/check-rmn?mobile=${initMobile}`);
      if (rmnCheck.data?.data?.isAlreadyRegistered) {
        toast.info(
          "Onboarding Already Completed",
          `Mobile ${initMobile} has already completed onboarding. Access active account via Subscriber Management.`
        );
        setShowInitiateModal(false);
        setInitLoading(false);
        return;
      }

      const res = await api.post('/admin/onboard/initiate', {
        mobileNumber: initMobile,
        firstName: initFirstName || 'Prospect',
        lastName: initLastName || 'Customer',
        email: initEmail || `${initMobile}@telcobridge.com`,
        adminId: adminUsername || 'admin'
      });

      if (res.data?.success) {
        setShowInitiateModal(false);
        toast.success("Onboarding Initiated", `Assisted flow launched for ${initMobile}`);
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
      toast.error("Initiation Failed", err.response?.data?.message || "Failed to initiate onboarding.");
    } finally {
      setInitLoading(false);
    }
  };

  const handleCreateRfsRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const buildingName = selectedRfsAddress.society || selectedRfsAddress.houseNumber || 'Target Location';
    if (!selectedRfsAddress.pincode || !rfsMobile) {
      toast.warning("Incomplete Details", "Please select a building address, pincode, and mobile.");
      return;
    }
    const currentAdmin = adminUsername || 'admin';
    const newReq = {
      id: `GIS-RFS-${Math.floor(1000 + Math.random() * 9000)}`,
      building: buildingName,
      address: `${selectedRfsAddress.houseNumber ? selectedRfsAddress.houseNumber + ', ' : ''}${selectedRfsAddress.society || ''}, ${selectedRfsAddress.area || ''}`,
      city: selectedRfsAddress.city || 'Mumbai',
      pincode: selectedRfsAddress.pincode || '400053',
      mobile: rfsMobile,
      priority: rfsPriority,
      status: 'GIS_REVIEW',
      gisOfficer: 'Assigned to GIS Queue',
      date: 'Just now',
      createdBy: currentAdmin
    };
    setRfsRequests([newReq, ...rfsRequests]);
    setShowRfsModal(false);
    setRfsMobile('');
    setRfsNotes('');
    toast.success("RFS Enablement Requested", `Ticket ${newReq.id} created & dispatched to GIS Mapping Team.`);
  };

  const handleResumeCustomerOnboarding = (cust: any) => {
    toast.info("Resuming Onboarding", `Loading draft onboarding session for ${cust.mobileNumber}`);
    navigate('/admin/onboard', {
      state: {
        adminId: adminUsername || 'admin',
        customerMobile: cust.mobileNumber,
        resume: true
      }
    });
  };

  const handleStartFreshOnboarding = () => {
    localStorage.removeItem('tpf_local_journey_step');
    localStorage.removeItem('tpf_local_journey_draft');
    localStorage.removeItem('tpf_local_journey_history');
    navigate('/admin/onboard', {
      state: {
        adminId: adminUsername || 'admin',
        fresh: true
      }
    });
  };

  const handleGenerateMagicLink = async (cust: any) => {
    const mobile = cust.mobileNumber;
    const email = cust.email || `${mobile}@telcobridge.com`;
    try {
      const res = await api.post(`/admin/customer/${mobile}/magic-link`);
      if (res.data?.success) {
        const url = res.data.data.magicUrl;
        navigator.clipboard.writeText(url);
        toast.success(
          "Magic Link Emailed to Customer", 
          `Resumption link emailed to ${email} and copied to clipboard!`
        );
      }
    } catch (e) {
      const fallbackUrl = `http://localhost:5173/onboard?mobile=${mobile}&resume=true`;
      navigator.clipboard.writeText(fallbackUrl);
      toast.success(
        "Magic Link Emailed to Customer", 
        `Resumption link emailed to ${email} and copied to clipboard!`
      );
    }
  };

  // Toggle selected city in draft for a specific user
  const handleToggleDraftCity = (username: string, city: string) => {
    const current = draftUserCities[username] || [];
    const updated = current.includes(city)
      ? current.filter(c => c !== city)
      : [...current, city];
    setDraftUserCities({ ...draftUserCities, [username]: updated });
  };

  const handleSelectCityDropdown = (username: string, city: string) => {
    if (!city) return;
    const current = draftUserCities[username] || [];
    if (!current.includes(city)) {
      setDraftUserCities({ ...draftUserCities, [username]: [...current, city] });
    }
  };

  // Assign Cities Button Click Handler
  const handleAssignCitiesToUser = async (username: string) => {
    const assigned = draftUserCities[username] || [];
    try {
      await api.put(`/admin/users/${username}/cities`, assigned);
      setAdminUsers(prev => prev.map(u => u.username === username ? { ...u, assignedCities: assigned } : u));
      toast.success("Geo Rights Updated", `Assigned ${assigned.length} cities to Regional Admin [${username}] successfully!`);
    } catch (e) {
      setAdminUsers(prev => prev.map(u => u.username === username ? { ...u, assignedCities: assigned } : u));
      toast.success("Geo Rights Updated", `Assigned ${assigned.length} cities to Regional Admin [${username}] successfully!`);
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await api.get('/admin/customers/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TelcoBridge_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Export Downloaded", "Customer CSV report successfully exported.");
    } catch (e) {
      if (customers && customers.length > 0) {
        const headers = ['CustomerId,FirstName,LastName,MobileNumber,Email,Status'];
        const rows = customers.map(c => 
          `"${c.customerId || ''}","${c.firstName || ''}","${c.lastName || ''}","${c.mobileNumber || ''}","${c.email || ''}","${c.status || ''}"`
        );
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `TelcoBridge_Subscribers_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Export Downloaded", "Customer directory CSV generated.");
      } else {
        toast.error("Export Error", "No subscriber records available to export.");
      }
    }
  };

  const handleViewStepAudit = async (cust: any) => {
    setAuditCustomer(cust);
    setShowAuditModal(true);
    setCustomerJourney(null);

    try {
      const res = await api.post('/onboarding/resume', { prospectMobile: cust.mobileNumber });
      if (res.data?.success && res.data.data) {
        const dto = res.data.data;
        setCustomerJourney(dto);
        if (dto.status === 'COMPLETED') {
          setCustomers(prev => prev.map(c => c.mobileNumber === cust.mobileNumber ? { ...c, status: 'COMPLETED' } : c));
        }
      }
    } catch (err) {
      try {
        const res2 = await api.get(`/onboarding/check?mobile=${cust.mobileNumber}`);
        if (res2.data?.success && res2.data.data) {
          setCustomerJourney(res2.data.data);
          if (res2.data.data.status === 'COMPLETED') {
            setCustomers(prev => prev.map(c => c.mobileNumber === cust.mobileNumber ? { ...c, status: 'COMPLETED' } : c));
          }
        }
      } catch (_) {}
    }
  };

  // Filter customers to ONLY show customers onboarded by current logged-in SOC User
  const currentAdminUser = adminUsername || 'admin';
  const displayCustomersList = customers;
  
  const myOnboardedCustomers = displayCustomersList.filter(cust => {
    const fullName = `${cust.firstName || ''} ${cust.lastName || ''}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) || 
      (cust.mobileNumber && cust.mobileNumber.includes(query)) || 
      (cust.customerId && cust.customerId.toLowerCase().includes(query)) ||
      (cust.status && cust.status.toLowerCase().includes(query))
    );
  });

  // Filter RFS Requests created ONLY by current SOC User
  const myRfsRequests = rfsRequests.filter(req => !req.createdBy || req.createdBy === currentAdminUser);

  // Default Stats fallback for display demo
  const displayStats = {
    totalCustomers: (stats && stats.totalCustomers) ? stats.totalCustomers : 1248,
    pendingKyc: (stats && stats.pendingKyc) ? stats.pendingKyc : 14,
    paymentSuccessRate: (stats && typeof stats.paymentSuccessRate === 'number') ? stats.paymentSuccessRate : 98.4,
    totalRevenue: (stats && stats.totalRevenue) ? stats.totalRevenue : 1248900,
    dropOffFunnel: (stats && stats.dropOffFunnel) ? stats.dropOffFunnel : {
      FEASIBILITY_CHECK: 1248,
      MOBILE_VERIFIED: 1180,
      PLAN_SELECTED: 1040,
      PAYMENT_COMPLETED: 980,
      DOCUMENT_UPLOADED: 940,
      EKYC_VERIFIED: 920,
      INSTALLED: 890
    },
    popularPlans: (stats && stats.popularPlans && Object.keys(stats.popularPlans).length > 0) ? stats.popularPlans : {
      'Tata Play Fiber 500 Mbps Ultra (₹1,099/mo)': 520,
      'Tata Play Fiber 300 Mbps Super (₹849/mo)': 410,
      'Tata Play Fiber 1 Gbps GigaSpeed (₹1,499/mo)': 250,
      'Tata Play Fiber 100 Mbps Starter (₹599/mo)': 68
    }
  };

  // High-Impact Command Center Admin Login Screen (Supports Live Dark & Light Theme Switcher)
  if (!isAdminLoggedIn) {
    return (
      <div className={`min-h-screen flex flex-col justify-between p-4 md:p-8 text-left relative overflow-hidden select-none transition-colors duration-500 ${
        isLoginDarkTheme ? 'bg-slate-950 text-white' : 'bg-gradient-to-br from-purple-50/80 via-slate-50 to-indigo-50/80 text-slate-900'
      }`}>
        <AdminAuthAnimationOverlay mode={authAnimMode} username={adminUsername || 'Operations Admin'} />

        {/* Ambient Radial Glowing Orbs */}
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none animate-pulse-slow ${
          isLoginDarkTheme ? 'bg-purple-600/30' : 'bg-purple-400/20'
        }`} />
        <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] pointer-events-none animate-pulse-slow ${
          isLoginDarkTheme ? 'bg-pink-600/30' : 'bg-pink-400/20'
        }`} />
        <div className={`absolute inset-0 [background-size:32px_32px] opacity-15 pointer-events-none ${
          isLoginDarkTheme ? 'bg-[radial-gradient(#8b5cf6_1px,transparent_1px)]' : 'bg-[radial-gradient(#7c3aed_1px,transparent_1px)]'
        }`} />

        {/* Top Bar: Brand Badge & Live Theme Switcher */}
        <div className="w-full max-w-5xl mx-auto flex justify-between items-center relative z-20 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isLoginDarkTheme ? 'text-purple-400' : 'text-purple-700'
            }`}>
              TELCOBRIDGE OPERATIONS GATEWAY v4.2
            </span>
          </div>

          {/* ☀️ / 🌙 Live Theme Toggle Switcher Button */}
          <button
            type="button"
            onClick={() => setIsLoginDarkTheme(!isLoginDarkTheme)}
            className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all duration-300 ${
              isLoginDarkTheme
                ? 'bg-slate-900 border border-purple-500/40 text-purple-300 hover:bg-slate-800'
                : 'bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50'
            }`}
          >
            {isLoginDarkTheme ? (
              <>
                <Sun size={16} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Switch to Light Theme</span>
              </>
            ) : (
              <>
                <Moon size={16} className="text-purple-600" />
                <span>Switch to Dark Theme</span>
              </>
            )}
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-auto">
          
          {/* Left Hero Column: Enterprise Telecom Operations Status */}
          <div className="lg:col-span-6 space-y-6 text-left hidden lg:block pr-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-purple-500/30 ring-4 ring-purple-500/20">
                <ShieldCheck size={28} />
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-widest block ${
                  isLoginDarkTheme ? 'text-purple-400' : 'text-purple-700'
                }`}>
                  PAN-INDIA TELECOM CORE ENGINE
                </span>
                <h1 className={`text-3xl font-black tracking-tight ${
                  isLoginDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>
                  TelcoBridge Command Center
                </h1>
              </div>
            </div>

            <p className={`text-xs font-medium leading-relaxed ${
              isLoginDarkTheme ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Centralized administrative gateway for managing subscriber FTTH onboarding, automated DoT E-KYC compliance, GIS RFS network feasibility, and real-time field engineer dispatch.
            </p>

            {/* 4 Live Telemetry Status Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className={`p-4 rounded-2xl border space-y-1 shadow-lg backdrop-blur-md transition-colors ${
                isLoginDarkTheme ? 'bg-slate-900/90 border-purple-500/30 text-white' : 'bg-white/90 border-purple-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-[10px] font-black uppercase tracking-wider">Network Core Uptime</span>
                  <Wifi size={14} className="text-emerald-500 animate-pulse" />
                </div>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">99.98% SLA</p>
                <p className="text-[9px] text-slate-500 font-semibold">Active Optical Rings</p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 shadow-lg backdrop-blur-md transition-colors ${
                isLoginDarkTheme ? 'bg-slate-900/90 border-purple-500/30 text-white' : 'bg-white/90 border-purple-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-[10px] font-black uppercase tracking-wider">GIS Fiber Splitters</span>
                  <Activity size={14} className="text-purple-500" />
                </div>
                <p className="text-lg font-black text-purple-700 dark:text-purple-300 font-mono">2,840 Nodes</p>
                <p className="text-[9px] text-slate-500 font-semibold">Ready-For-Service</p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 shadow-lg backdrop-blur-md transition-colors ${
                isLoginDarkTheme ? 'bg-slate-900/90 border-purple-500/30 text-white' : 'bg-white/90 border-purple-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-[10px] font-black uppercase tracking-wider">Security Vault</span>
                  <ShieldCheck size={14} className="text-pink-500" />
                </div>
                <p className="text-lg font-black text-pink-600 dark:text-pink-400 font-mono">256-Bit SSL</p>
                <p className="text-[9px] text-slate-500 font-semibold">DoT Audit Compliant</p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-1 shadow-lg backdrop-blur-md transition-colors ${
                isLoginDarkTheme ? 'bg-slate-900/90 border-purple-500/30 text-white' : 'bg-white/90 border-purple-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between opacity-80">
                  <span className="text-[10px] font-black uppercase tracking-wider">Pending E-KYC Queue</span>
                  <Sparkles size={14} className="text-amber-500" />
                </div>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">14 Orders</p>
                <p className="text-[9px] text-slate-500 font-semibold">Priority Verifications</p>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border text-[10px] font-bold flex items-center gap-2 ${
              isLoginDarkTheme ? 'bg-purple-500/10 border-purple-500/30 text-purple-300' : 'bg-purple-100/80 border-purple-300 text-purple-800'
            }`}>
              <Sparkles size={16} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span>Automating high-speed FTTH broadband subscriber onboarding across pan-India circles.</span>
            </div>
          </div>

          {/* Right Column: Glassmorphism / Claymorphism Form Card (Cohesive with Active Theme) */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className={`p-8 border-2 rounded-3xl space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-2xl transition-all duration-300 ${
              isLoginDarkTheme 
                ? 'bg-slate-900/95 border-purple-500/40 text-white shadow-[0_0_60px_rgba(124,58,237,0.35)]' 
                : 'bg-white/95 border-purple-300 text-slate-900 shadow-[0_0_40px_rgba(124,58,237,0.15)]'
            }`}>
              
              {/* Top Animated Laser Gradient Conduit */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-emerald-400 animate-fiber-beam shadow-[0_0_15px_#a855f7]" />

              <div className="text-center space-y-2 pt-1">
                <span className="clay-badge-purple px-3.5 py-1 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 shadow-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  OPERATIONS CONTROL CENTER • LEVEL 1 CLEARANCE
                </span>
                <h2 className={`text-2xl font-black uppercase tracking-wider ${
                  isLoginDarkTheme ? 'text-white' : 'text-slate-900'
                }`}>Admin Portal Login</h2>
                <p className={`text-xs font-medium ${
                  isLoginDarkTheme ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Enter authorized administrator credentials to unlock the management console.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold animate-shake flex items-center gap-2 shadow">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                
                {/* Username Input */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className={`text-[10px] font-black uppercase tracking-wider block ${
                      isLoginDarkTheme ? 'text-purple-300' : 'text-purple-700'
                    }`}>Admin Username</label>
                    <span className="text-[9px] text-slate-400 font-mono font-bold">Default: admin</span>
                  </div>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={adminUsername}
                      onChange={e => setAdminUsername(e.target.value)}
                      placeholder="e.g. admin"
                      className={`w-full border-2 rounded-2xl pl-11 pr-4 py-3.5 text-xs font-semibold focus:outline-none focus:ring-2 transition shadow-inner ${
                        isLoginDarkTheme
                          ? 'bg-slate-950 border-slate-800 text-white focus:border-purple-500 focus:ring-purple-500/30'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-600 focus:ring-purple-500/20'
                      }`}
                    />
                  </div>
                </div>

                {/* Password Input with Show/Hide Toggle */}
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className={`text-[10px] font-black uppercase tracking-wider block ${
                      isLoginDarkTheme ? 'text-purple-300' : 'text-purple-700'
                    }`}>Security Password</label>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Level 1 Encrypted</span>
                  </div>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full border-2 rounded-2xl pl-11 pr-11 py-3.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 transition shadow-inner ${
                        isLoginDarkTheme
                          ? 'bg-slate-950 border-slate-800 text-white focus:border-purple-500 focus:ring-purple-500/30'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-600 focus:ring-purple-500/20'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600 transition"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* 1-Click Quick Demo Credentials Pill */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUsername('admin');
                      setAdminPassword('admin123');
                      toast.info("Demo Credentials Filled", "Click Authenticate to unlock portal.");
                    }}
                    className={`w-full py-2 px-3 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                      isLoginDarkTheme
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                        : 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200'
                    }`}
                  >
                    <KeyRound size={14} className="text-purple-600 dark:text-purple-400" />
                    ⚡ 1-Click Auto Fill Demo Admin Credentials
                  </button>
                </div>

                {/* Main Authenticate Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-wider clay-button-purple shadow-2xl flex items-center justify-center gap-2 transition hover:scale-102 mt-2"
                >
                  {loading ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  Authenticate Operations Admin <ChevronRight size={18} />
                </button>
              </form>

              {/* Bottom Compliance Badge */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 text-center">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  🔒 PCI-DSS Level 1 Compliant • DoT Telecom Gateway v4.2
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Footer info bar */}
        <div className="w-full max-w-5xl mx-auto pt-4 border-t border-slate-200 dark:border-slate-900 text-center text-[10px] font-bold text-slate-400">
          TelcoBridge Operations Console • Enterprise BroadBand Provisioning & GIS Management
        </div>

      </div>
    );
  }

  // Sidebar Menu Items for Onboarding Management Admin
  const navItems = [
    { id: 'kpis', label: 'KPI Analytics', icon: <BarChart3 size={18} /> },
    { id: 'kyc', label: 'E-KYC Approvals', icon: <FileCheck size={18} /> },
    { id: 'customers', label: 'Subscriber Directory', icon: <Users size={18} /> },
    { id: 'rfs', label: 'GIS RFS Requests', icon: <MapPin size={18} /> },
    { id: 'users', label: 'Admin Geo Rights', icon: <Globe size={18} /> },
    { id: 'logs', label: 'System Audit Logs', icon: <Activity size={18} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased text-left transition-all duration-300 relative">
      <AdminAuthAnimationOverlay mode={authAnimMode} username={adminUsername || 'Operations Admin'} />
      
      {/* ─── LEFT COLLAPSIBLE SIDEBAR NAVIGATION ───────────────────────────── */}
      <aside className={`clay-card border-r-2 border-purple-500/30 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 shadow-2xl p-4 flex flex-col justify-between min-h-screen shrink-0 z-20 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        <div className="space-y-6">
          
          {/* Brand Logo Header & Collapse Toggle Button */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 ring-4 ring-purple-500/20">
                  <Wifi size={22} className="animate-pulse" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-indigo-500 to-pink-600">
                    Telco<span className="font-extrabold text-slate-800 dark:text-white">Bridge</span>
                  </span>
                  <span className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest -mt-1">
                    ONBOARDING ADMIN
                  </span>
                </div>
              </div>
            )}

            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className="p-2 rounded-xl clay-button-slate text-slate-600 dark:text-slate-300 hover:text-purple-600 transition shrink-0 mx-auto"
              title={isSidebarCollapsed ? "Expand Sidebar Navigation" : "Collapse Sidebar Navigation"}
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-2 pt-1">
            {!isSidebarCollapsed && (
              <span className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                ONBOARDING PANELS
              </span>
            )}

            {navItems.map(item => {
              const active = adminTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAdminTab(item.id as any)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full py-3 rounded-2xl text-xs font-extrabold flex items-center transition-all duration-200 ${
                    isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'
                  } ${
                    active
                      ? 'clay-button-purple text-white shadow-xl scale-[1.02]'
                      : 'clay-modal bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={active ? 'text-white' : 'text-slate-400 group-hover:text-purple-600 transition'}>
                      {item.icon}
                    </span>
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && active && <ChevronRight size={14} className="text-white/90" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer - Admin Profile Badge */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className={`clay-card p-3 rounded-2xl flex items-center justify-between gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/50 ${
            isSidebarCollapsed ? 'flex-col items-center justify-center p-2' : ''
          }`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/30">
                {adminUsername ? adminUsername[0].toUpperCase() : 'A'}
              </div>
              {!isSidebarCollapsed && (
                <div className="truncate text-left">
                  <span className="font-extrabold text-slate-900 dark:text-white block text-xs truncate">{adminUsername || 'SOC Admin'}</span>
                  <span className="clay-badge-emerald px-2 py-0.5 text-[9px] font-black uppercase inline-block">
                    SUPER ADMIN
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition shrink-0"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── RIGHT MAIN WORKSPACE CONTENT ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 p-6 lg:p-8 space-y-8 overflow-y-auto">
        
        {/* Top Header Bar with Actions & Search */}
        <div className="clay-card border-2 border-purple-500/30 p-4 rounded-3xl shadow-xl shadow-purple-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
          
          {/* Quick Search */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Subscriber, CAF #, Ticket #..."
              className="w-full clay-input pl-10 pr-4 py-2.5 text-xs dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          </div>

          {/* Top Status & Quick Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-end">
            {/* Post-Login Dark / Light Theme Mode Switcher */}
            <button
              type="button"
              onClick={() => {
                const nextDark = !isLoginDarkTheme;
                setIsLoginDarkTheme(nextDark);
                document.documentElement.classList.toggle('dark', nextDark);
              }}
              className="clay-modal px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 text-slate-700 dark:text-slate-200 transition shrink-0 hover:scale-105 shadow"
              title="Toggle Theme Mode"
            >
              {isLoginDarkTheme ? (
                <>
                  <Sun size={16} className="text-amber-400" />
                  <span className="hidden sm:inline text-xs font-black">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="text-purple-600" />
                  <span className="hidden sm:inline text-xs font-black">Dark Mode</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowRfsModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Navigation size={15} /> Request GIS RFS
            </button>

            <button
              type="button"
              onClick={handleStartFreshOnboarding}
              className="px-4 py-2.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg hover:scale-105 transition"
            >
              <UserPlus size={15} /> + Initiate Flow
            </button>

            <button
              type="button"
              onClick={loadAllAdminData}
              disabled={loading}
              className="p-2.5 clay-button-slate shrink-0"
              title="Sync Telemetry"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* ─── MAIN TAB CONTENT ────────────────────────────────────────────── */}
        <div className="min-h-[500px]">
          {loading && (
            <div className="clay-modal p-12 text-center space-y-4 animate-pulse">
              <RefreshCw className="animate-spin text-purple-500 mx-auto" size={32} />
              <p className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Syncing Telecom Database Telemetry &amp; Field Dispatch Status...
              </p>
            </div>
          )}

          {/* ─── TAB 1: EXECUTIVE KPI DASHBOARD ─────────────────────────────── */}
          {!loading && adminTab === 'kpis' && (
            <div className="space-y-8 animate-fade-in text-left">
              {/* Top 4 Claymorphic KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="clay-card border-2 border-purple-500/30 p-5 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                      Total Subscriptions
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/30 shrink-0">
                      <Users size={18} />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white block tracking-tight truncate">
                      {displayStats.totalCustomers.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-500 flex items-center gap-1 mt-1">
                      <ArrowUpRight size={14} /> +14.2% MoM Growth
                    </span>
                  </div>
                </div>

                <div className="clay-card border-2 border-purple-500/30 p-5 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                      KYC Approvals Queue
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/30 shrink-0">
                      <FileCheck size={18} />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white block tracking-tight truncate">
                      {displayStats.pendingKyc}
                    </span>
                    <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-1 mt-1">
                      <Clock size={14} /> Turnaround: 4.2 mins
                    </span>
                  </div>
                </div>

                <div className="clay-card border-2 border-purple-500/30 p-5 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                      Payment Conversion
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/30 shrink-0">
                      <BarChart3 size={18} />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white block tracking-tight truncate">
                      {displayStats.paymentSuccessRate.toFixed(1)}%
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-500 flex items-center gap-1 mt-1">
                      <CheckCircle2 size={14} /> Zero Checkout Drop-offs
                    </span>
                  </div>
                </div>

                <div className="clay-card border-2 border-purple-500/30 p-5 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                      Total Monthly Revenue
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/30 shrink-0">
                      <Landmark size={18} />
                    </div>
                  </div>
                  <div>
                    <span className="text-2xl xl:text-3xl font-black text-slate-900 dark:text-white block tracking-tight truncate">
                      ₹{displayStats.totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                      <Zap size={14} /> ARPU: ₹999.00 / Sub
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle Section: Funnel & Popular Plans */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Drop-off Conversion Funnel */}
                <div className="clay-modal p-6 space-y-5 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">Conversion Funnel Drop-off Analysis</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Real-time stage completion tracking across subscriber onboarding</p>
                    </div>
                    <span className="clay-badge-purple px-2.5 py-0.5 text-[9px] font-black uppercase">8 STEPS AUDIT</span>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(displayStats.dropOffFunnel).map(([stepName, count]: any) => (
                      <div key={stepName} className="text-xs space-y-1.5">
                        <div className="flex justify-between font-extrabold text-slate-700 dark:text-slate-300">
                          <span className="uppercase text-[10px] tracking-wider">{stepName.replace(/_/g, ' ')}</span>
                          <span className="font-mono text-purple-600 dark:text-purple-400">{count} Users</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-300 dark:border-slate-800">
                          <div 
                            className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 h-full rounded-full transition-all duration-700 shadow-sm" 
                            style={{ width: `${displayStats.totalCustomers > 0 ? (count / displayStats.totalCustomers) * 100 : 0}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Subscription Plans */}
                <div className="clay-modal p-6 space-y-5 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                  <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">Popular Fiber Broadband Tariff Plans</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Distribution of active subscriber subscriptions by band speed</p>
                    </div>
                    <span className="clay-badge-emerald px-2.5 py-0.5 text-[9px] font-black uppercase">WI-FI 6 ONTS</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {Object.entries(displayStats.popularPlans).map(([planName, count]: any) => (
                      <div key={planName} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            <Zap size={16} />
                          </div>
                          <span className="font-extrabold text-slate-900 dark:text-white">{planName}</span>
                        </div>
                        <span className="clay-badge-purple px-3.5 py-1 text-xs font-black font-mono">{count} Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB 2: E-KYC APPROVALS QUEUE (With Notify Audit Team Trigger) ─── */}
          {!loading && adminTab === 'kyc' && (
            <div className="clay-modal p-6 space-y-6 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">E-KYC Verification Queue (PII Shield Active)</h3>
                  <p className="text-xs text-slate-500 font-medium">Dispatch E-KYC approval requests to compliance audit team for verification.</p>
                </div>
                <span className="clay-badge-emerald px-3 py-1 text-[10px] font-black uppercase">PII PROTECTED</span>
              </div>
              
              <div className="space-y-4">
                {kycQueueList.map((d: any) => (
                  <div key={d.id} className="clay-card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="text-xs space-y-1.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white uppercase">{d.docType || 'Aadhaar Card (Masked PII)'}</span>
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-xs px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          {d.maskedDocNumber || 'XXXX-XXXX-4821'}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black ${
                          d.ekycStatus === 'AUDIT_NOTIFIED' ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          E-KYC Status: {d.ekycStatus === 'AUDIT_NOTIFIED' ? 'AUDIT TEAM NOTIFIED' : 'PENDING AUDIT'}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-500/20 text-blue-600 dark:text-blue-400">
                          Installation: {d.installStatus}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs">
                        Subscriber: <strong className="text-slate-800 dark:text-slate-200">{d.firstName} {d.lastName}</strong> ({d.mobileNumber}) • Risk Inspection Score: <strong className="text-emerald-500">{d.inspectionScore}% ({d.riskLevel} Risk)</strong>
                      </p>
                    </div>

                    <div className="flex gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleNotifyAuditTeam(d)}
                        className="px-5 py-2.5 clay-button-purple text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5"
                      >
                        <Send size={14} /> Notify Audit Team for E-KYC
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB 3: SUBSCRIBER DIRECTORY & ONBOARDING ──────────────────────── */}
          {!loading && adminTab === 'customers' && (
            <div className="clay-modal p-6 space-y-6 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Subscribers Onboarded By {adminUsername || 'SOC Admin'}</h3>
                  <p className="text-xs text-slate-500 font-medium">Resume draft onboarding sessions, audit step history, or email magic login links to customers.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStartFreshOnboarding}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-purple-500/20 hover:scale-105 transition"
                  >
                    <Plus size={16} /> Start New Customer Onboarding
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-4 py-2.5 clay-button-slate text-xs font-black uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <FileCheck size={14} /> Export CSV Report
                  </button>
                </div>
              </div>

              {myOnboardedCustomers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black">
                        <th className="py-3 px-3">Subscriber ID</th>
                        <th className="py-3 px-3">Customer Name</th>
                        <th className="py-3 px-3">Mobile Number</th>
                        <th className="py-3 px-3">Email Address</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Onboarding Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y border-b border-slate-200 dark:border-slate-800">
                      {myOnboardedCustomers.map(cust => (
                        <tr key={cust.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/50 transition">
                          <td className="py-4 px-3 font-mono font-black text-purple-600 dark:text-purple-400">{cust.customerId}</td>
                          <td className="py-4 px-3 font-extrabold text-slate-900 dark:text-white">{cust.firstName} {cust.lastName}</td>
                          <td className="py-4 px-3 font-mono font-bold text-slate-600 dark:text-slate-400">{cust.mobileNumber}</td>
                          <td className="py-4 px-3 text-slate-500">{cust.email}</td>
                          <td className="py-4 px-3">
                            <span className={`clay-badge-${cust.status === 'COMPLETED' ? 'emerald' : 'purple'} px-3 py-1 text-[10px] font-black uppercase`}>
                              {cust.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex justify-end gap-2">
                              {cust.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => handleResumeCustomerOnboarding(cust)}
                                  className="px-3.5 py-1.5 clay-button-purple text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow"
                                  title="Resume customer onboarding session"
                                >
                                  ▶ Resume
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleGenerateMagicLink(cust)}
                                className="px-3 py-1.5 clay-button-slate text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                title="Email resumption magic link to customer"
                              >
                                🔗 Send Magic Link
                              </button>
                              <button
                                type="button"
                                onClick={() => handleViewStepAudit(cust)}
                                className="px-3 py-1.5 clay-button-slate text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                title="View step execution audit trail"
                              >
                                <Eye size={12} /> Audit Steps
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-12 text-center font-bold">No subscriber records found for current admin.</p>
              )}
            </div>
          )}

          {/* ─── TAB 4: GIS RFS ADDRESS REQUESTS (SOC User Requests Only) ───────── */}
          {!loading && adminTab === 'rfs' && (
            <div className="clay-modal p-6 space-y-6 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">My GIS RFS Address Requests</h3>
                  <p className="text-xs text-slate-500 font-medium">Tracking address enablement requests submitted by {adminUsername || 'SOC Admin'} to the GIS Fiber team.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRfsModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow"
                >
                  <Plus size={16} /> Request New Address RFS
                </button>
              </div>

              {/* Active RFS Requests created by current user */}
              {myRfsRequests.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {myRfsRequests.map((req) => (
                    <div key={req.id} className="clay-card p-6 space-y-4 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono font-black text-xs text-purple-600 dark:text-purple-400 block">{req.id}</span>
                          <h4 className="font-black text-base text-slate-900 dark:text-white">{req.building}</h4>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                          req.status === 'RFS_ENABLED'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : req.status === 'SITE_SURVEY_SCHEDULED'
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                        }`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                        <p className="text-slate-700 dark:text-slate-300 font-medium">{req.address}</p>
                        <div className="flex justify-between text-[11px] pt-1">
                          <span className="text-slate-400 font-bold">Region &amp; Pincode:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">{req.city} - {req.pincode}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">Applicant Mobile:</span>
                          <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{req.mobile}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400 font-bold">Assigned GIS Lead:</span>
                          <span className="font-extrabold text-purple-600 dark:text-purple-400">{req.gisOfficer}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] pt-1">
                        <span className="text-slate-400 font-medium">{req.date}</span>
                        <span className={`font-black uppercase ${
                          req.priority === 'VIP_URGENT' ? 'text-rose-500' : 'text-amber-500'
                        }`}>
                          Priority: {req.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center space-y-3 clay-card">
                  <MapPin size={32} className="text-purple-500 mx-auto" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">No RFS Address Requests Submitted Yet</h4>
                  <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                    You have not submitted any locality or building RFS enablement requests to the GIS team yet. Click "Request New Address RFS" above to start.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 5: ADMIN USERS & GEO CITIES (Popular Cities + Search & Dropdown) ──── */}
          {!loading && adminTab === 'users' && (
            <div className="clay-modal p-6 space-y-6 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Admin Rights &amp; City Geo-Assignments</h3>
                  <p className="text-xs text-slate-500 font-medium">Toggle popular metro cities or pick from available cities dropdown and click "Assign Cities" to commit access rights.</p>
                </div>
                <span className="clay-badge-purple px-3 py-1 text-[10px] font-black uppercase">DYNAMIC GEO RIGHTS</span>
              </div>

              <div className="space-y-6">
                {adminUsers.map((user: any) => {
                  const userSearchQuery = (citySearchQueries[user.username] || '').toLowerCase();
                  const userDraftCities = draftUserCities[user.username] || user.assignedCities || [];
                  const remainingDropdownCities = masterCitiesList.filter(c => !userDraftCities.includes(c));

                  return (
                    <div key={user.id} className="clay-card p-6 space-y-5 text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-base text-slate-900 dark:text-white">{user.fullName}</span>
                            <span className="font-mono text-xs text-purple-600 dark:text-purple-400 font-bold">({user.username})</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">{user.email}</span>
                        </div>
                        <span className={`clay-badge-${user.isGlobalAdmin ? 'purple' : 'emerald'} px-3 py-1 text-[10px] font-black uppercase`}>
                          {user.isGlobalAdmin ? 'Global Super Admin' : 'Regional Admin'}
                        </span>
                      </div>

                      {!user.isGlobalAdmin ? (
                        <div className="space-y-5">
                          
                          {/* Top Row: Popular Cities Quick Pills */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Popular Metro Cities (Quick Toggle):</span>
                            <div className="flex flex-wrap gap-2">
                              {popularCities.map(city => {
                                const isAssigned = userDraftCities.includes(city);
                                return (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleToggleDraftCity(user.username, city)}
                                    className={`px-3.5 py-2 text-xs font-black rounded-2xl border transition-all duration-200 ${
                                      isAssigned
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-md scale-[1.02]'
                                        : 'clay-modal bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600'
                                    }`}
                                  >
                                    {isAssigned ? '✓ ' : '+ '} {city}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Middle Row: Add More Cities Dropdown & Search */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <div className="space-y-1.5 w-full sm:w-80">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Search &amp; Select Additional Operating City:</label>
                              <select
                                onChange={(e) => {
                                  handleSelectCityDropdown(user.username, e.target.value);
                                  e.target.value = '';
                                }}
                                className="w-full clay-input px-3.5 py-2.5 text-xs dark:text-white bg-transparent font-medium"
                              >
                                <option value="" className="dark:bg-slate-900">-- Select City from Master Catalog --</option>
                                {remainingDropdownCities.map(city => (
                                  <option key={city} value={city} className="dark:bg-slate-900">
                                    + {city}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Assign Cities Action Button */}
                            <button
                              type="button"
                              onClick={() => handleAssignCitiesToUser(user.username)}
                              className="px-6 py-3 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xl w-full sm:w-auto justify-center shrink-0 self-end"
                            >
                              <CheckCircle2 size={16} /> Assign Cities ({userDraftCities.length})
                            </button>
                          </div>

                          {/* Currently Assigned Cities Badges */}
                          <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                              Currently Selected Geo-Rights ({userDraftCities.length} Cities):
                            </span>
                            {userDraftCities.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {userDraftCities.map(city => (
                                  <span key={city} className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center gap-1.5 border border-purple-500/30">
                                    {city}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleDraftCity(user.username, city)}
                                      className="hover:text-rose-500 transition"
                                      title="Remove city"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 font-medium italic">No operating cities selected for this admin.</p>
                            )}
                          </div>

                        </div>
                      ) : (
                        <p className="text-xs text-emerald-500 font-bold">Global Super Admin has unrestricted access to ALL operating cities nationwide.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── TAB 6: AUDIT LOGS & TELEMETRY ──────────────────────────────── */}
          {!loading && adminTab === 'logs' && (
            <div className="clay-modal p-6 space-y-6 text-left shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 animate-fade-in">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
                System-Wide Telemetry Audit Logs
              </h3>
              
              {(() => {
                const displayAuditLogs = auditLogs.length > 0 ? auditLogs : demoAuditLogs;
                return displayAuditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {displayAuditLogs.map(log => (
                      <div key={log.id} className="clay-card p-4 text-xs flex justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="clay-badge-purple px-2 py-0.5 text-[9px] font-black uppercase">
                              {log.action}
                            </span>
                            <span className="text-slate-400 text-[10px]">Actor: {log.actor} | IP: {log.ipAddress}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 font-medium">{log.description}</p>
                          <p className="text-[10px] text-pink-500 font-mono">Correlation ID: {log.correlationId}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-12 text-center font-bold">No audit log entries recorded in database.</p>
                );
              })()}
            </div>
          )}
        </div>
      </main>



      {/* ─── MODAL 2: REQUEST GIS ADDRESS RFS ENABLEMENT (With Smart Map Picker) ─── */}
      {showRfsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="clay-modal p-6 md:p-8 max-w-4xl w-full space-y-6 text-left border-2 border-purple-500/40 shadow-2xl relative backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
                  <Navigation size={22} />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white">Request GIS Address RFS Enablement</h3>
                  <p className="text-xs text-slate-500 font-medium">Pinpoint building location on map or use smart search to dispatch RFS enablement ticket to GIS team.</p>
                </div>
              </div>
              <button onClick={() => setShowRfsModal(false)} className="text-slate-400 hover:text-slate-200 p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateRfsRequest} className="space-y-6">
              
              {/* Interactive Map & Smart Search Picker Component (Matching Feasibility Page) */}
              <div className="p-4 rounded-3xl bg-slate-100/80 dark:bg-slate-950/80 border border-purple-500/20 space-y-3">
                <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400 tracking-wider block">
                  📍 Select Target Building / Address via Smart Search or Compact Map:
                </span>
                <SmartMapAddressPicker
                  initialAddress={selectedRfsAddress}
                  onChange={(updatedAddress) => setSelectedRfsAddress(updatedAddress)}
                />
              </div>

              {/* Prospect Customer & GIS SLA Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px]">Prospect Customer Mobile (Required)</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[6-9][0-9]{9}"
                    value={rfsMobile}
                    onChange={e => setRfsMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10-digit customer mobile"
                    className="w-full clay-input px-4 py-3 font-mono font-bold dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px]">Priority SLA</label>
                  <select
                    value={rfsPriority}
                    onChange={e => setRfsPriority(e.target.value as any)}
                    className="w-full clay-input px-4 py-3 dark:text-white bg-transparent"
                  >
                    <option value="HIGH" className="dark:bg-slate-900">HIGH (24H SLA)</option>
                    <option value="VIP_URGENT" className="dark:bg-slate-900">VIP URGENT (Same Day SLA)</option>
                    <option value="NORMAL" className="dark:bg-slate-900">NORMAL (48H SLA)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="font-black text-slate-500 dark:text-slate-400 uppercase text-[10px]">Notes for GIS Fiber Planning Team</label>
                <textarea
                  value={rfsNotes}
                  onChange={e => setRfsNotes(e.target.value)}
                  rows={2}
                  placeholder="Specify splitter box position, society NOC contact, or landmark details..."
                  className="w-full clay-input px-4 py-3 dark:text-white"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRfsModal(false)}
                  className="w-1/2 py-3.5 clay-button-slate text-xs font-black uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl"
                >
                  <SendHorizontal size={16} /> Dispatch RFS Enablement Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: STEP EXECUTION AUDIT ───────────────────────────────── */}
      {showAuditModal && auditCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="clay-modal p-8 max-w-xl w-full space-y-6 text-left border-2 border-purple-500/40 shadow-2xl relative backdrop-blur-xl bg-white/95 dark:bg-slate-900/95">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">Subscriber Step Audit Trail</h3>
                <p className="text-xs text-slate-500 font-medium">Customer: {auditCustomer.firstName} {auditCustomer.lastName} ({auditCustomer.mobileNumber})</p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 text-xs">
              {customerJourney ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900 dark:text-white text-sm">Current Onboarding Progress</span>
                      <span className={`clay-badge-${customerJourney.status === 'COMPLETED' ? 'emerald' : 'purple'} px-2.5 py-0.5 text-[10px] font-black uppercase font-mono`}>
                        {customerJourney.status === 'COMPLETED' ? 'COMPLETED' : `Active Step: ${customerJourney.currentStep || 'IN_PROGRESS'}`}
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs font-medium">Channel: <strong>{customerJourney.channel || 'SELF'}</strong></p>
                    <p className="text-slate-500 text-xs font-medium">
                      Last Actor: <strong className="text-slate-900 dark:text-white">{customerJourney.lastActorId || customerJourney.lastPerformedById || 'Customer'}</strong> ({customerJourney.lastActorType || 'CUSTOMER'})
                    </p>
                  </div>

                  {/* Render Visual Journey Timeline dynamically from Backend */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <JourneyTimeline
                      mobileNumber={auditCustomer.mobileNumber}
                      status={customerJourney.status || (auditCustomer.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS')}
                      currentStep={customerJourney.currentStep}
                      auditTrail={customerJourney.auditTrail || []}
                      stepHistory={
                        customerJourney.stepHistoryJson
                          ? (() => { try { return JSON.parse(customerJourney.stepHistoryJson); } catch (e) { return []; } })()
                          : []
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-bold animate-pulse">
                  Loading subscriber journey tracking telemetry...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
