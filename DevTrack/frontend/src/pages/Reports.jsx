import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Users, 
  Download, 
  Activity,
  ArrowUpRight,
  PieChart,
  FileSpreadsheet,
  Calendar,
  Bug,
  CheckSquare,
  Filter
} from 'lucide-react';
import apiClient from '../api/client';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const Reports = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [startDate, setStartDate] = useState(firstDay);
    const [endDate, setEndDate] = useState(lastDay);
    const [selectedUser, setSelectedUser] = useState('');
    const navigate = useNavigate();

    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();
    
    const isDevAdmin = currentUser?.roles?.includes('ROLE_DEVADMIN');
    const isTestAdmin = currentUser?.roles?.includes('ROLE_TESTADMIN');
    // Only admins have access to reports based on sidebar hiding and new requirements
    const isTaskCentric = isDevAdmin; 

    const fetchMetrics = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/reports/metrics?startDate=${startDate}&endDate=${endDate}`);
            setMetrics(res.data);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            showNotification('Failed to load analytical metrics', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isDevAdmin && !isTestAdmin) {
             navigate('/');
             return;
        }
        fetchMetrics();
    }, []);

    const handleFilterApply = () => {
        if (new Date(endDate) < new Date(startDate)) {
            showNotification('End date cannot be earlier than start date.', 'error');
            return;
        }
        fetchMetrics();
    };

    if (isLoading && !metrics) return <div className="p-8 text-center text-tata-purple font-bold"><Activity className="animate-spin inline-block mr-2" />Generating Analytical Report...</div>;

    const statusDistribution = isTaskCentric ? (metrics?.taskStatusDistribution || {}) : (metrics?.bugStatusDistribution || {});
    
    const performanceDataEntries = isTaskCentric 
        ? Object.entries(metrics?.taskCountPerDev || {}) 
        : Object.entries(metrics?.bugsRaisedByTester || {});

    const bugTaskDataEntries = isTaskCentric
        ? []
        : Object.entries(metrics?.bugTaskCountPerTester || {}); // Add this if backend provides it

    const filteredPerformanceData = selectedUser 
        ? performanceDataEntries.filter(([name]) => name === selectedUser)
        : performanceDataEntries;

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise Intelligence</h1>
                   <p className="text-gray-500 font-medium">{isTaskCentric ? 'Task allocation and developer performance.' : 'Defect tracking and tester productivity.'}</p>
                </div>
                
                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center space-x-2 px-3">
                        <Calendar className="w-4 h-4 text-tata-pink" />
                        <span className="text-xs font-bold text-gray-400 uppercase">Period:</span>
                    </div>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl py-2 px-3 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-tata-pink transition-all"
                    />
                    <span className="text-gray-300 font-bold">to</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl py-2 px-3 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:border-tata-pink transition-all"
                    />
                    <button 
                        onClick={handleFilterApply}
                        className="btn-tata py-2 px-6 ml-2 text-sm shadow-md"
                    >
                        Apply Filter
                    </button>
                </div>
            </div>

            {/* Scorecards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Overall Volume in Period</p>
                    <h3 className="text-5xl font-black text-gray-900 mb-4">
                        {isTaskCentric ? metrics?.totalTasks : (metrics?.totalBugs + (metrics?.totalBugTasks || 0))}
                    </h3>
                    <div className="flex items-center space-x-2 text-indigo-500 font-bold text-xs">
                        <Target className="w-4 h-4" />
                        <span>{isTaskCentric ? 'Total Tasks Created' : 'Total Bugs & Linked Tasks'}</span>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden group text-tata-purple">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <CheckSquare className="w-24 h-24" />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Completion / Resolution</p>
                    <h3 className="text-5xl font-black text-slate-900 mb-4">{isTaskCentric ? metrics?.completedTasks : metrics?.closedBugs}</h3>
                    <div className="flex items-center space-x-2 text-emerald-500 font-bold text-xs">
                        <ArrowUpRight className="w-4 h-4" />
                        <span>{isTaskCentric ? 'Successfully closed tasks' : 'Successfully resolved defects'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Status Breakdown Panel */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm">
                    <h3 className="text-xl font-black text-gray-800 tracking-tight mb-8">
                        {isTaskCentric ? 'Task Status Breakdown' : 'Bug Status Breakdown'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {(!isTaskCentric ? ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED', 'BLOCKED'] : ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED', 'CLOSED']).map((status) => (
                            <div key={status} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 text-center hover:shadow-md transition-shadow">
                                <p className="text-4xl font-black text-tata-purple mb-2">
                                    {statusDistribution[status] || 0}
                                </p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {status.replace('_', ' ')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Role Specific Performance Panels */}
                <div className="bg-white rounded-[40px] border border-gray-100 p-10 shadow-sm content-start">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h3 className="text-xl font-black text-gray-800 tracking-tight">
                            {isTaskCentric ? 'Developer Performance Metrics' : 'Tester Productivity Metrics'}
                        </h3>
                        <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                            <Filter className="w-4 h-4 text-gray-400 ml-3" />
                            <select 
                                value={selectedUser} 
                                onChange={(e) => setSelectedUser(e.target.value)}
                                className="bg-transparent py-2 px-3 text-sm font-bold text-gray-700 outline-none w-48"
                            >
                                <option value="">All {isTaskCentric ? 'Developers' : 'Testers'}</option>
                                {performanceDataEntries.map(([name]) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    {isTaskCentric ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredPerformanceData.length > 0 ? (
                                filteredPerformanceData.map(([dev, assignedCount], i) => (
                                    <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                        <div className="flex items-center space-x-4 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-tata-purple text-white flex items-center justify-center font-black shadow-md">
                                                {dev.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-gray-800">{dev}</p>
                                                <p className="text-[10px] text-tata-pink font-bold uppercase tracking-widest">Developer</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-3 rounded-xl border border-gray-100/50 text-center">
                                                <p className="text-2xl font-black text-gray-800">{assignedCount}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tasks Assigned</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-gray-100/50 text-center">
                                                <p className="text-2xl font-black text-orange-500">{metrics.pendingTaskCountPerDev?.[dev] || 0}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pending Tasks</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-gray-100/50 text-center">
                                                <p className="text-2xl font-black text-red-500">{metrics.bugsRaisedAgainstDev?.[dev] || 0}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bugs Assigned</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-gray-100/50 text-center">
                                                <p className="text-2xl font-black text-emerald-500">{metrics.bugsSolvedByDev?.[dev] || 0}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Bugs Solved</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm font-bold text-gray-400 col-span-full">No developer metrics found in this period.</p>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredPerformanceData.length > 0 ? (
                                filteredPerformanceData.map(([tester, raisedCount], i) => (
                                    <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col justify-between">
                                        <div className="flex items-center space-x-4 mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-tata-pink text-white flex items-center justify-center font-black shadow-md">
                                                {tester.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-gray-800 line-clamp-1">{tester}</p>
                                                <p className="text-[10px] text-tata-purple font-bold uppercase tracking-widest">Quality Assurance</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 bg-white p-4 rounded-2xl border border-gray-100/50">
                                            <div className="flex-1 text-center border-r border-gray-50">
                                                <p className="text-2xl font-black text-gray-800">{raisedCount}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Reported</p>
                                            </div>
                                            <div className="flex-1 text-center border-r border-gray-50">
                                                <p className="text-2xl font-black text-emerald-500">{metrics.bugsClosedByTester?.[tester] || 0}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Verified Closed</p>
                                            </div>
                                            <div className="flex-1 text-center">
                                                <p className="text-2xl font-black text-pink-500">{metrics.invalidBugsRaisedByTester?.[tester] || 0}</p>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Invalid</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm font-bold text-gray-400 col-span-full">No tester metrics found in this period.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;

