import { useState, useEffect } from 'react';
import { 
  Search, 
  Activity, 
  ChevronRight, 
  Clock, 
  UserPlus, 
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  FlaskConical,
  ShieldCheck
} from 'lucide-react';
import apiClient from '../api/client';
import authService from '../services/authService';
import configService from '../services/configService';
import UATModal from '../components/UATModal';
import { useNotification } from '../context/NotificationContext';

const TESTING_PHASES = {
    SIT: {
        key: 'SIT',
        title: 'SIT System Check',
        icon: FlaskConical,
        color: 'indigo',
        configKey: 'STATUS_PUSHED_FOR_SIT',
        defaultStatus: 'SIT_TESTING'
    },
    UAT: {
        key: 'UAT',
        title: 'UAT Quality Check',
        icon: ShieldCheck,
        color: 'pink',
        configKey: 'STATUS_PUSHED_FOR_UAT',
        defaultStatus: 'UAT_TESTING'
    }
};

const TestingDashboard = () => {
    const [allTasks, setAllTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBucket, setFilterBucket] = useState('AVAILABLE'); // AVAILABLE or MY_TASKS
    const [modalConfig, setModalConfig] = useState({ open: false, item: null, type: 'UAT' });
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch both types of tasks to restore SIT/UAT section functionality
            const [tasksRes, bugsRes] = await Promise.all([
                apiClient.get('/tasks'),
                apiClient.get('/bugs')
            ]);

            const combined = [
                ...tasksRes.data.map(t => ({ ...t, entityType: 'task' })),
                ...bugsRes.data.map(b => ({ ...b, entityType: 'bug' }))
            ];

            setAllTasks(combined);
        } catch (error) {
            console.error('Error fetching testing tasks:', error);
            showNotification('Failed to load tasks.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickTask = async (item, type) => {
        try {
            const endpoint = `/${item.entityType === 'task' ? 'tasks' : 'bugs'}/${item.id}/pick-for-${type.toLowerCase()}`;
            await apiClient.post(endpoint);
            showNotification(`${type} task picked successfully!`, 'success');
            fetchData();
        } catch (error) {
            showNotification(error.response?.data || 'Failed to pick task.', 'error');
        }
    };

    const filterTasks = (phase) => {
        const triggerStatus = configService.getConfig(phase.configKey, phase.defaultStatus);
        
        return allTasks.filter(item => {
            const matchesSearch = !searchTerm || 
                item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;
            
            const isPhaseStatus = item.status === triggerStatus;
            
            if (filterBucket === 'AVAILABLE') {
                return isPhaseStatus && !item.tester;
            } else {
                return isPhaseStatus && item.tester?.id === currentUser.id;
            }
        }).sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
    };

    if (isLoading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Activity className="animate-spin text-tata-pink w-8 h-8" /></div>;

    return (
        <div className="space-y-10 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Testing Dashboard</h1>
                   <p className="text-gray-500 font-medium">Unified command center for SIT and UAT verification.</p>
                </div>
                
                <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200 shadow-sm self-start">
                    <button 
                        onClick={() => setFilterBucket('AVAILABLE')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filterBucket === 'AVAILABLE' ? 'bg-white text-tata-pink shadow-md' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Available Pool
                    </button>
                    <button 
                        onClick={() => setFilterBucket('MY_TASKS')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            filterBucket === 'MY_TASKS' ? 'bg-white text-tata-pink shadow-md' : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        My Testing Bucket
                    </button>
                </div>
            </div>

            {/* Global Search */}
            <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search tasks across all phases..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-100 rounded-3xl py-4 pl-12 pr-6 outline-none focus:ring-4 focus:ring-tata-pink/5 focus:border-tata-pink transition-all font-bold shadow-sm"
                />
            </div>

            {/* Dashboard Sections */}
            <div className="space-y-12">
                {[TESTING_PHASES.SIT, TESTING_PHASES.UAT].map((phase) => {
                    const phaseTasks = filterTasks(phase);
                    const PhaseIcon = phase.icon;
                    
                    return (
                        <section key={phase.key} className="space-y-6">
                            <div className="flex items-center space-x-3 px-2">
                                <div className={`p-2 rounded-xl bg-${phase.color}-50 border border-${phase.color}-100`}>
                                    <PhaseIcon className={`w-5 h-5 text-${phase.color}-600`} />
                                </div>
                                <h2 className="text-xl font-black text-gray-800 tracking-tight">{phase.title}</h2>
                                <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-black rounded-full border border-gray-100">
                                    {phaseTasks.length} ITEMS
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {phaseTasks.length === 0 ? (
                                    <div className="bg-gray-50/50 rounded-[40px] py-12 text-center border-2 border-dashed border-gray-100 italic text-gray-400 font-medium">
                                        No tasks currently in {phase.key} phase.
                                    </div>
                                ) : (
                                    phaseTasks.map((item) => (
                                        <div 
                                            key={`${item.entityType}-${item.id}`} 
                                            className="bg-white rounded-[32px] p-6 border border-gray-50 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all group flex flex-col md:flex-row items-center gap-6"
                                        >
                                            <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-1 min-w-[120px]">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                    phase.key === 'SIT' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                                                }`}>
                                                    {item.jtrackId || `T-${item.id}`}
                                                </span>
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {item.entityType}
                                                </span>
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <h3 className="text-lg font-black text-gray-800 transition-colors mb-1">
                                                    {item.title}
                                                </h3>
                                                <div className="flex items-center flex-wrap justify-center md:justify-start gap-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center font-bold text-[10px] text-gray-400 border border-gray-100">
                                                            {item.assignedDeveloper?.fullName?.charAt(0) || 'U'}
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-600">{item.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                                        Updated {new Date(item.updatedDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-4">
                                                {filterBucket === 'AVAILABLE' ? (
                                                    <button 
                                                        onClick={() => handlePickTask(item, phase.key)}
                                                        className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest transition-all transform active:scale-95 border ${
                                                            phase.key === 'SIT' 
                                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600 hover:text-white shadow-sm' 
                                                            : 'bg-pink-50 text-pink-600 border-pink-100 hover:bg-tata-pink hover:text-white shadow-sm'
                                                        }`}
                                                    >
                                                        <UserPlus className="w-4 h-4" />
                                                        <span>Pick {phase.key}</span>
                                                    </button>
                                                ) : (
                                                    <button 
                                                        onClick={() => setModalConfig({ open: true, item, type: phase.key })}
                                                        className={`flex items-center space-x-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-lg ${
                                                            phase.key === 'SIT'
                                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                                                            : 'bg-tata-pink text-white hover:bg-tata-purple shadow-pink-200'
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span>Review</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    );
                })}
            </div>

            <UATModal
                isOpen={modalConfig.open}
                onClose={() => setModalConfig({ ...modalConfig, open: false })}
                item={modalConfig.item}
                type={modalConfig.type}
                onActionSuccess={fetchData}
            />
        </div>
    );
};

export default TestingDashboard;
