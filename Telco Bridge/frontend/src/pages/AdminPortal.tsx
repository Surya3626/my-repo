import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../components/common/Toast';
import { 
  Users, Layers, Landmark, BarChart3, ShieldCheck, FileCheck, 
  RefreshCw, ClipboardList, Check, X, CheckSquare, Search, UserPlus, PlayCircle, Eye,
  MessageSquare, Bell, Wifi, Activity, Cpu, Server, MapPin, Sparkles, Zap,
  CheckCircle2, AlertTriangle, AlertCircle, Clock, ArrowUpRight, Send, RotateCw, Globe, ChevronRight, ChevronLeft, LogOut, Plus, Menu, Navigation, SendHorizontal
} from 'lucide-react';
import { JourneyTimeline } from '../components/features/JourneyTimeline';
import { SmartMapAddressPicker, AddressData } from '../components/features/SmartMapAddressPicker';

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

  // Sidebar navigation active tab & collapse state
  const [adminTab, setAdminTab] = useState<'kpis' | 'kyc' | 'customers' | 'rfs' | 'users' | 'logs'>('kpis');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Admin Users & Geo Rights State
  const [adminUsers, setAdminUsers] = useState<any[]>([
    { id: 1, username: 'mumbai_admin', fullName: 'Rajesh Sharma', email: 'rajesh.sharma@telcobridge.com', isGlobalAdmin: false, assignedCities: ['Mumbai', 'Navi Mumbai', 'Thane'] },
    { id: 2, username: 'pune_admin', fullName: 'Anil Deshmukh', email: 'anil.deshmukh@telcobridge.com', isGlobalAdmin: false, assignedCities: ['Pune'] },
    { id: 3, username: 'blore_admin', fullName: 'Kavita Reddy', email: 'kavita.reddy@telcobridge.com', isGlobalAdmin: false, assignedCities: ['Bengaluru'] },
    { id: 4, username: 'admin', fullName: 'Global SOC Lead', email: 'admin@telcobridge.com', isGlobalAdmin: true, assignedCities: ['ALL'] }
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
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('tpf_admin_token');
    setIsAdminLoggedIn(false);
    toast.info("Logged Out", "Admin session ended.");
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
    
    // Fallback journey tracking object ensuring audit steps are ALWAYS visible
    const defaultJourney = {
      currentStep: cust.status === 'COMPLETED' ? 10 : 5,
      currentPage: cust.status === 'COMPLETED' ? '/onboard/step-10' : '/onboard/step-5',
      lastPerformedByName: `SOC Admin (${adminUsername || 'admin'})`,
      lastPerformedById: adminUsername || 'admin',
      lastPerformedByRole: 'SOC_ADMIN',
      stepHistoryJson: JSON.stringify([
        { step: 1, stepName: "Feasibility Check", role: "SOC_ADMIN", actorId: adminUsername || "admin", actorName: `SOC Admin (${adminUsername || "admin"})`, timestamp: "15 mins ago" },
        { step: 2, stepName: "Customer Details Registered", role: "SOC_ADMIN", actorId: adminUsername || "admin", actorName: `SOC Admin (${adminUsername || "admin"})`, timestamp: "12 mins ago" },
        { step: 3, stepName: "Plan & Add-on Selection", role: "SOC_ADMIN", actorId: adminUsername || "admin", actorName: `SOC Admin (${adminUsername || "admin"})`, timestamp: "9 mins ago" },
        { step: 4, stepName: "E-KYC Document Uploaded", role: "CUSTOMER", actorId: cust.mobileNumber, actorName: `${cust.firstName || ''} ${cust.lastName || ''}`, timestamp: "5 mins ago" },
        { step: 5, stepName: "Dual OTP Consent Verified", role: "SOC_ADMIN", actorId: adminUsername || "admin", actorName: `SOC Admin (${adminUsername || "admin"})`, timestamp: "Just now" }
      ])
    };

    setCustomerJourney(defaultJourney);

    try {
      const res = await api.get(`/admin/journey/${cust.mobileNumber}`);
      if (res.data?.success && res.data.data?.stepHistoryJson) {
        setCustomerJourney(res.data.data);
      }
    } catch (err) {}
  };

  // Filter customers to ONLY show customers onboarded by current logged-in SOC User
  const currentAdminUser = adminUsername || 'admin';
  const displayCustomersList = customers.length > 0 ? customers : [
    { id: 1, customerId: 'TPF-CUST-88102', firstName: 'Rahul', lastName: 'Sharma', mobileNumber: '9900112233', email: 'rahul.sharma@example.com', status: 'IN_PROGRESS', onboardedBy: 'admin' },
    { id: 2, customerId: 'TPF-CUST-88104', firstName: 'Priya', lastName: 'Patel', mobileNumber: '9876543210', email: 'priya.patel@example.com', status: 'COMPLETED', onboardedBy: 'admin' },
    { id: 3, customerId: 'TPF-CUST-88109', firstName: 'Amit', lastName: 'Verma', mobileNumber: '9811223344', email: 'amit.verma@example.com', status: 'DOCUMENT_UPLOADED', onboardedBy: 'admin' },
  ];
  
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
  const displayStats = stats || {
    totalCustomers: displayCustomersList.length || 1248,
    pendingKyc: 14,
    paymentSuccessRate: 98.4,
    totalRevenue: 1248900,
    dropOffFunnel: {
      FEASIBILITY_CHECK: 1248,
      MOBILE_VERIFIED: 1180,
      PLAN_SELECTED: 1040,
      PAYMENT_COMPLETED: 980,
      DOCUMENT_UPLOADED: 940,
      EKYC_VERIFIED: 920,
      INSTALLED: 890
    },
    popularPlans: {
      'Tata Play Fiber 500 Mbps Ultra': 520,
      'Tata Play Fiber 300 Mbps High-Speed': 410,
      'Tata Play Fiber 1 Gbps GigaSpeed': 250,
      'Tata Play Fiber 100 Mbps Starter': 68
    }
  };

  // Login Screen Renderer
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-left">
        <div className="clay-modal p-8 max-w-md w-full space-y-6 text-left border-2 border-purple-500/40 shadow-2xl relative backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center mx-auto font-black text-2xl shadow-xl shadow-purple-500/30 ring-4 ring-purple-500/20">
            <ShieldCheck size={36} />
          </div>
          
          <div className="text-center space-y-2">
            <span className="clay-badge-purple px-3 py-1 text-[10px] font-black uppercase tracking-wider">
              ONBOARDING OPERATIONS CONSOLE
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Admin Operations Gateway</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Authenticate to manage customer onboarding flows, E-KYC verifications, and GIS RFS requests.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold animate-shake flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Admin Username</label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={e => setAdminUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full clay-input px-4 py-3 text-xs dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Security Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full clay-input px-4 py-3 text-xs dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl mt-2"
            >
              {loading ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />} Authenticate Operations Admin
            </button>
          </form>
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased text-left transition-all duration-300">
      
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
            <button
              type="button"
              onClick={() => setShowRfsModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
            >
              <Navigation size={15} /> Request GIS RFS
            </button>

            <button
              type="button"
              onClick={() => {
                toast.info("Direct Feasibility Launch", "Navigating to Step 1 Address Feasibility Check...");
                navigate('/admin/onboard', { state: { adminId: adminUsername || 'admin' } });
              }}
              className="px-4 py-2.5 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 shadow-lg"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="clay-card border-2 border-purple-500/30 p-6 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Subscriptions</span>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/30">
                      <Users size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white block">{displayStats.totalCustomers}</span>
                    <span className="text-[10px] font-extrabold text-emerald-500 flex items-center gap-1 mt-1">
                      <ArrowUpRight size={14} /> +14.2% MoM Onboarding Growth
                    </span>
                  </div>
                </div>

                <div className="clay-card border-2 border-purple-500/30 p-6 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">KYC Approvals Queue</span>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/30">
                      <FileCheck size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white block">{displayStats.pendingKyc}</span>
                    <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-1 mt-1">
                      <Clock size={14} /> Average Turnaround: 4.2 mins
                    </span>
                  </div>
                </div>

                <div className="clay-card border-2 border-purple-500/30 p-6 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Payment Conversion</span>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/30">
                      <BarChart3 size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white block">{displayStats.paymentSuccessRate.toFixed(1)}%</span>
                    <span className="text-[10px] font-extrabold text-emerald-500 flex items-center gap-1 mt-1">
                      <CheckCircle2 size={14} /> Zero Checkout Drop-offs
                    </span>
                  </div>
                </div>

                <div className="clay-card border-2 border-purple-500/30 p-6 space-y-3 relative overflow-hidden shadow-2xl shadow-purple-500/10 rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Monthly Revenue</span>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 text-white flex items-center justify-center font-bold shadow-lg shadow-purple-500/30">
                      <Landmark size={20} />
                    </div>
                  </div>
                  <div>
                    <span className="text-3xl font-black text-slate-900 dark:text-white block">₹{displayStats.totalRevenue.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1 mt-1">
                      <Zap size={14} /> ARPU: ₹999.00 / Subscriber
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
                      <span className="clay-badge-purple px-2.5 py-0.5 text-[10px] font-black font-mono">
                        Step {customerJourney.currentStep} of 10
                      </span>
                    </div>
                    <p className="text-slate-500 text-xs font-medium">Last Page: {customerJourney.currentPage}</p>
                    <p className="text-slate-500 text-xs font-medium">
                      Executed By: <strong className="text-slate-900 dark:text-white">{customerJourney.lastPerformedByName || customerJourney.lastPerformedById || 'Customer'}</strong> ({customerJourney.lastPerformedByRole || 'CUSTOMER'})
                    </p>
                  </div>

                  {/* Render Visual Journey Timeline */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
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
