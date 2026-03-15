import { useState, useEffect } from 'react';
import { Search, Activity, Tag, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../api/client';
import TaskModal from '../components/TaskModal';
import { useNotification } from '../context/NotificationContext';

const CodeReviewPage = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/tasks/current?type=CODE_REVIEW`);
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            showNotification('Could not load code review tasks.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              task.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPriority = priorityFilter === '' || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    if (isLoading) return <div className="p-8"><Activity className="animate-spin text-tata-purple" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                        Code Review Pool
                   </h1>
                   <p className="text-purple-200 font-medium">Verify code quality and adherence to standards.</p>
                </div>
            </div>

            <div className="glass-morphism p-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search reviews..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-2.5 pl-11 pr-4 outline-none focus:border-tata-purple text-white font-medium transition-all"
                    />
                </div>
                <div className="relative">
                    <select 
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="appearance-none bg-white/10 border border-white/20 rounded-2xl py-2.5 pl-4 pr-10 outline-none text-white font-bold cursor-pointer"
                    >
                        <option value="" className="text-gray-900">All Priorities</option>
                        <option value="Highest" className="text-gray-900">Highest</option>
                        <option value="High" className="text-gray-900">High</option>
                        <option value="Medium" className="text-gray-900">Medium</option>
                        <option value="Low" className="text-gray-900">Low</option>
                    </select>
                    <BarChart2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-gray-400 font-bold glass-morphism">
                        No tasks pending code review.
                    </div>
                ) : filteredTasks.map((task) => (
                    <div 
                        key={task.id} 
                        className="glass-morphism p-6 hover:shadow-2xl hover:-translate-y-1 transition-all group cursor-pointer border-l-4 border-tata-purple"
                        onClick={() => { setSelectedTask(task); setModalOpen(true); }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <span className="text-[10px] font-black text-tata-purple uppercase tracking-widest bg-purple-50/10 px-3 py-1 rounded-full border border-tata-purple/20">
                                {task.jtrackId}
                            </span>
                            <div className="flex space-x-1">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                                <XCircle className="w-4 h-4 text-red-400" />
                            </div>
                        </div>

                        <h3 className="text-lg font-black text-white mb-2 line-clamp-1 group-hover:text-tata-purple transition-colors">
                            {task.title}
                        </h3>
                        <div className="bg-white/5 rounded-xl p-3 mb-4">
                            <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Git Links</span>
                            <p className="text-xs text-blue-300 font-mono truncate">{task.gitLinks || 'No links provided'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center space-x-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Developer</span>
                                    <span className="text-xs font-black text-white">{task.assignedDeveloper?.fullName || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="p-2 rounded-xl bg-white/5 text-gray-400 group-hover:bg-tata-purple group-hover:text-white transition-all">
                                <Activity className="w-4 h-4" />
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

export default CodeReviewPage;
