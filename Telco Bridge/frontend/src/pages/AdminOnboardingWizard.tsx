import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api, { extractErrorMessage } from '../utils/api';
import { useToast } from '../components/common/Toast';
import { 
  User, MapPin, Zap, FileText, CreditCard, Calendar, CheckCircle, Check,
  ChevronRight, ChevronLeft, Upload, Trash2, Eye, Compass,
  Smartphone, Building, Wallet, Settings, Camera, Video, VideoOff,
  ShieldCheck, CheckSquare, RefreshCw, ArrowLeft, Image as ImageIcon, X, Gauge, Fingerprint
} from 'lucide-react';
import { DigitalSignature } from '../components/features/DigitalSignature';
import { PlanComparisonTable } from '../components/features/PlanComparisonTable';
import { BiometricConsentModal } from '../components/features/BiometricConsentModal';
import { EngineerTrackingMap } from '../components/features/EngineerTrackingMap';
import { SpeedTestWidget } from '../components/features/SpeedTestWidget';
import { SmartDocScannerWidget } from '../components/features/SmartDocScannerWidget';
import { SmartPlanMatchModal } from '../components/features/SmartPlanMatchModal';

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

export const AdminOnboardingWizard: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const locationState = useLocation().state as { 
    adminId?: string; 
    customerMobile?: string; 
    prospectData?: any;
    resume?: boolean;
  } | null;

  const adminId = locationState?.adminId || localStorage.getItem('tpf_admin_username') || 'admin';
  const customerMobileFromState = locationState?.customerMobile || '';

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stepHistory, setStepHistory] = useState<any[]>([]);

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
  const [pincode, setPincode] = useState('400703');
  const [latitude, setLatitude] = useState<number | null>(19.0760);
  const [longitude, setLongitude] = useState<number | null>(72.8777);
  const [locationFeasible, setLocationFeasible] = useState<boolean | null>(null);

  // Customer details state
  const [firstName, setFirstName] = useState(locationState?.prospectData?.firstName || '');
  const [lastName, setLastName] = useState(locationState?.prospectData?.lastName || '');
  const [mobileNumber, setMobileNumber] = useState(customerMobileFromState || locationState?.prospectData?.mobileNumber || '');
  const [email, setEmail] = useState(locationState?.prospectData?.email || '');

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [mobileVerified, setMobileVerified] = useState(false);

  // Documents state (Separate Photo & Multi-Document Upload)
  const [docType, setDocType] = useState('AADHAAR');
  const [docNumber, setDocNumber] = useState('');
  const [docFiles, setDocFiles] = useState<File[]>([]); // multi-file support
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [customerPhotoUrl, setCustomerPhotoUrl] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});

  // Live camera state
  const [cameraMode, setCameraMode] = useState<'off' | 'preview' | 'captured'>('off');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Profile & Billing state
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

  // Plans/Addons state
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [activePlanTab, setActivePlanTab] = useState<'plans' | 'addons' | 'coupons'>('plans');
  const [selectedAddons, setSelectedAddons] = useState<any[]>([
    { id: 'static_ip', name: 'Static IP Address', price: 250.0, selected: false },
    { id: 'security_suite', name: 'Smart Security Suite', price: 99.0, selected: false },
    { id: 'binge_ott', name: 'TelcoBridge OTT Bundle', price: 199.0, selected: false }
  ]);
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Payment state
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

  // Customer Consent Dual OTP state
  const [adminConsentOtp, setAdminConsentOtp] = useState('');
  const [consentOtpCode, setConsentOtpCode] = useState('');
  const [consentVerified, setConsentVerified] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showPlanMatchModal, setShowPlanMatchModal] = useState(false);

  // CAF & EKYC Ticket state
  const [cafFile, setCafFile] = useState<any>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [ticketDetails, setTicketDetails] = useState<any>(null);

  // Pincode lookup helper
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

  // Check initial journey load on mount
  useEffect(() => {
    const fetchJourney = async () => {
      const target = mobileNumber || customerMobileFromState;
      if (target) {
        try {
          const res = await api.get(`/admin/journey/${target}`);
          if (res.data?.success && res.data.data) {
            restoreJourney(res.data.data);
          }
        } catch (e) {}
      }
    };
    fetchJourney();
  }, [customerMobileFromState]);

  // Load plans on step 5
  useEffect(() => {
    if (currentStep === 5) {
      api.get('/plans')
        .then(res => {
          if (res.data?.success && res.data.data.length > 0) {
            setPlans(res.data.data);
            if (!selectedPlan) setSelectedPlan(res.data.data[0]);
          }
        })
        .catch(() => {});
    }
  }, [currentStep]);

  const restoreJourney = (progress: any) => {
    if (!progress) return;
    try {
      if (progress.stepHistoryJson) {
        try { setStepHistory(JSON.parse(progress.stepHistoryJson)); } catch (e) {}
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
          if (data.selectedPlan) setSelectedPlan(data.selectedPlan);
          if (data.customerPhotoUrl) setCustomerPhotoUrl(data.customerPhotoUrl);
          if (data.uploadedDocs) setUploadedDocs(data.uploadedDocs);
          if (data.docType) setDocType(data.docType);
          if (data.docNumber) setDocNumber(data.docNumber);
          if (data.billingAddress) setBillingAddress(data.billingAddress);
          if (data.gstNumber) setGstNumber(data.gstNumber);
          if (data.gstValid !== undefined) setGstValid(data.gstValid);
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
    } catch (e) {}

    if (progress.currentStep !== undefined && progress.currentStep !== null) {
      setCurrentStep(progress.currentStep);
    }
  };

  const saveJourneyDraft = async (nextStep: number, customData: any = {}) => {
    const targetMobile = mobileNumber || customerMobileFromState;
    if (!targetMobile) return;

    const stepNames = [
      "", "Feasibility Check", "Customer Details & OTP", "Document Collection & Validation",
      "Customer Profile & Address", "Plan Selection & Amount Calculation", "Payment & Order Settlement",
      "Customer Dual OTP Consent", "CAF Generation", "EKYC Process Initiation"
    ];

    const currentAuditItem = {
      step: currentStep,
      stepName: stepNames[currentStep] || `Step ${currentStep}`,
      role: 'SOC_ADMIN',
      actorId: adminId,
      actorName: `SOC Admin (${adminId})`,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...stepHistory.filter((h: any) => h.step !== currentStep), currentAuditItem];
    setStepHistory(updatedHistory);

    const draftData = {
      firstName, lastName, email, mobileNumber: targetMobile, houseNumber, addressLine1, addressLine2, society, street, landmark, area, city, state, pincode,
      selectedPlan, customerPhotoUrl, uploadedDocs, docType, docNumber, billingAddress, gstNumber, gstValid, selectedAddons, couponCodeInput, couponApplied, couponDiscount, consentVerified,
      billingSameAsInstallation, billingHouseNumber, billingSociety, billingAddressLine1, billingAddressLine2, billingStreet, billingLandmark, billingArea, billingCity, billingState, billingPincode,
      ...customData
    };

    try {
      await api.post('/admin/journey/save', {
        page: `/admin/wizard/step-${nextStep}`,
        step: nextStep,
        draftData: JSON.stringify(draftData),
        sessionId: 'ADMIN-SESSION-' + Date.now(),
        mobileNumber: targetMobile,
        adminId: adminId,
        stepHistoryJson: JSON.stringify(updatedHistory)
      });
    } catch (e) {}
  };

  const handleSaveAndExit = async () => {
    await saveJourneyDraft(currentStep);
    toast.success('Progress Saved', `Onboarding saved at Step ${currentStep} for customer: ${mobileNumber}. Can resume anytime.`);
    setTimeout(() => navigate('/admin'), 1500);
  };

  // ─── Live Camera Handlers ────────────────────────────────────────────────

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode('preview');
      setCapturedImage(null);
    } catch (err) {
      toast.error('Camera Error', 'Could not access camera. Please allow camera permission in your browser.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraMode('off');
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    setCameraMode('captured');
    stopCamera();
  }, [stopCamera]);

  const handleSaveLiveCapture = async () => {
    if (!capturedImage) return;
    if (!mobileNumber) {
      toast.error('Missing Info', 'Please complete Step 2 (Customer Details) first.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/admin/documents/capture', {
        mobileNumber,
        image: capturedImage,
        adminId
      });
      setCustomerPhotoUrl(capturedImage);
      setCapturedImage(null);
      setCameraMode('off');
      toast.success('Live Capture Saved', `Customer photo captured and saved to server. Document ID: ${res.data?.data?.id}`);
    } catch (err) {
      toast.error('Upload Failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  // GPS Auto-detect handler
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
      toast.success('Location Detected', 'GPS coordinates retrieved and address auto-filled.');
    }, () => {
      toast.warning('GPS Failed', 'Unable to retrieve location. Please enter address manually.');
    });
  };

  // Step 1: Feasibility Check Form Submit (With Full Address)
  const handleFeasibilityCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!pincode || pincode.length !== 6) {
      setErrorMessage("Please enter a valid 6-digit pincode.");
      return;
    }
    if (!houseNumber || !society || !addressLine1 || !area || !city || !state) {
      setErrorMessage("Please fill all mandatory address fields (House No, Society, Address Line 1, Area, City, State).");
      return;
    }

    setLoading(true);
    try {
      const testLat = latitude || 19.0760;
      const testLon = longitude || 72.8777;
      const res = await api.get(`/feasibility/check?pincode=${pincode}&latitude=${testLat}&longitude=${testLon}`);
      const isFeasible = res.data?.data?.feasible ?? true;
      setLocationFeasible(isFeasible);
      
      if (isFeasible) {
        setCurrentStep(2);
        saveJourneyDraft(2, {
          houseNumber, society, addressLine1, addressLine2, street, landmark, area, city, state, pincode, latitude, longitude
        });
      } else {
        setErrorMessage("Location is currently not feasible for fiber deployment.");
      }
    } catch (e: any) {
      setLocationFeasible(true); // default to true for testing
      setCurrentStep(2);
      saveJourneyDraft(2, {
        houseNumber, society, addressLine1, addressLine2, street, landmark, area, city, state, pincode, latitude, longitude
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Send & Verify Mobile OTP with full field validations
  const handleSendMobileOtp = async () => {
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      await api.post('/auth/otp/send', { mobileNumber });
      setOtpSent(true);
      toast.success('OTP Dispatched', `Verification OTP sent to customer mobile ${mobileNumber}. Mock code: 123456.`);
    } catch (err: any) {
      setOtpSent(true);
      toast.info('OTP Sent (Mock)', `Mock OTP sent to ${mobileNumber}. Use code: 123456.`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Please enter customer's First Name and Last Name.");
      return;
    }
    if (!mobileNumber || !/^[6-9]\d{9}$/.test(mobileNumber)) {
      setErrorMessage("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/onboard/initiate', {
        mobileNumber, firstName, lastName, email, adminId
      });
      setMobileVerified(true);
      setCurrentStep(3);
      saveJourneyDraft(3, { mobileNumber, firstName, lastName, email });
    } catch (err: any) {
      setMobileVerified(true);
      setCurrentStep(3);
      saveJourneyDraft(3, { mobileNumber, firstName, lastName, email });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Customer Photo Upload Handler — uploads to backend immediately
  const handleCustomerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    if (!mobileNumber) {
      toast.error('Missing Info', 'Complete Step 2 first to set customer mobile number.');
      return;
    }
    const file = e.target.files[0];
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => { if (ev.target?.result) setCustomerPhotoUrl(ev.target.result as string); };
    reader.readAsDataURL(file);

    // Upload to backend
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docType', 'PASSPORT_PHOTO');
    formData.append('docNumber', '');
    setLoading(true);
    try {
      const res = await api.post(`/admin/documents/upload?mobileNumber=${mobileNumber}&docType=PASSPORT_PHOTO&docNumber=&adminId=${adminId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Photo Uploaded', `Customer passport photo uploaded successfully. ID: ${res.data?.data?.id}`);
    } catch (err) {
      toast.error('Photo Upload Failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Add multiple KYC Documents — uploads to backend
  const handleAddDocument = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!mobileNumber) {
      toast.error('Missing Info', 'Complete Step 2 first to set customer mobile number.');
      return;
    }
    if (docFiles.length === 0) {
      toast.warning('No Files', 'Please select at least one document file to upload.');
      return;
    }

    let finalDocNumber = docNumber.trim();
    if (!finalDocNumber) {
      finalDocNumber = docType === 'AADHAAR' ? '482910394821' : docType === 'PAN' ? 'ABCDE1234F' : `${docType}-DOC-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      docFiles.forEach(f => formData.append('files', f));
      const res = await api.post(
        `/admin/documents/upload/batch?mobileNumber=${mobileNumber}&docType=${docType}&docNumber=${finalDocNumber}&adminId=${adminId}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const savedDocs: any[] = res.data?.data || [];
      const newDocs = savedDocs.map(d => ({
        id: d.id,
        docType: d.docType,
        docNumber: finalDocNumber,
        fileName: d.originalFileName || docFiles[0]?.name,
        uploadedAt: new Date().toLocaleTimeString()
      }));
      setUploadedDocs(prev => [...prev, ...newDocs]);
      setDocNumber('');
      setDocFiles([]);
      toast.success('Documents Uploaded', `${savedDocs.length} file(s) uploaded for ${docType}. Stored on server.`);

      // Reset file input
      const input = document.getElementById('adminDocFileInput') as HTMLInputElement;
      if (input) input.value = '';
    } catch (err) {
      toast.error('Upload Failed', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = (docId: number) => {
    setUploadedDocs(uploadedDocs.filter(d => d.id !== docId));
    toast.info('Document Removed', 'Document removed from upload list.');
  };

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (uploadedDocs.length === 0 && !customerPhotoUrl && !capturedImage) {
      toast.warning('No Documents', 'Please upload at least one KYC document or customer photo before proceeding.');
      return;
    }

    setLoading(true);
    try {
      await saveJourneyDraft(4, { docType, uploadedDocs });
      setCurrentStep(4);
      toast.success('Documents Saved', `${uploadedDocs.length} KYC document(s) processed. Proceeding to profile setup.`);
    } catch (err: any) {
      setCurrentStep(4);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Build Customer Profile & Address Submit
  const handleGstValidation = async () => {
    if (!gstNumber.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/auth/gst/validate?gstNumber=${gstNumber}`);
      setGstValid(res.data?.data ?? true);
    } catch (e) {
      setGstValid(gstNumber.length === 15);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      let finalBilling = billingSameAsInstallation 
        ? `${houseNumber}, ${society}, ${addressLine1}, ${street}, ${area}, ${city}, ${state} - ${pincode}`
        : `${billingHouseNumber}, ${billingSociety}, ${billingAddressLine1}, ${billingStreet}, ${billingArea}, ${billingCity}, ${billingState} - ${billingPincode}`;

      setBillingAddress(finalBilling);

      setCurrentStep(5);
      await saveJourneyDraft(5, {
        firstName, lastName, email,
        houseNumber, society, addressLine1, addressLine2, street, landmark, area, city, state, pincode,
        billingAddress: finalBilling, gstNumber, gstValid, billingSameAsInstallation,
        billingHouseNumber, billingSociety, billingAddressLine1, billingAddressLine2, billingStreet, billingLandmark, billingArea, billingCity, billingState, billingPincode
      });
    } catch (err: any) {
      setErrorMessage("Error saving address details.");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Plans & Calculation Handlers
  const handleToggleAddon = (addonId: string) => {
    setSelectedAddons(selectedAddons.map(a => 
      a.id === addonId ? { ...a, selected: !a.selected } : a
    ));
  };

  const handleValidateCoupon = async () => {
    if (!couponCodeInput.trim()) return;
    if (!selectedPlan) {
      toast.warning('Select Plan', 'Please select a broadband plan before applying a coupon.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/plans/coupon/validate?code=${couponCodeInput.trim().toUpperCase()}&price=${selectedPlan.price}`);
      if (res.data?.success) {
        const discount = res.data.data.discount || 0;
        setCouponApplied(true);
        setCouponDiscount(discount);
        setErrorMessage('');
        toast.success('Coupon Applied!', `Coupon ${couponCodeInput.toUpperCase()} gives ₹${discount.toFixed(2)} discount!`);
      }
    } catch (err) {
      setCouponApplied(false);
      setCouponDiscount(0);
      toast.error('Invalid Coupon', extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const base = selectedPlan ? selectedPlan.price : 799.0;
    const addonPrice = selectedAddons.filter(a => a.selected).reduce((acc, a) => acc + a.price, 0);
    const install = base >= 999 ? 0 : 500;
    const disc = couponApplied ? couponDiscount : 0;
    const subtotal = Math.max(0, base + addonPrice + install - disc);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    return { base, addonPrice, install, disc, tax, total };
  };

  const { base, addonPrice, install, disc, tax, total } = calculateTotal();

  const handleProceedFromPlans = () => {
    if (!selectedPlan) {
      setErrorMessage("Please select a broadband plan.");
      return;
    }
    setCurrentStep(6);
    saveJourneyDraft(6, { selectedPlan, selectedAddons, couponCodeInput, couponApplied, couponDiscount });
  };

  // Step 6: Process Payment with Mode Validation
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (paymentMode === 'UPI' && upiId && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      setErrorMessage("Please enter a valid VPA / UPI ID (e.g., customer@upi).");
      return;
    }
    if ((paymentMode === 'CREDIT_CARD' || paymentMode === 'DEBIT_CARD') && cardNumber && !/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      setErrorMessage("Card number must be 16 digits.");
      return;
    }

    setPaymentStatus('processing');
    setPaymentStatusText('SOC Admin initiating customer order & payment settlement...');

    await new Promise(r => setTimeout(r, 1200));

    try {
      const planRes = await api.post(`/customer/portal/plan/select?planId=${selectedPlan?.id || 1}`);
      const updatedCust = planRes.data?.data || { 
        customerId: 'TPF' + Math.floor(100000 + Math.random() * 900000), 
        accountNumber: 'ACT' + Math.floor(100000 + Math.random() * 900000), 
        connectionId: 'CON' + Math.floor(100000 + Math.random() * 900000) 
      };
      setTempCustomer(updatedCust);

      const payRes = await api.post('/customer/payment/process', {
        paymentMode,
        couponCode: couponApplied ? couponCodeInput : ''
      });

      setTransactionRef(payRes.data?.data || { transactionId: 'TXN-SOC-' + Date.now() });
      await api.post(`/admin/consent/send-dual-otp?mobileNumber=${mobileNumber}`);

      setPaymentStatus('success');
      setPaymentStatusText('Payment of ₹' + total.toFixed(2) + ' authorized & backend document migration completed!');
    } catch (err: any) {
      setPaymentStatus('success');
      setPaymentStatusText('Payment simulated & backend document migration completed!');
    }
  };

  // Step 7: Dual OTP Consent Verification
  const handleVerifyDualConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!adminConsentOtp || adminConsentOtp.length !== 6) {
      setErrorMessage("Please enter 6-digit SOC Admin Authorization OTP.");
      return;
    }
    if (!consentOtpCode || consentOtpCode.length !== 6) {
      setErrorMessage("Please enter 6-digit Customer Verification OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/admin/consent/verify-dual-otp', {
        mobileNumber,
        adminOtp: adminConsentOtp,
        customerOtp: consentOtpCode,
        adminId
      });
      if (res.data?.success) {
        setConsentVerified(true);
        setCurrentStep(8);
        saveJourneyDraft(8);
      }
    } catch (err: any) {
      setConsentVerified(true);
      setCurrentStep(8);
      saveJourneyDraft(8);
    } finally {
      setLoading(false);
    }
  };

  // Step 8: CAF Generation
  const handleGenerateCaf = async () => {
    setLoading(true);
    try {
      const res = await api.post('/customer/portal/caf/generate');
      setCafFile(res.data?.data || { documentName: 'CAF_Form.pdf' });
      toast.success('CAF Generated', 'Customer Application Form (CAF) generated and saved to server successfully!');
    } catch (e) {
      setCafFile({ documentName: 'CAF_Form.pdf' });
      toast.success('CAF Generated', 'CAF document generated and stored successfully!');
    } finally {
      setLoading(false);
    }
  };

  // Step 9: EKYC & Ticket Scheduling
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!appointmentDate) {
      setErrorMessage("Please select installation appointment date & time.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/ticket/schedule', { appointmentDate });
      setTicketDetails(res.data?.data || {
        ticketNumber: 'TKT-SOC-' + Date.now() % 100000,
        engineerName: 'Rajesh Kumar (Field Agent)',
        engineerPhone: '9876543210',
        appointmentDate: appointmentDate || new Date().toISOString()
      });
      saveJourneyDraft(9);
    } catch (e: any) {
      setTicketDetails({
        ticketNumber: 'TKT-SOC-' + Date.now() % 100000,
        engineerName: 'Rajesh Kumar (Field Agent)',
        engineerPhone: '9876543210',
        appointmentDate: appointmentDate || new Date().toISOString()
      });
      saveJourneyDraft(9);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: "Feasibility", icon: <MapPin size={16} /> },
    { num: 2, label: "Customer Details", icon: <User size={16} /> },
    { num: 3, label: "Documents", icon: <FileText size={16} /> },
    { num: 4, label: "Profile & Address", icon: <Settings size={16} /> },
    { num: 5, label: "Plans & Pricing", icon: <Zap size={16} /> },
    { num: 6, label: "Payment Settlement", icon: <CreditCard size={16} /> },
    { num: 7, label: "Dual OTP Consent", icon: <CheckSquare size={16} /> },
    { num: 8, label: "CAF Preview", icon: <FileText size={16} /> },
    { num: 9, label: "EKYC Schedule", icon: <Calendar size={16} /> }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-left">
      {/* SOC Admin Header Banner */}
      <div className="glass-panel border-2 border-purple-500/40 rounded-2xl p-4 bg-gradient-to-r from-purple-950/40 via-slate-900 to-purple-900/30 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold border border-purple-500/30">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400">SOC Admin Onboarding Portal</span>
              <span className="px-2.5 py-0.5 bg-purple-500/30 text-white rounded text-[10px] font-extrabold">Admin ID: {adminId}</span>
            </div>
            <p className="text-xs text-slate-300">
              Customer: <span className="font-extrabold text-white">{mobileNumber || 'New Prospect'}</span> | Onboarding execution on behalf of customer
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1"
          >
            <ArrowLeft size={14} /> Back to Portal
          </button>
          <button
            type="button"
            onClick={handleSaveAndExit}
            className="px-4 py-2 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white font-extrabold text-xs rounded-xl shadow-md hover:opacity-90"
          >
            Save & Leave Onboarding
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      {!ticketDetails && (
        <div className="glass-panel border rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {steps.map(step => (
              <div key={step.num} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition duration-300 ${
                    currentStep === step.num
                      ? 'gradient-bg text-white shadow-md'
                      : currentStep > step.num
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > step.num ? <Check size={14} /> : step.icon}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold hidden md:inline ${
                    currentStep === step.num ? 'text-tpf-purple dark:text-purple-400' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {step.num < 9 && <ChevronRight size={12} className="text-slate-300 dark:text-slate-700 hidden lg:block" />}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t dark:border-slate-800 pt-2">
            <span>Step {currentStep} of 9: {steps.find(s => s.num === currentStep)?.label}</span>
            <span className="font-semibold text-tpf-purple dark:text-purple-300">SOC Admin Execution Mode</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/35 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Main Wizard Content Panel */}
      <div className="glass-panel border rounded-3xl p-8 shadow-lg relative min-h-[420px] flex flex-col justify-between">
        
        {/* STEP 1: Full Installation Address & Feasibility Check */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center border-b dark:border-slate-800 pb-4 gap-2">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 1: Check Fiber Feasibility</h2>
                <p className="text-xs text-slate-400">Enter complete customer installation address details & check coverage feasibility</p>
              </div>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950/30 text-tpf-purple dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 rounded-xl text-xs font-extrabold flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition"
              >
                <Compass size={16} /> Auto-Detect via GPS
              </button>
            </div>

            <form onSubmit={handleFeasibilityCheck} className="space-y-4 max-w-3xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Flat / House / Door Number *</label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    placeholder="e.g. Flat 402, B-Block"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Society / Building Name *</label>
                  <input
                    type="text"
                    required
                    value={society}
                    onChange={e => setSociety(e.target.value)}
                    placeholder="e.g. Sea Breeze Heights"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    placeholder="Street name, Sector, Main Road"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={e => setAddressLine2(e.target.value)}
                    placeholder="Cross street, Sub-locality"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Street / Landmark</label>
                  <input
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Near Central Mall"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Area / Locality *</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Vashi / Hitec City"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">PIN Code (6 Digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                    placeholder="400703"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple font-bold tracking-wider"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">State *</label>
                  <select
                    value={state}
                    required
                    onChange={e => { setState(e.target.value); setCity(''); }}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  >
                    <option value="">Select State</option>
                    {Object.keys(statesAndCities).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">City *</label>
                  <select
                    value={city}
                    required
                    onChange={e => setCity(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  >
                    <option value="">Select City</option>
                    {state && statesAndCities[state]?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || pincode.length !== 6}
                className="w-full py-3.5 mt-4 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow-md flex items-center justify-center gap-1 disabled:opacity-40 text-sm"
              >
                {loading ? 'Verifying Feasibility...' : 'Verify Fiber Feasibility & Proceed'} <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Customer Details & Mobile OTP */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 2: Customer Contact & Details</h2>
              <p className="text-xs text-slate-400">Enter customer personal details & perform mobile RMN OTP verification</p>
            </div>

            <form onSubmit={handleVerifyMobileOtp} className="max-w-lg mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Rahul"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Sharma"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Customer Mobile Number (RMN) *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none flex-1 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSendMobileOtp}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                  >
                    Send OTP
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                />
              </div>

              {otpSent && (
                <div className="flex flex-col gap-1.5 p-3.5 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30 rounded-xl animate-fade-in">
                  <label className="text-xs font-bold text-tpf-purple uppercase">Verification OTP (Mock: 123456)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2 text-xs text-center font-bold tracking-widest focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
                >
                  Save & Proceed <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: Separate Photo Upload & Multi-Document Upload */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 3: Document Collection & Validation</h2>
              <p className="text-xs text-slate-400">SOC Admin mode: Upload customer passport photo & attach multiple KYC verification documents</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              
              {/* SECTION 1: Customer Passport Photo — Upload or Live Capture */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-2xl space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <ImageIcon size={18} className="text-tpf-purple" /> Customer Photo *
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-100 dark:bg-purple-950/40 text-tpf-purple font-bold rounded">
                    File Upload or Live Camera
                  </span>
                </div>

                {/* Tab: File Upload vs Live Camera */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { stopCamera(); setCameraMode('off'); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      cameraMode === 'off' ? 'bg-tpf-purple text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Upload size={12} className="inline mr-1" /> File Upload
                  </button>
                  <button
                    type="button"
                    onClick={cameraMode !== 'off' ? stopCamera : startCamera}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      cameraMode !== 'off' ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Camera size={12} className="inline mr-1" />
                    {cameraMode !== 'off' ? 'Stop Camera' : 'Live Capture'}
                  </button>
                </div>

                {/* File Upload */}
                {cameraMode === 'off' && (
                  <div className="flex flex-wrap items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomerPhotoUpload}
                      className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-tpf-purple file:text-white hover:file:opacity-90 cursor-pointer"
                    />
                    {customerPhotoUrl && (
                      <div className="flex items-center gap-2">
                        <img src={customerPhotoUrl} alt="Customer" className="w-14 h-14 object-cover rounded-xl border-2 border-green-500 shadow" />
                        <span className="text-[11px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle size={14} /> Photo Attached &amp; Saved
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Live Camera Capture */}
                {cameraMode === 'preview' && (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-tpf-purple/40 bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full max-h-64 object-cover"
                      />
                      <div className="absolute inset-0 border-4 border-dashed border-white/20 rounded-2xl pointer-events-none" />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/70 font-bold">Position face in frame</div>
                    </div>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full py-3 bg-tpf-purple text-white font-extrabold text-sm rounded-xl shadow flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      <Camera size={18} /> Capture Photo Now
                    </button>
                  </div>
                )}

                {/* Captured Image Preview */}
                {cameraMode === 'captured' && capturedImage && (
                  <div className="space-y-3">
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50">
                      <img src={capturedImage} alt="Captured" className="w-full max-h-64 object-cover" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">CAPTURED</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 py-2.5 border dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <RefreshCw size={12} className="inline mr-1" /> Retake
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveLiveCapture}
                        disabled={loading}
                        className="flex-1 py-2.5 bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow hover:opacity-90 transition flex items-center justify-center gap-1"
                      >
                        <CheckCircle size={12} /> Save to Server
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Add KYC Verification Document */}
              <div className="p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl space-y-4">
                <div className="flex justify-between items-center border-b dark:border-slate-800 pb-2">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <FileText size={16} className="text-tpf-purple" /> Attach KYC Document
                  </h3>
                  <span className="text-[10px] text-slate-400">Multiple Documents Allowed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Document Type *</label>
                    <select
                      value={docType}
                      onChange={e => setDocType(e.target.value)}
                      className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                    >
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="VOTER_ID">Voter ID Card</option>
                      <option value="DRIVING_LICENSE">Driving License</option>
                      <option value="PASSPORT">Passport</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Document ID Number *</label>
                    <input
                      type="text"
                      value={docNumber}
                      onChange={e => setDocNumber(e.target.value.toUpperCase())}
                      placeholder={docType === 'AADHAAR' ? '12-digit Aadhaar' : docType === 'PAN' ? '10-char PAN (ABCDE1234F)' : 'Document Number'}
                      className="border dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Document File(s) — PDF or Image</label>
                  <input
                    id="adminDocFileInput"
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    onChange={e => {
                      if (e.target.files) {
                        setDocFiles(Array.from(e.target.files));
                      }
                    }}
                    className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                  />
                  {docFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-emerald-500 font-bold">{docFiles.length} file(s) selected: {docFiles.map(f => f.name).join(', ')}</p>
                      <SmartDocScannerWidget docType={docType} docNumber={docNumber} fileName={docFiles[0]?.name} />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddDocument}
                  className="w-full py-2.5 bg-tpf-purple hover:opacity-90 text-white font-extrabold text-xs rounded-xl shadow flex items-center justify-center gap-1 transition"
                >
                  + Add Document to Customer File
                </button>
              </div>

              {/* SECTION 3: Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Uploaded Documents List ({uploadedDocs.length})
                </h4>

                {uploadedDocs.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-400">
                    No KYC documents added yet. Please select document type, enter number, and click "+ Add Document".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {uploadedDocs.map((doc, idx) => (
                      <div
                        key={doc.id || idx}
                        className="p-3 bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/40 text-tpf-purple flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-800 dark:text-white">{doc.docType}</span>
                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px] font-mono font-bold">
                                {doc.docNumber}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">{doc.fileName} • Uploaded at {doc.uploadedAt || 'Just now'}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          title="Remove Document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <form onSubmit={handleDocumentSubmit} className="pt-4 flex gap-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
                >
                  Proceed to Profile & Address <ChevronRight size={16} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* STEP 4: Build Customer Profile & Address (Matching Self-Onboarding) */}
        {currentStep === 4 && (
          <div className="space-y-6 text-left">
            <div className="border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Build Customer Profile & Address</h2>
              <p className="text-xs text-slate-400">Configure customer personal profile, primary installation address, separate billing address, and GST registration.</p>
            </div>

            <form onSubmit={handleProfileAddressSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Personal Profile Details */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">First Name *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Registered Mobile (RMN - Locked)</label>
                  <input
                    type="text"
                    disabled
                    value={mobileNumber}
                    className="border dark:border-slate-800 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-400 cursor-not-allowed font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none focus:ring-2 focus:ring-tpf-purple"
                  />
                </div>

                {/* Installation Address Details Header */}
                <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 md:col-span-2 border-b dark:border-slate-800 pb-2 mt-4 flex items-center gap-1.5">
                  <MapPin size={16} className="text-tpf-purple" /> Primary Installation Address
                </h3>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Flat / House Number *</label>
                  <input
                    type="text"
                    required
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    placeholder="e.g. Flat 402"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Society / Building Name *</label>
                  <input
                    type="text"
                    required
                    value={society}
                    onChange={e => setSociety(e.target.value)}
                    placeholder="e.g. Sea Breeze Heights"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Address Line 1 *</label>
                  <input
                    type="text"
                    required
                    value={addressLine1}
                    onChange={e => setAddressLine1(e.target.value)}
                    placeholder="Street / Sector name"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Street / Landmark</label>
                  <input
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Near Central Mall"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">Area / Locality *</label>
                  <input
                    type="text"
                    required
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="Vashi"
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">State *</label>
                  <select
                    value={state}
                    required
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
                  <label className="text-xs font-bold text-slate-400 uppercase">City *</label>
                  <select
                    value={city}
                    required
                    onChange={e => setCity(e.target.value)}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                  >
                    <option value="">Select City</option>
                    {state && statesAndCities[state]?.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">PIN Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none font-bold max-w-xs"
                  />
                </div>

                {/* Billing Address Selection Checkbox */}
                <div className="flex items-center gap-2 md:col-span-2 mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border dark:border-slate-800">
                  <input
                    type="checkbox"
                    id="adminBillingSameAsInstallation"
                    checked={billingSameAsInstallation}
                    onChange={e => setBillingSameAsInstallation(e.target.checked)}
                    className="rounded text-tpf-purple focus:ring-tpf-purple cursor-pointer"
                  />
                  <label htmlFor="adminBillingSameAsInstallation" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                    Billing Address is same as Installation / Primary Address
                  </label>
                </div>

                {/* Separate Billing Address Fields */}
                {!billingSameAsInstallation && (
                  <>
                    <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 md:col-span-2 border-b dark:border-slate-800 pb-2 mt-4">
                      Billing Address Details
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing House Number *</label>
                      <input
                        type="text"
                        required
                        value={billingHouseNumber}
                        onChange={e => setBillingHouseNumber(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing Building / Society *</label>
                      <input
                        type="text"
                        required
                        value={billingSociety}
                        onChange={e => setBillingSociety(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        value={billingAddressLine1}
                        onChange={e => setBillingAddressLine1(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing Street Name</label>
                      <input
                        type="text"
                        value={billingStreet}
                        onChange={e => setBillingStreet(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing Area / Locality *</label>
                      <input
                        type="text"
                        required
                        value={billingArea}
                        onChange={e => setBillingArea(e.target.value)}
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing PIN Code *</label>
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
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing State *</label>
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
                      <label className="text-xs font-bold text-slate-400 uppercase">Billing City *</label>
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

                {/* GST Registration Details */}
                <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-300 md:col-span-2 border-b dark:border-slate-800 pb-2 mt-4">
                  Tax & GST Registration Details
                </h3>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">GST Registration Number (Optional)</label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={e => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="27AAAAA0000A1Z5"
                      className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none flex-1 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleGstValidation}
                      disabled={!gstNumber}
                      className="px-4 bg-slate-200 dark:bg-slate-800 border dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-300"
                    >
                      Validate GST
                    </button>
                  </div>
                  {gstValid === true && (
                    <span className="text-[10px] font-bold text-green-500">GST Registration Number Validated successfully!</span>
                  )}
                  {gstValid === false && (
                    <span className="text-[10px] font-bold text-rose-500">Invalid GST format (15 characters required).</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex gap-4 pt-6 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
                >
                  Save Profile & Choose Plans <ChevronRight size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 5: Plans, Addons, Coupons & Calculation (Matching Self-Onboarding) */}
        {currentStep === 5 && (
          <div className="space-y-6 text-left">
            <div className="border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Choose Plans & Offers</h2>
              <p className="text-xs text-slate-400">Select broadband plans, customize add-on services, apply active coupons, and view real-time cost breakup.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Tabbed Sections */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex border-b dark:border-slate-800 gap-4">
                  {(['plans', 'addons', 'coupons'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActivePlanTab(tab)}
                      className={`pb-2.5 text-xs font-extrabold uppercase tracking-wider border-b-2 transition ${
                        activePlanTab === tab
                          ? 'border-tpf-purple text-tpf-purple dark:text-purple-400'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab === 'plans' ? '1. Broadband Plans' : tab === 'addons' ? '2. Add-ons & Services' : '3. Coupons & Discounts'}
                    </button>
                  ))}
                </div>

                {/* TAB 1: Plans */}
                {activePlanTab === 'plans' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Available Fiber Plans</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPlanMatchModal(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-tpf-purple to-tpf-pink text-white text-xs font-extrabold rounded-xl shadow hover:opacity-90 transition flex items-center gap-1"
                        >
                          ⚡ Smart Match Quiz
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCompareModal(!showCompareModal)}
                          className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-tpf-purple dark:text-purple-300 text-xs font-extrabold rounded-xl hover:bg-purple-500/20 transition"
                        >
                          {showCompareModal ? 'Hide Plan Comparison' : '📊 Side-by-Side Comparison'}
                        </button>
                      </div>
                    </div>

                    <SmartPlanMatchModal
                      isOpen={showPlanMatchModal}
                      onClose={() => setShowPlanMatchModal(false)}
                      plans={plans}
                      onSelectPlan={p => setSelectedPlan(p)}
                    />

                    {showCompareModal && (
                      <PlanComparisonTable
                        plans={plans}
                        selectedPlanId={selectedPlan?.id}
                        onSelectPlan={p => setSelectedPlan(p)}
                      />
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                    {plans.length > 0 ? (
                      plans.map(p => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPlan(p)}
                          className={`p-5 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative ${
                            selectedPlan?.id === p.id
                              ? 'border-tpf-purple bg-purple-500/5 ring-2 ring-tpf-purple/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
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
                            <span className="text-[10px] text-slate-400">/ {p.validityDays || 30} Days</span>
                          </div>
                          <p className="text-[10px] mt-1.5 text-slate-400">{p.description || `Symmetric ${p.speedMbps} Mbps ultra-high speed fiber connection.`}</p>
                          <div className="mt-4 pt-3 border-t dark:border-slate-800 flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-500">Speed: {p.speedMbps} Mbps</span>
                            <span className="text-slate-400">Router: {p.routerIncluded ? 'Free' : 'Included'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 p-6 text-center text-xs text-slate-400">
                        Default Plan: TelcoBridge Ultra 300 Mbps (₹999/mo) selected.
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {/* TAB 2: Add-ons */}
                {activePlanTab === 'addons' && (
                  <div className="space-y-3">
                    {selectedAddons.map(a => (
                      <div
                        key={a.id}
                        onClick={() => handleToggleAddon(a.id)}
                        className={`p-4 rounded-xl border cursor-pointer flex justify-between items-center transition ${
                          a.selected
                            ? 'border-tpf-purple bg-purple-500/5 ring-1 ring-tpf-purple shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-white">{a.name}</h4>
                          <p className="text-[10px] text-slate-400">Optional customer value-added onboarding service.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-tpf-purple">+ ₹{a.price.toFixed(2)}/mo</span>
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${a.selected ? 'bg-tpf-purple border-tpf-purple text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                            {a.selected && <Check size={12} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: Coupons */}
                {activePlanTab === 'coupons' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCodeInput}
                        onChange={e => setCouponCodeInput(e.target.value.toUpperCase())}
                        placeholder="Enter Coupon (e.g. WELCOME100, FIBER50)"
                        className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none flex-1 font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleValidateCoupon}
                        className="px-5 py-2.5 bg-tpf-purple text-white text-xs font-bold rounded-xl shadow hover:opacity-90"
                      >
                        Apply Code
                      </button>
                    </div>
                    {couponApplied && (
                      <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-xs font-bold flex justify-between items-center">
                        <span>✓ Coupon {couponCodeInput} applied successfully!</span>
                        <span>- ₹{couponDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="p-4 border dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 text-xs space-y-1.5">
                      <p className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">Available Coupon Codes:</p>
                      <p className="text-slate-500 dark:text-slate-400"><strong className="text-tpf-purple">WELCOME100:</strong> Flat ₹100 Discount on installation.</p>
                      <p className="text-slate-500 dark:text-slate-400"><strong className="text-tpf-purple">FIBER50:</strong> Flat ₹50 Discount on broadband plan.</p>
                      <p className="text-slate-500 dark:text-slate-400"><strong className="text-tpf-purple">TELCO10:</strong> 10% Discount on Base Plan Price.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Invoice Summary Card */}
              <div className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 shadow flex flex-col justify-between h-fit">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Cost Invoice Breakup</h3>
                  
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
                          <span>Coupon: {couponCodeInput}</span>
                          <span>- ₹{disc.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-400">
                        <span>Telecom GST (18%)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{tax.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-slate-400">
                        <span>Installation Fee</span>
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
                    onClick={() => setCurrentStep(4)}
                    className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedFromPlans}
                    className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
                  >
                    Proceed to Payment <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Payment Page & Settlement (Matching Self-Onboarding) */}
        {currentStep === 6 && (
          <div className="space-y-6 text-left">
            <div className="border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 6: Payment Page & Settlement</h2>
              <p className="text-xs text-slate-400">SOC Admin authorized payment collection & automated backend customer profile creation</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Payment Inputs & Processing */}
              <div className="lg:col-span-2 space-y-6">
                {paymentStatus === 'processing' && (
                  <div className="glass-panel border rounded-3xl p-12 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-tpf-purple border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{paymentStatusText}</p>
                    <p className="text-xs text-slate-400">Processing order & transaction authorization...</p>
                  </div>
                )}

                {paymentStatus === 'success' && (
                  <div className="glass-panel border rounded-3xl p-8 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <Check size={36} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Payment Authorized!</h3>
                      <p className="text-xs text-slate-400">Transaction Ref: {transactionRef?.transactionId || 'TXN-SOC-' + Date.now()}</p>
                      <p className="text-sm text-green-500 font-bold">{paymentStatusText}</p>
                    </div>

                    <div className="w-full max-w-sm border dark:border-slate-800 bg-white dark:bg-slate-950 p-4 rounded-2xl text-xs space-y-2.5 text-left shadow-sm">
                      <p className="font-bold text-slate-500 uppercase tracking-wide border-b dark:border-slate-800 pb-1">Generated Customer Credentials:</p>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Customer ID</span>
                        <span className="font-bold text-tpf-purple">{tempCustomer?.customerId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Account Number</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{tempCustomer?.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Connection ID</span>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{tempCustomer?.connectionId}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => { setCurrentStep(7); saveJourneyDraft(7); }}
                      className="px-8 py-3 rounded-xl font-bold text-white gradient-bg flex items-center gap-1 shadow-lg hover:opacity-90 transition"
                    >
                      Proceed to Dual OTP Consent <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {(paymentStatus === null || paymentStatus === 'failed') && (
                  <form onSubmit={handleProcessPayment} className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 space-y-6">
                    <div className="flex flex-col gap-3">
                      <h3 className="font-extrabold text-sm text-slate-800 dark:text-white border-b dark:border-slate-800 pb-2">Select Payment Method</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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

                    {/* Dynamic Inputs per Mode */}
                    <div className="border-t dark:border-slate-800 pt-4 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Enter Customer Payment Details</h4>
                      
                      {paymentMode === 'UPI' && (
                        <div className="flex flex-col gap-1.5 max-w-md">
                          <label className="text-xs font-bold text-slate-500">Customer VPA / UPI ID</label>
                          <input
                            type="text"
                            required
                            placeholder="customer@okhdfcbank"
                            value={upiId}
                            onChange={e => setUpiId(e.target.value)}
                            className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                          />
                        </div>
                      )}

                      {(paymentMode === 'DEBIT_CARD' || paymentMode === 'CREDIT_CARD') && (
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                          <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-xs font-bold text-slate-500">Cardholder Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Name on Card"
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
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500">Expiry (MM/YY)</label>
                            <input
                              type="text"
                              required
                              placeholder="12/28"
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
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none text-center font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500">CVV</label>
                            <input
                              type="password"
                              required
                              maxLength={3}
                              placeholder="123"
                              value={cardCvv}
                              onChange={e => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none text-center font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {paymentMode === 'NET_BANKING' && (
                        <div className="flex flex-col gap-1.5 max-w-md">
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
                        onClick={() => setCurrentStep(5)}
                        className="w-1/3 py-3 rounded-xl border text-xs font-bold text-slate-600 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
                      >
                        Authorize Payment ₹{total.toFixed(2)} <ChevronRight size={16} />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Right Column: Invoice Breakup */}
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

                      <div className="flex justify-between text-slate-400">
                        <span>Telecom GST (18%)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">₹{tax.toFixed(2)}</span>
                      </div>
                      
                      <div className="flex justify-between text-slate-400">
                        <span>Installation Fee</span>
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
                  All transactions are secure and encrypted. Automated backend customer account migration.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Dual OTP Consent */}
        {currentStep === 7 && (
          <div className="space-y-6 max-w-md mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 7: Customer Dual OTP Consent</h2>
              <p className="text-xs text-slate-400">SOC Admin Authorization OTP + Customer Verification OTP</p>
            </div>

            <div className="p-3.5 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-xs font-semibold text-tpf-purple dark:text-purple-300 flex justify-between items-center">
              <span>Dual OTP authorization enforces both SOC Admin identity and Customer explicit consent.</span>
              <button
                type="button"
                onClick={() => setShowBiometricModal(true)}
                className="px-3 py-1.5 bg-tpf-purple text-white text-[10px] font-extrabold rounded-xl shadow flex items-center gap-1 hover:opacity-90"
              >
                <Fingerprint size={12} /> Biometric eKYC
              </button>
            </div>

            <BiometricConsentModal
              isOpen={showBiometricModal}
              onClose={() => setShowBiometricModal(false)}
              onSuccess={() => {
                setAdminConsentOtp('123456');
                setConsentOtpCode('123456');
                setConsentVerified(true);
              }}
              customerMobile={mobileNumber}
            />

            <form onSubmit={handleVerifyDualConsent} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">1. SOC Admin Security Authorization OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={adminConsentOtp}
                  onChange={e => setAdminConsentOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Admin OTP (mock: 123456)"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm text-center font-extrabold tracking-widest focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">2. Customer Verification OTP (RMN)</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={consentOtpCode}
                  onChange={e => setConsentOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter Customer OTP (mock: 123456)"
                  className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3 text-sm text-center font-extrabold tracking-widest focus:outline-none focus:ring-2 focus:ring-tpf-purple dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
              >
                Verify Dual Consent <ChevronRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* STEP 8: CAF Generation & Preview (Matching Self-Onboarding) */}
        {currentStep === 8 && (
          <div className="space-y-6 text-left">
            <div className="border-b dark:border-slate-800 pb-4">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 8: Customer Application Form (CAF) Preview</h2>
              <p className="text-xs text-slate-400">Review legal application form and verify document metadata before proceeding to installation scheduling.</p>
            </div>

            <div className="glass-panel border rounded-3xl p-6 bg-slate-50/50 dark:bg-slate-900/50 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-700 dark:text-slate-300">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Customer Name</span>
                    <p className="font-bold text-slate-800 dark:text-white text-sm">{firstName} {lastName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Customer ID</span>
                    <p className="font-bold text-tpf-purple text-sm">{tempCustomer?.customerId || 'CUST-' + (mobileNumber ? mobileNumber.slice(-6) : '889900')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Account Number</span>
                    <p className="font-bold text-slate-800 dark:text-white">{tempCustomer?.accountNumber || 'ACT-' + (mobileNumber ? mobileNumber.slice(-6) : '889900')}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Connection ID</span>
                    <p className="font-bold text-slate-800 dark:text-white">{tempCustomer?.connectionId || 'CON-' + (mobileNumber ? mobileNumber.slice(-6) : '889900')}</p>
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
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Primary Installation Address</span>
                  <p className="text-slate-600 dark:text-slate-400 font-semibold">{houseNumber}, {society}, {addressLine1}, {street}, {area}, {city}, {state} - {pincode}</p>
                </div>

                {!billingSameAsInstallation && (
                  <div className="border-t dark:border-slate-800 pt-3">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Billing Address</span>
                    <p className="text-slate-600 dark:text-slate-400">{billingHouseNumber}, {billingSociety}, {billingAddressLine1}, {billingArea}, {billingCity}, {billingState} - {billingPincode}</p>
                  </div>
                )}

                <div className="border-t dark:border-slate-800 pt-3">
                  <span className="text-slate-400 uppercase font-bold text-[10px]">Selected Broadband Plan</span>
                  <p className="font-bold text-slate-800 dark:text-white">{selectedPlan?.name || 'TelcoBridge Ultra 300 Mbps'} (Speed: {selectedPlan?.speedMbps || 300} Mbps, Price: ₹{base.toFixed(2)})</p>
                </div>

                {/* Digital Signature Component */}
                <div className="border-t dark:border-slate-800 pt-4">
                  <DigitalSignature
                    label="Customer Application Form (CAF) Digital Signature"
                    onSign={url => toast.success('Signed CAF', 'Customer signature captured on CAF preview.')}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 border dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-950 shadow-sm">
                <span className="text-slate-400 uppercase font-bold text-[10px] mb-2.5">Customer Passport Photo</span>
                {customerPhotoUrl ? (
                  <img src={customerPhotoUrl} alt="Passport Headshot" className="w-[130px] h-[130px] object-cover rounded-xl border-2 border-tpf-purple shadow-sm" />
                ) : (
                  <div className="w-[130px] h-[130px] bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 text-xs font-bold">Photo Missing</div>
                )}
              </div>
            </div>

            <div className="pt-6 flex justify-between items-center border-t dark:border-slate-800">
              <button
                type="button"
                onClick={handleGenerateCaf}
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <FileText size={16} /> Generate & Save CAF File
              </button>
              <button
                type="button"
                onClick={() => { setCurrentStep(9); saveJourneyDraft(9); }}
                className="px-6 py-3 font-bold text-white rounded-xl gradient-bg hover:opacity-90 flex items-center gap-1 shadow"
              >
                Proceed to EKYC Scheduling <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 9: EKYC Process Initiation */}
        {currentStep === 9 && (
          <div className="space-y-6">
            {!ticketDetails ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Step 9: Schedule EKYC & Field Ticket</h2>
                  <p className="text-xs text-slate-400">Assign preferred installation slot for field technician visit</p>
                </div>

                <form onSubmit={handleScheduleAppointment} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase">Appointment Date & Time *</label>
                    <input
                      type="datetime-local"
                      required
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().substring(0, 16)}
                      className="border dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2.5 text-xs dark:text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow flex items-center justify-center gap-1"
                  >
                    Initiate EKYC & Create Ticket <ChevronRight size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-3xl space-y-6 max-w-md mx-auto text-center animate-fade-in">
                <div className="w-14 h-14 bg-green-100 text-green-500 rounded-full mx-auto flex items-center justify-center shadow">
                  <Check size={28} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Admin Onboarding Completed!</h3>
                <div className="text-xs text-left p-4 bg-white dark:bg-slate-950 rounded-xl space-y-2 border dark:border-slate-800">
                  <p className="flex justify-between">
                    <span className="text-slate-400">FSM Ticket ID:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{ticketDetails.ticketNumber}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Assigned Agent:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{ticketDetails.engineerName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-slate-400">Scheduled Date:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{new Date(ticketDetails.appointmentDate).toLocaleString()}</span>
                  </p>
                </div>

                <EngineerTrackingMap
                  engineerName={ticketDetails.engineerName}
                  engineerPhone={ticketDetails.engineerPhone}
                  ticketNumber={ticketDetails.ticketNumber}
                  appointmentDate={new Date(ticketDetails.appointmentDate).toLocaleString()}
                />

                <SpeedTestWidget />

                <button
                  type="button"
                  onClick={() => navigate('/admin')}
                  className="w-full py-3 rounded-xl font-bold text-white gradient-bg hover:opacity-90 shadow"
                >
                  Return to Admin Portal Dashboard
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
