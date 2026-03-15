import React, { useState } from 'react';
import { X, HandMetal, AlertCircle, CheckCircle2, Activity } from 'lucide-react';
import apiClient from '../api/client';
import { useNotification } from '../context/NotificationContext';

const PoolModal = ({ isOpen, onClose, item, onActionSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();

    if (!isOpen || !item) return null;

    const handlePickTask = async () => {
        setIsSubmitting(true);
        try {
            const endpoint = `/${item.entityType === 'task' ? 'tasks' : 'bugs'}/${item.id}/pick-from-pool`;
            await apiClient.post(endpoint);
            showNotification('Task picked and assigned to you!', 'success');
            onActionSuccess();
            onClose();
        } catch (error) {
            console.error('Error picking task from pool:', error);
            showNotification(error.response?.data || 'Failed to pick task.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden transform transition-all border border-gray-100 p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="p-4 bg-indigo-50 rounded-3xl text-indigo-600">
                        <HandMetal className="w-6 h-6" />
                    </div>
                    <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pick this Task?</h2>
                    <p className="text-gray-500 font-medium">Once picked, it will be assigned to you and removed from the public pool.</p>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">ID: {item.jtrackId || `DT-${item.id}`}</span>
                    <h3 className="font-bold text-gray-800 leading-tight">{item.title}</h3>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        disabled={isSubmitting}
                        onClick={handlePickTask}
                        className="w-full flex items-center justify-center space-x-2 bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all transform active:scale-95 shadow-xl shadow-black/10"
                    >
                        {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : <HandMetal className="w-5 h-5" />}
                        <span>Pick & Assign to Me</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PoolModal;
