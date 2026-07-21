import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { useAuth, CustomerType } from '../context/AuthContext';
import api, { extractErrorMessage } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { 
  User, MapPin, Zap, FileText, CreditCard, Calendar, CheckCircle, Check,
  ChevronRight, ChevronLeft, Upload, Camera, Trash2, Eye, Compass, HelpCircle,
  Smartphone, Building, Wallet, Settings, ShieldCheck, CheckSquare, RefreshCw,
  Sparkles, Activity, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DigitalSignature } from '../components/features/DigitalSignature';
import { PlanComparisonTable } from '../components/features/PlanComparisonTable';
import { EngineerTrackingMap } from '../components/features/EngineerTrackingMap';
import { SpeedTestWidget } from '../components/features/SpeedTestWidget';
import { SmartMapAddressPicker } from '../components/features/SmartMapAddressPicker';

const paymentModeIcons: { [key: string]: React.ReactNode } = {
  'UPI': <Smartphone className="text-purple-600 dark:text-purple-400" size={20} />,
  'DEBIT_CARD': <CreditCard className="text-blue-600 dark:text-blue-400" size={20} />,
  'CREDIT_CARD': <CreditCard className="text-indigo-600 dark:text-indigo-400" size={20} />,
  'NET_BANKING': <Building className="text-emerald-600 dark:text-emerald-400" size={20} />,
  'WALLET': <Wallet className="text-amber-600 dark:text-amber-400" size={20} />,
};

const statesAndCities: { [key: string]: string[] } = {
  "Maharashtra": ["Mumbai", "Navi Mumbai", "Pune", "Nagpur"],
  "Gujarat": ["Ahmedabad", "Gandhinagar", "Surat", "Vadodara"],
  "Delhi": ["New Delhi"],
  "Karnataka": ["Bengaluru", "Mysore"],
  "Tamil Nadu": ["Chennai", "Coimbatore"],
  "West Bengal": ["Kolkata"],
  "Telangana": ["Hyderabad"]
};

