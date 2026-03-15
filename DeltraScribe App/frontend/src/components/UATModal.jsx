import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import apiClient from '../api/client';
import { useNotification } from '../context/NotificationContext';

const UATModal = ({ isOpen, onClose, item, onActionSuccess, type = 'uat' }) => {
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showNotification } = useNotification();

    if (!isOpen || !item) return null;

    const handleAction = async (action) => {
        if (!remarks.trim()) {
            showNotification('Remarks are mandatory.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = `/tasks/${item.id}/${action}-${type.toLowerCase()}`;
            const bugEndpoint = `/bugs/${item.id}/${action}-${type.toLowerCase()}`;
            const finalEndpoint = item.entityType === 'task' ? endpoint : bugEndpoint;

            await apiClient.post(finalEndpoint, { remarks });
            showNotification(`Task ${action === 'approve' ? 'approved' : 'rejected'} successfully.`, 'success');
            onActionSuccess();
            onClose();
        } catch (error) {
            console.error(`Error during ${type} ${action}:`, error);
            const msg = error.response?.data?.message || error.response?.data || `Failed to ${action} task.`;
            showNotification(typeof msg === 'string' ? msg : `Failed to ${action} task.`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const phaseLabel = type.toUpperCase() === 'SIT' ? 'SIT SYSTEM CHECK' : 'UAT QUALITY CHECK';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden transform transition-all scale-105 border border-gray-100">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border mb-2 inline-block ${
                                type.toUpperCase() === 'SIT' ? 'text-slate-600 bg-slate-50 border-slate-100' : 'text-deltascribe-emerald bg-emerald-50 border-emerald-100'
                            }`}>
                                {phaseLabel}
                            </span>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Review Task</h2>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-600 transition-all hover:rotate-90">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">TASK ID:</span>
                            <span className="text-sm font-black text-gray-800">{item.jtrackId || `DT-${item.id}`}</span>
                        </div>
                        <h3 className="font-bold text-gray-700 leading-tight">{item.title}</h3>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Testing Remarks (Mandatory)</label>
                        <textarea
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Detail your testing results here..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 min-h-[150px] outline-none focus:ring-4 focus:ring-deltascribe-emerald focus:ring-opacity-10 focus:border-deltascribe-emerald transition-all font-medium text-gray-700"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            disabled={isSubmitting}
                            onClick={() => handleAction('reject')}
                            className="flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl font-black uppercase tracking-widest transition-all transform active:scale-95 border border-gray-100 bg-white text-gray-500 hover:bg-gray-50 shadow-sm"
                        >
                            <XCircle className="w-5 h-5" />
                            <span>Reject</span>
                        </button>
                        <button
                            disabled={isSubmitting}
                            onClick={() => handleAction('approve')}
                            className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl font-black uppercase tracking-widest transition-all transform active:scale-95 border shadow-sm ${
                                type.toUpperCase() === 'SIT' 
                                ? 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-600 hover:text-white' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                            }`}
                        >
                            <CheckCircle className="w-5 h-5" />
                            <span>Approve</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UATModal;
