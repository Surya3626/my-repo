import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  MessageSquare, 
  History, 
  Info,
  User,
  Calendar,
  Tag,
  Flag,
  Send,
  Link as LinkIcon,
  CheckSquare,
  Bug,
  ChevronRight,
  Upload,
  File,
  ExternalLink,
  XCircle,
  CheckCircle2
} from 'lucide-react';
import { createPortal } from 'react-dom';
import apiClient from '../api/client';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const ItemModal = ({ isOpen, onClose, type, item, onSave }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [tasks, setTasks] = useState([]); // For linking bugs to tasks
  const [users, setUsers] = useState([]); // For assignment
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskJtrackId, setQuickTaskJtrackId] = useState('');
  const [quickTaskType, setQuickTaskType] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [taskTypes, setTaskTypes] = useState([]);
  
  const { showNotification } = useNotification();
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!isOpen) return;

    fetchUsers();
    fetchWorkflows();
    fetchTaskTypes();

    if (item) {
      setFormData({ 
        ...item,
        assignedDeveloperId: item.assignedDeveloper?.id,
        taskId: item.task?.id || item.bugTask?.id,
        workflowId: item.workflow?.id,
        typeId: item.type?.id,
        gitLinks: item.gitLinks || '',
        codeReviewComments: item.codeReviewComments || ''
      });
      if (item.workflow) {
          setSelectedWorkflow(item.workflow);
      }
      fetchComments();
      fetchAuditLogs();
    } else {
      setFormData({
        status: 'OPEN',
        priority: 'Medium',
        type: 'CR',
        severity: 'Medium',
        // Auto-assign to current developer if they are creating a task
        assignedDeveloperId: currentUser?.roles?.includes('ROLE_DEVELOPER') && type === 'task' ? currentUser.id : undefined
      });
    }

    if (type === 'bug' || type === 'testcase') {
        fetchTasks();
    }

    if (item) {
        fetchAttachments();
    }
  }, [item, isOpen]);

  const fetchAttachments = async () => {
    try {
        const res = await apiClient.get(`/attachments/${type}/${item.id}`);
        setAttachments(res.data);
    } catch (e) {
        console.error(e);
        showNotification('Failed to fetch attachments', 'error');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formDataFile = new FormData();
    formDataFile.append('file', file);
    formDataFile.append('entityType', type.toUpperCase());
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
      const res = await apiClient.get(`/comments/${type}/${item.id}`);
      setComments(res.data);
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to fetch comments', 'error');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get(`/audit/${type}/${item.id}`);
      setAuditLogs(res.data);
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to fetch audit history', 'error');
    }
  };

  const fetchTasks = async () => {
      try {
          const res = await apiClient.get('/tasks');
          setTasks(res.data);
      } catch (e) { 
          console.error(e); 
          showNotification('Failed to fetch tasks', 'error');
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
        const res = await apiClient.get(`/workflows/type/${type === 'testcase' ? 'TASK' : type.toUpperCase()}`);
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
        if (res.data.length > 0 && !quickTaskType) {
            setQuickTaskType(res.data[0].id);
        }
    } catch (e) {
        console.error(e);
        showNotification('Failed to fetch task types', 'error');
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
    } else if (name === 'typeId') {
        setFormData({ ...formData, typeId: value });
    } else {
        if (name === 'status' && !value) return; // Ignore dummy select
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (type === 'task' || type === 'bug') {
      if (item && formData.status !== item?.status && (!remarks || remarks.trim() === '')) {
        return showNotification('Updating Remarks are mandatory for all status changes.', 'error');
      }
      if (formData.status === 'IN_PROGRESS' && !formData.devStartDate) {
        return showNotification('Dev Start Date is mandatory when moving to In Progress.', 'error');
      }
      if (formData.status === 'CODE_REVIEW' && (!formData.gitLinks || formData.gitLinks.trim() === '')) {
        return showNotification('Git links are required when pushing for Code Review.', 'error');
      }
      if (formData.status === 'SIT_COMPLETED' && !formData.sitDate) {
        return showNotification('SIT Date is required for SIT Completed status.', 'error');
      }
      if (formData.status === 'UAT_COMPLETED' && !formData.uatDate) {
        return showNotification('UAT Date is required for UAT Completed status.', 'error');
      }
      if (formData.status === 'PREPROD_COMPLETED' && !formData.preprodDate) {
        return showNotification('PREPROD Date is required for PREPROD Completed status.', 'error');
      }
      if (formData.status === 'PROD_COMPLETED' && !formData.productionDate) {
        return showNotification('PROD Date is required for PROD Completed status.', 'error');
      }
    }

    try {
      const payload = { ...formData, remarks };
      
      // Structure related entities for backend correctly
      if (payload.assignedDeveloperId) {
          payload.assignedDeveloper = { id: payload.assignedDeveloperId };
      } else {
          payload.assignedDeveloper = null; // Unassign explicit
      }
      
      if (payload.taskId) {
          if (type === 'bug') {
              payload.bugTask = { id: payload.taskId };
          } else {
              payload.task = { id: payload.taskId };
          }
      } else {
          payload.task = null;
          payload.bugTask = null;
      }

      if (payload.workflowId) {
          payload.workflow = { id: payload.workflowId };
      }

      if (payload.typeId) {
          payload.type = { id: payload.typeId };
      } else if (!item) {
          return showNotification('Task Type is mandatory.', 'error');
      }

      const url = `/${type === 'testcase' ? 'testcases' : type + 's'}`;
      if (item?.id) {
        await apiClient.put(`${url}/${item.id}`, payload);
      } else {
        if (type === 'testcase' && !payload.status) {
           payload.status = 'OPEN';
        }
        await apiClient.post(url, payload);
      }
      onSave();
      onClose();
      setRemarks('');
      showNotification(`${type} saved successfully!`, 'success');
    } catch (error) {
      console.error('Error saving item:', error);
      showNotification(error.response?.data || 'Failed to save item', 'error');
    }
  };

  const handleCreateQuickTask = async () => {
    if (!quickTaskTitle.trim()) return;
    setIsCreatingTask(true);
    try {
        const newTask = {
            title: quickTaskTitle,
            jtrackId: quickTaskJtrackId,
            type: { id: quickTaskType },
            status: 'OPEN',
            priority: 'Medium'
        };
        const res = await apiClient.post(type === 'bug' ? '/bugtasks' : '/tasks', newTask);
        await fetchTasks(); // Refresh dropdown tasks
        setFormData({ ...formData, taskId: res.data.id }); // Select the newly created task
        setShowQuickTask(false);
        setQuickTaskTitle('');
        setQuickTaskJtrackId('');
        showNotification('Quick task created and linked successfully!', 'success');
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
        entityType: type.toUpperCase(),
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

  const handleCodeReviewAction = async (newStatus) => {
    if (!formData.codeReviewComments?.trim()) {
        return showNotification('Please provide feedback/remarks for this review.', 'error');
    }
    
    try {
        const payload = { 
            ...formData, 
            status: newStatus,
            remarks: newStatus === 'UAT_TESTING' ? 'Code review approved.' : 'Code review rejected: ' + formData.codeReviewComments
        };
        
        // Structure for backend
        if (payload.assignedDeveloperId) payload.assignedDeveloper = { id: payload.assignedDeveloperId };
        if (payload.taskId) {
            if (type === 'bug') payload.bugTask = { id: payload.taskId };
            else payload.task = { id: payload.taskId };
        }
        if (payload.workflowId) payload.workflow = { id: payload.workflowId };

        const url = `/${type === 'testcase' ? 'testcases' : type + 's'}`;
        await apiClient.put(`${url}/${item.id}`, payload);
        
        onSave();
        onClose();
        showNotification(`Code review ${newStatus === 'UAT_TESTING' ? 'approved' : 'rejected'} successfully!`, 'success');
    } catch (error) {
        console.error('Error in code review action:', error);
        showNotification(error.response?.data || 'Action failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      const url = `/${type === 'testcase' ? 'testcases' : type + 's'}/${item.id}`;
      await apiClient.delete(url);
      onSave();
      onClose();
      showNotification(`${type} deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification(error.response?.data || `Failed to delete ${type}`, 'error');
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
             <div className={`p-2 rounded-xl text-white bg-gradient-to-br ${
               type === 'task' ? 'from-deltascribe-navy to-indigo-600' : 
               type === 'bug' ? 'from-deltascribe-emerald to-emerald-600' : 'from-emerald-400 to-teal-500'
             }`}>
                {type === 'task' ? <CheckSquare className="w-5 h-5" /> : 
                 type === 'bug' ? <Bug className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">
                    {item ? `Edit ${type}` : `Create New ${type}`}
                </h2>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-deltascribe-emerald uppercase tracking-widest">{formData.jtrackId || 'NEW-ITEM'}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type} Management</span>
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
                      placeholder={`Enter ${type} summary...`}
                      required
                    />
                 </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows="4"
                      className={`w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-800 transition-all outline-none resize-none ${
                        (item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')) ||
                        (item && type === 'testcase' && !currentUser?.roles?.some(r => r.includes('ADMIN')) && currentUser?.id !== item.createdBy?.id) ? 'opacity-60 cursor-not-allowed' : 'focus:bg-white focus:border-deltascribe-emerald'
                      }`}
                      placeholder="Technical details, context..."
                      disabled={
                        (item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')) ||
                        (item && type === 'testcase' && !currentUser?.roles?.some(r => r.includes('ADMIN')) && currentUser?.id !== item.createdBy?.id)
                      }
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
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Priority</label>
                <select 
                   name="priority" 
                   value={formData.priority || ''} 
                   onChange={handleChange} 
                   className={`w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none ${
                       (item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')) ? 'opacity-60 cursor-not-allowed' : ''
                   }`}
                   disabled={item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')}
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
                   className={`w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none ${
                      (item && type === 'testcase' && !currentUser?.roles?.some(r => r.includes('ADMIN')) && currentUser?.id !== item.createdBy?.id) ||
                      (item && type === 'task' && item.status === 'CODE_REVIEW' && !currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN'))
                      ? 'opacity-60 cursor-not-allowed' : ''
                   }`}
                   disabled={
                       (item && type === 'testcase' && !currentUser?.roles?.some(r => r.includes('ADMIN')) && currentUser?.id !== item.createdBy?.id) ||
                       (item && type === 'task' && item.status === 'CODE_REVIEW' && !currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN'))
                   }
                >
                  <option value="">-- UPDATE STATUS (SELECT) --</option>
                  {!selectedWorkflow ? (
                    <>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      {type === 'task' && (
                        <>
                          <option value="SIT_COMPLETED">SIT Completed</option>
                          <option value="UAT_COMPLETED">UAT Completed</option>
                          <option value="PREPROD_COMPLETED">PREPROD Completed</option>
                          <option value="PROD_COMPLETED">PROD Completed</option>
                        </>
                      )}
                      {type === 'testcase' && (
                        <>
                          <option value="PENDING">Pending</option>
                          <option value="PASS">Pass</option>
                          <option value="FAIL">Fail</option>
                        </>
                      )}
                      <option value="RESOLVED">Resolved</option>
                      <option value="VERIFIED">Verified</option>
                      {(!item || type !== 'bug' || currentUser?.roles?.includes('ROLE_DEVADMIN') || currentUser?.roles?.includes('ROLE_TESTADMIN') || currentUser?.id === item.raisedBy?.id) && (
                          <option value="CLOSED">Closed</option>
                      )}
                    </>
                  ) : (
                    selectedWorkflow.steps
                      .filter(step => {
                        const currentStatusStep = selectedWorkflow.steps.find(s => s.stepName === (item?.status || formData.status));
                        if (!currentStatusStep) return true;
                        
                        // Show only ALLOWED next/previous transitions, and HIDE CURRENT status
                        const isCurrent = step.stepName === (item?.status || formData.status);
                        const isNext = step.sequence === currentStatusStep.sequence + 1;
                        const isBackFromReview = currentStatusStep.stepName === 'CODE_REVIEW' && step.stepName === 'SIT_COMPLETED';
                        
                        // Restriction: Developers should NOT see any transitions while in CODE_REVIEW (only reviewers/admins)
                        if (item?.status === 'CODE_REVIEW' && !currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN')) {
                            return false;
                        }
                        
                        return (isNext || isBackFromReview) && !isCurrent;
                      })
                      .map((step) => (
                        <option 
                            key={step.id} 
                            value={step.stepName}
                        >
                          {step.stepName.replace('_', ' ')}
                        </option>
                      ))
                  )}
                </select>
                </div>
                )}

              {/* Workflow Selection */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Workflow</label>
                <select 
                   name="workflowId" 
                   value={formData.workflowId || ''} 
                   onChange={handleChange} 
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none focus:bg-white focus:border-deltascribe-emerald transition-all"
                   disabled={item} // Workflow cannot be changed once item is created
                >
                  <option value="">Default Workflow (Ad-hoc)</option>
                  {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                </select>
              </div>

              {type === 'task' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Type <span className="text-red-500">*</span></label>
                    <select 
                        name="typeId" 
                        value={formData.typeId || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800"
                        disabled={item}
                        required
                    >
                      <option value="">-- SELECT TYPE --</option>
                      {taskTypes.map(tt => (
                          <option key={tt.id} value={tt.id}>{tt.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Jtrack ID</label>
                    <input name="jtrackId" value={formData.jtrackId || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">PDs</label>
                    <input name="pds" value={formData.pds || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" placeholder="Planned Days / Details..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assignee</label>
                    <select 
                      name="assignedDeveloperId" 
                      value={formData.assignedDeveloperId || ''} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-deltascribe-emerald transition-all outline-none"
                      disabled={currentUser?.roles?.includes('ROLE_DEVELOPER') && !currentUser?.roles?.includes('ROLE_DEVADMIN')}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Branch Name</label>
                    <input name="branchName" value={formData.branchName || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" placeholder="feature/ticket-123" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Dev Start Date</span>
                    </label>
                    <input 
                      type="date" 
                      name="devStartDate" 
                      value={formData.devStartDate || ''} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" 
                      required={formData.status === 'IN_PROGRESS'}
                      disabled={item?.status && item?.status !== 'OPEN'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>SIT Date {formData.status === 'SIT_COMPLETED' && <span className="text-red-500">*</span>}</span>
                    </label>
                    <input 
                        type="date" 
                        name="sitDate" 
                        value={formData.sitDate || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" 
                        required={formData.status === 'SIT_COMPLETED'}
                        disabled={(item?.status !== 'OPEN' && item?.status !== 'IN_PROGRESS' && item?.status !== 'SIT_TESTING' && item?.status !== 'SIT_COMPLETED') || (formData.status !== 'SIT_COMPLETED' && !formData.sitDate)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-deltascribe-navy" />
                      <span>UAT Date {formData.status === 'UAT_COMPLETED' && <span className="text-red-500">*</span>}</span>
                    </label>
                    <input 
                        type="date" 
                        name="uatDate" 
                        value={formData.uatDate || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800"
                        required={formData.status === 'UAT_COMPLETED'} 
                        disabled={(item?.status && !['OPEN', 'IN_PROGRESS', 'SIT_TESTING', 'SIT_COMPLETED', 'CODE_REVIEW', 'UAT_TESTING', 'UAT_COMPLETED'].includes(item?.status)) || (formData.status !== 'UAT_COMPLETED' && !formData.uatDate)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-orange-400" />
                      <span>PREPROD Date {formData.status === 'PREPROD_COMPLETED' && <span className="text-red-500">*</span>}</span>
                    </label>
                    <input 
                        type="date" 
                        name="preprodDate" 
                        value={formData.preprodDate || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" 
                        required={formData.status === 'PREPROD_COMPLETED'}
                        disabled={(item?.status && !['OPEN', 'IN_PROGRESS', 'SIT_TESTING', 'SIT_COMPLETED', 'CODE_REVIEW', 'UAT_TESTING', 'UAT_COMPLETED', 'PREPROD_COMPLETED'].includes(item?.status)) || (formData.status !== 'PREPROD_COMPLETED' && !formData.preprodDate)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-deltascribe-emerald" />
                      <span>PROD Date {formData.status === 'PROD_COMPLETED' && <span className="text-red-500">*</span>}</span>
                    </label>
                    <input 
                        type="date" 
                        name="productionDate" 
                        value={formData.productionDate || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800" 
                        required={formData.status === 'PROD_COMPLETED'}
                        disabled={(item?.status && !['OPEN', 'IN_PROGRESS', 'SIT_TESTING', 'SIT_COMPLETED', 'CODE_REVIEW', 'UAT_TESTING', 'UAT_COMPLETED', 'PREPROD_COMPLETED', 'PROD_COMPLETED'].includes(item?.status)) || (formData.status !== 'PROD_COMPLETED' && !formData.productionDate)}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>Git Pull Request Links / Documentation</span>
                    </label>
                    <textarea 
                        name="gitLinks" 
                        value={formData.gitLinks || ''} 
                        onChange={handleChange} 
                        rows="3"
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl py-3 px-4 font-bold text-emerald-900 focus:bg-white focus:border-emerald-500 transition-all outline-none resize-none"
                        placeholder="https://github.com/org/repo/pull/123, https://..." 
                        required={formData.status === 'CODE_REVIEW'}
                    />
                    {formData.gitLinks && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.gitLinks.split(',').map((link, idx) => {
                                const trimLink = link.trim();
                                if (!trimLink) return null;
                                return (
                                    <a key={idx} href={trimLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-black text-indigo-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                        <span>LINK {idx + 1}</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                );
                            })}
                        </div>
                    )}
                  </div>

                  {(formData.status === 'CODE_REVIEW' || formData.codeReviewComments) && (
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                            <MessageSquare className="w-3.5 h-3.5 text-deltascribe-emerald" />
                            <span>Code Review Feedback</span>
                        </label>
                        <textarea 
                            name="codeReviewComments" 
                            value={formData.codeReviewComments || ''} 
                            onChange={handleChange} 
                            rows="3"
                            className={`w-full border rounded-2xl py-3 px-4 font-bold transition-all outline-none resize-none ${
                                (currentUser?.roles?.includes('ROLE_CODEREVIEWER') || currentUser?.roles?.includes('ROLE_DEVADMIN'))
                                ? 'bg-emerald-50/30 border-emerald-100 text-emerald-900 focus:bg-white focus:border-deltascribe-emerald'
                                : 'bg-gray-50 border-gray-100 text-gray-500'
                            }`}
                            placeholder="Add your review feedback here..." 
                            disabled={!currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN')}
                        />
                      </div>
                  )}
                </>
              )}

               {type === 'bug' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Linked Task</label>
                        {(!item || type !== 'bug' || currentUser?.roles?.includes('ROLE_TESTER') || currentUser?.roles?.includes('ROLE_DEVADMIN') || currentUser?.roles?.includes('ROLE_TESTADMIN')) && (
                            <button 
                                type="button" 
                                onClick={() => setShowQuickTask(!showQuickTask)}
                                className="text-[10px] font-bold text-deltascribe-emerald hover:bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                            >
                                + QUICK CREATE TASK
                            </button>
                        )}
                    </div>
                    
                    {showQuickTask && (
                        <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-2 space-y-3 animate-slide-down">
                            <div className="flex space-x-2">
                                <input 
                                    value={quickTaskJtrackId}
                                    onChange={(e) => setQuickTaskJtrackId(e.target.value)}
                                    placeholder="Jtrack ID (optional)"
                                    className="w-1/3 bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-tata-pink"
                                />
                                <input 
                                    value={quickTaskTitle}
                                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                                    placeholder="Task Title..."
                                    className="flex-1 bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-tata-pink"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <select 
                                    value={quickTaskType}
                                    onChange={(e) => setQuickTaskType(e.target.value)}
                                    className="bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none"
                                >
                                    <option value="CR">CR</option>
                                    <option value="SR">SR</option>
                                    <option value="FIX">FIX</option>
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
                        className={`w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 transition-all outline-none ${
                            (item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')) ? 'opacity-60 cursor-not-allowed' : 'focus:bg-white focus:border-deltascribe-emerald'
                        }`}
                        disabled={item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')}
                    >
                      <option value="">None</option>
                      {tasks.map(t => <option key={t.id} value={t.id}>{t.jtrackId} - {t.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Severity</label>
                    <select 
                      name="severity" 
                      value={formData.severity || ''} 
                      onChange={handleChange} 
                      className={`w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 transition-all outline-none ${
                        (item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')) ? 'opacity-60 cursor-not-allowed' : 'focus:bg-white focus:border-tata-pink'
                      }`}
                      disabled={item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')}
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assignee</label>
                    <select 
                      name="assignedDeveloperId" 
                      value={formData.assignedDeveloperId || ''} 
                      onChange={handleChange} 
                      className={`w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 transition-all outline-none ${
                        (item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')) ? 'opacity-60 cursor-not-allowed' : 'focus:bg-white focus:border-tata-pink'
                      }`}
                      disabled={item && type === 'bug' && !currentUser?.roles?.includes('ROLE_TESTER') && !currentUser?.roles?.includes('ROLE_DEVADMIN') && !currentUser?.roles?.includes('ROLE_TESTADMIN')}
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Bug Attachments</span>
                    </label>
                    
                    {item && (
                        <div className="grid grid-cols-1 gap-3 mb-4">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                            <File className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-gray-800">{att.fileName}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Uploaded by {att.uploadedBy?.fullName} • {new Date(att.uploadDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button 
                                            onClick={() => handleDownload(att.id, att.fileName)}
                                            className="p-2 text-indigo-500 hover:bg-white rounded-lg transition-all"
                                            title="Download"
                                        >
                                            <Upload className="w-4 h-4 rotate-180" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[32px] cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-300" />
                          <p className="mb-2 text-sm text-gray-400 font-bold uppercase tracking-tighter">
                            {item ? 'Upload new screenshot' : 'Attachments available after creation'}
                          </p>
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            disabled={!item}
                            onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                </>
              )}

              {type === 'testcase' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Test Case ID</label>
                    <input 
                        name="testCaseId" 
                        value={formData.testCaseId || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-deltascribe-emerald transition-all outline-none"
                        placeholder="TC-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Linked Task</label>
                        <button 
                            type="button" 
                            onClick={() => setShowQuickTask(!showQuickTask)}
                            className="text-[10px] font-bold text-tata-pink hover:bg-pink-50 px-2 py-1 rounded-md transition-colors"
                        >
                            + QUICK CREATE TASK
                        </button>
                    </div>

                    {showQuickTask && (
                        <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 mb-2 space-y-3 animate-slide-down">
                            <div className="flex space-x-2">
                                <input 
                                    value={quickTaskJtrackId}
                                    onChange={(e) => setQuickTaskJtrackId(e.target.value)}
                                    placeholder="Jtrack ID (optional)"
                                    className="w-1/3 bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-tata-pink"
                                />
                                <input 
                                    value={quickTaskTitle}
                                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                                    placeholder="Task Title..."
                                    className="flex-1 bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none focus:border-tata-pink"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <select 
                                    value={quickTaskType}
                                    onChange={(e) => setQuickTaskType(e.target.value)}
                                    className="bg-white border border-gray-100 rounded-lg py-2 px-3 text-sm font-bold outline-none"
                                >
                                    <option value="CR">CR</option>
                                    <option value="SR">SR</option>
                                    <option value="FIX">FIX</option>
                                </select>
                                <button 
                                    type="button" 
                                    onClick={handleCreateQuickTask}
                                    disabled={isCreatingTask || !quickTaskTitle.trim()}
                                    className="flex-1 bg-tata-pink text-white rounded-lg py-2 text-sm font-bold shadow-sm hover:bg-pink-600 transition-colors disabled:opacity-50"
                                >
                                    {isCreatingTask ? 'Creating...' : 'Create & Link'}
                                </button>
                            </div>
                        </div>
                    )}

                    <select name="taskId" value={formData.taskId || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-tata-pink transition-all outline-none">
                      <option value="">None</option>
                      {tasks.map(t => <option key={t.id} value={t.id}>{t.jtrackId} - {t.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Steps to Execute</label>
                    <textarea 
                        name="steps" 
                        value={formData.steps || ''} 
                        onChange={handleChange} 
                        rows="3"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-800 focus:bg-white focus:border-tata-pink transition-all outline-none resize-none"
                        placeholder="1. Launch app... 2. Click button..." 
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Expected Result</label>
                    <input 
                        name="expectedResult" 
                        value={formData.expectedResult || ''} 
                        onChange={handleChange} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-deltascribe-emerald transition-all outline-none"
                        placeholder="What should happen?"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Documents / Attachments</span>
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-100 border-dashed rounded-[32px] cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-3 text-gray-300" />
                          <p className="mb-2 text-sm text-gray-400 font-bold uppercase tracking-tighter">Click to upload or drag and drop</p>
                          <p className="text-[10px] text-gray-300 font-bold">PDF, DOCX, XLSX (MAX. 5MB)</p>
                        </div>
                        <input type="file" className="hidden" />
                      </label>
                    </div>
                  </div>
                </>
              )}
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
                    placeholder="Add a comment..."
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
                        <p className="text-[10px] text-gray-300 mt-2 font-bold uppercase tracking-widest">{new Date(log.changedDate).toLocaleString()}</p>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex flex-col">
            {(item && (type === 'task' || type === 'bug') && item.assignedDeveloper && item.assignedDeveloper.id !== currentUser?.id && !currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN')) && (
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Locked: Only Assigned Developer can update</span>
                </p>
            )}
            <div className="flex items-center space-x-3">
              {(currentUser?.roles?.includes('ROLE_CODEREVIEWER') || currentUser?.roles?.includes('ROLE_DEVADMIN')) && item?.status === 'CODE_REVIEW' && (
                  <div className="flex items-center space-x-3">
                      <button 
                          onClick={() => handleCodeReviewAction('SIT_COMPLETED')}
                          className="flex items-center space-x-2 px-6 py-2.5 bg-red-50 text-red-600 font-black text-xs rounded-xl hover:bg-red-100 transition-all border border-red-100"
                      >
                          <XCircle className="w-4 h-4" />
                          <span>REJECT REVIEW</span>
                      </button>
                      <button 
                          onClick={() => handleCodeReviewAction('UAT_TESTING')}
                          className="flex items-center space-x-2 px-6 py-2.5 bg-emerald-50 text-emerald-600 font-black text-xs rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100"
                      >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>APPROVE & MOVE TO UAT</span>
                      </button>
                  </div>
              )}
              {item && (type !== 'bug' || currentUser?.roles?.includes('ROLE_DEVADMIN') || currentUser?.roles?.includes('ROLE_TESTADMIN') || currentUser?.id === item.raisedBy?.id) && (
                 <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 text-red-500 font-bold text-xs hover:bg-red-50 rounded-xl transition-all">
                   <Trash2 className="w-4 h-4" />
                   <span>Delete Issue</span>
                 </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-gray-500 font-bold text-xs hover:bg-gray-100 transition-all">Cancel</button>
             <button 
                onClick={handleSave}
                disabled={
                    (item && type === 'testcase' && !currentUser?.roles?.some(r => r.includes('ADMIN')) && currentUser?.id !== item.createdBy?.id) ||
                    (item && (type === 'task' || type === 'bug') && item.assignedDeveloper && item.assignedDeveloper.id !== currentUser?.id && !currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN'))
                }
                className="btn-deltascribe flex items-center space-x-2 py-2.5 px-8 shadow-lg shadow-deltascribe-emerald/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Save className="w-4 h-4" />
                <span>{item ? 'Save Changes' : `Create ${type}`}</span>
             </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ItemModal;
