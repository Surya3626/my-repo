import { useState, useEffect } from 'react';
import { Plus, Search, Filter, CheckSquare, Clock, AlertCircle, ChevronRight, Tag, BarChart2 } from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import authService from '../services/authService';
import TaskModal from '../components/TaskModal';
import { useNotification } from '../context/NotificationContext';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [showClosed, setShowClosed] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    const { showNotification } = useNotification();
    const currentUser = authService.getCurrentUser();
    const isDeveloper = currentUser?.roles?.includes('ROLE_DEVELOPER');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/tasks/my`);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showNotification('Could not load your tasks. Our servers might be busy.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              task.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === '' || task.status === statusFilter;
        const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
        const matchesClosed = showClosed || task.status !== 'CLOSED';
        return matchesSearch && matchesStatus && matchesPriority && matchesClosed;
    });

    if (isLoading) return <div className="p-8 flex items-center justify-center min-h-[40vh]"><Logo className="animate-spin w-8 h-8 text-deltascribe-emerald" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {isDeveloper ? 'My Active Tasks' : 'Project Tasks'}
                   </h1>
                   <p className="text-gray-500 font-medium">Manage CRs, SRs, and feature fixes.</p>
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
                        onClick={() => { setSelectedTask(null); setModalOpen(true); }}
                        className="btn-deltascribe flex items-center space-x-2 py-2.5 px-6 shadow-lg shadow-deltascribe-emerald/20"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Task</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col md:flex-row gap-4 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by ID or Title..."
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
                            <option value="SIT_COMPLETED">SIT Completed</option>
                            <option value="UAT_COMPLETED">UAT Completed</option>
                            <option value="PREPROD_COMPLETED">PREPROD Completed</option>
                            <option value="PROD_COMPLETED">PROD Completed</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <select 
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-100 rounded-2xl py-2.5 pl-4 pr-10 outline-none focus:border-deltascribe-navy focus:ring-4 focus:ring-deltascribe-navy focus:ring-opacity-5 font-bold text-gray-600 transition-all cursor-pointer"
                        >
                            <option value="">All Priorities</option>
                            <option value="Highest">Highest</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                        </select>
                        <BarChart2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Tasks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 font-bold">
                        No tasks found matching your filters.
                    </div>
                ) : filteredTasks.map((task) => (
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
                            {task.description || 'No description provided for this task.'}
                        </p>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                            <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Assignee</span>
                                    <span className="text-xs font-black text-gray-700">{task.assignedDeveloper?.fullName || 'Unassigned'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Priority</span>
                                    <span className={`text-[10px] font-bold ${
                                        task.priority === 'Highest' ? 'text-red-500' : 
                                        task.priority === 'High' ? 'text-orange-500' : 'text-blue-500'
                                    }`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Type</span>
                                    <span className="text-xs font-black text-deltascribe-navy uppercase">{task.type?.name}</span>
                                </div>
                            </div>
                            <div className="p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-deltascribe-emerald group-hover:text-white transition-all transform group-hover:rotate-12">
                                <Tag className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <TaskModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedTask}
                onSave={fetchTasks}
            />
        </div>
    );
};

export default Tasks;
