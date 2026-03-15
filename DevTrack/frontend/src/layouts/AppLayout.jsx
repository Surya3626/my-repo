import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import authService from '../services/authService';

const AppLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-outfit">
      <Sidebar 
        userRoles={currentUser.roles} 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-tata-purple/5 to-transparent pointer-events-none"></div>
        <Topbar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
