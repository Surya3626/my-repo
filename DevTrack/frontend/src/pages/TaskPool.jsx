import { useState, useEffect } from 'react';
import { 
  Search, 
  Activity, 
  HandMetal, 
  Clock, 
  Zap,
  Target,
  SearchCode
} from 'lucide-react';
import apiClient from '../api/client';
import PoolModal from '../components/PoolModal';
import { useNotification } from '../context/NotificationContext';

const TaskPool = () => {
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [tasksRes, bugsRes] = await Promise.all([
                apiClient.get('/tasks'),
                apiClient.get('/bugs')
            ]);

            const allItems = [
                ...tasksRes.data.map(t => ({ ...t, entityType: 'task' })),
                ...bugsRes.data.map(b => ({ ...b, entityType: 'bug' }))
            ];

            // Filter for tasks in pool
            const poolItems = allItems.filter(item => item.inPool);

            setItems(poolItems.sort((a, b) => new Date(b.inPoolDate || b.updatedDate) - new Date(a.inPoolDate || a.updatedDate)));
        } catch (error) {
            console.error('Error fetching pool tasks:', error);
            showNotification('Failed to load task pool.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredItems = items.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jtrackId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 flex items-center justify-center"><Activity className="animate-spin text-tata-pink" /></div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-5">
                    <div className="p-4 bg-black text-white rounded-[32px] shadow-2xl shadow-black/20">
                        <Zap className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">The Task Pool</h1>
                        <p className="text-gray-500 font-medium italic">Universal unassigned tasks ready for action.</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-100 p-6 rounded-[32px] flex flex-col md:flex-row gap-4 shadow-sm items-center">
                <div className="flex-1 relative w-full">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for your next challenge..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-[28px] py-4 pl-14 pr-6 outline-none focus:ring-4 focus:ring-black focus:ring-opacity-5 focus:bg-white transition-all font-bold text-gray-700"
                    />
                </div>
                <div className="hidden md:flex flex-col items-end px-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Now</span>
                    <span className="text-2xl font-black text-black">{items.length}</span>
                </div>
            </div>

            {/* Pool grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.length === 0 ? (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center opacity-30 grayscale">
                        <Target className="w-20 h-20 mb-4" />
                        <h3 className="text-2xl font-black uppercase tracking-widest">Pool Dry</h3>
                    </div>
                ) : filteredItems.map((item) => (
                    <div 
                        key={`${item.entityType}-${item.id}`} 
                        className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] transition-all group flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-6">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 shadow-sm">
                                    {item.jtrackId || `DT-${item.id}`}
                                </span>
                                <div className="p-2.5 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-all transform group-hover:rotate-12">
                                    <SearchCode className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-gray-800 leading-tight mb-4 group-hover:text-tata-pink transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-400 font-medium line-clamp-2 mb-6">
                                {item.description || 'No description provided.'}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                <div className="flex items-center space-x-2 text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(item.inPoolDate || item.updatedDate).toLocaleDateString()}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-300 uppercase italic tracking-widest">{item.priority}</span>
                            </div>

                            <button 
                                onClick={() => {
                                    setSelectedItem(item);
                                    setModalOpen(true);
                                }}
                                className="w-full py-4 bg-gray-50 text-gray-500 group-hover:bg-black group-hover:text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-transparent group-hover:shadow-black/20"
                            >
                                Pick Task
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <PoolModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                item={selectedItem}
                onActionSuccess={fetchData}
            />
        </div>
    );
};

export default TaskPool;
