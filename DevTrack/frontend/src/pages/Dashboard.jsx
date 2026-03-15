import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bug,
  Layout,
  ChevronRight,
  TrendingUp,
  Target,
  BarChart2,
  Activity,
  CheckSquare
} from 'lucide-react';
import apiClient from '../api/client';
import authService from '../services/authService';
import TaskModal from '../components/TaskModal';
import BugModal from '../components/BugModal';
import { useNotification } from '../context/NotificationContext';

const Dashboard = () => {
    const [metrics, setMetrics] = useState(null);
    const [recentBugs, setRecentBugs] = useState([]);
    const [recentTasks, setRecentTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();
    const isDevAdmin = currentUser?.roles?.includes('ROLE_DEVADMIN');
    const isTestAdmin = currentUser?.roles?.includes('ROLE_TESTADMIN');
    const isDeveloper = currentUser?.roles?.includes('ROLE_DEVELOPER');
    const isAdmin = isDevAdmin || isTestAdmin;
    const isTaskCentric = isDevAdmin || isDeveloper;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, bugsRes, tasksRes] = await Promise.all([
                    apiClient.get('/reports/metrics'),
                    apiClient.get('/bugs'),
                    apiClient.get('/tasks')
                ]);
                
                let calculatedMetrics = metricsRes.data;
                let displayedBugs = bugsRes.data;
                let displayedTasks = tasksRes.data;

                if (isDeveloper && !isDevAdmin) {
                    displayedTasks = tasksRes.data.filter(t => t.assignedDeveloper?.id === currentUser.id);
                    calculatedMetrics = {
                        ...calculatedMetrics,
                        totalTasks: displayedTasks.length,
                        openTasks: displayedTasks.filter(t => t.status === 'OPEN').length,
                        pendingTasks: displayedTasks.filter(t => ['IN_PROGRESS', 'SIT_COMPLETED', 'UAT_COMPLETED', 'PREPROD_COMPLETED', 'PROD_COMPLETED'].includes(t.status)).length,
                        completedTasks: displayedTasks.filter(t => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(t.status)).length
                    };
                } else if (!isAdmin) {
                    // Must be Tester
                    displayedBugs = bugsRes.data.filter(b => b.raisedBy?.id === currentUser.id);
                    calculatedMetrics = {
                        ...calculatedMetrics,
                        totalBugs: displayedBugs.length,
                        openBugs: displayedBugs.filter(b => b.status === 'OPEN').length,
                        closedBugs: displayedBugs.filter(b => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(b.status)).length,
                        blockedBugs: displayedBugs.filter(b => b.status === 'BLOCKED').length
                    };
                }

                setMetrics(calculatedMetrics);
                setRecentBugs(displayedBugs.slice(0, 5));
                setRecentTasks(displayedTasks.slice(0, 5));
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                showNotification('Failed to load dashboard metrics. Please check your connection.', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = metrics ? (isTaskCentric ? [
        { 
            label: 'Total Tasks', 
            value: metrics.totalTasks || 0, 
            change: '', 
            isUp: true, 
            icon: CheckSquare, 
            color: 'from-tata-purple to-indigo-600',
            bg: 'bg-indigo-50'
        },
        { 
            label: 'Open Tasks', 
            value: metrics.openTasks || 0, 
            change: '', 
            isUp: false, 
            icon: Target, 
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50'
        },
        { 
            label: 'Pending Tasks', 
            value: metrics.pendingTasks || 0, 
            change: '', 
            isUp: true, 
            icon: Clock, 
            color: 'from-blue-400 to-indigo-500',
            bg: 'bg-blue-50'
        },
        { 
            label: 'Completed Tasks', 
            value: metrics.completedTasks || 0, 
            change: '', 
            isUp: true, 
            icon: CheckCircle2, 
            color: 'from-emerald-400 to-teal-500',
            bg: 'bg-emerald-50'
        },
    ] : [
        { 
            label: 'Total Bugs', 
            value: metrics.totalBugs || 0, 
            change: '', 
            isUp: true, 
            icon: Bug, 
            color: 'from-tata-pink to-pink-600',
            bg: 'bg-pink-50'
        },
        { 
            label: 'Open Bugs', 
            value: metrics.openBugs || 0, 
            change: '', 
            isUp: false, 
            icon: AlertCircle, 
            color: 'from-amber-400 to-orange-500',
            bg: 'bg-amber-50'
        },
        { 
            label: 'Resolved Bugs', 
            value: metrics.closedBugs || 0, 
            change: '', 
            isUp: true, 
            icon: CheckCircle2, 
            color: 'from-emerald-400 to-teal-500',
            bg: 'bg-emerald-50'
        },
        { 
            label: 'Blocked Bugs', 
            value: metrics.blockedBugs || 0, 
            change: '', 
            isUp: false, 
            icon: AlertCircle, 
            color: 'from-red-400 to-red-600',
            bg: 'bg-red-50'
        },
    ]) : [];

    if (isLoading) return <div className="p-8"><Activity className="animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise Overview</h1>
                    <p className="text-gray-500 font-medium">Tracking system health and team productivity.</p>
                </div>
                <div className="flex items-center space-x-3">
                    {isAdmin && (
                        <button 
                            onClick={() => navigate('/reports')}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                        >
                            <BarChart2 className="w-4 h-4" />
                            <span>View Analytics</span>
                        </button>
                    )}
                    {isAdmin && (
                        <button 
                            onClick={() => { setSelectedItem(null); setModalOpen(true); }}
                            className="btn-tata flex items-center space-x-2 py-2.5 px-6 shadow-lg shadow-tata-pink/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{isDevAdmin ? 'Create Task' : 'Create Bug'}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div key={index} className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-500`}></div>
                        <div className="relative z-10">
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} w-fit shadow-lg mb-4 text-white`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-500 mb-1">{stat.label}</p>
                                <div className="flex items-end space-x-3">
                                <h3 className="text-3xl font-black text-gray-900 leading-none">{stat.value}</h3>
                                {stat.change && (
                                    <div className={`flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${stat.isUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {stat.isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                                        {stat.change}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Recent Issues Table */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-8 shadow-sm overflow-hidden relative group">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-800 tracking-tight">
                                {isTaskCentric ? 'Recent Tasks' : 'Recent Critical Bugs'}
                            </h3>
                            <p className="text-xs font-bold text-tata-pink uppercase tracking-widest opacity-70">
                                {isTaskCentric ? 'Priority Work' : 'Attention Required'}
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                if (isDevAdmin) navigate('/all-tasks');
                                else if (isDeveloper) navigate('/tasks');
                                else navigate('/bugs');
                            }}
                            className="text-xs font-bold text-tata-purple hover:underline flex items-center space-x-1"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                    <th className="pb-4 pl-2">ID</th>
                                    <th className="pb-4">{isTaskCentric ? 'Task Details' : 'Bug Details'}</th>
                                    <th className="pb-4">{isTaskCentric ? 'Status' : 'Severity'}</th>
                                    {isAdmin && <th className="pb-4 text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {(isTaskCentric ? recentTasks : recentBugs).map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 pl-2">
                                            <span className="text-xs font-black text-tata-pink">{item.jtrackId || (isTaskCentric ? `T-${item.id}` : `B-${item.id}`)}</span>
                                        </td>
                                        <td className="py-4">
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.title}</p>
                                            <p className="text-[10px] text-gray-400 font-medium tracking-tight uppercase">
                                                {isTaskCentric ? `Type: ${item.type?.name}` : `Raised by: ${item.raisedBy?.fullName || 'Tester'}`}
                                            </p>
                                        </td>
                                        <td className="py-4">
                                            <span className={`status-badge text-[10px] ${
                                                isTaskCentric ? (item.status === 'CLOSED' ? 'status-resolved' : 'status-open') :
                                                (item.severity === 'Critical' ? 'status-open red' : 
                                                 item.severity === 'High' ? 'status-open orange' : 'status-in-progress')
                                            }`}>
                                                {isTaskCentric ? item.status : item.severity}
                                            </span>
                                        </td>
                                        {isAdmin && (
                                            <td className="py-4 text-right">
                                                <button 
                                                    onClick={() => { setSelectedItem(item); setModalOpen(true); }}
                                                    className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-tata-pink hover:text-white transition-all transform group-hover:scale-110"
                                                >
                                                    <Target className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isTaskCentric ? (
              <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedItem}
                onSave={() => window.location.reload()}
              />
            ) : (
              <BugModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedItem}
                onSave={() => window.location.reload()}
              />
            )}
        </div>
    );
};

export default Dashboard;
