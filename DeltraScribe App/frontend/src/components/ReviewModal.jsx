import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitPullRequest, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  MessageSquare, 
  User, 
  Clock, 
  Tag,
  AlertCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import apiClient from '../api/client';
import { useNotification } from '../context/NotificationContext';
import authService from '../services/authService';

const ReviewModal = ({ isOpen, onClose, item, onSave }) => {
  const [formData, setFormData] = useState({
    codeReviewComments: '',
    remarks: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (item) {
      setFormData({
        codeReviewComments: item.codeReviewComments || '',
        remarks: ''
      });
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleAction = async (actionType) => {
    const comments = formData.codeReviewComments?.trim();
    if (!comments) {
      return showNotification('Please provide feedback/remarks for this review.', 'error');
    }
    
    setIsSubmitting(true);
    try {
      const payload = { 
        ...item,
        codeReviewComments: formData.codeReviewComments,
        remarks: actionType === 'approve' ? 'Code review approved.' : 'Code review rejected: ' + formData.codeReviewComments
      };
      
      // Structure nested objects for JPA
      if (item.assignedDeveloper) payload.assignedDeveloper = { id: item.assignedDeveloper.id };
      if (item.workflow) payload.workflow = { id: item.workflow.id };
      
      // Remove UI-only fields that might break the backend
      delete payload.entityType;

      const endpoint = actionType === 'approve' ? 'approve' : 'reject';
      const url = `/${item.entityType === 'bugTask' ? 'bugtasks' : 'tasks'}`;
      await apiClient.post(`${url}/${item.id}/${endpoint}`, payload);
      
      showNotification(`Code review ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`, 'success');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error in code review action:', error);
      showNotification(error.response?.data || 'Action failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden animate-zoom-in border border-white/20">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-deltascribe-emerald/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-deltascribe-navy/5 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative p-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-md">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <GitPullRequest className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black text-deltascribe-emerald uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg">
                  {item.jtrackId || `T-${item.id}`}
                </span>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg">
                  {item.type?.name || item.type}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-800 mt-1">Reviewing Code Implementation</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Title Area */}
          <section>
            <h3 className="text-xl font-black text-slate-800 leading-tight mb-2">{item.title}</h3>
            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-bold">{item.assignedDeveloper?.fullName}</span>
               </div>
               <div className="flex items-center space-x-2 text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold">{new Date().toLocaleDateString()}</span>
               </div>
            </div>
          </section>

          {/* Git Links Section */}
          <section className="space-y-4">
            <label className="flex items-center space-x-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <ExternalLink className="w-4 h-4" />
              <span>Pull Request & Documentation Links</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {item.gitLinks?.split(',').map((link, idx) => {
                const trimLink = link.trim();
                if (!trimLink) return null;
                return (
                  <a 
                    key={idx} 
                    href={trimLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl group hover:bg-emerald-50 transition-all shadow-sm"
                  >
                    <div className="flex items-center space-x-3 truncate">
                       <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                       </div>
                       <span className="text-sm font-bold text-emerald-700 truncate">{trimLink}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                );
              })}
              {!item.gitLinks && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center space-x-3 text-amber-700">
                   <AlertCircle className="w-5 h-5" />
                   <span className="text-sm font-bold">No Git links provided for this review.</span>
                </div>
              )}
            </div>
          </section>

          {/* Feedback Form */}
          <section className="space-y-4">
            <label className="flex items-center space-x-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <MessageSquare className="w-4 h-4" />
              <span>Review Feedback & Quality Checklist</span>
            </label>
            <textarea
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[32px] font-bold text-slate-700 focus:bg-white focus:border-deltascribe-emerald focus:ring-4 focus:ring-deltascribe-emerald/5 transition-all outline-none min-h-[120px] shadow-inner"
              placeholder="Provide constructive feedback, identify bugs, or list improvements needed..."
              value={formData.codeReviewComments}
              onChange={(e) => setFormData({ ...formData, codeReviewComments: e.target.value })}
              readOnly={item.status !== 'CODE_REVIEW' || currentUser?.roles?.includes('ROLE_DEVELOPER')}
            />
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50/80 backdrop-blur-sm border-t border-gray-100 flex items-center justify-center space-x-3">
          {item.status === 'CODE_REVIEW' ? (
            <>
              <button 
                disabled={isSubmitting}
                onClick={() => handleAction('reject')}
                className="flex-1 flex items-center justify-center space-x-3 py-3 px-6 bg-red-50 text-red-600 rounded-xl font-black text-xs uppercase tracking-widest shadow-sm hover:bg-red-500 hover:text-white transition-all active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject & Return</span>
              </button>
              <button 
                disabled={isSubmitting}
                onClick={() => handleAction('approve')}
                className="flex-1 flex items-center justify-center space-x-3 py-3 px-6 bg-deltascribe-emerald text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-deltascribe-emerald/20 hover:scale-[1.02] transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Review</span>
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2 text-emerald-600 font-black uppercase tracking-widest text-xs">
                <CheckCircle2 className="w-5 h-5" />
                <span>Review Completed on {new Date(item.updatedDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ReviewModal;
