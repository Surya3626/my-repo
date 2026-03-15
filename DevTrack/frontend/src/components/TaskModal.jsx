import { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  MessageSquare, 
  History, 
  Info,
  Calendar,
  Link as LinkIcon,
  CheckSquare,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  Send,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { createPortal } from 'react-dom';
import apiClient from '../api/client';
import authService from '../services/authService';
import { useNotification } from '../context/NotificationContext';

const TaskModal = ({ isOpen, onClose, item, onSave }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [taskTypes, setTaskTypes] = useState([]);
  const [currentWorkflowStep, setCurrentWorkflowStep] = useState(null);
  const [snapshottedSteps, setSnapshottedSteps] = useState([]);
  
  const { showNotification } = useNotification();
  const currentUser = authService.getCurrentUser();
  const isTerminalState = item?.status === 'CLOSED' || item?.status === 'PROD_COMPLETED';

  useEffect(() => {
    if (!isOpen) return;

    fetchUsers();
    fetchWorkflows();
    fetchTaskTypes();

    if (item) {
      setFormData({ 
        ...item,
        assignedDeveloperId: item.assignedDeveloper?.id,
        workflowId: item.workflow?.id,
        typeId: item.type?.id,
        gitLinks: item.gitLinks || '',
        codeReviewComments: item.codeReviewComments || ''
      });
      if (item.workflow) {
          setSelectedWorkflow(item.workflow);
          fetchCurrentStep();
          fetchSnapshottedSteps();
      }
      fetchComments();
      fetchAuditLogs();
    } else {
      const isTasksPage = window.location.pathname.includes('/tasks');
      const isAdmin = currentUser?.roles?.includes('ROLE_DEVADMIN');
      
      setFormData({
        status: 'OPEN',
        priority: 'Medium',
        assignedDeveloperId: (isTasksPage && isAdmin) ? currentUser.id : ''
      });
    }
  }, [item, isOpen]);

  const fetchComments = async () => {
    try {
      const res = await apiClient.get(`/comments/task/${item.id}`);
      setComments(res.data);
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to fetch comments', 'error');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiClient.get(`/audit/task/${item.id}`);
      setAuditLogs(res.data);
    } catch (e) { 
      console.error(e); 
      showNotification('Failed to fetch audit history', 'error');
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
        const res = await apiClient.get('/workflows/type/TASK');
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

  const fetchCurrentStep = async () => {
    try {
        const res = await apiClient.get(`/tasks/${item.id}/current-step`);
        setCurrentWorkflowStep(res.data);
    } catch (e) {
        console.error('Failed to fetch current workflow step:', e);
    }
  };

  const fetchSnapshottedSteps = async () => {
    try {
        const res = await apiClient.get(`/tasks/${item.id}/steps`);
        setSnapshottedSteps(res.data);
    } catch (e) {
        console.error('Failed to fetch snapshotted steps:', e);
    }
  };

  const canApprove = () => {
      if (!item || !currentWorkflowStep) return false;
      
      const stepType = currentWorkflowStep.stepType;
      
      // Admins can approve anything
      if (currentUser?.roles?.includes('ROLE_DEVADMIN') || currentUser?.roles?.includes('ROLE_TESTADMIN')) return true;

      if (stepType === 'CODE_REVIEW') return currentUser?.roles?.includes('ROLE_CODEREVIEWER');
      if (stepType === 'TESTING') return currentUser?.roles?.includes('ROLE_TESTER');
      
      // For tasks, check if the user is the assigned developer
      if (stepType === 'TASK' && item.assignedDeveloper) {
          return item.assignedDeveloper.id === currentUser?.id;
      }
      
      return false; // Default false if we can't determine
  };

  const getNextStageName = () => {
    const stepsToUse = snapshottedSteps.length > 0 ? snapshottedSteps : item?.workflow?.steps;
    if (!stepsToUse || !item?.status) return null;
    const sortedSteps = [...stepsToUse].sort((a,b) => a.sequence - b.sequence);
    const currentIndex = sortedSteps.findIndex(s => s.stepName === item.status);
    if (currentIndex !== -1 && currentIndex + 1 < sortedSteps.length) {
        return sortedSteps[currentIndex + 1].stepName; // return precise code instead of replacing underscores for logical checks
    }
    return null;
  };

  const isDateFieldDisabled = (dateName) => {
      if (item?.status && ['CLOSED', 'PROD_COMPLETED'].includes(item.status)) return true;
      
      const targetStatus = getNextStageName() || formData.status;
      
      switch (dateName) {
          case 'devStartDate':
              return targetStatus !== 'IN_PROGRESS' && formData.status !== 'IN_PROGRESS';
          case 'sitDate':
              return targetStatus !== 'SIT_DEPLOYED' && formData.status !== 'SIT_DEPLOYED';
          case 'uatDate':
              return targetStatus !== 'MOVE_TO_UAT' && formData.status !== 'MOVE_TO_UAT';
          case 'preprodDate':
              return targetStatus !== 'PREPROD_DEPLOYED' && formData.status !== 'PREPROD_DEPLOYED';
          case 'productionDate':
              return targetStatus !== 'PROD_DEPLOYED' && formData.status !== 'PROD_DEPLOYED';
          default:
              return true;
      }
  };

  const handleWorkflowAction = async (action) => {
    if (item && (!remarks || remarks.trim() === '')) {
      return showNotification('Remarks are mandatory for workflow actions.', 'error');
    }

    if (action === 'approve') {
       if (!canApprove()) {
          return showNotification(`You do not have the required role to approve ${currentWorkflowStep.stepType.replace('_', ' ')} steps.`, 'error');
       }

       // Date validation for the next step (Frontend check)
       const stepsToUse = snapshottedSteps.length > 0 ? snapshottedSteps : (selectedWorkflow?.steps || item?.workflow?.steps);
       if (stepsToUse) {
          const sortedSteps = [...stepsToUse].sort((a,b) => a.sequence - b.sequence);
          const currentIndex = sortedSteps.findIndex(s => s.stepName === item.status);
          if (currentIndex !== -1 && currentIndex + 1 < sortedSteps.length) {
              const nextStep = sortedSteps[currentIndex + 1];
              const nextStatus = nextStep.stepName;
              
              if (nextStatus === 'IN_PROGRESS' && !formData.devStartDate) {
                  return showNotification('Dev Start Date is mandatory to move to In Progress.', 'error');
              }
              if (nextStatus === 'SIT_DEPLOYED' && !formData.sitDate) {
                  return showNotification('SIT Date is mandatory to move to SIT DEPLOYED', 'error');
              }
              if (nextStatus === 'MOVE_TO_UAT' && !formData.uatDate) {
                  return showNotification('UAT Date is mandatory to move to MOVE TO UAT', 'error');
              }
              if (nextStatus === 'PROD_DEPLOYED' && !formData.productionDate) {
                  return showNotification('Production Date is mandatory to move to PROD DEPLOYED', 'error');
              }
              if (nextStatus === 'CODE_REVIEW' && (!formData.gitLinks || formData.gitLinks.trim() === '')) {
                  return showNotification('Git Links are mandatory to move to Code Review', 'error');
              }
          }
       }
    }
    
    try {
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      
      // Ensure we send assigned developer ID if present
      const payload = { ...formData, remarks };
      if (payload.assignedDeveloperId) {
          payload.assignedDeveloper = { id: payload.assignedDeveloperId };
      }
      
      await apiClient.post(`/tasks/${item.id}/${endpoint}`, payload);
      onSave();
      onClose();
      showNotification(`Task ${action === 'approve' ? 'approved' : 'rejected'} successfully!`, 'success');
    } catch (error) {
      console.error(`Workflow ${action} failed:`, error);
      showNotification(error.response?.data || `Failed to ${action} task.`, 'error');
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

    if (item && formData.status !== item?.status && (!remarks || remarks.trim() === '')) {
      return showNotification('Updating Remarks are mandatory for all status changes.', 'error');
    }
    if (formData.status === 'IN_PROGRESS' && !formData.devStartDate) {
      return showNotification('Dev Start Date is mandatory when moving to In Progress.', 'error');
    }
    if (formData.status === 'CODE_REVIEW' && (!formData.gitLinks || formData.gitLinks.trim() === '')) {
      return showNotification('Git links are required when pushing for Code Review.', 'error');
    }
    if (formData.status === 'SIT_DEPLOYED' && !formData.sitDate) {
      return showNotification('SIT Date is mandatory for SIT Deployed status.', 'error');
    }
    if (formData.status === 'SIT_COMPLETED' && !formData.sitDate) {
      return showNotification('SIT Date is required for SIT Completed status.', 'error');
    }
    if ((formData.status === 'UAT_DEPLOYED' || formData.status === 'MOVE_TO_UAT') && !formData.uatDate) {
      return showNotification('UAT Date is mandatory for UAT deployment status.', 'error');
    }
    if (formData.status === 'UAT_COMPLETED' && !formData.uatDate) {
      return showNotification('UAT Date is required for UAT Completed status.', 'error');
    }
    if (formData.status === 'PREPROD_DEPLOYED' && !formData.preprodDate) {
      return showNotification('PREPROD Date is mandatory for PREPROD Deployed status.', 'error');
    }
    if (formData.status === 'PREPROD_COMPLETED' && !formData.preprodDate) {
      return showNotification('PREPROD Date is required for PREPROD Completed status.', 'error');
    }
    if (formData.status === 'PROD_DEPLOYED' && !formData.productionDate) {
      return showNotification('PROD Date is mandatory for PROD Deployed status.', 'error');
    }
    if (formData.status === 'PROD_COMPLETED' && !formData.productionDate) {
      return showNotification('PROD Date is required for PROD Completed status.', 'error');
    }

    try {
      const payload = { ...formData, remarks };
      
      if (payload.assignedDeveloperId) {
          payload.assignedDeveloper = { id: payload.assignedDeveloperId };
      } else {
          payload.assignedDeveloper = null;
      }
      
      if (payload.workflowId) {
          payload.workflow = { id: payload.workflowId };
      }

      if (payload.typeId) {
          payload.type = { id: payload.typeId };
      } else if (!item) {
          return showNotification('Task Type is mandatory.', 'error');
      }

      if (item?.id) {
        await apiClient.put(`/tasks/${item.id}`, payload);
      } else {
        await apiClient.post('/tasks', payload);
      }
      onSave();
      onClose();
      setRemarks('');
      showNotification('Task saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving task:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to save task';
      showNotification(typeof msg === 'string' ? msg : 'Failed to save task', 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await apiClient.post('/comments', {
        entityType: 'TASK',
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
        
        if (payload.assignedDeveloperId) payload.assignedDeveloper = { id: payload.assignedDeveloperId };
        if (payload.workflowId) payload.workflow = { id: payload.workflowId };

        await apiClient.put(`/tasks/${item.id}`, payload);
        
        onSave();
        onClose();
        showNotification(`Code review ${newStatus === 'UAT_TESTING' ? 'approved' : 'rejected'} successfully!`, 'success');
    } catch (error) {
        console.error('Error in code review action:', error);
        showNotification(error.response?.data || 'Action failed', 'error');
    }
  };

  const handlePushToPool = async () => {
    try {
      await apiClient.post(`/tasks/${item.id}/push-to-pool`);
      showNotification('Task pushed to pool successfully!', 'success');
      onSave();
      onClose();
    } catch (error) {
      console.error('Pool push failed:', error);
      showNotification(error.response?.data || 'Failed to push task to pool.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${item.id}`);
      onSave();
      onClose();
      showNotification('Task deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting task:', error);
      const msg = error.response?.data?.message || error.response?.data || 'Failed to delete task';
      showNotification(typeof msg === 'string' ? msg : 'Failed to delete task', 'error');
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
             <div className="p-2 rounded-xl text-white bg-gradient-to-br from-tata-purple to-indigo-600">
                <CheckSquare className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-800 tracking-tight">
                    {item ? 'Edit Task' : 'Create New Task'}
                </h2>
                <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-tata-pink uppercase tracking-widest">{formData.jtrackId || 'NEW-TASK'}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Task Management</span>
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
                activeTab === tab ? 'border-tata-pink text-tata-pink' : 'border-transparent text-gray-400 hover:text-gray-600'
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
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-tata-pink transition-all outline-none"
                      placeholder="Enter task summary..."
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
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-800 transition-all outline-none resize-none focus:bg-white focus:border-tata-pink"
                      placeholder="Technical details, context..."
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
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status / Current Step</label>
                {!item.workflow ? (
                  <select 
                    name="status" 
                    value={formData.status || ''} 
                    onChange={handleChange} 
                    className={`w-full border rounded-2xl py-3 px-4 font-bold transition-all outline-none ${
                        isTerminalState ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-800 focus:bg-white focus:border-tata-pink'
                    }`}
                    disabled={isTerminalState}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="SIT_DEPLOYED">SIT Deployed</option>
                    {/* ... other statuses ... */}
                    <option value="CLOSED">Closed</option>
                  </select>
                ) : (
                  <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl py-3 px-4 font-black text-indigo-700 flex items-center justify-between">
                    <span>{item.status.replace('_', ' ')}</span>
                    <span className="text-[10px] bg-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-widest">Workflow Active</span>
                  </div>
                )}
                </div>
                )}

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Workflow</label>
                <select 
                   name="workflowId" 
                   value={formData.workflowId || ''} 
                   onChange={handleChange} 
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 outline-none focus:bg-white focus:border-tata-pink transition-all"
                   disabled={item}
                >
                  <option value="">Default Workflow (Ad-hoc)</option>
                  {workflows.map(wf => <option key={wf.id} value={wf.id}>{wf.name}</option>)}
                </select>
              </div>

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
                <input 
                    name="jtrackId" 
                    value={formData.jtrackId || ''} 
                    onChange={handleChange} 
                    className={`w-full border rounded-2xl py-3 px-4 font-bold transition-all outline-none ${
                        item ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-50 border-gray-100 text-gray-800 focus:bg-white focus:border-tata-pink'
                    }`}
                    readOnly={item}
                />
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
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 focus:bg-white focus:border-tata-pink transition-all outline-none"
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" 
                    required={formData.status === 'IN_PROGRESS'}
                    disabled={isDateFieldDisabled('devStartDate')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    <span>SIT Date {['SIT_DEPLOYED', 'SIT_COMPLETED'].includes(formData.status) && <span className="text-red-500">*</span>}</span>
                  </label>
                  <input 
                      type="date" 
                      name="sitDate" 
                      value={formData.sitDate || ''} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" 
                      required={['SIT_DEPLOYED', 'SIT_COMPLETED'].includes(formData.status)}
                      disabled={isDateFieldDisabled('sitDate')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-tata-purple" />
                    <span>UAT Date {['UAT_COMPLETED', 'MOVE_TO_UAT'].includes(formData.status) && <span className="text-red-500">*</span>}</span>
                  </label>
                  <input 
                      type="date" 
                      name="uatDate" 
                      value={formData.uatDate || ''} 
                      onChange={handleChange} 
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      required={['UAT_COMPLETED', 'MOVE_TO_UAT'].includes(formData.status)} 
                      disabled={isDateFieldDisabled('uatDate')}
                  />
                </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-orange-400" />
                  <span>PREPROD Date {['PREPROD_DEPLOYED', 'PREPROD_COMPLETED'].includes(formData.status) && <span className="text-red-500">*</span>}</span>
                </label>
                <input 
                    type="date" 
                    name="preprodDate" 
                    value={formData.preprodDate || ''} 
                    onChange={handleChange} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" 
                    required={['PREPROD_DEPLOYED', 'PREPROD_COMPLETED'].includes(formData.status)}
                    disabled={isDateFieldDisabled('preprodDate')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest font-flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-tata-pink" />
                  <span>PROD Date {['PROD_DEPLOYED', 'PROD_COMPLETED'].includes(formData.status) && <span className="text-red-500">*</span>}</span>
                </label>
                <input 
                    type="date" 
                    name="productionDate" 
                    value={formData.productionDate || ''} 
                    onChange={handleChange} 
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-bold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed" 
                    required={['PROD_DEPLOYED', 'PROD_COMPLETED'].includes(formData.status)}
                    disabled={isDateFieldDisabled('productionDate')}
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
              </div>

              {formData.id && (
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center space-x-2">
                        <MessageSquare className="w-3.5 h-3.5 text-tata-pink" />
                        <span>Code Review Feedback</span>
                    </label>
                    <textarea 
                        name="codeReviewComments" 
                        value={formData.codeReviewComments || ''} 
                        onChange={handleChange} 
                        rows="3"
                        className={`w-full border rounded-2xl py-3 px-4 font-bold transition-all outline-none resize-none ${
                            (currentUser?.roles?.includes('ROLE_CODEREVIEWER') || currentUser?.roles?.includes('ROLE_DEVADMIN'))
                            ? 'bg-pink-50/30 border-pink-100 text-pink-900 focus:bg-white focus:border-tata-pink'
                            : 'bg-gray-50 border-gray-100 text-gray-500'
                        }`}
                        placeholder="Add your review feedback here..." 
                        disabled={!currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN')}
                    />
                  </div>
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
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 font-medium text-gray-800 focus:bg-white focus:border-tata-pink transition-all outline-none resize-none"
                    rows="3"
                  />
                  <button 
                    onClick={handleAddComment}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-tata-pink text-white shadow-lg shadow-tata-pink/20 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((c) => (
                  <div key={c.id} className="flex space-x-4 animate-slide-up">
                    <div className="w-10 h-10 rounded-xl bg-tata-purple bg-opacity-10 flex items-center justify-center font-bold text-tata-purple">
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
                            {log.changedBy?.fullName} changed <span className="text-tata-pink">{log.fieldName}</span>
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
            {(!canApprove()) && (
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center space-x-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Locked: Requires {currentWorkflowStep?.stepType?.replace('_', ' ') || 'Specific Role'} to approve</span>
                </p>
            )}
            <div className="flex items-center space-x-3">
              {item && item.workflow && !isTerminalState && (
                  <div className="flex items-center space-x-3">
                      <button 
                          onClick={() => handleWorkflowAction('approve')}
                          disabled={!canApprove()}
                          className={`flex flex-col items-center justify-center px-6 py-2 rounded-xl transition-all border ${
                              canApprove() 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white' 
                              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                          }`}
                      >
                          <div className="flex items-center space-x-2 font-black text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>APPROVE & MOVE</span>
                          </div>
                          {getNextStageName() && (
                              <span className="text-[9px] font-bold opacity-80 mt-0.5 tracking-wider">TO: {getNextStageName()}</span>
                          )}
                      </button>
                  </div>
              )}
              {item && (currentUser?.roles?.includes('ROLE_DEVADMIN') || currentUser?.roles?.includes('ROLE_TESTADMIN')) && (
                 <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 text-red-500 font-bold text-xs hover:bg-red-50 rounded-xl transition-all">
                   <Trash2 className="w-4 h-4" />
                   <span>Delete Task</span>
                 </button>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
             {item && (!formData.assignedDeveloper || !formData.assignedDeveloper.id) && !formData.inPool && 
              (currentUser?.roles?.some(r => r.includes('ADMIN') || r.includes('DEVADMIN'))) && (
                <button 
                  onClick={handlePushToPool}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 font-black text-xs rounded-xl hover:bg-black hover:text-white transition-all border border-indigo-100 shadow-sm group/pool"
                >
                  <Zap className="w-4 h-4 fill-current group-hover/pool:fill-yellow-400 transition-colors" />
                  <span>PUSH TO POOL</span>
                </button>
             )}
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-gray-500 font-bold text-xs hover:bg-gray-100 transition-all">Cancel</button>
             {!isTerminalState && (
                 <button 
                    onClick={handleSave}
                    disabled={item && item.assignedDeveloper && item.assignedDeveloper.id !== currentUser?.id && !currentUser?.roles?.includes('ROLE_CODEREVIEWER') && !currentUser?.roles?.includes('ROLE_DEVADMIN')}
                    className="btn-tata flex items-center space-x-2 py-2.5 px-8 shadow-lg shadow-tata-pink/20 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Save className="w-4 h-4" />
                    <span>{item ? 'Save Changes' : 'Create Task'}</span>
                 </button>
             )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TaskModal;
