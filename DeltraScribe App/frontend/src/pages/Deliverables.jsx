import { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  Server, 
  Globe,
  Truck,
  ArrowRight
} from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import configService from '../services/configService';
import { useNotification } from '../context/NotificationContext';

const Deliverables = () => {
    const [sections, setSections] = useState({
        SIT: [],
        UAT: [],
        PROD: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const { showNotification } = useNotification();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            await configService.fetchConfigs();
            const sitStatus = configService.getConfig('STATUS_SIT_DEPLOYED', 'SIT_COMPLETED');
            const uatStatus = configService.getConfig('STATUS_UAT_DEPLOYED', 'UAT_COMPLETED');
            const prodStatus = configService.getConfig('STATUS_PROD_READY', 'CLOSED');

            const [tasksRes, bugsRes] = await Promise.all([
                apiClient.get('/tasks', { params: { size: 1000, showClosed: true } }),
                apiClient.get('/bugs', { params: { size: 1000, showClosed: true } })
            ]);

            const tasksData = tasksRes.data.content || tasksRes.data;
            const bugsData = bugsRes.data.content || bugsRes.data;

            const allItems = [
                ...tasksData.map(t => ({ ...t, entityType: 'task' })),
                ...bugsData.map(b => ({ ...b, entityType: 'bug' }))
            ];

            setSections({
                SIT: allItems.filter(item => item.status === sitStatus),
                UAT: allItems.filter(item => item.status === uatStatus),
                PROD: allItems.filter(item => item.status === prodStatus)
            });
        } catch (error) {
            console.error('Error fetching deliverables:', error);
            showNotification('Failed to load deliverables.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 flex items-center justify-center"><Logo className="animate-spin text-deltascribe-emerald w-8 h-8" color="currentColor" /></div>;

    const Section = ({ title, icon: Icon, items, colorClass }) => (
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex-1 flex flex-col min-h-[600px] animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <div className={`p-4 rounded-3xl ${colorClass.bg} ${colorClass.text}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">{title}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{items.length} Deliverables</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colorClass.badge}`}>
                    Ready
                </div>
            </div>

            <div className="space-y-4 flex-1">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <Truck className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Bucket Empty</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={`${item.entityType}-${item.id}`} className="p-5 bg-gray-50 rounded-[32px] border border-gray-100 hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all group cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                    {item.jtrackId || `DT-${item.id}`}
                                </span>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                            </div>
                            <h3 className="font-bold text-gray-700 leading-tight group-hover:text-deltascribe-emerald transition-colors">{item.title}</h3>
                                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-5 h-5 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[8px] font-black text-gray-400 shadow-sm">
                                            {item.assignedDeveloper?.fullName?.charAt(0) || 'U'}
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{item.assignedDeveloper?.fullName?.split(' ')[0] || 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[8px] font-black text-gray-300 uppercase tracking-tighter">{item.entityType}</span>
                                        <span className="text-[10px] font-bold text-indigo-400">
                                            {title.includes('SIT') ? item.sitDate : title.includes('UAT') ? item.uatDate : item.productionDate}
                                        </span>
                                    </div>
                                </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 min-h-screen bg-gray-50/50 p-6 -m-6 rounded-[60px]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                   <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Release Management</h1>
                   <p className="text-gray-500 font-medium">Tracking deliverables across deployment environments.</p>
                </div>
                <div className="flex bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
                    <button className="px-6 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95">
                        Active Release
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <Section 
                    title="SIT Bucket" 
                    icon={Server} 
                    items={sections.SIT} 
                    colorClass={{
                        bg: 'bg-indigo-50',
                        text: 'text-indigo-600',
                        badge: 'bg-indigo-100 text-indigo-700'
                    }}
                />
                <Section 
                    title="UAT Bucket" 
                    icon={Package} 
                    items={sections.UAT} 
                    colorClass={{
                        bg: 'bg-amber-50',
                        text: 'text-amber-600',
                        badge: 'bg-amber-100 text-amber-700'
                    }}
                />
                <Section 
                    title="PROD Bucket" 
                    icon={Globe} 
                    items={sections.PROD} 
                    colorClass={{
                        bg: 'bg-emerald-50',
                        text: 'text-emerald-600',
                        badge: 'bg-emerald-100 text-emerald-700'
                    }}
                />
            </div>
        </div>
    );
};

export default Deliverables;
