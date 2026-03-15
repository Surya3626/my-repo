import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, Bug, AlertCircle, ChevronRight,
    Target, Calendar, ChevronDown, FileSpreadsheet, List, Layout
} from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import * as XLSX from 'xlsx';
import authService from '../services/authService';
import BugModal from '../components/BugModal';
import { useNotification } from '../context/NotificationContext';

const Bugs = () => {
    const [bugs, setBugs] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedBug, setSelectedBug] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState({});
    const [statusFilter, setStatusFilter] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();
    const isTester = currentUser?.roles?.some(r => r.includes('TESTER') || r.includes('TESTADMIN'));
    const isDeveloper = currentUser?.roles?.some(r => r.includes('DEVELOPER'));

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [bugsRes, tasksRes] = await Promise.all([
                apiClient.get('/bugs'),
                apiClient.get('/bugtasks')
            ]);
            setBugs(bugsRes.data);
            setTasks(tasksRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            const msg = error.response?.data?.message || error.response?.data || 'Failed to retrieve bugs.';
            showNotification(typeof msg === 'string' ? msg : 'Failed to retrieve bugs.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);


    const toggleTask = (taskId) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const handleExportToExcel = () => {
        const dataForExport = (isDeveloper ? bugs.filter(b => b.assignedDeveloper?.id === currentUser.id) : bugs).map(bug => ({
            'Track ID': bug.jtrackId || `B-${bug.id}`,
            'Title': bug.title,
            'Task ID': bug.bugTask?.jtrackId || 'No Task',
            'Task Name': bug.bugTask?.title || 'No Task',
            'Severity': bug.severity,
            'Priority': bug.priority,
            'Status': bug.status,
            'Assignee': bug.assignedDeveloper?.fullName || 'Unassigned',
            'Raised By': bug.raisedBy?.fullName || 'N/A',
            'Created Date': bug.createdDate ? new Date(bug.createdDate).toLocaleDateString() : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bugs Report");
        XLSX.writeFile(wb, `DeltaScribe_Bugs_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Grouping bugs by taskId
    // Apply Developer filter, Status filter, and Severity filter here
    const filteredBugsForView = bugs.filter(b => {
        const isAssignedToDev = !isDeveloper || b.assignedDeveloper?.id === currentUser.id;
        const matchesStatus = statusFilter === '' || b.status === statusFilter;
        const matchesSeverity = severityFilter === '' || b.severity === severityFilter;
        const matchesClosed = showClosed || (!b.status?.includes('CLOSED') && !b.status?.includes('VERIFIED') && !b.status?.includes('INVALID_BUG'));
        const notPendingReview = b.status !== 'INVALID_PENDING_APPROVAL';
        return isAssignedToDev && matchesStatus && matchesSeverity && matchesClosed && notPendingReview;
    });
    
    const groupedBugs = filteredBugsForView.reduce((acc, bug) => {
        const taskId = bug.bugTask?.id || 'unassigned';
        if (!acc[taskId]) acc[taskId] = [];
        acc[taskId].push(bug);
        return acc;
    }, {});

    const filteredTasks = tasks.filter(task => {
        const hasMatchingBug = groupedBugs[task.id]?.some(bug => 
            bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bug.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               task.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               hasMatchingBug;
    });

    const unassignedBugs = groupedBugs['unassigned']?.filter(bug => 
        bug.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (isLoading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Logo className="animate-spin text-deltascribe-emerald w-8 h-8" color="currentColor" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Bug Management</h1>
                   <p className="text-gray-500 font-medium tracking-tight">Organized by Task (CR/SR/FIX) for enterprise tracking.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 mr-4">
                        <input 
                            type="checkbox" 
                            id="showClosed" 
                            checked={showClosed} 
                            onChange={(e) => setShowClosed(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-deltascribe-emerald focus:ring-deltascribe-emerald"
                        />
                        <label htmlFor="showClosed" className="text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer">Show Closed</label>
                    </div>
                    <button 
                        onClick={handleExportToExcel}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        <span>Export Excel</span>
                    </button>
                    {isTester && (
                        <button 
                            onClick={() => { setSelectedBug(null); setModalOpen(true); }}
                            className="btn-deltascribe flex items-center space-x-2 py-2.5 px-6 shadow-lg shadow-deltascribe-emerald/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Bug</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search bugs or tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white bg-opacity-50 border border-gray-100 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 font-medium transition-all"
                    />
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                    <div className="relative w-full sm:w-auto">
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-100 rounded-2xl py-2.5 pl-4 pr-10 outline-none focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 font-bold text-gray-600 transition-all cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="CLOSED">Closed</option>
                            <option value="BLOCKED">Blocked</option>
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select 
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-100 rounded-2xl py-2.5 pl-4 pr-10 outline-none focus:border-deltascribe-navy focus:ring-4 focus:ring-deltascribe-navy focus:ring-opacity-5 font-bold text-gray-600 transition-all cursor-pointer"
                        >
                            <option value="">All Severities</option>
                            <option value="Critical">Critical</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <Target className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Hierarchical List */}
            <div className="space-y-4">
                {filteredTasks.map(task => {
                    const taskBugs = groupedBugs[task.id] || [];
                    const isExpanded = expandedTasks[task.id];
                    
                    if (taskBugs.length === 0 && !task.title?.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                    return (
                        <div key={task.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div 
                                onClick={() => toggleTask(task.id)}
                                className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-emerald-50/30' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-2xl ${isExpanded ? 'bg-deltascribe-emerald text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-black text-deltascribe-emerald uppercase tracking-widest">{task.jtrackId}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                            <span className="text-sm font-bold text-gray-800">{task.title}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                            {taskBugs.length} {taskBugs.length === 1 ? 'Bug' : 'Bugs'} Identified
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-gray-50 p-4 bg-white">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                                <th className="pb-3 pl-4">Bug ID</th>
                                                <th className="pb-3">Title</th>
                                                <th className="pb-3">Severity</th>
                                                <th className="pb-3">Status</th>
                                                <th className="pb-3 text-right">Assignee</th>
                                                <th className="pb-3 text-right pr-4">Handle</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {taskBugs.map(bug => (
                                                <tr key={bug.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 pl-4">
                                                        <span className="text-xs font-black text-deltascribe-emerald">{bug.jtrackId || `B-${bug.id}`}</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <p className="text-sm font-bold text-gray-800">{bug.title}</p>
                                                        <div className="flex items-center space-x-2 mt-1">
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                                                                By: {bug.raisedBy?.fullName}
                                                            </span>
                                                            <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">•</span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                                {new Date(bug.createdDate).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                            bug.severity === 'Critical' ? 'bg-red-100 text-red-600' : 
                                                            bug.severity === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {bug.severity}
                                                        </span>
                                                    </td>
                                                    <td className="py-4">
                                                        <span className={`status-badge text-[10px] ${
                                                            bug.status === 'OPEN' ? 'status-open' : 
                                                            bug.status === 'RESOLVED' ? 'status-in-progress' : 'status-resolved'
                                                        }`}>
                                                            {bug.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-2 py-1 rounded-lg uppercase">{bug.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                                    </td>
                                                    <td className="py-4 text-right pr-4">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setSelectedBug(bug); setModalOpen(true); }}
                                                            className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-deltascribe-emerald hover:text-white transition-all transform hover:scale-110"
                                                        >
                                                            <Target className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {taskBugs.length === 0 && (
                                        <div className="py-8 text-center text-gray-400 text-xs font-bold">
                                            Clean as a whistle! No bugs reported for this task.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {unassignedBugs.length > 0 && (
                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-2xl bg-slate-200 text-slate-500">
                                    <Bug className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">General / Standalone Bugs</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{unassignedBugs.length} Items</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4">
                             <table className="w-full text-left">
                                <thead>
                                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                        <th className="pb-3 pl-4">Bug ID</th>
                                        <th className="pb-3">Title</th>
                                        <th className="pb-3">Severity</th>
                                        <th className="pb-3">Status</th>
                                        <th className="pb-3 text-right">Assignee</th>
                                        <th className="pb-3 text-right pr-4">Handle</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {unassignedBugs.map(bug => (
                                        <tr key={bug.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 pl-4">
                                                <span className="text-xs font-black text-deltascribe-emerald">{bug.jtrackId || `B-${bug.id}`}</span>
                                            </td>
                                            <td className="py-4">
                                                <p className="text-sm font-bold text-gray-800">{bug.title}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                                                        By: {bug.raisedBy?.fullName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">•</span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                                                        {new Date(bug.createdDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                    bug.severity === 'Critical' ? 'bg-red-100 text-red-600' : 
                                                    bug.severity === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                    {bug.severity}
                                                </span>
                                            </td>
                                            <td className="py-4">
                                                <span className={`status-badge text-[10px] ${
                                                    bug.status === 'OPEN' ? 'status-open' : 
                                                    !bug.status?.includes('CLOSED') ? 'status-in-progress' : 'status-resolved'
                                                }`}>
                                                    {bug.status}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-2 py-1 rounded-lg uppercase">{bug.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button 
                                                        onClick={() => { setSelectedBug(bug); setModalOpen(true); }}
                                                        className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-deltascribe-emerald hover:text-white transition-all transform hover:scale-110"
                                                    >
                                                        <Target className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <BugModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedBug}
                onSave={fetchData}
            />
        </div>
    );
};

export default Bugs;
