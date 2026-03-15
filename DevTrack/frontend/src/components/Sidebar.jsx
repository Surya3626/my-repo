import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Bug, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Activity,
  BarChart3,
  TestTube2,
  Users,
  PanelLeftClose,
  PanelLeftOpen,
  GitBranch,
  Truck,
  Zap,
  ClipboardCheck
} from 'lucide-react';
import authService from '../services/authService';

const Sidebar = ({ userRoles: propRoles, isCollapsed, onToggle }) => {
  const location = useLocation();
  const currentUser = authService.getCurrentUser();

  const menuItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      roles: ['DEVADMIN', 'DEVELOPER', 'TESTER', 'TESTADMIN']
    },
    { 
      path: '/tasks', 
      label: 'My Tasks', 
      icon: CheckSquare,
      roles: ['DEVADMIN', 'DEVELOPER']
    },
    { 
      path: '/all-tasks', 
      label: 'All Tasks', 
      icon: Users,
      roles: ['DEVADMIN']
    },
    { 
      path: '/bugs', 
      label: 'Bug Tracking', 
      icon: Bug,
      roles: ['DEVADMIN', 'DEVELOPER', 'TESTER', 'TESTADMIN']
    },
    { 
      path: '/testcases', 
      label: 'QA Center', 
      icon: TestTube2,
      roles: ['DEVADMIN', 'TESTER', 'TESTADMIN']
    },
    { 
      path: '/review-bugs', 
      label: 'Bug Review', 
      icon: CheckSquare,
      roles: ['TESTER', 'TESTADMIN']
    },
    { 
      path: '/reports', 
      label: 'Reports', 
      icon: BarChart3,
      roles: ['DEVADMIN', 'TESTADMIN']
    },
    { 
      path: '/workflows', 
      label: 'Workflows', 
      icon: GitBranch,
      roles: ['DEVADMIN', 'TESTADMIN']
    },
    { 
      path: '/code-reviews', 
      label: 'My Code Reviews', 
      icon: Activity,
      roles: ['DEVADMIN', 'CODEREVIEWER']
    },
    { 
      path: '/uat-testing', 
      label: 'Testing Dashboard', 
      icon: ClipboardCheck,
      roles: ['TESTER', 'TESTADMIN']
    },
    { 
      path: '/deliverables', 
      label: 'Deliverables', 
      icon: Truck,
      roles: ['DEVADMIN', 'TESTADMIN']
    },
    { 
      path: '/task-pool', 
      label: 'Task Pool', 
      icon: Zap,
      roles: ['DEVADMIN', 'DEVELOPER']
    }
  ];

  // Get all roles for the user, stripped of ROLE_ prefix
  const userRoles = (currentUser?.roles || []).map(r => r.replace('ROLE_', ''));

  const filteredMenu = menuItems.filter(item => 
    item.roles.some(role => userRoles.includes(role))
  );

  return (
    <aside className={`${isCollapsed ? 'w-24' : 'w-72'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 z-20 transition-all duration-500 ease-in-out`}>
      <div className={`p-8 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6 relative`}>
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-tata-gradient rounded-2xl shadow-lg shadow-tata-pink/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">DevTrack</h1>
              <span className="text-[10px] font-bold text-tata-pink tracking-widest uppercase opacity-70">Enterprise</span>
            </div>
          </div>
        )}
        {isCollapsed && (
           <div className="p-2.5 bg-tata-gradient rounded-2xl shadow-lg shadow-tata-pink/20">
              <Activity className="w-6 h-6 text-white" />
           </div>
        )}
        
        {/* Toggle Button */}
        <button 
          onClick={onToggle}
          className={`absolute ${isCollapsed ? '-right-3' : '-right-3'} top-10 p-1.5 bg-white border border-gray-100 rounded-lg shadow-md text-gray-400 hover:text-tata-pink hover:scale-110 transition-all z-30`}
        >
          {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {filteredMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3.5 rounded-2xl transition-all group ${
                isActive 
                ? 'bg-tata-gradient text-white shadow-xl shadow-tata-pink/20' 
                : 'text-slate-400 hover:text-tata-pink hover:bg-pink-50'
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'group-hover:text-tata-pink'}`} />
                {!isCollapsed && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
              </div>
              {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 text-white opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <button 
          onClick={() => { authService.logout(); window.location.reload(); }}
          className={`w-full flex items-center justify-center ${isCollapsed ? '' : 'space-x-2'} p-4 rounded-[28px] text-red-500 font-black text-xs bg-red-50/50 hover:bg-red-50 transition-all border border-red-100/50 shadow-sm`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="uppercase tracking-widest">Logout Session</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
