import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  CheckSquare, 
  ChevronRight, 
  Tag, 
  GitPullRequest,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
  Clock
} from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import authService from '../services/authService';
import ReviewModal from '../components/ReviewModal';
import { useNotification } from '../context/NotificationContext';

const CodeReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('PENDING'); // PENDING or COMPLETED
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedType, setSelectedType] = useState('task');
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        fetchReviews();
    }, [filterStatus]);

    const fetchReviews = async () => {
        setIsLoading(true);
        try {
            // Fetch both types of tasks to restore original review dashboard functionality
            const [tasksRes, bugTasksRes] = await Promise.all([
                apiClient.get('/tasks'),
                apiClient.get('/bugtasks')
            ]);

            const allItems = [
                ...tasksRes.data.map(t => ({ ...t, entityType: 'task' })),
                ...bugTasksRes.data.map(bt => ({ ...bt, entityType: 'bugTask' }))
            ];

            // Sort by status and date
            const filtered = allItems.filter(item => {
                if (filterStatus === 'PENDING') return item.status === 'CODE_REVIEW';
                // If filter is COMPLETED, show items that were in review (have gitLinks) but are no longer in CODE_REVIEW
                // Or simply items that are UAT_TESTING, UAT_COMPLETED, etc.
                return item.status !== 'CODE_REVIEW' && (item.gitLinks || item.codeReviewComments);
            });

            setReviews(filtered.sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate)));
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showNotification('Failed to load code reviews.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReviews = reviews.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedDeveloper?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openModal = (item) => {
        setSelectedItem({
            ...item,
            entityType: item.entityType // Ensure entityType travels with the item
        });
        setModalOpen(true);
    };

    if (isLoading) return <div className="p-8 flex items-center justify-center"><Logo className="animate-spin text-deltascribe-emerald w-8 h-8" color="currentColor" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Code Review Dashboard</h1>
                   <p className="text-gray-500 font-medium">Approve or Reject tasks pushed for quality assessment.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col md:flex-row gap-4 shadow-sm items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID, Title or Developer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white bg-opacity-50 border border-gray-100 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 font-medium transition-all"
                    />
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
                    <button 
                        onClick={() => setFilterStatus('PENDING')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filterStatus === 'PENDING' ? 'bg-white text-deltascribe-emerald shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Pending ({reviews.filter(r => r.status === 'CODE_REVIEW').length})
                    </button>
                    <button 
                        onClick={() => setFilterStatus('COMPLETED')}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filterStatus === 'COMPLETED' ? 'bg-white text-deltascribe-emerald shadow-sm' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Closed Reviews
                    </button>
                </div>
            </div>

            {/* Reviews Board */}
            <div className="grid grid-cols-1 gap-4">
                {filteredReviews.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-20 text-center border-2 border-dashed border-gray-100">
                        <div className="inline-flex p-6 bg-gray-50 rounded-full mb-4">
                            <GitPullRequest className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 mb-1">All caught up!</h3>
                        <p className="text-gray-400 font-medium max-w-xs mx-auto">No {filterStatus.toLowerCase()} code reviews found matching your search.</p>
                    </div>
                ) : filteredReviews.map((item) => (
                    <div 
                        key={`${item.entityType}-${item.id}`} 
                        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row items-center gap-6"
                        onClick={() => openModal(item)}
                    >
                        {/* ID and Type */}
                        <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[120px]">
                            <span className="text-[10px] font-black text-deltascribe-emerald uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                {item.jtrackId || `T-${item.id}`}
                            </span>
                            <div className="flex items-center space-x-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">TYPE:</span>
                                <span className="text-xs font-black text-deltascribe-navy uppercase">{item.type?.name}</span>
                            </div>
                        </div>

                        {/* Title and Dev */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-black text-gray-800 group-hover:text-deltascribe-emerald transition-colors mb-1">
                                {item.title}
                            </h3>
                            <div className="flex items-center flex-wrap justify-center md:justify-start gap-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center font-bold text-[10px] text-indigo-500 border border-indigo-100">
                                        {item.assignedDeveloper?.fullName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="text-sm font-bold text-gray-600">{item.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(item.updatedDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Git Links Count */}
                        <div className="hidden lg:flex flex-col items-center px-8 border-l border-r border-gray-50">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">GIT LINKS</span>
                            <div className="flex items-center space-x-2">
                                <GitPullRequest className="w-4 h-4 text-emerald-500" />
                                <span className="text-lg font-black text-gray-800">
                                    {item.gitLinks ? item.gitLinks.split(',').length : 0}
                                </span>
                            </div>
                        </div>

                        {/* Status Badge & Action */}
                        <div className="flex items-center space-x-4 min-w-[180px] justify-end">
                            <div className={`status-badge text-[10px] ${
                                item.status === 'CODE_REVIEW' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                item.status === 'SIT_COMPLETED' ? 'bg-red-50 text-red-600 border border-red-100' :
                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            }`}>
                                {item.status.replace('_', ' ')}
                            </div>
                            {filterStatus === 'PENDING' ? (
                                <button className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-deltascribe-emerald group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm border border-transparent group-hover:border-deltascribe-emerald/20">
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <div className="text-right">
                                    <span className="text-[10px] font-black text-gray-400 uppercase block">Approved On</span>
                                    <span className="text-sm font-black text-emerald-600">{new Date(item.updatedDate).toLocaleDateString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <ReviewModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedItem}
                onSave={fetchReviews}
            />
        </div>
    );
};

export default CodeReviews;
