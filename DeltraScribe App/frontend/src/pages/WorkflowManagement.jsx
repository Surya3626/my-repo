import { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Settings,
  X,
  PlusCircle,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import Logo from '../components/Logo';
import apiClient from '../api/client';
import { useNotification } from '../context/NotificationContext';

const WorkflowManagement = () => {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isAddingWorkflow, setIsAddingWorkflow] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', type: 'TASK' });
  const [newStep, setNewStep] = useState({ stepName: '', sequence: '' });
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await apiClient.get('/workflows');
      setWorkflows(res.data);
    } catch (e) {
      showNotification('Failed to fetch workflows', 'error');
    }
  };

  const handleCreateWorkflow = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/workflows', { ...newWorkflow, steps: [] });
      setNewWorkflow({ name: '', type: 'TASK' });
      setIsAddingWorkflow(false);
      fetchWorkflows();
      showNotification('Workflow created successfully!', 'success');
    } catch (e) {
      showNotification('Failed to create workflow', 'error');
    }
  };

  const handleAddStep = async (e) => {
    e.preventDefault();
    if (!selectedWorkflow) return;
    try {
      const updatedSteps = [...selectedWorkflow.steps, { 
        ...newStep, 
        sequence: parseInt(newStep.sequence) 
      }].sort((a, b) => a.sequence - b.sequence);
      
      const res = await apiClient.put(`/workflows/${selectedWorkflow.id}`, {
        ...selectedWorkflow,
        steps: updatedSteps
      });
      setSelectedWorkflow(res.data);
      setNewStep({ stepName: '', sequence: '' });
      fetchWorkflows();
      showNotification('Step added successfully!', 'success');
    } catch (e) {
      showNotification('Failed to add step', 'error');
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!selectedWorkflow) return;
    try {
      const updatedSteps = selectedWorkflow.steps.filter(s => s.id !== stepId);
      const res = await apiClient.put(`/workflows/${selectedWorkflow.id}`, {
        ...selectedWorkflow,
        steps: updatedSteps
      });
      setSelectedWorkflow(res.data);
      fetchWorkflows();
      showNotification('Step deleted successfully!', 'success');
    } catch (e) {
      showNotification('Failed to delete step', 'error');
    }
  };

  const handleDeleteWorkflow = async (id) => {
    if (!window.confirm('Delete this workflow? All associated tasks will lose their context.')) return;
    try {
      await apiClient.delete(`/workflows/${id}`);
      if (selectedWorkflow?.id === id) setSelectedWorkflow(null);
      fetchWorkflows();
      showNotification('Workflow deleted successfully!', 'success');
    } catch (e) {
      showNotification('Failed to delete workflow', 'error');
    }
  };

  return (
    <div className="p-8 space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Workflow Intelligence</h1>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Enterprise Process Orchestration</p>
        </div>
        <button 
          onClick={() => setIsAddingWorkflow(true)}
          className="bg-deltascribe-navy text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-deltascribe-navy/20 hover:scale-105 active:scale-95 transition-all flex items-center space-x-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workflow List */}
        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm space-y-6 flex flex-col h-[600px]">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Available Engines</h3>
          <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
            {workflows.map(wf => (
              <div 
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className={`group p-6 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                  selectedWorkflow?.id === wf.id 
                  ? 'bg-indigo-50 border-indigo-100' 
                  : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:border-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{wf.type}</p>
                    <h4 className="text-lg font-black text-gray-800">{wf.name}</h4>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {selectedWorkflow?.id === wf.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps Editor */}
        <div className="lg:col-span-2 bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm flex flex-col h-[600px] relative overflow-hidden">
          {!selectedWorkflow ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-8 rounded-[40px] bg-gray-50 border border-gray-100">
                <GitBranch className="w-12 h-12 text-gray-300" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800">Select a Workflow</h3>
                <p className="text-gray-400 font-medium">Configure states and transition sequences</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-gray-50 pb-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-2xl bg-deltascribe-navy text-white shadow-lg shadow-deltascribe-navy/20">
                    <Logo className="w-5 h-5" color="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-gray-800">{selectedWorkflow.name}</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Type: {selectedWorkflow.type}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4 pb-20">
                <div className="grid grid-cols-1 gap-4">
                  {selectedWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="group flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                        {step.sequence}
                      </div>
                      <div className="flex-1 bg-gray-50/50 border border-gray-100 rounded-3xl p-6 flex items-center justify-between group-hover:border-indigo-100 transition-all">
                        <span className="text-sm font-black text-gray-700 tracking-wide">{step.stepName}</span>
                        <button 
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {index < selectedWorkflow.steps.length - 1 && (
                        <div className="absolute left-[2.4rem] h-4 w-[2px] bg-gray-100" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Step Form */}
                <form onSubmit={handleAddStep} className="mt-8 pt-8 border-t border-gray-50 flex space-x-4">
                  <input 
                    value={newStep.stepName}
                    onChange={(e) => setNewStep({ ...newStep, stepName: e.target.value.toUpperCase() })}
                    placeholder="STEP NAME (e.g. TESTING)"
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-6 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                  <input 
                    type="number"
                    value={newStep.sequence}
                    onChange={(e) => setNewStep({ ...newStep, sequence: e.target.value })}
                    placeholder="SEQ"
                    className="w-24 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-6 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!newStep.stepName || !newStep.sequence}
                    className="bg-gray-900 text-white p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New Workflow Modal */}
      {isAddingWorkflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddingWorkflow(false)}></div>
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 relative z-10 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-800">New Engine</h2>
              <button onClick={() => setIsAddingWorkflow(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <form onSubmit={handleCreateWorkflow} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Workflow Name</label>
                <input 
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="e.g. Standard Mobile Workflow"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold outline-none focus:bg-white focus:border-indigo-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Domain Type</label>
                <select 
                  value={newWorkflow.type}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, type: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold outline-none"
                >
                  <option value="TASK">TASK SYSTEM</option>
                  <option value="BUG">BUG TRACKING</option>
                </select>
              </div>
              <button 
                type="submit"
                className="w-full bg-deltascribe-navy text-white rounded-2xl py-4 font-black shadow-xl shadow-deltascribe-navy/20 hover:bg-slate-800 transition-all"
              >
                INITIALIZE WORKFLOW
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowManagement;
