import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  MessageSquare, 
  History, 
  Info,
  Bug,
  Upload,
  File,
  AlertCircle,
  ChevronRight,
  Send
} from 'lucide-react';
import { createPortal } from 'react-dom';
import apiClient from '../api/client';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const BugModal = ({ isOpen, onClose, item, onSave }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [tasks, setTasks] = useState([]); // For linking to bugtasks
  const [users, setUsers] = useState([]);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskDescription, setQuickTaskDescription] = useState('');
  const [quickTaskJtrackId, setQuickTaskJtrackId] = useState('');
  const [quickTaskType, setQuickTaskType] = useState(''); // Initialize empty
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [taskTypes, setTaskTypes] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [snapshottedSteps, setSnapshottedSteps] = useState([]);
  
  const { showNotification } = useNotification();
  const currentUser = authService.getCurrentUser();
  const isTerminalState = item?.status === 'CLOSED' || item?.status === 'VERIFIED&CLOSED' || item?.status === 'INVALID_BUG';

  useEffect(() => {
    if (!isOpen) return;

    fetchUsers();
    fetchWorkflows();
    fetchTaskTypes();
    fetchTasks();

    if (item) {
      setFormData({ 
        ...item,
        assignedDeveloperId: item.assignedDeveloper?.id,
        taskId: item.bugTask?.id,
        workflowId: item.workflow?.id,
        severity: item.severity || 'Medium'
      });
      if (item.workflow) {
          setSelectedWorkflow(item.workflow);
          fetchSnapshottedSteps();
      }
      fetchComments();
      fetchAuditLogs();
      fetchAttachments();
    } else {
      setFormData({
        status: 'OPEN',
        priority: 'Medium',
        severity: 'Medium'
      });
    }
  }, [item, isOpen]);

  const fetchAttachments = async () => {
    try {
        const res = await apiClient.get(`/attachments/bug/${item.id}`);
        setAttachments(res.data);
    } catch (e) {
        console.error(e);
        showNotification('Failed to fetch attachments', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!item?.id) {
        // Creation mode: store in pending
        setPendingFiles([...pendingFiles, file]);
        showNotification(`${file.name} added to upload queue.`, 'info');
        return;
    }

    const formDataFile = new FormData();
    formDataFile.append('file', file);
    formDataFile.append('entityType', 'BUG');
    formDataFile.append('entityId', item.id);

    try {
        await apiClient.post('/attachments/upload', formDataFile, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        fetchAttachments();
        showNotification('File uploaded successfully!', 'success');
    } catch (e) {
        showNotification('Failed to upload file', 'error');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/comments/bug/${item.id}`);
      setComments(res.data);
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to fetch comments', 'error');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get(`/audit/bug/${item.id}`);
      setAuditLogs(res.data);
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to fetch audit history', 'error');
    }
  };

  const fetchTasks = async () => {
      try {
          const res = await apiClient.get('/bugtasks');
          setTasks(res.data);
      } catch (e) { 
          console.error(e); 
          showNotification('Failed to fetch bug tasks', 'error');
      }
  };

  const handleDownload = async (attachmentId, fileName) => {
    try {
        const response = await apiClient.get(`/attachments/download/${attachmentId}`, {
            responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (e) {
        console.error(e);
        showNotification('Failed to download file', 'error');
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to remove this attachment?')) return;
    try {
        await apiClient.delete(`/attachments/${attachmentId}`);
        showNotification('Attachment removed successfully', 'success');
        fetchAttachments();
    } catch (e) {
        console.error(e);
        showNotification('Failed to remove attachment', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
        const res = await apiClient.get('/users');
        setUsers(res.data);
    } catch (e) { 
        console.error(e); 
        showNotification('Failed to fetch users', 'error');
    }
  };

  const fetchWorkflows = async () => {
    try {
        const res = await apiClient.get('/workflows/type/BUG');
        setWorkflows(res.data);
    } catch (e) {
        console.error(e);
        showNotification('Failed to fetch workflows', 'error');
    }
  };

  const fetchTaskTypes = async () => {
    try {
        const res = await apiClient.get('/task-types');
        setTaskTypes(res.data);
    } catch (e) {
        console.error(e);
        showNotification('Failed to fetch task types', 'error');
    }
  };

  const fetchSnapshottedSteps = async () => {
    try {
        const res = await apiClient.get(`/bugs/${item.id}/steps`);
        setSnapshottedSteps(res.data);
    } catch (e) {
        console.error('Failed to fetch snapshotted steps:', e);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'workflowId') {
        const wf = workflows.find(w => w.id.toString() === value);
        setSelectedWorkflow(wf || null);
        if (wf && wf.steps && wf.steps.length > 0) {
            setFormData({ ...formData, workflowId: value, status: wf.steps[0].stepName });
        } else {
            setFormData({ ...formData, workflowId: value });
        }
    } else {
        if (name === 'status' && !value) return;
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.title?.trim()) {
      return showNotification('Title is mandatory.', 'error');
    }
    if (!formData.description?.trim()) {
      return showNotification('Description is mandatory.', 'error');
    }
    if (!formData.jtrackId?.trim()) {
      return showNotification('Jtrack ID is mandatory.', 'error');
    }
    if (!formData.assignedDeveloperId) {
      return showNotification('Assignee is mandatory for Bugs.', 'error');
    }

    if (item && formData.status !== item?.status && (!remarks || remarks.trim() === '')) {
      return showNotification('Updating Remarks are mandatory for all status changes.', 'error');
    }

    try {
      const payload = { ...formData, remarks };
      
      if (payload.assignedDeveloperId) {
          payload.assignedDeveloper = { id: payload.assignedDeveloperId };
      } else {
          payload.assignedDeveloper = null;
      }
      
      if (payload.taskId) {
          payload.bugTask = { id: payload.taskId };
      }
      if (payload.workflowId) {
          payload.workflow = { id: payload.workflowId };
      }

      let savedBug;
      if (item?.id) {
        // Special mapping for INVALID_BUG and NOT_RESOLVED pseudo-statuses
        if (payload.status === 'INVALID_BUG_ACTION') {
            payload.status = 'INVALID_PENDING_APPROVAL';
            // Overriding remarks for backend to detect
            payload.remarks = 'Marked as invalid by developer. Pending tester review.'; 
        } else if (payload.status === 'NOT_RESOLVED_ACTION') {
            payload.status = 'IN_PROGRESS'; // Dummy target, backend will override
            payload.remarks = 'NOT_RESOLVED';
        }

        const res = await apiClient.put(`/bugs/${item.id}`, payload);
        savedBug = res.data;
      } else {
        const res = await apiClient.post('/bugs', payload);
        savedBug = res.data;
      }

      // Handle pending uploads if any
      if (pendingFiles.length > 0 && savedBug?.id) {
          for (const file of pendingFiles) {
              const fData = new FormData();
              fData.append('file', file);
              fData.append('entityType', 'BUG');
              fData.append('entityId', savedBug.id);
              await apiClient.post('/attachments/upload', fData, {
                  headers: { 'Content-Type': 'multipart/form-data' }
              });
          }
      }

      onSave();
      onClose();
      setRemarks('');
      showNotification('Bug saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving bug:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save bug';
      showNotification(typeof msg === 'string' ? msg : 'Failed to save bug', 'error');
    }
  };

  const handleCreateQuickTask = async () => {
    if (!quickTaskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
        const newTask = {
            title: quickTaskTitle,
            description: quickTaskDescription || quickTaskTitle, // Use title as default if empty
            jtrackId: quickTaskJtrackId,
            type: { id: quickTaskType },
            status: 'OPEN',
            priority: 'Medium'
        };
        const res = await apiClient.post('/bugtasks', newTask);
        await fetchTasks();
        setFormData({ ...formData, taskId: res.data.id });
        setShowQuickTask(false);
        setQuickTaskTitle('');
        setQuickTaskDescription('');
        setQuickTaskJtrackId('');
        showNotification('Quick bug-task created and linked successfully!', 'success');
    } catch (error) {
        console.error('Error creating quick task', error);
        showNotification(error.response?.data || 'Failed to create quick task', 'error');
    } finally {
        setIsCreatingTask(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await apiClient.post('/comments', {
        entityType: 'BUG',
        entityId: item.id,
        text: newComment
      });
      setNewComment('');
      fetchComments();
      showNotification('Comment added successfully!', 'success');
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to add comment', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this bug?')) return;
    try {
      await apiClient.delete(`/bugs/${item.id}`);
      onSave();
      onClose();
      showNotification('Bug deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting bug:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to delete bug';
      showNotification(typeof msg === 'string' ? msg : 'Failed to delete bug', 'error');
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 animate-scale-in flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
             <div className="p-2 rounded-xl text-white bg-deltascribe-emerald">
                <Bug className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">
                    {item ? 'Edit Bug' : 'Create New Bug'}
                </h2>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-deltascribe-emerald uppercase tracking-widest">{formData.jtrackId || 'NEW-BUG'}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bug Tracking</span>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 flex items-center space-x-8 border-b border-gray-100 bg-white">
          {['general', 'comments', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                activeTab === tab ? 'border-deltascribe-emerald text-deltascribe-emerald' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                {tab === 'general' && <Info className="w-3.5 h-3.5" />}
                {tab === 'comments' && <MessageSquare className="w-3.5 h-3.5" />}
                {tab === 'history' && <History className="w-3.5 h-3.5" />}
                <span>{tab}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'general' && (
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6 md:col-span-2">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
                    <input
                      name="title"
                      value={formData.title || ''}
                      onChange={handleChange}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-deltascribe-emerald transition-all outline-none"
                      placeholder="Enter bug summary..."
                      required
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Jtrack ID</label>
                    <input
                      name="jtrackId"
                      value={formData.jtrackId || ''}
                      onChange={handleChange}
                      className={`w-full border rounded-2xl py-3 px-4 font-bold transition-all outline-none ${
                        item ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-800 focus:bg-white focus:border-deltascribe-emerald'
                      }`}
                      placeholder="BT-XXX"
                      readOnly={item}
                    />
                 </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows="4"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-800 transition-all outline-none resize-none focus:bg-white focus:border-deltascribe-emerald"
                      placeholder="Steps to reproduce, actual vs expected..."
                    />
                 </div>
              </div>

              {item && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Update Remark / Reasoning</label>
                    <textarea
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      rows="2"
                      className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl py-3 px-4 font-bold text-indigo-900 focus:bg-white focus:border-indigo-500 transition-all outline-none resize-none"
                      placeholder="Why are you updating this? (e.g. status move, priority change...)"
                      required={item.status !== formData.status}
                    />
                  </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Severity</label>
                <select 
                   name="severity" 
                   value={formData.severity || ''} 
                   onChange={handleChange} 
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Priority</label>
                  <select 
                     name="priority" 
                     value={formData.priority || ''} 
                     onChange={handleChange} 
                     className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none"
                  >
                    <option value="Highest">Highest</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
              </div>

                {item && (
                <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
                <select 
                   name="status" 
                   value={formData.status || ''} 
                   onChange={handleChange} 
                   className={`w-full border rounded-2xl py-3 px-4 font-bold transition-all outline-none ${
                        isTerminalState ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-800 focus:bg-white focus:border-deltascribe-emerald'
                    }`}
                   disabled={isTerminalState}
                >
                  <option value="">-- UPDATE STATUS (SELECT) --</option>
                  {!selectedWorkflow ? (
                    <>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="CLOSED">Closed</option>
                    </>
                  ) : (
                    <>
                    {(snapshottedSteps.length > 0 ? snapshottedSteps : selectedWorkflow.steps)
                      .filter(step => {
                        const stepsToUse = snapshottedSteps.length > 0 ? snapshottedSteps : selectedWorkflow.steps;
                        const currentStatusStep = stepsToUse.find(s => s.stepName === (item?.status || formData.status));
                        if (!currentStatusStep) return true;
                        
                        const isCurrent = step.stepName === (item?.status || formData.status);
                        const isNext = step.sequence === currentStatusStep.sequence + 1;
                        
                        return isNext && !isCurrent;
                      })
                      .map((step) => (
                        <option 
                            key={step.id || step.stepName} 
                            value={step.stepName}
                        >
                          {step.stepName.replace('_', ' ')}
                        </option>
                      ))}
                      
                      {/* Special Status Actions based on Roles and Context */}
                      {item && item.status !== 'CLOSED' && item.status !== 'VERIFIED&CLOSED' && (currentUser?.roles?.includes('ROLE_DEVELOPER') || currentUser?.roles?.includes('ROLE_DEVADMIN')) && (
                          <option value="INVALID_BUG_ACTION" className="text-red-600 font-bold">⛔ Mark as Invalid Bug</option>
                      )}
                      
                      {item && (item.status === 'RESOLVED' || item.status === 'TESTING' || item.status === 'VERIFIED') && (currentUser?.roles?.includes('ROLE_TESTER') || currentUser?.roles?.includes('ROLE_TESTADMIN')) && (
                          <option value="NOT_RESOLVED_ACTION" className="text-amber-600 font-bold">⚠️ Return as Not Resolved</option>
                      )}
                    </>
                  )}
                </select>
                </div>
                )}

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Workflow</label>
                <select 
                   name="workflowId" 
                   value={formData.workflowId || ''} 
                   onChange={handleChange} 
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none focus:bg-white focus:border-deltascribe-emerald transition-all"
                   disabled={item}
                >
                  <option value="">Default Bug Workflow (Ad-hoc)</option>
                  {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Linked Bug-Task</label>
                    <button 
                        type="button" 
                        onClick={() => setShowQuickTask(!showQuickTask)}
                        className="text-[10px] font-bold text-deltascribe-emerald hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                    >
                        + QUICK CREATE
                    </button>
                </div>
                
                {showQuickTask && (
                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-2 space-y-3 animate-slide-down md:col-span-2">
                        <div className="flex space-x-2">
                            <input 
                                value={quickTaskJtrackId}
                                onChange={(e) => setQuickTaskJtrackId(e.target.value)}
                                placeholder="Jtrack ID (optional)"
                                className="w-1/3 bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-deltascribe-emerald"
                            />
                            <input 
                                value={quickTaskTitle}
                                onChange={(e) => setQuickTaskTitle(e.target.value)}
                                placeholder="Task Title..."
                                className="flex-1 bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-deltascribe-emerald"
                            />
                        </div>
                        <textarea 
                            value={quickTaskDescription}
                            onChange={(e) => setQuickTaskDescription(e.target.value)}
                            placeholder="Task Description..."
                            className="w-full bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-deltascribe-emerald resize-none"
                            rows="2"
                        />
                        <div className="flex items-center space-x-2">
                            <select 
                                value={quickTaskType}
                                onChange={(e) => setQuickTaskType(e.target.value)}
                                className="bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none"
                            >
                                {taskTypes.map(tt => <option key={tt.id} value={tt.id}>{tt.name}</option>)}
                            </select>
                            <button 
                                type="button" 
                                onClick={handleCreateQuickTask}
                                disabled={isCreatingTask || !quickTaskTitle.trim()}
                                className="flex-1 bg-deltascribe-emerald text-white rounded-lg py-2 text-sm font-bold shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                                {isCreatingTask ? 'Creating...' : 'Create & Link'}
                            </button>
                        </div>
                    </div>
                )}

                <select 
                    name="taskId" 
                    value={formData.taskId || ''} 
                    onChange={handleChange} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-deltascribe-emerald"
                >
                  <option value="">None</option>
                  {tasks.map(t => <option key={t.id} value={t.id}>{t.jtrackId} - {t.title}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assignee</label>
                <select 
                  name="assignedDeveloperId" 
                  value={formData.assignedDeveloperId || ''} 
                  onChange={handleChange} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 transition-all outline-none focus:bg-white focus:border-deltascribe-emerald"
                >
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                </select>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Bug Attachments {pendingFiles.length > 0 && `(${pendingFiles.length} pending)`}</span>
                </label>
                
                {item && attachments.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 mb-4">
                        {attachments.map(att => (
                            <div key={att.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <File className="w-4 h-4 text-indigo-500" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-black text-gray-800">{att.fileName}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Uploaded by {att.uploadedBy?.fullName} • {new Date(att.uploadDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button 
                                        onClick={() => handleDownload(att.id, att.fileName)}
                                        className="p-2 text-indigo-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                        title="Download"
                                    >
                                        <Upload className="w-4 h-4 rotate-180" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteAttachment(att.id)}
                                        className="p-2 text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {pendingFiles.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 mb-4">
                        {pendingFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                                <div className="flex items-center space-x-2">
                                    <File className="w-3 h-3 text-amber-500" />
                                    <span className="text-xs font-bold text-amber-800">{file.name}</span>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setPendingFiles(pendingFiles.filter((_, i) => i !== idx))}
                                    className="p-1 hover:bg-white rounded-md transition-all text-amber-500"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[32px] cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-300" />
                      <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter">
                        Drop screenshot/log here to attach
                      </p>
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-8">
              <div className="flex space-x-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add feedback for this bug..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-800 focus:bg-white focus:border-deltascribe-emerald transition-all outline-none resize-none"
                    rows="3"
                  />
                  <button 
                    onClick={handleAddComment}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-deltascribe-emerald text-white shadow-lg shadow-deltascribe-emerald/20 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((c) => (
                  <div key={c.id} className="flex space-x-4 animate-slide-up">
                    <div className="w-10 h-10 rounded-xl bg-deltascribe-navy bg-opacity-10 flex items-center justify-center font-bold text-deltascribe-navy">
                      {c.user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-black text-gray-800">{c.user?.fullName || c.user?.username}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(c.createdDate).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">{c.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
               {auditLogs.length === 0 ? (
                 <p className="text-center text-gray-400 py-8 font-medium">No activity recorded yet.</p>
               ) : auditLogs.map((log) => (
                 <div key={log.id} className="flex items-start space-x-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50/50 transition-all">
                    <div className="p-2 bg-indigo-50 rounded-xl">
                        <History className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-bold text-gray-800">
                            {log.changedBy?.fullName} changed <span className="text-deltascribe-emerald">{log.fieldName}</span>
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400 line-through font-medium">{log.oldValue}</span>
                            <ChevronRight className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-emerald-500 font-black">{log.newValue}</span>
                        </div>
                        {log.remarks && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-xl border-l-4 border-indigo-200">
                                <p className="text-xs text-gray-600 font-bold italic">"{log.remarks}"</p>
                            </div>
                        )}
                        <p className="text-[10px] text-gray-300 mt-2 font-bold uppercase tracking-widest leading-none">{new Date(log.changedDate).toLocaleString()}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
              {item && (currentUser?.roles?.includes('ROLE_DEVADMIN') || currentUser?.roles?.includes('ROLE_TESTADMIN') || currentUser?.id === item.raisedBy?.id) && (
                 <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 text-red-500 font-bold text-xs hover:bg-red-50 rounded-xl transition-all">
                   <Trash2 className="w-4 h-4" />
                   <span>Delete Bug</span>
                 </button>
              )}
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-gray-500 font-bold text-xs hover:bg-gray-100 transition-all">Cancel</button>
             {!isTerminalState && (
                 <button 
                    onClick={handleSave}
                    className="btn-deltascribe flex items-center space-x-2 py-2.5 px-8 shadow-lg shadow-deltascribe-emerald/20"
                 >
                    <Save className="w-4 h-4" />
                    <span>{item ? 'Save Changes' : 'Raise Bug'}</span>
                 </button>
             )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BugModal;
