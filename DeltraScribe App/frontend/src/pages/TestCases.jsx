import { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, TestTube2, AlertCircle, ChevronRight, Zap, 
    Trash2, CheckCircle2, FlaskConical, ChevronDown, FileSpreadsheet, List, Layout
} from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import * as XLSX from 'xlsx';
import authService from '../services/authService';
import TestCaseModal from '../components/TestCaseModal';
import Pagination from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

const TestCases = () => {
    const [testCases, setTestCases] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTestCase, setSelectedTestCase] = useState(null);
    const [expandedTasks, setExpandedTasks] = useState({});
    const [showClosed, setShowClosed] = useState(false);
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();
    const isQA = currentUser?.roles?.some(r => r.includes('TESTER') || r.includes('TESTADMIN') || r.includes('ADMIN'));

    const fetchData = async (pageNumber = 0) => {
        setIsLoading(true);
        try {
            const [tcRes, tasksRes] = await Promise.all([
                apiClient.get('/testcases', {
                    params: {
                        page: pageNumber,
                        size: pageSize,
                        showClosed: showClosed
                    }
                }),
                apiClient.get('/test-case-tasks')
            ]);
            
            if (tcRes.data.content) {
                setTestCases(tcRes.data.content);
                setTotalPages(tcRes.data.totalPages);
                setTotalElements(tcRes.data.totalElements);
                setPage(tcRes.data.number);
            } else {
                setTestCases(tcRes.data);
                setTotalPages(1);
                setPage(0);
            }
            setTasks(tasksRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showNotification('Failed to sync with QA Engine. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(0);
    }, [showClosed]);

    const toggleTask = (taskId) => {
        setExpandedTasks(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const handleExportToExcel = () => {
        const dataForExport = testCases.map(tc => ({
            'ID': tc.id,
            'Task ID': tc.task?.jtrackId || 'N/A',
            'Title': tc.title,
            'Description': tc.description,
            'Steps': tc.steps,
            'Expected Result': tc.expectedResult,
            'Created By': tc.createdBy?.fullName || 'N/A',
            'Created Date': tc.createdDate ? new Date(tc.createdDate).toLocaleDateString() : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Test Cases Report");
        XLSX.writeFile(wb, `DeltaScribe_TestCases_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Grouping test cases by taskId
    const groupedTCs = testCases.reduce((acc, tc) => {
        if (!showClosed && tc.status === 'CLOSED') return acc;
        const taskId = tc.testCaseTask?.id || 'unassigned';
        if (!acc[taskId]) acc[taskId] = [];
        acc[taskId].push(tc);
        return acc;
    }, {});

    const filteredTasks = tasks.filter(task => {
        const hasMatchingTC = groupedTCs[task.id]?.some(tc => 
            tc.title?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
               task.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               hasMatchingTC;
    });

    const unassignedTCs = groupedTCs['unassigned']?.filter(tc => 
        tc.title?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (isLoading) return <div className="p-8 text-center text-deltascribe-emerald font-bold flex items-center justify-center min-h-[60vh]"><Logo className="animate-spin mr-3 w-8 h-8" />Initializing QA Engine...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">QA Management</h1>
                   <p className="text-gray-500 font-medium tracking-tight">Execute and track test scenarios mapped to project tasks.</p>
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
                    {isQA && (
                        <button 
                            onClick={() => { setSelectedTestCase(null); setModalOpen(true); }}
                            className="btn-deltascribe flex items-center space-x-2 py-2.5 px-6 shadow-lg shadow-deltascribe-emerald/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Create Test Case</span>
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
                        placeholder="Search test cases or tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white bg-opacity-50 border border-gray-100 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 font-medium transition-all"
                    />
                </div>
            </div>

            {/* Hierarchical List */}
            <div className="space-y-4">
                {filteredTasks.map(task => {
                    const taskTCs = groupedTCs[task.id] || [];
                    const isExpanded = expandedTasks[task.id];
                    
                    if (taskTCs.length === 0 && !task.title?.toLowerCase().includes(searchTerm.toLowerCase())) return null;

                    return (
                        <div key={task.id} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                            <div 
                                onClick={() => toggleTask(task.id)}
                                className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-2xl ${isExpanded ? 'bg-deltascribe-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Layout className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-[10px] font-black text-deltascribe-navy uppercase tracking-widest">{task.jtrackId}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                            <span className="text-sm font-bold text-gray-800">{task.title}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                            {taskTCs.length} {taskTCs.length === 1 ? 'Test Case' : 'Test Cases'} Available
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="border-t border-gray-50 p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {taskTCs.map(tc => (
                                        <div 
                                            key={tc.id} 
                                            onClick={(e) => { e.stopPropagation(); setSelectedTestCase(tc); setModalOpen(true); }}
                                            className="p-6 rounded-3xl border border-gray-50 hover:border-deltascribe-emerald/30 hover:shadow-xl transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <TestTube2 className="w-4 h-4 text-emerald-500" />
                                                <span className="text-[10px] font-black text-gray-300 uppercase">TC-{tc.id}</span>
                                            </div>
                                            <h4 className="text-sm font-black text-gray-800 group-hover:text-deltascribe-emerald transition-colors line-clamp-2 mb-2">{tc.title}</h4>
                                            <p className="text-xs text-gray-400 font-medium line-clamp-2">{tc.description || 'No description provided.'}</p>
                                            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                                <div className={`flex items-center space-x-1 ${
                                                    tc.status === 'PASS' ? 'text-emerald-500' :
                                                    tc.status === 'FAIL' ? 'text-red-500' :
                                                    tc.status === 'IN_PROGRESS' ? 'text-deltascribe-navy' : 'text-gray-400'
                                                }`}>
                                                    {tc.status === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : (tc.status === 'FAIL' ? <XCircle className="w-3 h-3" /> : <Logo className="w-3 h-3 animate-pulse" />)}
                                                    <span className="text-[8px] font-black uppercase">{tc.status || 'OPEN'}</span>
                                                </div>
                                                <span className="text-[8px] text-gray-400 font-bold uppercase">{tc.createdBy?.fullName || 'QA'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {taskTCs.length === 0 && (
                                        <div className="col-span-full py-8 text-center text-gray-400 text-xs font-bold">
                                            No test scenarios mapped to this task yet.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {unassignedTCs.length > 0 && (
                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 bg-gray-50 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-2xl bg-slate-200 text-slate-500">
                                    <FlaskConical className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Standalone Test Cases</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{unassignedTCs.length} Items</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {unassignedTCs.map(tc => (
                                <div 
                                    key={tc.id} 
                                    onClick={() => { setSelectedTestCase(tc); setModalOpen(true); }}
                                    className="p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer"
                                >
                                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{tc.title}</p>
                                </div>
                             ))}
                        </div>
                    </div>
                )}
            </div>

            <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={fetchData} 
                isLoading={isLoading} 
            />

            <TestCaseModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedTestCase}
                onSave={() => fetchData(page)}
            />
        </div>
    );
};

export default TestCases;
