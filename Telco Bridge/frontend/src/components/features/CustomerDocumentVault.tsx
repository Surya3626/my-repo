import React, { useState } from 'react';
import { 
  FileText, Download, Eye, ShieldCheck, CheckCircle2, Upload, 
  Search, Filter, Sparkles, Clock, Lock, FileCheck, Printer, X, 
  Folder, UserCheck, RefreshCw, Zap, ArrowDownToLine, ExternalLink,
  Building, CheckSquare, FileSpreadsheet, ShieldAlert
} from 'lucide-react';
import { useToast } from '../common/Toast';

export interface DocumentItem {
  id: string;
  title: string;
  category: 'UPLOADED_KYC' | 'SYSTEM_GENERATED';
  type: 'PDF' | 'PNG' | 'JPG';
  size: string;
  date: string;
  status: 'VERIFIED' | 'APPROVED' | 'PENDING';
  serialNo?: string;
  description: string;
  previewType: 'IDENTITY' | 'SELFIE' | 'SIGNATURE' | 'CAF' | 'INVOICE' | 'AGREEMENT' | 'CERTIFICATE';
}

interface CustomerDocumentVaultProps {
  customer: any;
  dashboardData?: any;
}

export const CustomerDocumentVault: React.FC<CustomerDocumentVaultProps> = ({ customer, dashboardData }) => {
  const { toast } = useToast();

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'UPLOADED_KYC' | 'SYSTEM_GENERATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<DocumentItem | null>(null);

  // New Upload state
  const [newDocType, setNewDocType] = useState('ELECTRICITY_BILL');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initial Document List
  const [documents, setDocuments] = useState<DocumentItem[]>([
    {
      id: 'doc-001',
      title: 'Aadhaar Identity Card (Front & Back)',
      category: 'UPLOADED_KYC',
      type: 'PDF',
      size: '1.8 MB',
      date: '2026-07-20',
      status: 'VERIFIED',
      serialNo: 'UIDAI-XXXX-8821',
      description: 'Official UIDAI Aadhaar photo ID uploaded during E-KYC onboarding.',
      previewType: 'IDENTITY'
    },
    {
      id: 'doc-002',
      title: 'PAN Card Tax Verification Record',
      category: 'UPLOADED_KYC',
      type: 'JPG',
      size: '940 KB',
      date: '2026-07-20',
      status: 'VERIFIED',
      serialNo: 'PAN-ABCDE1234F',
      description: 'Income Tax Department PAN card proof for billing identity verification.',
      previewType: 'IDENTITY'
    },
    {
      id: 'doc-003',
      title: 'Subscriber Liveness Bio Selfie',
      category: 'UPLOADED_KYC',
      type: 'PNG',
      size: '1.2 MB',
      date: '2026-07-20',
      status: 'VERIFIED',
      serialNo: 'BIO-SELFIE-2026',
      description: 'Live camera biometric liveness selfie captured during online registration.',
      previewType: 'SELFIE'
    },
    {
      id: 'doc-004',
      title: 'Captured Digital E-Signature',
      category: 'UPLOADED_KYC',
      type: 'PNG',
      size: '420 KB',
      date: '2026-07-20',
      status: 'VERIFIED',
      serialNo: 'ESIGN-HASH-8891',
      description: 'Digital touchscreen signature used to seal legal disclosures and SLA terms.',
      previewType: 'SIGNATURE'
    },
    {
      id: 'doc-005',
      title: 'Premises Ownership / Utility Bill Proof',
      category: 'UPLOADED_KYC',
      type: 'PDF',
      size: '2.1 MB',
      date: '2026-07-20',
      status: 'VERIFIED',
      serialNo: 'UTIL-ELEC-3800',
      description: 'Electricity connection bill verifying optical fiber installation address.',
      previewType: 'IDENTITY'
    },
    {
      id: 'doc-006',
      title: 'TRAI Sealed Customer Application Form (CAF)',
      category: 'SYSTEM_GENERATED',
      type: 'PDF',
      size: '3.4 MB',
      date: '2026-07-21',
      status: 'APPROVED',
      serialNo: 'TPF-CAF-2026-88412',
      description: 'Official TRAI & DoT Master Customer Application Form sealed with digital signatures.',
      previewType: 'CAF'
    },
    {
      id: 'doc-007',
      title: 'Broadband Service Agreement & SLA Contract',
      category: 'SYSTEM_GENERATED',
      type: 'PDF',
      size: '2.6 MB',
      date: '2026-07-21',
      status: 'APPROVED',
      serialNo: 'TPF-SLA-99201',
      description: 'Legal subscriber agreement guaranteeing 99.98% SLA uptime & 24/7 priority support.',
      previewType: 'AGREEMENT'
    },
    {
      id: 'doc-008',
      title: 'Plan Subscription Invoice & Tax Receipt',
      category: 'SYSTEM_GENERATED',
      type: 'PDF',
      size: '1.5 MB',
      date: '2026-07-21',
      status: 'APPROVED',
      serialNo: 'INV-2026-8812',
      description: 'GST compliant tax invoice for broadband subscription payment.',
      previewType: 'INVOICE'
    },
    {
      id: 'doc-009',
      title: 'DoT & TRAI E-KYC Compliance Certificate',
      category: 'SYSTEM_GENERATED',
      type: 'PDF',
      size: '1.9 MB',
      date: '2026-07-21',
      status: 'APPROVED',
      serialNo: 'EKYC-CERT-2026',
      description: 'Regulatory certificate validating digital biometrics and liveness identity.',
      previewType: 'CERTIFICATE'
    },
    {
      id: 'doc-010',
      title: 'Welcome Kit & Router Configuration Guide',
      category: 'SYSTEM_GENERATED',
      type: 'PDF',
      size: '1.1 MB',
      date: '2026-07-21',
      status: 'APPROVED',
      serialNo: 'WELCOME-KIT-TPF',
      description: 'Welcome document detailing Wi-Fi 6 router setup, SSIDs, and self-care features.',
      previewType: 'CERTIFICATE'
    }
  ]);

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = activeCategory === 'ALL' || doc.category === activeCategory;
    const matchesQuery = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.serialNo && doc.serialNo.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  const uploadedCount = documents.filter(d => d.category === 'UPLOADED_KYC').length;
  const generatedCount = documents.filter(d => d.category === 'SYSTEM_GENERATED').length;

  // Handle Download Action
  const handleDownloadDoc = (doc: DocumentItem) => {
    toast.info("Downloading Document", `Preparing ${doc.title} (${doc.type}) for download...`);

    // Create a dummy text content blob to trigger real browser file download
    const content = `TelcoBridge Fiber Broadband Official Document
------------------------------------------------------
Document Title: ${doc.title}
Serial / Reference: ${doc.serialNo || 'N/A'}
Category: ${doc.category}
Verification Status: ${doc.status}
Subscriber Name: ${customer?.firstName || 'Subscriber'} ${customer?.lastName || ''}
Customer ID: ${customer?.customerId || 'TPF-CUST-99201'}
Account Number: ${customer?.accountNumber || 'ACC-2026-8812'}
Issue Date: ${doc.date}
Security Hash: SHA256-${(doc.id + '-' + doc.title + '-SEALED-2026').toUpperCase()}

Description:
${doc.description}

Official Seal: TelcoBridge Telecom GIS & Compliance Vault
`;

    const blob = new Blob([content], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '_')}_${doc.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      toast.success("Download Complete", `${doc.title} downloaded successfully.`);
    }, 800);
  };

  // Handle New File Upload
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.warning("File Required", "Please select a document file to upload.");
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const newDoc: DocumentItem = {
        id: `doc-${Date.now().toString().slice(-4)}`,
        title: `${newDocType.replace('_', ' ')} (${uploadFile.name})`,
        category: 'UPLOADED_KYC',
        type: uploadFile.name.endsWith('.png') ? 'PNG' : uploadFile.name.endsWith('.jpg') || uploadFile.name.endsWith('.jpeg') ? 'JPG' : 'PDF',
        size: `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`,
        date: new Date().toISOString().split('T')[0],
        status: 'VERIFIED',
        serialNo: `DOC-${Math.floor(Math.random() * 90000 + 10000)}`,
        description: `Customer uploaded supplementary document (${uploadFile.name}).`,
        previewType: 'IDENTITY'
      };

      setDocuments(prev => [newDoc, ...prev]);
      setUploadFile(null);
      setIsUploading(false);
      toast.success("Document Uploaded!", `${newDoc.title} added to your secure vault.`);
    }, 1000);
  };

  return (
    <div className="space-y-8 text-left animate-fade-in">
      
      {/* Top Banner & Vault Summary */}
      <div className="clay-card p-6 md:p-8 space-y-6 border-2 border-purple-500/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Customer Document Vault & Archival</h2>
              <span className="clay-badge-purple px-3 py-1 text-xs font-black uppercase tracking-wider shrink-0">
                256-BIT ENCRYPTED
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Access all your uploaded KYC identity proofs and official system-generated TRAI telecom agreements.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center">
              <span className="text-xs text-slate-400 font-bold block uppercase">Total Documents</span>
              <span className="text-xl font-black text-purple-600 dark:text-purple-400">{documents.length}</span>
            </div>
          </div>
        </div>

        {/* Category Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Folder size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">All Vault Files</span>
                <span className="text-[10px] text-slate-400 font-medium">Uploaded + Generated</span>
              </div>
            </div>
            <span className="text-lg font-black text-slate-900 dark:text-white">{documents.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">Uploaded KYC Proofs</span>
                <span className="text-[10px] text-slate-400 font-medium">Identity & Biometrics</span>
              </div>
            </div>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{uploadedCount}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                <FileCheck size={20} />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 dark:text-white block">System Generated</span>
                <span className="text-[10px] text-slate-400 font-medium">CAF, Agreements & Invoices</span>
              </div>
            </div>
            <span className="text-lg font-black text-pink-600 dark:text-pink-400">{generatedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Live Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Category Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
          {[
            { id: 'ALL', label: `All Files (${documents.length})` },
            { id: 'UPLOADED_KYC', label: `Uploaded (${uploadedCount})` },
            { id: 'SYSTEM_GENERATED', label: `Generated (${generatedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id as any)}
              className={`py-2.5 px-4 font-black text-xs transition rounded-xl ${
                activeCategory === tab.id
                  ? 'clay-pill-active scale-102 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by Document Name or Ref No..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-extrabold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 shadow-sm"
          />
          {searchQuery && (
            <button 
              type="button" 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold"
            >
              <X size={14} />
            </button>
          )}
        </div>

      </div>

      {/* Document Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {filteredDocs.map((doc) => (
          <div 
            key={doc.id}
            className="clay-card p-5 space-y-4 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition group relative overflow-hidden"
          >
            {/* Header Tag Bar */}
            <div className="flex justify-between items-center text-xs">
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                doc.category === 'UPLOADED_KYC'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
              }`}>
                {doc.category === 'UPLOADED_KYC' ? 'Uploaded KYC Document' : 'System Generated Record'}
              </span>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono text-[9px] font-extrabold rounded text-slate-600 dark:text-slate-300">
                  {doc.type} • {doc.size}
                </span>
                <span className="clay-badge-emerald px-2 py-0.5 text-[9px] font-black uppercase flex items-center gap-1">
                  <CheckCircle2 size={10} /> {doc.status}
                </span>
              </div>
            </div>

            {/* Main Document Details */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 transition group-hover:scale-105 shadow-md ${
                doc.category === 'UPLOADED_KYC'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white'
              }`}>
                <FileText size={22} />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                  {doc.title}
                </h3>
                {doc.serialNo && (
                  <span className="text-[10px] font-mono text-purple-600 dark:text-purple-300 font-bold block">
                    Ref: {doc.serialNo}
                  </span>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
                  {doc.description}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block pt-1">
                  Date: {doc.date}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocForPreview(doc)}
                className="flex-1 py-2.5 px-3 clay-button-slate text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition hover:scale-[1.02]"
              >
                <Eye size={15} /> View Document
              </button>

              <button
                type="button"
                onClick={() => handleDownloadDoc(doc)}
                className="flex-1 py-2.5 px-3 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition hover:scale-[1.02]"
              >
                <ArrowDownToLine size={15} /> Download PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <div className="p-12 text-center clay-card space-y-3">
          <Folder size={40} className="mx-auto text-slate-400" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">No Matching Documents Found</h3>
          <p className="text-xs text-slate-500 font-medium">Try clearing your search query or selecting another filter tab.</p>
        </div>
      )}

      {/* Upload New Supplementary Document Section */}
      <div className="clay-card p-6 md:p-8 space-y-6 border-2 border-purple-500/30">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Upload className="text-purple-600" size={18} /> Upload Supplementary Document
            </h3>
            <p className="text-xs text-slate-500 font-medium">Upload updated address proof, corporate GSTIN, or secondary KYC records for re-verification.</p>
          </div>
          <span className="clay-badge-purple px-2.5 py-0.5 text-[9px] font-black uppercase">ENCRYPTED UPLOAD</span>
        </div>

        <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase block">Document Type *</label>
            <select
              value={newDocType}
              onChange={e => setNewDocType(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
            >
              <option value="ELECTRICITY_BILL">Electricity Bill (Address Proof)</option>
              <option value="RENT_AGREEMENT">Registered Rent Agreement</option>
              <option value="GST_CERTIFICATE">Corporate GSTIN Certificate</option>
              <option value="PASSPORT">Passport / Voter ID</option>
              <option value="OTHER_PROOF">Other Telecom KYC Proof</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase block">Select File (PDF, PNG, JPG) *</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
              className="w-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isUploading || !uploadFile}
            className="w-full py-3 clay-button-purple text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload to Secure Vault
          </button>
        </form>
      </div>

      {/* DOCUMENT PREVIEW MODAL - Authentic Clean Document Sheet Preview */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="clay-modal max-w-3xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto text-left relative border-2 border-purple-500/40 shadow-2xl">
            
            {/* Top Close Bar */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-purple-600 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  {selectedDocForPreview.category === 'UPLOADED_KYC' ? 'Uploaded Identity & KYC Proof' : 'System Generated Telecom Document'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDocForPreview(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* REALISTIC DOCUMENT PAPER SHEET CONTAINER */}
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-slate-900 dark:text-white shadow-xl relative overflow-hidden">
              
              {/* Document Header Accent */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600" />

              {/* Document Letterhead Bar */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow">
                      TPF
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">
                      TelcoBridge Telecom Master Document
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-semibold block mt-0.5">
                    TRAI & DoT Licensee Code: DOT/FTTH/2026/8812 • Verified Digital Copy
                  </span>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="clay-badge-emerald px-3 py-1 text-[10px] font-black uppercase flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={12} /> {selectedDocForPreview.status} & SEALED
                  </span>
                  {selectedDocForPreview.serialNo && (
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-extrabold block mt-1">
                      Ref: {selectedDocForPreview.serialNo}
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h4 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {selectedDocForPreview.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {selectedDocForPreview.description}
                </p>
              </div>

              {/* Structured Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Subscriber Name</span>
                  <span className="font-extrabold text-slate-900 dark:text-white truncate block">{customer?.firstName || 'Subscriber'} {customer?.lastName || ''}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Customer ID</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400 block">{customer?.customerId || 'TPF-CUST-99201'}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Format & Size</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{selectedDocForPreview.type} ({selectedDocForPreview.size})</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase block">Document Date</span>
                  <span className="font-bold text-slate-900 dark:text-white block">{selectedDocForPreview.date}</span>
                </div>
              </div>

              {/* Visual Card / Document Render Preview Container */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 via-slate-50 to-pink-500/5 dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-950 border-2 border-dashed border-purple-500/30 text-center space-y-3 relative">
                
                {/* Watermark Text */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 text-slate-900 dark:text-white font-black text-4xl uppercase pointer-events-none select-none">
                  SEALED TELECOM RECORD
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 text-white flex items-center justify-center mx-auto shadow-md">
                    <FileText size={24} />
                  </div>

                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 block">
                    {selectedDocForPreview.category === 'UPLOADED_KYC' ? 'Verified Subscriber Attachment' : 'Certified Broadband Document PDF'}
                  </span>

                  {/* Context Specific Render View */}
                  {selectedDocForPreview.previewType === 'SELFIE' ? (
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-w-xs mx-auto space-y-1">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 mx-auto flex items-center justify-center text-white font-black text-xl shadow">
                        {customer?.firstName ? customer?.firstName[0] : 'S'}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-extrabold block">✓ Liveness Selfie Audit Passed</span>
                    </div>
                  ) : selectedDocForPreview.previewType === 'SIGNATURE' ? (
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-w-xs mx-auto space-y-1">
                      <div className="h-14 bg-slate-100 dark:bg-slate-900 rounded flex items-center justify-center font-serif text-lg italic font-bold text-purple-600 dark:text-purple-400">
                        {customer?.firstName || 'Subscriber'} {customer?.lastName || ''}
                      </div>
                      <span className="text-[10px] text-purple-600 font-mono font-extrabold block">Digital E-Stamp Fingerprinted</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-w-sm mx-auto space-y-1 text-left font-mono text-[11px]">
                      <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1 text-[10px]">
                        <span className="text-slate-400">Security Certificate:</span>
                        <span className="text-emerald-500 font-bold">VALID & TRUSTED</span>
                      </div>
                      <div className="flex justify-between text-[10px] pt-1">
                        <span className="text-slate-400">TRAI Regulatory Compliance:</span>
                        <span className="text-purple-500 font-bold">SECTION 4 COMPLIANT</span>
                      </div>
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                    Click 'Download File' below to save the official full-resolution document.
                  </span>
                </div>
              </div>

              {/* SHA256 Security Audit Seal Footer */}
              <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold truncate">
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                  <span className="truncate">SHA256: SHA256-{(selectedDocForPreview.id + '-' + selectedDocForPreview.title.slice(0,6) + '-2026').toUpperCase()}</span>
                </div>
                <span className="text-[10px] font-sans font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0 uppercase">
                  ✓ TRAI & DoT Audited
                </span>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  toast.info("Printing Document", `Opening printable view for ${selectedDocForPreview.title}...`);
                  window.print();
                }}
                className="w-full sm:w-1/2 py-3.5 px-4 clay-button-slate text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                <Printer size={16} /> Print Document
              </button>

              <button
                type="button"
                onClick={() => handleDownloadDoc(selectedDocForPreview)}
                className="w-full sm:w-1/2 py-3.5 px-4 clay-button-purple text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition hover:scale-[1.02]"
              >
                <ArrowDownToLine size={16} /> Download File ({selectedDocForPreview.type})
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
