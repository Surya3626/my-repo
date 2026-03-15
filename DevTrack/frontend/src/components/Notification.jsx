import React from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const Notification = () => {
    const { notification, hideNotification } = useNotification();

    if (!notification) return null;

    const { message, type } = notification;

    const styles = {
        error: 'bg-red-50 border-red-200 text-red-800 shadow-red-100',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100',
        info: 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100'
    };

    const icons = {
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    return (
        <div className="fixed top-6 right-6 z-[9999] animate-slide-in">
            <div className={`flex items-center space-x-4 p-4 rounded-[28px] border shadow-2xl min-w-[320px] max-w-md ${styles[type] || styles.error}`}>
                <div className="flex-shrink-0">
                    {icons[type] || icons.error}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-black tracking-tight">{type === 'error' ? 'System Exception' : 'Notification'}</p>
                    <p className="text-xs font-medium opacity-80">{message}</p>
                </div>
                <button 
                    onClick={hideNotification}
                    className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                    <X className="w-4 h-4 opacity-50" />
                </button>
            </div>
        </div>
    );
};

export default Notification;
