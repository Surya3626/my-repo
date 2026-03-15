import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Bugs from './pages/Bugs';
import TestCases from './pages/TestCases';
import Reports from './pages/Reports';
import AllTasks from './pages/AllTasks';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WorkflowManagement from './pages/WorkflowManagement';
import CodeReviews from './pages/CodeReviews';
import BugReview from './pages/BugReview';
import TestingDashboard from './pages/UATTesting';
import Deliverables from './pages/Deliverables';
import TaskPool from './pages/TaskPool';
import { NotificationProvider } from './context/NotificationContext';
import Notification from './components/Notification';

function App() {
  return (
    <NotificationProvider>
      <Router basename="/deltascribe">
        <Notification />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="bugs" element={<Bugs />} />
            <Route path="testcases" element={<TestCases />} />
            <Route path="reports" element={<Reports />} />
            <Route path="all-tasks" element={<AllTasks />} />
            <Route path="workflows" element={<WorkflowManagement />} />
            <Route path="code-reviews" element={<CodeReviews />} />
            <Route path="review-bugs" element={<BugReview />} />
            <Route path="uat-testing" element={<TestingDashboard />} />
            <Route path="deliverables" element={<Deliverables />} />
            <Route path="task-pool" element={<TaskPool />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;
