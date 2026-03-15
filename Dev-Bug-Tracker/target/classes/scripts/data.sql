-- DevTrack Sample Data
-- This script inserts sample task data for testing and demonstration

-- Clear existing data
DELETE FROM task;

-- Insert sample tasks
INSERT INTO task (developer_name, task_name, status, sit_date, uat_date, prod_date, type, branch, priority, jtrack_id, description, efforts, dev_start_date) VALUES
('John Doe', 'Implement User Authentication', 'In Progress', '2024-11-25', '2024-11-28', '2024-12-01', 'Feature', 'feature/auth-system', 'High', 'JT-1001', 'Implement JWT-based authentication system with role-based access control', 5.0, '2024-11-20'),
('Jane Smith', 'Fix Payment Gateway Bug', 'Completed', '2024-11-22', '2024-11-24', '2024-11-26', 'Bug', 'bugfix/payment-issue', 'High', 'JT-1002', 'Resolve timeout issues in payment gateway integration', 2.5, '2024-11-18'),
('Mike Johnson', 'Database Migration', 'In Progress', '2024-11-26', '2024-11-29', '2024-12-02', 'Task', 'task/db-migration', 'Medium', 'JT-1003', 'Migrate database from MySQL 5.7 to MySQL 8.0', 8.0, '2024-11-19'),
('Sarah Williams', 'Update Dashboard UI', 'Done', '2024-11-23', '2024-11-25', '2024-11-27', 'Enhancement', 'feature/dashboard-v3', 'Medium', 'JT-1004', 'Implement modern glassmorphism design for dashboard', 4.0, '2024-11-15'),
('Tom Brown', 'API Rate Limiting', 'Blocked', '2024-11-27', '2024-11-30', '2024-12-03', 'Feature', 'feature/rate-limit', 'High', 'JT-1005', 'Implement rate limiting for public APIs to prevent abuse', 3.5, '2024-11-21'),
('Emily Davis', 'Email Notification Service', 'In Progress', '2024-11-24', '2024-11-27', '2024-11-29', 'Feature', 'feature/email-service', 'Medium', 'JT-1006', 'Create email notification service for task updates and alerts', 6.0, '2024-11-17'),
('David Wilson', 'Performance Optimization', 'To Do', '2024-11-28', '2024-12-01', '2024-12-04', 'Task', 'task/performance', 'Low', 'JT-1007', 'Optimize database queries and implement caching strategy', 7.0, '2024-11-22'),
('Lisa Anderson', 'Mobile App Integration', 'In Progress', '2024-11-29', '2024-12-02', '2024-12-05', 'Feature', 'feature/mobile-api', 'High', 'JT-1008', 'Create REST API endpoints for mobile application', 10.0, '2024-11-16'),
('Chris Martinez', 'Security Audit', 'To Do', '2024-11-30', '2024-12-03', '2024-12-06', 'Task', 'task/security-audit', 'High', 'JT-1009', 'Conduct comprehensive security audit and fix vulnerabilities', 5.5, '2024-11-23'),
('Anna Taylor', 'Report Generation Module', 'In Progress', '2024-11-25', '2024-11-28', '2024-12-01', 'Feature', 'feature/reports', 'Medium', 'JT-1010', 'Build PDF and Excel report generation functionality', 4.5, '2024-11-19');

-- Additional sample data for variety
INSERT INTO task (developer_name, task_name, status, sit_date, uat_date, prod_date, type, branch, priority, jtrack_id, description, efforts, dev_start_date) VALUES
('Robert Lee', 'Implement Dark Mode', 'Completed', '2024-11-21', '2024-11-23', '2024-11-25', 'Enhancement', 'feature/dark-mode', 'Low', 'JT-1011', 'Add dark mode theme support across the application', 3.0, '2024-11-14'),
('Jennifer White', 'User Profile Management', 'In Progress', '2024-11-26', '2024-11-29', '2024-12-02', 'Feature', 'feature/user-profile', 'Medium', 'JT-1012', 'Create user profile management with avatar upload', 5.5, '2024-11-20'),
('Kevin Harris', 'Fix Memory Leak', 'Completed', '2024-11-20', '2024-11-22', '2024-11-24', 'Bug', 'bugfix/memory-leak', 'High', 'JT-1013', 'Resolve memory leak in background task processor', 2.0, '2024-11-17'),
('Michelle Clark', 'Implement Search Feature', 'To Do', '2024-12-01', '2024-12-04', '2024-12-07', 'Feature', 'feature/search', 'Medium', 'JT-1014', 'Add full-text search capability with filters', 6.5, '2024-11-24'),
('Daniel Lewis', 'API Documentation', 'In Progress', '2024-11-27', '2024-11-30', '2024-12-03', 'Task', 'task/api-docs', 'Low', 'JT-1015', 'Create comprehensive API documentation using Swagger', 4.0, '2024-11-21');