export const OnboardingWizard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const locationState = useLocation().state as { 
    pincode?: string; 
    selectedPlanId?: number; 
    resume?: boolean; 
    adminMode?: boolean; 
    adminId?: string; 
    customerMobile?: string; 
    prospectData?: any 
  } | null;
  const { login, logout, token, customer, updateCustomer } = useAuth();
  
  // SOC Admin & Actor Tracking context
  const isAdminMode = locationState?.adminMode || false;
  const adminId = locationState?.adminId || localStorage.getItem('tpf_admin_username') || 'admin';
  const customerMobileFromState = locationState?.customerMobile || '';
  const [stepHistory, setStepHistory] = useState<any[]>([]);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resume Mode Toggle
  const [isResumeMode, setIsResumeMode] = useState(locationState?.resume || false);

  // Address (Feasibility) state
  const [houseNumber, setHouseNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [society, setSociety] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState(locationState?.pincode || '');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationFeasible, setLocationFeasible] = useState<boolean | null>(null);

  // Customer details (Connection booking) state
  const [firstName, setFirstName] = useState(locationState?.prospectData?.firstName || '');
  const [lastName, setLastName] = useState(locationState?.prospectData?.lastName || '');
  const [mobileNumber, setMobileNumber] = useState(locationState?.customerMobile || locationState?.prospectData?.mobileNumber || '');
  const [email, setEmail] = useState(locationState?.prospectData?.email || '');

  // OTP Validation state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(60);

  // Documents state
  const [docType, setDocType] = useState('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [docFiles, setDocFiles] = useState<File[]>([]); // multi-file support
  const [webcamActive, setWebcamActive] = useState(false);
  const [selfieData, setSelfieData] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [declarationGenerated, setDeclarationGenerated] = useState(false);

  // Profile building state
  const [billingAddress, setBillingAddress] = useState('');
  const [billingSameAsInstallation, setBillingSameAsInstallation] = useState(true);
  const [billingHouseNumber, setBillingHouseNumber] = useState('');
  const [billingSociety, setBillingSociety] = useState('');
  const [billingAddressLine1, setBillingAddressLine1] = useState('');
  const [billingAddressLine2, setBillingAddressLine2] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [billingLandmark, setBillingLandmark] = useState('');
  const [billingArea, setBillingArea] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingPincode, setBillingPincode] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [gstValid, setGstValid] = useState<boolean | null>(null);

  // Plans/Addons/Coupons state
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([
    { id: 'static_ip', name: 'Static IP Address', price: 250.0, selected: false },
    { id: 'security_suite', name: 'Smart Security Suite', price: 99.0, selected: false },
    { id: 'binge_ott', name: 'TelcoBridge OTT Bundle', price: 199.0, selected: false }
  ]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [activePlanTab, setActivePlanTab] = useState<'plans' | 'addons' | 'coupons'>('plans');

  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState<any>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('sbi');
  const [walletPhone, setWalletPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<null | 'processing' | 'success' | 'failed'>(null);
  const [paymentStatusText, setPaymentStatusText] = useState('');
  const [tempCustomer, setTempCustomer] = useState<any>(null);

  // Customer Consent state & SOC Dual OTP
  const [consentOtpSent, setConsentOtpSent] = useState(false);
  const [consentOtpCode, setConsentOtpCode] = useState('');
  const [adminConsentOtp, setAdminConsentOtp] = useState('');
  const [consentVerified, setConsentVerified] = useState(false);

  // CAF state
  const [cafFile, setCafFile] = useState<any>(null);

  // EKYC & Ticket state
  const [appointmentDate, setAppointmentDate] = useState('');
  const [ticketDetails, setTicketDetails] = useState<any>(null);

  const webcamRef = useRef<Webcam>(null);

  // Lookup city/state from pincode
  const lookupPincode = (pin: string) => {
    const customMap: { [key: string]: { city: string; state: string } } = {
      '382007': { city: 'Gandhinagar', state: 'Gujarat' },
      '400703': { city: 'Navi Mumbai', state: 'Maharashtra' },
      '110001': { city: 'New Delhi', state: 'Delhi' },
      '560001': { city: 'Bengaluru', state: 'Karnataka' },
      '400001': { city: 'Mumbai', state: 'Maharashtra' },
      '600001': { city: 'Chennai', state: 'Tamil Nadu' },
      '700001': { city: 'Kolkata', state: 'West Bengal' },
      '500001': { city: 'Hyderabad', state: 'Telangana' },
    };

    if (customMap[pin]) return customMap[pin];

    const firstDigit = pin[0];
    switch (firstDigit) {
      case '1': return { city: 'New Delhi', state: 'Delhi' };
      case '2': return { city: 'Noida', state: 'Uttar Pradesh' };
      case '3': return { city: 'Ahmedabad', state: 'Gujarat' };
      case '4': return { city: 'Mumbai', state: 'Maharashtra' };
      case '5': return { city: 'Bengaluru', state: 'Karnataka' };
      case '6': return { city: 'Chennai', state: 'Tamil Nadu' };
      case '7': return { city: 'Kolkata', state: 'West Bengal' };
      case '8': return { city: 'Patna', state: 'Bihar' };
      default: return { city: '', state: '' };
    }
  };

  // Auto-fill city/state when pincode is entered
  useEffect(() => {
    if (pincode && pincode.length === 6) {
      const result = lookupPincode(pincode);
      if (result.city) setCity(result.city);
      if (result.state) setState(result.state);
    }
  }, [pincode]);

  // OTP Timer countdown
  useEffect(() => {
    let interval: any;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  // 1-Hour Session Check
  useEffect(() => {
    const loginTime = localStorage.getItem('tpf_login_time');
    if (loginTime && token) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      if (elapsed > 3600000) { // 1 hour
        alert("Your session has expired (1 hour limit). Please log in again.");
        logout();
        navigate('/');
      }
    }
  }, [currentStep, token]);

  // Load plans
  useEffect(() => {
    if (currentStep === 6) {
      api.get('/plans')
        .then(res => {
          if (res.data?.success) {
            setPlans(res.data.data);
            if (locationState?.selectedPlanId) {
              const matched = res.data.data.find((p: any) => p.id === locationState.selectedPlanId);
              if (matched) setSelectedPlan(matched);
            } else if (res.data.data.length > 0) {
              setSelectedPlan(res.data.data[0]); // default
            }
          }
        })
        .catch(() => {});
    }
  }, [currentStep]);

  // Load existing progress & check ticket status on mount
  useEffect(() => {
    const fetchJourney = async () => {
      if (token) {
        try {
          // 1. Check if installation ticket is already created
          const dashRes = await api.get('/customer/portal/dashboard');
          if (dashRes.data?.success) {
            const profile = dashRes.data.data?.profile;
            const ticket = dashRes.data.data?.ticket;
            if (ticket) setTicketDetails(ticket);

            if (profile && (profile.status === 'COMPLETED' || profile.status === 'INSTALLED' || profile.status === 'APPOINTMENT_SCHEDULED')) {
              navigate('/selfcare');
              return;
            }
          }

          // 2. Otherwise load saved journey draft
          const res = await api.get('/auth/journey');
          if (res.data?.success && res.data.data) {
            restoreJourney(res.data.data);
          } else {
            setCurrentStep(4);
          }
        } catch (e) {
          logout();
          setCurrentStep(1);
        }
      }
    };
    fetchJourney();
  }, [token]);

  // Sync draft / journey restore when user logs in or admin resumes
  const restoreJourney = (progress: any) => {
    if (!progress) return;
    try {
      if (progress.stepHistoryJson) {
        try {
          setStepHistory(JSON.parse(progress.stepHistoryJson));
        } catch (e) {}
      }

      if (progress.draftData) {
        const data = JSON.parse(progress.draftData);
        if (data) {
          if (data.firstName) setFirstName(data.firstName);
          if (data.lastName) setLastName(data.lastName);
          if (data.email) setEmail(data.email);
          if (data.mobileNumber) setMobileNumber(data.mobileNumber);
          if (data.houseNumber) setHouseNumber(data.houseNumber);
          if (data.addressLine1) setAddressLine1(data.addressLine1);
          if (data.addressLine2) setAddressLine2(data.addressLine2);
          if (data.society) setSociety(data.society);
          if (data.street) setStreet(data.street);
          if (data.landmark) setLandmark(data.landmark);
          if (data.area) setArea(data.area);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
          if (data.pincode) setPincode(data.pincode);
          if (data.latitude) setLatitude(data.latitude);
          if (data.longitude) setLongitude(data.longitude);
          if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
          if (data.selfieData) setSelfieData(data.selfieData);
          if (data.docType) setDocType(data.docType);
          if (data.docNumber) setDocNumber(data.docNumber);
          
          if (data.billingAddress) setBillingAddress(data.billingAddress);
          if (data.gstNumber) setGstNumber(data.gstNumber);
          if (data.gstValid) setGstValid(data.gstValid);
          if (data.selectedAddons) setSelectedAddons(data.selectedAddons);
          if (data.couponCodeInput) setCouponCodeInput(data.couponCodeInput);
          if (data.couponApplied) setCouponApplied(data.couponApplied);
          if (data.couponDiscount) setCouponDiscount(data.couponDiscount);
          if (data.consentVerified) setConsentVerified(data.consentVerified);
          
          if (data.billingSameAsInstallation !== undefined) setBillingSameAsInstallation(data.billingSameAsInstallation);
          if (data.billingHouseNumber) setBillingHouseNumber(data.billingHouseNumber);
          if (data.billingSociety) setBillingSociety(data.billingSociety);
          if (data.billingAddressLine1) setBillingAddressLine1(data.billingAddressLine1);
          if (data.billingAddressLine2) setBillingAddressLine2(data.billingAddressLine2);
          if (data.billingStreet) setBillingStreet(data.billingStreet);
          if (data.billingLandmark) setBillingLandmark(data.billingLandmark);
          if (data.billingArea) setBillingArea(data.billingArea);
          if (data.billingCity) setBillingCity(data.billingCity);
          if (data.billingState) setBillingState(data.billingState);
          if (data.billingPincode) setBillingPincode(data.billingPincode);
        }
      }
    } catch (e) {
      console.error("Failed parsing journey draft:", e);
    }

    if (progress.currentStep !== undefined && progress.currentStep !== null) {
      setCurrentStep(progress.currentStep);
    } else {
      setCurrentStep(isAdminMode ? 1 : 4);
    }
  };

  // Save journey progress to backend with step actor tracking
  const saveJourneyDraft = async (nextStep: number, customData: any = {}) => {
    const targetMobile = mobileNumber || customerMobileFromState;
    const stepNames = [
      "", "Feasibility Check", "Customer Details & OTP", "Document Upload & E-KYC",
      "Billing Address & Profile", "Plan & Add-on Selection", "Payment & Order Summary",
      "Customer Consent", "Technician Scheduling"
    ];

    const currentAuditItem = {
      step: currentStep,
      stepName: stepNames[currentStep] || `Step ${currentStep}`,
      role: isAdminMode ? 'SOC_ADMIN' : 'CUSTOMER',
      actorId: isAdminMode ? adminId : (targetMobile || 'CUSTOMER'),
      actorName: isAdminMode ? `SOC Admin (${adminId})` : `Customer (${targetMobile || 'Self'})`,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...stepHistory.filter((h: any) => h.step !== currentStep), currentAuditItem];
    setStepHistory(updatedHistory);

    const draftData = {
      firstName, lastName, email, mobileNumber: targetMobile, houseNumber, addressLine1, addressLine2, society, street, landmark, area, city, state, pincode,
      latitude, longitude, selectedPlan, selfieData, docType, docNumber,
      billingAddress, gstNumber, gstValid, selectedAddons, couponCodeInput, couponApplied, couponDiscount, consentVerified,
      billingSameAsInstallation, billingHouseNumber, billingSociety, billingAddressLine1, billingAddressLine2, billingStreet,
      billingLandmark, billingArea, billingCity, billingState, billingPincode,
      ...customData
    };

    const payload = {
      page: `/wizard/step-${nextStep}`,
      step: nextStep,
      draftData: JSON.stringify(draftData),
      sessionId: localStorage.getItem('tpf_session_id') || 'SESSION-' + Date.now(),
      mobileNumber: targetMobile,
      performedByRole: isAdminMode ? 'SOC_ADMIN' : 'CUSTOMER',
      performedById: isAdminMode ? adminId : (targetMobile || 'CUSTOMER'),
      performedByName: isAdminMode ? `SOC Admin (${adminId})` : `Customer (${targetMobile || 'Self'})`,
      stepHistoryJson: JSON.stringify(updatedHistory)
    };

    try {
      if (isAdminMode) {
        await api.post('/admin/journey/save', payload);
      } else if (token || targetMobile) {
        await api.post('/auth/journey', payload);
      }
    } catch (e) {}
  };

  const handleSaveAndExit = async () => {
    await saveJourneyDraft(currentStep);
    toast.success('Progress Saved', `Onboarding saved at Step ${currentStep}. You can resume anytime!`);
    setTimeout(() => {
      if (isAdminMode) navigate('/admin');
      else navigate('/');
    }, 1500);
  };

  // Detect GPS coordinates
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS Unavailable', 'Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);
      setHouseNumber("Plot 12, Floor 3");
      setAddressLine1("Mindspace IT Park");
      setAddressLine2("Survey No 64");
      setSociety("Westend Heights");
      setStreet("Vithal Rao Nagar");
      setArea("Madhapur");
      setCity("Hyderabad");
      setState("Telangana");
      setPincode("500081");
      toast.success('Location Detected', 'GPS coordinates retrieved. Address auto-filled.');
    }, () => {
      toast.warning('GPS Failed', 'Unable to retrieve location. Please enter address manually.');
    });
  };

  // Feasibility Check Form Submit (Step 1)
  const handleFeasibilityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const testLat = latitude || 19.0760;
      const testLon = longitude || 72.8777;
      const fCheck = await api.get(`/feasibility/check?pincode=${pincode}&latitude=${testLat}&longitude=${testLon}`);
      
      if (!fCheck.data?.data?.feasible) {
        setLocationFeasible(false);
        toast.warning('Expansion Area', `Pin Code ${pincode} is on our expansion roadmap. Network cables are being laid!`);
      } else {
        setLocationFeasible(true);
        toast.success('Coverage Verified!', `1 Gbps Optical Fiber detected at PIN Code ${pincode}! Proceed to Step 2.`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Feasibility check failed.";
      setErrorMessage(msg);
      toast.error('Feasibility Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Connection Booking Form Submit (Step 2)
  const handleConnectionBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await api.post('/auth/register', {
        firstName, lastName, mobileNumber, email,
        houseNumber, addressLine1, addressLine2, society, street, landmark, area, city, state, pincode,
        latitude: latitude || 19.0760, longitude: longitude || 72.8777
      });
      
      await api.post('/auth/otp/send', { mobileNumber });
      setOtpSent(true);
      setTimer(60);
      setCurrentStep(3);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Lead registration failed. Customer might already be registered.");
    } finally {
      setLoading(false);
    }
  };

  // Login for Resuming Bookings (RMN verification & OTP trigger)
  const handleResumeBookingLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      await api.post('/auth/otp/send', { mobileNumber });
      setOtpSent(true);
      setTimer(60);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Mobile number is not registered. Please register first.");
    } finally {
      setLoading(false);
    }
  };

  // OTP Validation (Step 3 / Resume flow)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const response = await api.post('/auth/otp/verify', { mobileNumber, otp: otpCode });
      const data = response.data?.data;
      if (data) {
        localStorage.setItem('tpf_login_time', Date.now().toString());
        localStorage.setItem('tpf_session_id', 'SESSION-' + Date.now());
        
        login(data.token, data.customer);
        if (data.customer) {
          setFirstName(data.customer.firstName || '');
          setLastName(data.customer.lastName || '');
          setEmail(data.customer.email || '');
        }

        if (data.progress) {
          restoreJourney(data.progress);
        } else {
          setCurrentStep(4);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Invalid OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // Document Upload — supports multiple files
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docFiles.length === 0) {
      toast.warning('No Files', 'Please select at least one document file.');
      return;
    }
    setErrorMessage('');
    setLoading(true);

    const formData = new FormData();
    docFiles.forEach(f => formData.append('files', f));

    try {
      const res = await api.post(
        `/customer/documents/upload/batch?docType=${docType}&docNumber=${docNumber}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      if (res.data?.success) {
        const newDocs: any[] = res.data.data || [];
        setUploadedDocs(prev => [...prev, ...newDocs]);
        setDocNumber('');
        setDocFiles([]);
        const input = document.getElementById('docFile') as HTMLInputElement;
        if (input) input.value = '';
        toast.success('Documents Uploaded', `${newDocs.length} file(s) uploaded for ${docType} successfully.`);
      }
    } catch (err: any) {
      toast.error('Upload Failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Webcam Selfie upload (Step 4)
  const captureWebcamSelfie = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setLoading(true);
        try {
          const res = await api.post('/customer/documents/selfie', { image: imageSrc });
          if (res.data?.success) {
            setSelfieData(imageSrc);
            setUploadedDocs(prev => [...prev, res.data.data]);
            setWebcamActive(false);
            toast.success('Selfie Captured!', 'Your live photo has been saved to the server.');
          }
        } catch (err) {
          toast.error('Selfie Upload Failed', extractErrorMessage(err));
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Generate Declaration Form (End of Step 4)
  const triggerDeclarationForm = async () => {
    setLoading(true);
    try {
      const res = await api.post('/customer/documents/declaration');
      if (res.data?.success) {
        setDeclarationGenerated(true);
        setUploadedDocs(prev => [...prev, res.data.data]);
        setCurrentStep(5);
        saveJourneyDraft(5);
        toast.success('Declaration Signed', 'Your declaration form has been digitally signed and saved.');
      }
    } catch (err) {
      toast.error('Declaration Failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Profile Building Submit (Step 5)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      // 1. Save profile updates
      await api.post('/auth/profile/update', { firstName, lastName, email });
      
      // 2. Save installation address details to the backend
      await api.post('/customer/portal/address', {
        houseNumber, society, addressLine1, addressLine2, street, landmark, area, city, state, pincode,
        latitude: latitude || 19.0760, longitude: longitude || 72.8777
      });

      // 3. Construct billingAddress string
      let finalBillingAddress = '';
      if (billingSameAsInstallation) {
        finalBillingAddress = `${houseNumber}, ${society}, ${addressLine1}, ${street}, ${area}, ${city}, ${state} - ${pincode}`;
      } else {
        finalBillingAddress = `${billingHouseNumber}, ${billingSociety}, ${billingAddressLine1}, ${billingStreet}, ${billingArea}, ${billingCity}, ${billingState} - ${billingPincode}`;
      }
      setBillingAddress(finalBillingAddress);

      // 4. Save progress
      setCurrentStep(6);
      saveJourneyDraft(6, { 
        billingAddress: finalBillingAddress, 
        gstNumber, 
        gstValid,
        billingSameAsInstallation,
        billingHouseNumber,
        billingSociety,
        billingAddressLine1,
        billingAddressLine2,
        billingStreet,
        billingLandmark,
        billingArea,
        billingCity,
        billingState,
        billingPincode
      });
    } catch (err: any) {
      setErrorMessage("Failed to save profile updates.");
    } finally {
      setLoading(false);
    }
  };

  // Validate GST Number (Step 5)
  const handleGstValidation = async () => {
    if (!gstNumber) return;
    setLoading(true);
    try {
      const res = await api.get(`/auth/gst/validate?gstNumber=${gstNumber}`);
      setGstValid(res.data?.data || false);
    } catch (e) {
      setGstValid(false);
    } finally {
      setLoading(false);
    }
  };

  // Toggle addons
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons(selectedAddons.map(a => 
      a.id === addonId ? { ...a, selected: !a.selected } : a
    ));
  };

  // Validate Coupon via backend (Step 6)
  const handleValidateCoupon = async () => {
    if (!couponCodeInput || !selectedPlan) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await api.get(`/plans/coupon/validate?code=${couponCodeInput.toUpperCase()}&price=${selectedPlan.price}`);
      if (res.data?.success) {
        setCouponApplied(true);
        setCouponDiscount(res.data.data.discount);
        toast.success('Coupon Applied!', `₹${res.data.data.discount.toFixed(2)} discount applied via backend validation!`);
      }
    } catch (err: any) {
      setCouponApplied(false);
      setCouponDiscount(0);
      toast.error('Invalid Coupon', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Proceed from Plans (Step 6 -> Step 7)
  const handleProceedPlans = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const res = await api.post(`/customer/portal/plan/select?planId=${selectedPlan.id}`);
      if (res.data?.success) {
        if (res.data.data) {
          updateCustomer(res.data.data);
        }
        
        setCurrentStep(7);
        saveJourneyDraft(7, { selectedPlan });
      }
    } catch (err) {
      setErrorMessage("Failed to register plan selection.");
    } finally {
      setLoading(false);
    }
  };

  // Process Checkout Payment (Step 7)
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setPaymentStatus('processing');
    setPaymentStatusText('Contacting 3D-Secure payment gateway...');
    
    // Simulate delay 1
    await new Promise(resolve => setTimeout(resolve, 1500));
    setPaymentStatusText('Authenticating transaction with your bank...');
    
    // Simulate delay 2
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulated validations
    let isMockFailure = false;
    if (paymentMode === 'UPI' && upiId.includes('fail')) {
      isMockFailure = true;
    } else if ((paymentMode === 'CREDIT_CARD' || paymentMode === 'DEBIT_CARD') && cardNumber.includes('999')) {
      isMockFailure = true;
    }

    if (isMockFailure) {
      setPaymentStatus('failed');
      setPaymentStatusText('Transaction declined. Insufficient funds or invalid credentials.');
      return;
    }

    // Process actual backend calls
    try {
      setPaymentStatusText('Creating customer profile & account in database...');
      // 1. Assign plan and generate customer/account IDs in backend
      const planRes = await api.post(`/customer/portal/plan/select?planId=${selectedPlan.id}`);
      if (!planRes.data?.success) {
        throw new Error("Plan registration failed.");
      }
      const updatedCust = planRes.data.data;
      setTempCustomer(updatedCust);

      setPaymentStatusText('Processing order payment settlement...');
      // 2. Process payment transaction and trigger Document Migration
      const payRes = await api.post('/customer/payment/process', {
        paymentMode,
        couponCode: couponApplied ? couponCodeInput : ''
      });
      if (payRes.data?.success) {
        setTransactionRef(payRes.data.data);
        
        // 3. Trigger consent OTP send
        await api.post('/customer/portal/consent/send-otp');
        setConsentOtpSent(true);
        
        // 4. Update the context with the fresh Customer ID/Account Details
        updateCustomer(updatedCust);

        setPaymentStatus('success');
        setPaymentStatusText('Payment of ₹' + total.toFixed(2) + ' received successfully!');
      }
    } catch (err: any) {
      setPaymentStatus('failed');
      setPaymentStatusText(err.response?.data?.message || "Payment transaction processing failed.");
    }
  };

  // Verify Consent OTP (Step 8)
  const handleVerifyConsentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      if (isAdminMode) {
        const res = await api.post('/admin/consent/verify-dual-otp', {
          mobileNumber: mobileNumber || customerMobileFromState,
          adminOtp: adminConsentOtp,
          customerOtp: consentOtpCode,
          adminId: adminId
        });
        if (res.data?.success) {
          setConsentVerified(true);
          setCurrentStep(9);
          saveJourneyDraft(9);
        }
      } else {
        const res = await api.post(`/customer/portal/consent/verify?otp=${consentOtpCode}`);
        if (res.data?.success) {
          setConsentVerified(true);
          setCurrentStep(9);
          saveJourneyDraft(9);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Incorrect OTP code. Consent not verified.");
    } finally {
      setLoading(false);
    }
  };

  // Generate CAF Preview/Download (Step 9)
  const handleGenerateCaf = async () => {
    setLoading(true);
    try {
      const res = await api.post('/customer/portal/caf/generate');
      if (res.data?.success) {
        setCafFile(res.data.data);
        alert("CAF document generated and saved to your folder!");
      }
    } catch (e) {
      setErrorMessage("Failed to generate CAF document.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger EKYC Schedule (Step 10)
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await api.post('/customer/ticket/schedule', { appointmentDate });
      if (res.data?.success) {
        setTicketDetails(res.data.data);
        
        try {
          const dbRes = await api.get('/customer/portal/dashboard');
          if (dbRes.data?.success && dbRes.data.data?.profile) {
            updateCustomer(dbRes.data.data.profile);
          } else if (customer) {
            updateCustomer({ ...customer, status: 'APPOINTMENT_SCHEDULED' });
          }
        } catch (e) {
          if (customer) {
            updateCustomer({ ...customer, status: 'APPOINTMENT_SCHEDULED' });
          }
        }

        saveJourneyDraft(10);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || "Failed to schedule slot.");
    } finally {
      setLoading(false);
    }
  };  // Calculate pricing values
  const calculateTotal = () => {
    if (!selectedPlan) return { base: 0, addonPrice: 0, install: 0, disc: 0, tax: 0, total: 0 };
    const base = selectedPlan.price;
    const addonPrice = selectedAddons.reduce((sum, a) => sum + (a.selected ? a.price : 0), 0);
    const install = selectedPlan.installationCharges;
    const disc = couponDiscount;
    const taxable = base + addonPrice - disc;
    const tax = taxable * 0.18;
    const total = taxable + tax + install;
    return { base, addonPrice, install, disc, tax, total };
  };

  const { base, addonPrice, install, disc, tax, total } = calculateTotal();

  // Steps labels & icons helper
  const steps = [
    { num: 1, label: "Feasibility", icon: <MapPin size={16} /> },
    { num: 2, label: "Booking", icon: <User size={16} /> },
    { num: 3, label: "OTP", icon: <Smartphone size={16} /> },
    { num: 4, label: "Docs", icon: <FileText size={16} /> },
    { num: 5, label: "Profile", icon: <Settings size={16} /> },
    { num: 6, label: "Plans", icon: <Zap size={16} /> },
    { num: 7, label: "Payment", icon: <CreditCard size={16} /> },
    { num: 8, label: "Consent", icon: <CheckSquare size={16} /> },
    { num: 9, label: "CAF", icon: <FileText size={16} /> },
    { num: 10, label: "EKYC", icon: <Calendar size={16} /> }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* SOC Admin Operational Mode Top Bar */}
      {isAdminMode && (
        <div className="glass-panel border-2 border-purple-500/40 rounded-2xl p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-900/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">SOC Admin Onboarding Mode</span>
                <span className="px-2 py-0.5 bg-purple-500/30 text-white rounded text-[10px] font-bold">Admin ID: {adminId}</span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Onboarding customer: <span className="font-extrabold text-white">{mobileNumber || customerMobileFromState || 'Prospect'}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAndExit}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 shadow flex items-center gap-1.5 transition"
          >
            Save & Leave Onboarding
          </button>
        </div>
      )}

      {/* Customer Mode Save & Exit Button */}
      {!isAdminMode && (
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-400">TelcoBridge Self-Onboarding Portal</span>
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="px-3.5 py-1.5 rounded-xl border dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Save & Exit
          </button>
        </div>
      )}

      {/* Wizard Header & Stepper */}
      {currentStep < 10 && !ticketDetails && (
        <div className="glass-panel border-2 border-purple-500/30 rounded-3xl p-5 shadow-xl space-y-4 bg-slate-950/80 backdrop-blur-md">
          
          {/* Active Step Focus Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-tpf-purple to-tpf-pink text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30 animate-pulse-slow">
                {steps[currentStep - 1]?.icon || currentStep}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-tpf-purple dark:text-purple-400 block">
                  Onboarding Progress • Step {currentStep} of 10
                </span>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  {steps[currentStep - 1]?.label} Diagnostic & Setup
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {Math.round(((currentStep - 1) / 9) * 100)}% Completed
              </span>
            </div>
          </div>

          {/* Connected Gradient Progress Track Bar */}
          <div className="relative w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-tpf-purple via-tpf-pink to-emerald-400 rounded-full transition-all duration-700 shadow-md"
              style={{ width: `${Math.max(10, Math.min(100, Math.round(((currentStep - 1) / 9) * 100)))}%` }}
            />
          </div>

          {/* Stepper Node Timeline Matrix */}
          <div className="grid grid-cols-5 md:grid-cols-10 gap-1.5 pt-1">
            {steps.map(step => {
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              
              return (
                <button
                  key={step.num}
                  type="button"
                  disabled={!isCompleted}
                  onClick={() => isCompleted && setCurrentStep(step.num)}
                  className={`flex flex-col items-center gap-1 group transition ${
                    isCompleted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  title={`${step.label} ${isCompleted ? '(Click to jump)' : ''}`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-black transition duration-300 ${
                      isCurrent
                        ? 'bg-gradient-to-r from-tpf-purple to-tpf-pink text-white shadow-lg shadow-purple-500/40 ring-4 ring-purple-500/30 scale-110'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={14} className="text-emerald-400" /> : step.num}
                  </div>
                  
                  <span
                    className={`text-[9px] font-bold tracking-tight truncate max-w-full hidden sm:block ${
                      isCurrent
                        ? 'text-purple-300 font-black'
                        : isCompleted
                        ? 'text-slate-300 group-hover:text-white'
                        : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Actor Mode Audit Footer */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Session ID: <strong className="text-slate-300 font-mono">ONBRD-LIVE</strong></span>
            </span>
            <span className="font-semibold text-purple-300">
              Actor Role: {isAdminMode ? `SOC Admin (${adminId})` : 'Customer Direct Portal'}
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/35 text-xs font-semibold animate-shake">
          {errorMessage}
        </div>
      )}

      {/* Screen Renderers */}
      <div className="glass-panel border rounded-3xl p-8 shadow-lg relative min-h-[400px] flex flex-col justify-between">
        
        {/* STEP 1: Feasibility Check */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b dark:border-slate-800 pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-tpf-purple border border-purple-500/20 inline-block mb-1">
                  Step 1 of 10 • Coverage Diagnostic
                </span>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                  Verify Coverage Feasibility
                </h2>
              </div>
            </div>

            {/* Resume Booking Check Block */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
              <div className="text-left">
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">Have an ongoing booking?</h4>
                <p className="text-[10px] text-slate-400">Log in with your Mobile Number to resume booking right where you left.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (token) {
                    api.get('/auth/journey').then(res => {
                      if (res.data?.success && res.data.data) {
                        restoreJourney(res.data.data);
                      }
                    });
                  } else {
                    setIsResumeMode(!isResumeMode);
                    setOtpSent(false);
                    setOtpCode('');
                  }
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-tpf-purple text-white hover:opacity-90 transition duration-300 shadow"
              >
                {isResumeMode ? "New Connection" : "Resume Booking"}
              </button>
            </div>

            {isResumeMode && !token ? (
              // RESUME LOGIN SUB-VIEW
              <div className="space-y-4 text-left max-w-md mx-auto">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Log in with Mobile (RMN) to Resume</h3>
                {!otpSent ? (
                  <form onSubmit={handleResumeBookingLogin} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Mobile Number (Indian)</label>
                      <input
                        type="tel"
                        required
                        pattern="[6-9][0-9]{9}"
                        value={mobileNumber}
                        onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="E.g., 9876543210"
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || mobileNumber.length !== 10}
                      className="w-full py-2.5 rounded-xl font-bold text-white gradient-bg flex items-center justify-center gap-1 shadow"
                    >
                      Send OTP <ChevronRight size={14} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Enter Verification OTP</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpCode}
                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="6 Digit Code (Mock is 123456)"
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs text-center tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-2.5 rounded-xl font-bold text-white gradient-bg flex items-center justify-center gap-1 shadow"
                    >
                      Verify & Log In <ChevronRight size={14} />
                    </button>
                  </form>
                )}
              </div>
            ) : (
              // FEASIBILITY CHECK FORM WITH SMART MAP ADDRESS PICKER
              <div className="space-y-6">
                <form onSubmit={handleFeasibilityCheck} className="space-y-6">
                  <SmartMapAddressPicker
                    initialAddress={{
                      houseNumber,
                      society,
                      addressLine1,
                      street,
                      area,
                      city,
                      state,
                      pincode,
                      latitude: latitude || undefined,
                      longitude: longitude || undefined,
                    }}
                    onDetectGps={handleDetectLocation}
                    onChange={(data) => {
                      setHouseNumber(data.houseNumber);
                      setSociety(data.society);
                      setAddressLine1(data.addressLine1);
                      setStreet(data.street);
                      setArea(data.area);
                      setCity(data.city);
                      setState(data.state);
                      setPincode(data.pincode);
                      setLatitude(data.latitude);
                      setLongitude(data.longitude);
                    }}
                  />

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !pincode || pincode.length !== 6}
                      className="px-8 py-3.5 font-extrabold text-xs uppercase tracking-wider text-white rounded-2xl gradient-bg hover:opacity-90 disabled:opacity-40 shadow-xl glow-card-hover flex items-center gap-2 transition transform active:scale-95"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Calibrating Optical Feasibility...
                        </>
                      ) : (
                        <>
                          <Activity size={16} /> Run Signal Diagnostic & Verify Coverage
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {locationFeasible === true && (
                  <div className="p-6 rounded-3xl bg-emerald-950/30 border-2 border-emerald-500/40 text-left space-y-4 shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950">
                            100% Coverage Ready
                          </span>
                          <h4 className="text-lg font-black text-white mt-0.5">TelcoBridge is Fully Feasible!</h4>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-1.5 shadow-xl glow-card-hover transition active:scale-95"
                      >
                        Proceed to Step 2: Book Connection <ChevronRight size={16} />
                      </button>
                    </div>

                    <p className="text-xs text-emerald-300 font-medium">
                      Optical Line Terminal (OLT) signal strength optimal at Pin Code {pincode}. Wi-Fi 6 Router and 1 Gbps Gigabit bandwidth capability verified.
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-900/80 rounded-xl border border-emerald-500/20">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">SLA Bandwidth</span>
                        <span className="font-extrabold text-emerald-400">1 Gbps Ready</span>
                      </div>
                      <div className="p-2 bg-slate-900/80 rounded-xl border border-emerald-500/20">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Installation</span>
                        <span className="font-extrabold text-purple-300">Zero Charges</span>
                      </div>
                      <div className="p-2 bg-slate-900/80 rounded-xl border border-emerald-500/20">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Latency</span>
                        <span className="font-extrabold text-cyan-300">&lt; 2 ms SLA</span>
                      </div>
                    </div>
                  </div>
                )}

                {locationFeasible === false && (
                  <div className="p-6 rounded-3xl bg-amber-950/30 border-2 border-amber-500/40 text-left space-y-3 shadow-2xl backdrop-blur-md animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Network Laying In Progress
                        </span>
                        <h4 className="text-base font-extrabold text-white mt-0.5">Service Expansion Under Progress</h4>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300">
                      Pin Code <strong className="text-amber-400">{pincode}</strong> is currently on our active network expansion roadmap. Optical cables are being laid in your sector.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Connection Booking (Customer Details) */}
        {currentStep === 2 && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Connection Booking</h2>
            <p className="text-xs text-slate-400">Fill in your registered mobile details. We will link your address details with your profile.</p>
            <form onSubmit={handleConnectionBookingSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Mobile Number (RMN)</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="E.g., 9876543210"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                />
              </div>
              <div className="md:col-span-2 pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-xl border text-xs font-semibold text-slate-500 dark:border-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 font-bold text-white rounded-xl gradient-bg hover:opacity-90 flex items-center gap-1"
                >
                  Save Lead & Proceed <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: OTP Generation & Validation */}
        {currentStep === 3 && (
          <div className="space-y-6 text-left max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center">OTP Verification</h2>
            <p className="text-xs text-slate-400 text-center">We have triggered an OTP verification message to your Registered Mobile Number: +91 {mobileNumber}</p>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Verification Code</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit OTP code (mock is 123456)"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm text-center tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading || otpCode.length !== 6}
                className="w-full py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 flex items-center justify-center gap-1"
              >
                Verify & Start Onboarding Session <ChevronRight size={14} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: Documents Collection & Validation */}
        {currentStep === 4 && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">KYC Document Uploads & Validation</h2>
            <p className="text-xs text-slate-400">Please upload your Point of Address (POA), Point of Identity (POI), and take a passport selfie.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <form onSubmit={handleFileUpload} className="space-y-4 border dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-xs uppercase text-slate-400">1. Upload KYC File</h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">Document Type</label>
                  <select
                    value={docType}
                    onChange={e => setDocType(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  >
                    <option value="AADHAAR">Aadhaar Card (POI/POA)</option>
                    <option value="PAN">PAN Card (POI)</option>
                    <option value="VOTER_ID">Voter ID (POA)</option>
                    <option value="PASSPORT">Passport (POI/POA)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">Document / Identity Number</label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={e => setDocNumber(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500">Select File</label>
                  <input
                    type="file"
                    id="docFile"
                    required
                    multiple
                    onChange={e => e.target.files && setDocFiles(Array.from(e.target.files))}
                    className="text-xs dark:text-slate-300"
                  />
                  {docFiles.length > 0 && (
                    <p className="text-[10px] text-emerald-500 font-bold">{docFiles.length} file(s) selected: {docFiles.map(f => f.name).join(', ')}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || docFiles.length === 0 || !docNumber}
                  className="px-4 py-2 text-xs font-bold text-white gradient-bg rounded-lg flex items-center gap-1"
                >
                  <Upload size={14} /> Upload & Validate File(s)
                </button>
              </form>

              <div className="border dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between">
                <h3 className="font-bold text-xs uppercase text-slate-400 mb-2">2. Facial Recognition Live Selfie</h3>
                {selfieData ? (
                  <div className="relative w-full max-w-[280px] mx-auto rounded-xl overflow-hidden border">
                    <img src={selfieData} alt="Webcam Photo" className="w-full h-auto" />
                    <button
                      onClick={() => setSelfieData(null)}
                      className="absolute bottom-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : webcamActive ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-xl overflow-hidden border w-[280px]">
                      <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={280} />
                    </div>
                    <button
                      onClick={captureWebcamSelfie}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                    >
                      <Camera size={14} /> Click Passport Photo
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <button
                      onClick={() => setWebcamActive(true)}
                      className="px-4 py-2 border text-slate-700 dark:text-slate-300 dark:border-slate-800 text-xs font-bold rounded-lg flex items-center gap-1 mx-auto"
                    >
                      <Camera size={14} /> Activate Selfie Camera
                    </button>
                  </div>
                )}
              </div>
            </div>

            {uploadedDocs.length > 0 && (
              <div className="mt-6 border dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-xs text-slate-500 uppercase mb-3">Validated Uploads (SharePoint Mock Folder)</h3>
                <div className="space-y-2">
                  {uploadedDocs.map(d => (
                    <div key={d.id} className="flex justify-between items-center text-xs p-2.5 rounded-lg border dark:border-slate-800 bg-white dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-tpf-purple" />
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{d.docType}</p>
                          <p className="text-[10px] text-slate-400">OCR Scan: Approved | Path: {d.filePath}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-green-100 text-green-700 font-bold">VERIFIED</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="pt-8 flex justify-end">
              <button
                onClick={triggerDeclarationForm}
                disabled={loading || uploadedDocs.length < 2}
                className="px-6 py-3 font-bold text-white rounded-xl gradient-bg hover:opacity-90 flex items-center gap-1 disabled:opacity-40"
              >
                Sign Declaration & Proceed <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Profile Building */}
        {currentStep === 5 && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Build Customer Profile</h2>
            <p className="text-xs text-slate-400">Provide optional billing details and validate tax configuration settings. You can edit your name or email here.</p>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Profile Details */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Registered Mobile Number (RMN - Locked)</label>
                  <input
                    type="text"
                    disabled
                    value={mobileNumber}
                    className="border dark:border-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>

                {/* Installation Address Details */}
                <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 md:col-span-2 border-b dark:border-slate-800 pb-2 mt-4">
                  Installation Address Details
                </h3>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Flat / House Number</label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Society / Building Name</label>
                  <input
                    type="text"
                    required
                    value={society}
                    onChange={e => setSociety(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Address Line 1</label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Street Name</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Landmark</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={e => setLandmark(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Area / Locality</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">6-digit PIN Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">State</label>
                  <select
                    value={state}
                    onChange={e => { setState(e.target.value); setCity(''); }}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  >
                    <option value="">Select State</option>
                    {Object.keys(statesAndCities).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">City</label>
                  <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    disabled={!state}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Select City</option>
                    {state && statesAndCities[state]?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Billing Address Selection same Checkbox */}
                <div className="flex items-center gap-2 md:col-span-2 mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-800">
                  <input
                    type="checkbox"
                    id="billingSameAsInstallation"
                    checked={billingSameAsInstallation}
                    onChange={e => setBillingSameAsInstallation(e.target.checked)}
                    className="rounded text-tpf-purple focus:ring-tpf-purple"
                  />
                  <label htmlFor="billingSameAsInstallation" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                    Billing Address is same as Installation / Primary Address
                  </label>
                </div>

                {/* Separate Billing Address details */}
                {!billingSameAsInstallation && (
                  <>
                    <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 md:col-span-2 border-b dark:border-slate-800 pb-2 mt-4">
                      Billing Address Details
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Flat / House Number</label>
                      <input
                        type="text"
                        required
                        value={billingHouseNumber}
                        onChange={e => setBillingHouseNumber(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Society / Building Name</label>
                      <input
                        type="text"
                        required
                        value={billingSociety}
                        onChange={e => setBillingSociety(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Address Line 1</label>
                      <input
                        type="text"
                        required
                        value={billingAddressLine1}
                        onChange={e => setBillingAddressLine1(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Street Name</label>
                      <input
                        type="text"
                        required
                        value={billingStreet}
                        onChange={e => setBillingStreet(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Landmark</label>
                      <input
                        type="text"
                        value={billingLandmark}
                        onChange={e => setBillingLandmark(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Area / Locality</label>
                      <input
                        type="text"
                        required
                        value={billingArea}
                        onChange={e => setBillingArea(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">6-digit PIN Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={billingPincode}
                        onChange={e => setBillingPincode(e.target.value.replace(/\D/g, ''))}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">State</label>
                      <select
                        value={billingState}
                        onChange={e => { setBillingState(e.target.value); setBillingCity(''); }}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      >
                        <option value="">Select State</option>
                        {Object.keys(statesAndCities).map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">City</label>
                      <select
                        value={billingCity}
                        onChange={e => setBillingCity(e.target.value)}
                        disabled={!billingState}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none disabled:opacity-50"
                      >
                        <option value="">Select City</option>
                        {billingState && statesAndCities[billingState]?.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* GST Validation Section */}
                <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 md:col-span-2 border-b dark:border-slate-800 pb-2 mt-4">
                  Tax Registration details
                </h3>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">GST Registration Number (Optional)</label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="E.g., 22AAAAA1111A1Z1"
                      className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleGstValidation}
                      disabled={!gstNumber}
                      className="px-4 bg-slate-100 dark:bg-slate-800 dark:border-slate-800 border text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                    >
                      Validate
                    </button>
                  </div>
                  {gstValid === true && (
                    <span className="text-[10px] font-bold text-green-500">GST Registration Number Validated successfully!</span>
                  )}
                  {gstValid === false && (
                    <span className="text-[10px] font-bold text-rose-500">Invalid GST format. (15 characters alphanumeric required).</span>
                  )}
                </div>
              </div>

              <div className="pt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(4);
                    saveJourneyDraft(4);
                  }}
                  className="px-5 py-2.5 rounded-xl border text-xs font-semibold text-slate-500 dark:border-slate-800 flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 font-bold text-white rounded-xl gradient-bg hover:opacity-90 flex items-center gap-1"
                >
                  Save Profile & Next <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 6: Plans, Addons, Coupons Selection */}
        {currentStep === 6 && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Choose Plans & Offers</h2>
            <p className="text-xs text-slate-400">Select plans, choose custom add-ons, apply active coupons and view invoice breakup.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex border-b dark:border-slate-800 gap-4">
                  {(['plans', 'addons', 'coupons'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActivePlanTab(tab)}
                      className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
                        activePlanTab === tab
                          ? 'border-tpf-purple text-tpf-purple dark:text-purple-400'
                          : 'border-transparent text-slate-400'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activePlanTab === 'plans' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                    {plans.map(p => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlan(p)}
                        className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative ${
                          selectedPlan?.id === p.id
                            ? 'border-tpf-purple bg-purple-500/5 ring-2 ring-tpf-purple/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:bg-slate-50/20'
                        }`}
                      >
                        {p.recommended && (
                          <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-tpf-pink text-white uppercase shadow-sm">
                            RECOMMENDED
                          </span>
                        )}
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white">{p.name}</h4>
                        <div className="mt-2.5 flex items-baseline gap-1">
                          <span className="text-xl font-black text-tpf-purple dark:text-purple-400">₹{p.price}</span>
                          <span className="text-[10px] text-slate-400">/ {p.validityDays} Days</span>
                        </div>
                        <p className="text-[10px] mt-1.5 text-slate-400 dark:text-slate-500">{p.description}</p>
                        <div className="mt-4 pt-3 border-t dark:border-slate-800 flex justify-between items-center text-[10px]">
                          <span className="font-bold text-slate-500">Speed: {p.speedMbps} Mbps</span>
                          <span className="text-slate-400">Router: {p.routerIncluded ? 'Free' : 'Charged'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePlanTab === 'addons' && (
                  <div className="space-y-3">
                    {selectedAddons.map(a => (
                      <div
                        key={a.id}
                        onClick={() => handleToggleAddon(a.id)}
                        className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition ${
                          a.selected
                            ? 'border-tpf-purple bg-purple-500/5 ring-1 ring-tpf-purple'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white">{a.name}</h4>
                          <p className="text-[9px] text-slate-400">Optional onboarding value-add utility.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">+ ₹{a.price}/month</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${a.selected ? 'bg-tpf-purple border-tpf-purple text-white' : 'border-slate-300'}`}>
                            {a.selected && <Check size={10} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePlanTab === 'coupons' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter Coupon (e.g. WELCOME100, FIBER50)"
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleValidateCoupon}
                        className="px-4 py-2 bg-tpf-purple text-white text-xs font-bold rounded-xl"
                      >
                        Apply
                      </button>
                    </div>
                    {couponApplied && (
                      <div className="p-3 bg-green-500/5 border border-green-500/30 rounded-xl text-green-500 text-xs font-bold flex justify-between">
                        <span>Coupon applied successfully!</span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="p-4 border dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 text-[10px] space-y-1">
                      <p className="font-bold text-slate-500 uppercase tracking-wide">Available Coupon Offers:</p>
                      <p className="text-slate-400"><strong className="text-tpf-pink">WELCOME100:</strong> Flat ₹100 Discount on installation.</p>
                      <p className="text-slate-400"><strong className="text-tpf-pink">FIBER50:</strong> Flat ₹50 Discount on broadband plan.</p>
                      <p className="text-slate-400"><strong className="text-tpf-pink">TELCO10:</strong> 10% Discount on Plan Price.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 shadow flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white mb-4 border-b dark:border-slate-800 pb-2">Cost Invoice Breakup</h3>
                  
                  {selectedPlan ? (
                    <div className="text-xs space-y-3 text-left">
                      <div className="flex justify-between border-b dark:border-slate-800 pb-2">
                        <span className="text-slate-500 font-bold">Plan: {selectedPlan.name}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{base.toFixed(2)}</span>
                      </div>
                      
                      {selectedAddons.filter(a => a.selected).length > 0 && (
                        <div className="space-y-1 border-b dark:border-slate-800 pb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Add-ons:</p>
                          {selectedAddons.filter(a => a.selected).map(a => (
                            <div key={a.id} className="flex justify-between text-slate-400">
                              <span>• {a.name}</span>
                              <span>₹{a.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {couponApplied && (
                        <div className="flex justify-between text-green-500 font-bold border-b dark:border-slate-800 pb-2">
                          <span>Coupon Applied: {couponCodeInput}</span>
                          <span>- ₹{disc.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-slate-400">Telecom GST (18%)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{tax.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Installation Fee</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {install === 0 ? 'FREE' : `₹${install.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="border-t dark:border-slate-800 pt-3 flex justify-between font-extrabold text-sm text-slate-800 dark:text-white">
                        <span>Total Due</span>
                        <span className="text-tpf-purple dark:text-purple-400 text-base">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6">Select a plan to view cost breakup.</p>
                  )}
                </div>

                <div className="pt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(5);
                      saveJourneyDraft(5);
                    }}
                    className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={14} /> Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedPlans}
                    disabled={!selectedPlan}
                    className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    Proceed <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Payment Page */}
        {currentStep === 7 && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center">Complete Payment</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel: Options & Input Form */}
              <div className="lg:col-span-2 space-y-6">
                {paymentStatus === 'processing' && (
                  <div className="glass-panel border rounded-3xl p-12 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-tpf-purple border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{paymentStatusText}</p>
                    <p className="text-xs text-slate-400">Do not refresh or click the back button...</p>
                  </div>
                )}

                {paymentStatus === 'success' && (
                  <div className="glass-panel border rounded-3xl p-8 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check size={36} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Payment Successful!</h3>
                      <p className="text-xs text-slate-400">Transaction Ref: {transactionRef?.transactionId || 'TPF-TXN-MOCK-' + Date.now()}</p>
                      <p className="text-sm text-green-500 font-bold">{paymentStatusText}</p>
                    </div>

                    <div className="w-full max-w-sm border dark:border-slate-800 bg-white dark:bg-slate-950 p-4 rounded-2xl text-xs space-y-2.5 text-left">
                      <p className="font-bold text-slate-500 uppercase tracking-wide border-b dark:border-slate-800 pb-1">Generated Customer Profile:</p>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer ID</span>
                        <span className="font-bold text-tpf-purple">{tempCustomer?.customerId || customer?.customerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Number</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{tempCustomer?.accountNumber || customer?.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Connection ID</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{tempCustomer?.connectionId || customer?.connectionId}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCurrentStep(8);
                        saveJourneyDraft(8);
                      }}
                      className="px-8 py-3 rounded-xl font-bold text-white gradient-bg flex items-center gap-1 shadow-lg hover:opacity-90 transition"
                    >
                      Proceed to Consent Authorization <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {(paymentStatus === null || paymentStatus === 'failed') && (
                  <form onSubmit={handleProcessPayment} className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                    {paymentStatus === 'failed' && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-xl flex flex-col gap-2">
                        <span>❌ {paymentStatusText}</span>
                        <button
                          type="button"
                          onClick={() => setPaymentStatus(null)}
                          className="text-left underline hover:text-rose-400"
                        >
                          Try different payment details
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col gap-3">
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Select Payment Mode</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {['UPI', 'DEBIT_CARD', 'CREDIT_CARD', 'NET_BANKING', 'WALLET'].map(mode => (
                          <div
                            key={mode}
                            onClick={() => setPaymentMode(mode)}
                            className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition duration-300 ${
                              paymentMode === mode
                                ? 'border-tpf-purple bg-purple-500/5 shadow-sm ring-2 ring-tpf-purple/20'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                            }`}
                          >
                            <div className="p-1.5 bg-white dark:bg-slate-950 rounded-lg shadow-sm">
                              {paymentModeIcons[mode]}
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{mode.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Inputs */}
                    <div className="border-t dark:border-slate-800 pt-4 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enter Payment Details</h4>
                      
                      {paymentMode === 'UPI' && (
                        <div className="flex flex-col gap-1.5 max-w-md">
                          <label className="text-xs font-bold text-slate-500">Enter UPI ID (VPA)</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. customer@okaxis"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                            className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                          />
                          <span className="text-[9px] text-slate-400">Tip: Enter fail@upi to trigger failure mock.</span>
                        </div>
                      )}

                      {(paymentMode === 'DEBIT_CARD' || paymentMode === 'CREDIT_CARD') && (
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                          <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-xs font-bold text-slate-500">Cardholder Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Name as it appears on card"
                              value={cardholderName}
                              onChange={e => setCardholderName(e.target.value)}
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-xs font-bold text-slate-500">Card Number</label>
                            <input
                              type="text"
                              required
                              placeholder="16-digit card number"
                              maxLength={19}
                              value={cardNumber}
                              onChange={e => {
                                const raw = e.target.value.replace(/\D/g, '');
                                const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                setCardNumber(formatted);
                              }}
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400">Tip: Enter number containing 999 to trigger failure mock.</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500">Expiry Date</label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={e => {
                                const raw = e.target.value.replace(/\D/g, '');
                                if (raw.length > 2) {
                                  setCardExpiry(raw.slice(0, 2) + '/' + raw.slice(2, 4));
                                } else {
                                  setCardExpiry(raw);
                                }
                              }}
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500">CVV</label>
                            <input
                              type="password"
                              required
                              maxLength={3}
                              placeholder="***"
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {paymentMode === 'NET_BANKING' && (
                        <div className="grid grid-cols-1 gap-3 max-w-md">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500">Select Bank</label>
                            <select
                              value={selectedBank}
                              onChange={e => setSelectedBank(e.target.value)}
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                            >
                              <option value="sbi">State Bank of India</option>
                              <option value="hdfc">HDFC Bank</option>
                              <option value="icici">ICICI Bank</option>
                              <option value="axis">Axis Bank</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {paymentMode === 'WALLET' && (
                        <div className="flex flex-col gap-1.5 max-w-md">
                          <label className="text-xs font-bold text-slate-500">Linked Mobile Number</label>
                          <input
                            type="text"
                            required
                            maxLength={10}
                            placeholder="10-digit mobile number"
                            value={walletPhone}
                            onChange={e => setWalletPhone(e.target.value.replace(/\D/g, ''))}
                            className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentStep(6);
                          saveJourneyDraft(6);
                        }}
                        className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 flex items-center justify-center gap-1"
                      >
                        <ChevronLeft size={16} /> Back
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg flex items-center justify-center gap-1 shadow-md hover:opacity-90"
                      >
                        Pay Now ₹{total.toFixed(2)} <ChevronRight size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Right Panel: Invoice details */}
              <div className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 shadow flex flex-col justify-between h-fit">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Order Price Summary</h3>
                  
                  {selectedPlan ? (
                    <div className="text-xs space-y-3">
                      <div className="flex justify-between border-b dark:border-slate-800 pb-2">
                        <span className="text-slate-500 font-bold">Plan: {selectedPlan.name}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{base.toFixed(2)}</span>
                      </div>
                      
                      {selectedAddons.filter(a => a.selected).length > 0 && (
                        <div className="space-y-1 border-b dark:border-slate-800 pb-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Add-ons:</p>
                          {selectedAddons.filter(a => a.selected).map(a => (
                            <div key={a.id} className="flex justify-between text-slate-400">
                              <span>• {a.name}</span>
                              <span>₹{a.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {couponApplied && (
                        <div className="flex justify-between text-green-500 font-bold border-b dark:border-slate-800 pb-2">
                          <span>Coupon: {couponCodeInput}</span>
                          <span>- ₹{disc.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span className="text-slate-400">Telecom GST (18%)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{tax.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-slate-400">Installation Fee</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {install === 0 ? 'FREE' : `₹${install.toFixed(2)}`}
                        </span>
                      </div>

                      <div className="border-t dark:border-slate-800 pt-3 flex justify-between font-extrabold text-slate-800 dark:text-white text-sm">
                        <span>Total Amount Due</span>
                        <span className="text-tpf-purple text-base">₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6">No plan selected.</p>
                  )}
                </div>

                <div className="pt-6 text-[10px] text-slate-400 text-center leading-relaxed">
                  All transactions are secure and encrypted. Invoice generated instantly post payment confirmation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Customer Consent */}
        {currentStep === 8 && (
          <div className="space-y-6 text-left max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white text-center">Customer Consent Authorization</h2>
            <p className="text-xs text-slate-400 text-center">
              {isAdminMode 
                ? "SOC Admin Mode: Dual OTP verification required (SOC Admin OTP + Customer OTP)."
                : "Enter the authorization OTP code broadcasted to consent to the final installation setup."
              }
            </p>

            {isAdminMode && (
              <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-xs font-semibold text-tpf-purple dark:text-purple-300 space-y-1">
                <p className="font-extrabold flex items-center gap-1"><ShieldCheck size={16} /> SOC Admin Dual Consent Verification</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  As a SOC Admin performing consent on behalf of the customer, you must enter both your Admin authorization OTP and the customer verification OTP.
                </p>
              </div>
            )}

            <form onSubmit={handleVerifyConsentOtp} className="space-y-4">
              {isAdminMode && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">1. SOC Admin Security Authorization OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={adminConsentOtp}
                    onChange={e => setAdminConsentOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter Admin OTP code (bypass: 123456)"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm text-center tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">
                  {isAdminMode ? "2. Customer Consent Verification OTP (from Customer)" : "Consent Verification Code"}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={consentOtpCode}
                  onChange={e => setConsentOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Customer 6-digit OTP (bypass: 123456)"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm text-center tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || consentOtpCode.length !== 6 || (isAdminMode && adminConsentOtp.length !== 6)}
                  className="w-full py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 flex items-center justify-center gap-1 disabled:opacity-40"
                >
                  {isAdminMode ? 'Verify Dual Consent (Admin + Customer)' : 'Verify Consent'} <ChevronRight size={14} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 9: CAF Generation & Preview */}
        {currentStep === 9 && (
          <div className="space-y-6 text-left">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Customer Application Form (CAF) Preview</h2>
            <p className="text-xs text-slate-400">Review your final application details before submitting for EKYC scheduling.</p>

            <div className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 dark:text-slate-300">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Customer Name</span>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{firstName} {lastName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Customer ID</span>
                    <p className="font-bold text-tpf-purple text-sm">{customer?.customerId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Account Number</span>
                    <p className="font-bold text-slate-800 dark:text-white">{customer?.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Connection ID</span>
                    <p className="font-bold text-slate-800 dark:text-white">{customer?.connectionId}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Registered Mobile (RMN)</span>
                    <p className="font-bold text-slate-800 dark:text-white">{mobileNumber}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Email Address</span>
                    <p className="font-bold text-slate-800 dark:text-white">{email}</p>
                  </div>
                </div>

                <div className="border-t dark:border-slate-800 pt-3">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Installation Address</span>
                  <p className="text-slate-600 dark:text-slate-400">{houseNumber}, {society}, {addressLine1}, {street}, {area}, {city}, {state} - {pincode}</p>
                </div>

                <div className="border-t dark:border-slate-800 pt-3">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Selected Broadband Plan</span>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedPlan?.name} (Speed: {selectedPlan?.speedMbps} Mbps, price: ₹{base})</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950">
                <span className="text-slate-400 uppercase font-bold text-[10px] mb-2.5">Live Selfie Image</span>
                {selfieData ? (
                  <img src={selfieData} alt="Selfie" className="w-[140px] h-auto rounded-lg border shadow-sm" />
                ) : (
                  <div className="w-[140px] h-[140px] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">Selfie Missing</div>
                )}
              </div>
            </div>

            <div className="pt-6 flex justify-end items-center gap-4">
              <div className="flex gap-4">
                <button
                  onClick={handleGenerateCaf}
                  className="px-5 py-2.5 border text-slate-700 dark:text-slate-300 dark:border-slate-800 text-xs font-bold rounded-xl flex items-center gap-1"
                >
                  <FileText size={16} /> Generate & Save CAF
                </button>
                <button
                  onClick={() => setCurrentStep(10)}
                  className="px-6 py-3 font-bold text-white rounded-xl gradient-bg hover:opacity-90 flex items-center gap-1"
                >
                  Proceed to EKYC initiation <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 10: EKYC Process Initiation & Tracking */}
        {currentStep === 10 && (
          <div className="space-y-6">
            {!ticketDetails ? (
              <div className="space-y-6 text-left">
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Schedule Installation & EKYC</h2>
                <form onSubmit={handleScheduleAppointment} className="max-w-md mx-auto space-y-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Preferred Time Slot</label>
                    <input
                      type="datetime-local"
                      required
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().substring(0, 16)}
                      className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    EKYC verification tickets are processed via Field Service Management tools. Technicians follow strict SLAs.
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={loading || !appointmentDate}
                      className="w-full py-3 rounded-xl text-white font-bold text-sm gradient-bg hover:opacity-90 disabled:opacity-45 flex items-center justify-center gap-1"
                    >
                      Book Slot <ChevronRight size={16} />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-6 py-6 animate-fade-in max-w-xl mx-auto text-left">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/20 text-green-500 mx-auto flex items-center justify-center border border-green-200 dark:border-green-800/30">
                  <ShieldCheck size={36} />
                </div>
                
                <div className="space-y-2 text-center">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">EKYC Ticket Initiated!</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    A service ticket has been created. A verification technician has been broadcasted.
                  </p>
                </div>

                <div className="glass-panel border rounded-2xl p-5 text-xs space-y-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex justify-between">
                    <span className="text-slate-400">FSM Ticket ID</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ticketDetails.ticketNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">EKYC Agent Name</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ticketDetails.engineerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agent Phone</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ticketDetails.engineerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled Date & Time</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{new Date(ticketDetails.appointmentDate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t dark:border-slate-800 pt-2.5">
                    <span className="text-slate-400">Tracking Link</span>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-tpf-purple font-bold text-[9px] uppercase tracking-wide">ACTIVE</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => navigate('/selfcare')}
                    className="w-1/2 py-2.5 rounded-xl font-semibold text-xs border text-slate-700 dark:text-slate-300 dark:border-slate-800"
                  >
                    Go to Self Care Portal
                  </button>
                  <button
                    onClick={() => navigate('/selfcare', { state: { openTracking: true } })}
                    className="w-1/2 py-2.5 rounded-xl text-white font-bold text-xs gradient-bg hover:opacity-90 shadow"
                  >
                    Track Agent & Setup Status
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
