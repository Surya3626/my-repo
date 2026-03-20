import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Plus, Search, Filter, CheckSquare, Clock, AlertCircle, ChevronRight, Tag, BarChart2, Download, Zap } from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import authService from '../services/authService';
import TaskModal from '../components/TaskModal';
import Pagination from '../components/Pagination';
import { useNotification } from '../context/NotificationContext';

const AllTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    // Pagination states
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();

    useEffect(() => {
        fetchAllTasks(0);
    }, [showClosed]);

    const fetchAllTasks = async (pageNumber = 0) => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/tasks`, {
                params: {
                    page: pageNumber,
                    size: pageSize,
                    showClosed: showClosed
                }
            });
            
            if (response.data.content) {
                setTasks(response.data.content);
                setTotalPages(response.data.totalPages);
                setTotalElements(response.data.totalElements);
                setPage(response.data.number);
            } else {
                setTasks(response.data);
                setTotalPages(1);
                setPage(0);
            }
        } catch (error) {
            console.error('Error fetching all tasks:', error);
            showNotification('Failed to load enterprise task list. Check your role permissions.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        const dataForExport = tasks.map(task => ({
            'Track ID': task.jtrackId || `T-${task.id}`,
            'Title': task.title,
            'Status': task.status,
            'Type': task.type?.name || 'N/A',
            'Priority': task.priority,
            'Assignee': task.assignedDeveloper?.fullName || 'Unassigned',
            'SIT Date': task.sitDate || 'N/A',
            'UAT Date': task.uatDate || 'N/A',
            'Prod Date': task.productionDate || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(dataForExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Enterprise Tasks");
        XLSX.writeFile(wb, `DeltaScribe_Enterprise_Tasks_${new Date().toISOString().split('T')[0]}.xlsx`);
    };


    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             task.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClosed = showClosed || task.status !== 'CLOSED';
        return matchesSearch && matchesClosed;
    });

    if (isLoading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Logo className="animate-spin text-deltascribe-emerald w-8 h-8" color="currentColor" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">Enterprise Task Oversight</h1>
                   <p className="text-gray-500 font-medium">Global view of all Project Tasks (CR/SR/FIX).</p>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 mr-4">
                        <input 
                            type="checkbox" 
                            id="showClosedEnterprise" 
                            checked={showClosed} 
                            onChange={(e) => setShowClosed(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-deltascribe-emerald focus:ring-deltascribe-emerald"
                        />
                        <label htmlFor="showClosedEnterprise" className="text-xs font-black text-gray-500 uppercase tracking-widest cursor-pointer">Show Closed</label>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="btn-glass flex items-center space-x-2 py-2.5 px-6 shadow-sm border border-gray-100 font-bold text-gray-700 hover:text-deltascribe-emerald transition-all"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Excel</span>
                    </button>
                    <button 
                        onClick={() => { setSelectedTask(null); setModalOpen(true); }}
                        className="btn-deltascribe flex items-center space-x-2 py-2.5 px-6 shadow-lg shadow-deltascribe-emerald/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create New Task</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search across all tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white bg-opacity-50 border border-gray-100 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-5 font-medium transition-all"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <button className="p-2.5 rounded-xl bg-white border border-gray-100 text-gray-400 hover:text-deltascribe-emerald transition-all">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                        onClick={() => { setSelectedTask(task); setModalOpen(true); }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-[10px] font-black text-deltascribe-emerald uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                                {task.jtrackId || `T-${task.id}`}
                            </span>
                            <span className={`status-badge text-[10px] ${
                                task.status === 'OPEN' ? 'status-open' : 
                                task.status === 'IN_PROGRESS' ? 'status-in-progress' : 
                                task.status === 'CLOSED' ? 'status-resolved' : 'bg-gray-100 text-gray-600'
                            }`}>
                                {task.status.replace('_', ' ')}
                            </span>
                        </div>

                        <h3 className="text-lg font-black text-gray-800 mb-2 line-clamp-1 group-hover:text-deltascribe-emerald transition-colors">
                            {task.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                            {task.description || 'No description provided.'}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50 mt-auto">
                            <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Assignee</span>
                                    <span className="text-xs font-black text-gray-700 truncate max-w-[80px]">{task.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-400 font-bold uppercase">Type</span>
                                <span className="text-xs font-black text-deltascribe-navy uppercase">{task.type?.name}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={fetchAllTasks} 
                isLoading={isLoading} 
            />

            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedTask}
                onSave={() => fetchAllTasks(page)}
            />
        </div>
    );
};

export default AllTasks;
