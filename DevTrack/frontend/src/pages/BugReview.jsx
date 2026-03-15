import { useState, useEffect } from 'react';
import { 
  Bug, 
  Search, 
  Activity, 
  CheckCircle2,
  XCircle,
  AlertOctagon
} from 'lucide-react';
import apiClient from '../api/client';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const BugReview = () => {
    const [bugs, setBugs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBucket, setFilterBucket] = useState('MY_BUGS'); // 'ALL' or 'MY_BUGS'
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [actionType, setActionType] = useState(null); // 'APPROVE' or 'REJECT'
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();
    const isTestAdmin = currentUser?.roles?.includes('ROLE_TESTADMIN');

    useEffect(() => {
        fetchBugs();
    }, []);

    const fetchBugs = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/bugs');
            // strictly filter for INVALID_PENDING_APPROVAL
            const invalidPending = res.data.filter(b => b.status === 'INVALID_PENDING_APPROVAL');
            setBugs(invalidPending);
        } catch (error) {
            console.error('Error fetching bugs for review:', error);
            showNotification('Failed to load pending bugs.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (bug, type) => {
        setSelectedBug(bug);
        setActionType(type);
        setRemarks('');
        setIsModalOpen(true);
    };

    const handleSubmitAction = async () => {
        if (!remarks.trim()) {
            showNotification('Remarks are required.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = `/bugs/${selectedBug.id}/${actionType === 'APPROVE' ? 'approve-invalid' : 'reject-invalid'}`;
            await apiClient.post(endpoint, { remarks });
            
            showNotification(`Bug successfully ${actionType === 'APPROVE' ? 'marked as Invalid' : 'returned to Developer'}!`, 'success');
            setIsModalOpen(false);
            fetchBugs();
        } catch (error) {
            console.error('Error submitting bug review:', error);
            showNotification(error.response?.data || 'Failed to process request.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayBugs = bugs.filter(bug => {
        const matchesSearch = !searchTerm || 
            bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bug.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (!matchesSearch) return false;
        
        if (filterBucket === 'MY_BUGS') {
            return bug.raisedBy?.id === currentUser?.id;
        }
        return true; // ALL (for TestAdmins)
    }).sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));

    if (isLoading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Activity className="animate-spin text-tata-pink w-8 h-8" /></div>;

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bug Review</h1>
                   <p className="text-gray-500 font-medium">Verify or reject bugs marked as "Invalid" by Developers.</p>
                </div>
                
                {isTestAdmin && (
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm self-start">
                        <button 
                            onClick={() => setFilterBucket('MY_BUGS')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                filterBucket === 'MY_BUGS' ? 'bg-white text-tata-pink shadow-md' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            My Raised Bugs
                        </button>
                        <button 
                            onClick={() => setFilterBucket('ALL')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                filterBucket === 'ALL' ? 'bg-white text-tata-pink shadow-md' : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            All Pending
                        </button>
                    </div>
                )}
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search bugs by ID or Title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-3xl py-4 pl-12 pr-6 outline-none focus:ring-4 focus:ring-tata-pink/5 focus:border-tata-pink transition-all font-bold shadow-sm"
                />
            </div>

            <section className="space-y-6">
                <div className="flex items-center space-x-3 px-2">
                    <div className="p-2 rounded-xl bg-amber-50 border border-amber-100">
                        <AlertOctagon className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-black text-gray-800 tracking-tight">Validation Queue</h2>
                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100">
                        {displayBugs.length} PENDING
                    </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {displayBugs.length === 0 ? (
                        <div className="bg-gray-50/50 rounded-[40px] py-12 text-center border-2 border-dashed border-gray-100 italic text-gray-400 font-medium">
                            No bugs pending your invalidation review.
                        </div>
                    ) : (
                        displayBugs.map((bug) => (
                            <div 
                                key={bug.id} 
                                className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group flex flex-col md:flex-row items-center gap-6"
                            >
                                <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[120px]">
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border bg-amber-50 text-amber-600 border-amber-100">
                                        {bug.jtrackId || `B-${bug.id}`}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                        PRIORITY: {bug.priority?.toUpperCase() || 'NORMAL'}
                                    </span>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-black text-gray-800 transition-colors mb-1">
                                        {bug.title}
                                    </h3>
                                    <div className="flex items-center flex-wrap justify-center md:justify-start gap-4">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold text-gray-600">Dev: {bug.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                            Flagged {new Date(bug.updatedDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="mt-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100 relative">
                                        <div className="absolute top-0 left-4 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dev Remarks</div>
                                        {bug.remarks || "No remarks provided."}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button 
                                        onClick={() => handleOpenModal(bug, 'APPROVE')}
                                        className="flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:scale-105 border bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white shadow-sm"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>Accept Invalid</span>
                                    </button>
                                    <button 
                                        onClick={() => handleOpenModal(bug, 'REJECT')}
                                        className="flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:scale-105 border bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span>Reject & Return</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* Action Modal */}
            {isModalOpen && selectedBug && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-8 transform transition-all animate-scale-in">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
                            {actionType === 'APPROVE' ? 'Approve Invalid Status' : 'Reject Invalid Claim'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {actionType === 'APPROVE' 
                                ? "This will formally close the bug and register it as an 'Invalid Bug'. This action completes the workflow." 
                                : "This will return the bug to 'In Progress' status back to the developer queue for fixing."}
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Remarks (Mandatory)</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder={`Provide details on why you are ${actionType.toLowerCase()}ing...`}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 min-h-[120px] font-medium text-gray-800 outline-none focus:bg-white focus:border-tata-pink transition-all"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitAction}
                                    disabled={isSubmitting || !remarks.trim()}
                                    className={`px-8 py-3 rounded-2xl text-sm font-black text-white uppercase tracking-widest transition-all ${
                                        actionType === 'APPROVE' 
                                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                    } ${isSubmitting || !remarks.trim() ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:shadow-xl hover:-translate-y-0.5'}`}
                                >
                                    {isSubmitting ? 'Processing...' : 'Confirm Action'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BugReview;
