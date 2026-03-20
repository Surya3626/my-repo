-- Clean existing data
DELETE FROM audit_logs;
DELETE FROM comments;
DELETE FROM test_cases;
DELETE FROM test_case_tasks;
DELETE FROM bugs;
DELETE FROM bug_tasks;
DELETE FROM tasks;
DELETE FROM workflow_steps;
DELETE FROM workflows;
DELETE FROM task_types;
DELETE FROM users;
DELETE FROM app_configs;

-- Users (Password: password)
INSERT INTO users (id, username, password, full_name, email) VALUES 
(1, 'rajesh', '$2a$10$HGmXeVRxf5.es2.voimqQOdhb4yKHcdIfy5MliNx6TejwQTL773pK', 'Rajesh Kumar', 'rajesh@devtrack.com'),
(2, 'suresh', '$2a$10$HGmXeVRxf5.es2.voimqQOdhb4yKHcdIfy5MliNx6TejwQTL773pK', 'Suresh Raina', 'suresh@devtrack.com'),
(3, 'amit', '$2a$10$HGmXeVRxf5.es2.voimqQOdhb4yKHcdIfy5MliNx6TejwQTL773pK', 'Amit Shah', 'amit@devtrack.com'),
(4, 'testadmin', '$2a$10$HGmXeVRxf5.es2.voimqQOdhb4yKHcdIfy5MliNx6TejwQTL773pK', 'QA Manager', 'testadmin@devtrack.com'),
(5, 'reviewer', '$2a$10$HGmXeVRxf5.es2.voimqQOdhb4yKHcdIfy5MliNx6TejwQTL773pK', 'Code Reviewer', 'reviewer@devtrack.com'),
(6, 'admin', '$2a$10$HGmXeVRxf5.es2.voimqQOdhb4yKHcdIfy5MliNx6TejwQTL773pK', 'System Admin', 'admin@devtrack.com');

-- User Roles Mapping
INSERT INTO user_roles (user_id, role) VALUES 
(1, 'DEVELOPER'),
(2, 'DEVELOPER'),
(3, 'TESTER'),
(4, 'TESTADMIN'),
(5, 'CODEREVIEWER'),
(6, 'DEVADMIN'),
(6, 'CODEREVIEWER'),
(4, 'TESTER'); -- QA Manager is also a Tester

-- App Configurations
INSERT INTO app_configs (config_key, config_value, description) VALUES
('STATUS_PUSHED_FOR_UAT', 'UAT_TESTING', 'Status that pushes task for testing bucket'),
('STATUS_UAT_COMPLETED', 'UAT_COMPLETED', 'Status when UAT is approved'),
('STATUS_REJECTED', 'IN_PROGRESS', 'Status when UAT is rejected'),
('STATUS_SIT_DEPLOYED', 'SIT_COMPLETED', 'Status for SIT deployment section'),
('STATUS_UAT_DEPLOYED', 'UAT_COMPLETED', 'Status for UAT deployment section'),
('STATUS_PROD_READY', 'CLOSED', 'Status for Prod deployment section'),
('STATUS_CODE_REVIEW', 'CODE_REVIEW', 'Status for code review bucket'),
('STATUS_PUSHED_FOR_SIT', 'SIT_TESTING', 'Status that pushes task for SIT testing bucket'),
('STATUS_SIT_COMPLETED', 'SIT_COMPLETED', 'Status when SIT is approved'),
('SIT_APPROVAL_REQUIRED', 'true', 'Flag to enable/disable SIT testing requirement'),
('UAT_APPROVAL_REQUIRED', 'true', 'Flag to enable/disable UAT testing requirement');

-- Workflows
INSERT INTO workflows (id, name, type) VALUES 
(1, 'Standard Dev Workflow', 'TASK'),
(2, 'Bug Resolution Workflow', 'BUG');

-- Task Types
INSERT INTO task_types (id, name, description) VALUES
(1, 'CR', 'Change Request'),
(2, 'SR', 'Service Request'),
(3, 'FIX', 'Bug Fix'),
(4, 'NEW_REQ', 'New Requirement');

-- Workflow Steps (Standard Dev Workflow - ID 1)
INSERT INTO workflow_steps (workflow_id, step_name, step_type, sequence) VALUES 
(1, 'OPEN', 'TASK', 1),
(1, 'IN_PROGRESS', 'TASK', 2),
(1, 'SIT_DEPLOYED', 'TASK', 3),
(1, 'SIT_TESTING', 'TESTING', 4),
(1, 'SIT_COMPLETED', 'TASK', 5),
(1, 'CODE_REVIEW', 'CODE_REVIEW', 6),
(1, 'CODE_REVIEW_DONE', 'TASK', 7),
(1, 'MOVE_TO_UAT', 'TASK', 8),
(1, 'UAT_TESTING', 'TESTING', 9),
(1, 'UAT_COMPLETED', 'TASK', 10),
(1, 'PROD_DEPLOYED', 'TASK', 11),
(1, 'PROD_COMPLETED', 'TASK', 12),
(1, 'CLOSED', 'TASK', 13);

-- Workflow Steps (Bug Resolution Workflow - ID 2)
INSERT INTO workflow_steps (workflow_id, step_name, step_type, sequence) VALUES 
(2, 'OPEN', 'TASK', 1),
(2, 'IN_PROGRESS', 'TASK', 2),
(2, 'RESOLVED', 'TASK', 3),
(2, 'VERIFIED', 'TESTING', 4),
(2, 'CLOSED', 'TASK', 5);

-- Tasks
-- Tasks for end-to-end testing (all 12 stages)
INSERT INTO tasks (id, jtrack_id, title, description, task_type_id, status, priority, assigned_developer_id, created_by_id, workflow_id, dev_start_date, sit_date, uat_date, production_date, efforts, created_date, updated_date, is_in_pool, in_pool_date) VALUES
(1, 'DT-101', 'Task in OPEN', 'Testing the OPEN stage.', 1, 'OPEN', 'Highest', NULL, 1, 1, NULL, NULL, NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(2, 'DT-102', 'Task in IN_PROGRESS', 'Testing the IN_PROGRESS stage.', 2, 'IN_PROGRESS', 'High', 2, 1, 1, '2024-12-01', NULL, NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(3, 'DT-103', 'Task in SIT_DEPLOYED', 'Testing the SIT_DEPLOYED stage.', 1, 'SIT_DEPLOYED', 'Medium', 2, 1, 1, '2024-12-01', NULL, NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(4, 'DT-104', 'Task in SIT_TESTING', 'Testing the SIT_TESTING stage.', 3, 'SIT_TESTING', 'Low', 2, 1, 1, '2024-12-01', '2024-12-05', NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(5, 'DT-105', 'Task in SIT_COMPLETED', 'Testing the SIT_COMPLETED stage.', 4, 'SIT_COMPLETED', 'High', 2, 1, 1, '2024-12-01', '2024-12-05', NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(6, 'DT-106', 'Task in CODE_REVIEW', 'Testing the CODE_REVIEW stage.', 1, 'CODE_REVIEW', 'Highest', 2, 1, 1, '2024-12-01', '2024-12-05', NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(13, 'DT-113', 'Task in CODE_REVIEW_DONE', 'Testing the CODE_REVIEW_DONE stage.', 1, 'CODE_REVIEW_DONE', 'Highest', 2, 1, 1, '2024-12-01', '2024-12-05', NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(7, 'DT-107', 'Task in MOVE_TO_UAT', 'Testing the MOVE_TO_UAT stage.', 2, 'MOVE_TO_UAT', 'Medium', 2, 1, 1, '2024-12-01', '2024-12-05', NULL, NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(8, 'DT-108', 'Task in UAT_TESTING', 'Testing the UAT_TESTING stage.', 3, 'UAT_TESTING', 'High', 2, 1, 1, '2024-12-01', '2024-12-05', '2024-12-10', NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(9, 'DT-109', 'Task in UAT_COMPLETED', 'Testing the UAT_COMPLETED stage.', 4, 'UAT_COMPLETED', 'Low', 2, 1, 1, '2024-12-01', '2024-12-05', '2024-12-10', NULL, 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(10, 'DT-110', 'Task in PROD_DEPLOYED', 'Testing the PROD_DEPLOYED stage.', 1, 'PROD_DEPLOYED', 'High', 2, 1, 1, '2024-12-01', '2024-12-05', '2024-12-10', '2024-12-15', 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(11, 'DT-111', 'Task in PROD_COMPLETED', 'Testing the PROD_COMPLETED stage.', 2, 'PROD_COMPLETED', 'Medium', 2, 1, 1, '2024-12-01', '2024-12-05', '2024-12-10', '2024-12-15', 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(12, 'DT-112', 'Task in CLOSED', 'Testing the CLOSED stage.', 3, 'CLOSED', 'Low', 2, 1, 1, '2024-12-01', '2024-12-05', '2024-12-10', '2024-12-15', 5.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(14, 'DT-114', 'Bulk Task 1', 'Pagination test data.', 1, 'OPEN', 'High', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(15, 'DT-115', 'Bulk Task 2', 'Pagination test data.', 1, 'IN_PROGRESS', 'Medium', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(16, 'DT-116', 'Bulk Task 3', 'Pagination test data.', 1, 'OPEN', 'Low', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(17, 'DT-117', 'Bulk Task 4', 'Pagination test data.', 2, 'OPEN', 'High', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(18, 'DT-118', 'Bulk Task 5', 'Pagination test data.', 2, 'IN_PROGRESS', 'Medium', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(19, 'DT-119', 'Bulk Task 6', 'Pagination test data.', 2, 'OPEN', 'Low', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(20, 'DT-120', 'Bulk Task 7', 'Pagination test data.', 3, 'OPEN', 'High', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(21, 'DT-121', 'Bulk Task 8', 'Pagination test data.', 3, 'IN_PROGRESS', 'Medium', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(22, 'DT-122', 'Bulk Task 9', 'Pagination test data.', 3, 'OPEN', 'Low', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(23, 'DT-123', 'Bulk Task 10', 'Pagination test data.', 4, 'OPEN', 'High', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(24, 'DT-124', 'Bulk Task 11', 'Pagination test data.', 4, 'IN_PROGRESS', 'Medium', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(25, 'DT-125', 'Bulk Task 12', 'Pagination test data.', 4, 'OPEN', 'Low', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(26, 'DT-126', 'Bulk Task 13', 'Pagination test data.', 1, 'OPEN', 'High', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(27, 'DT-127', 'Bulk Task 14', 'Pagination test data.', 1, 'IN_PROGRESS', 'Medium', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(28, 'DT-128', 'Bulk Task 15', 'Pagination test data.', 1, 'OPEN', 'Low', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(29, 'DT-129', 'Bulk Task 16', 'Pagination test data.', 1, 'CLOSED', 'High', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(30, 'DT-130', 'Bulk Task 17', 'Pagination test data.', 1, 'CLOSED', 'Medium', 2, 1, 1, NULL, NULL, NULL, NULL, 1.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL);

-- Bug Tasks (Tester created tasks)
INSERT INTO bug_tasks (id, jtrack_id, title, description, task_type_id, status, priority, assigned_developer_id, created_by_id, workflow_id, efforts, created_date, updated_date) VALUES
(1, 'BT-101', 'Fix Token Expiration Bug', 'Tester identified critical auth bug during verification.', 3, 'OPEN', 'High', 2, 4, 1, 4.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'BT-102', 'UI Alignment Issue in Mobile', 'Fix sidebar overlapping in small screens.', 3, 'IN_PROGRESS', 'Medium', 3, 4, 1, 2.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Test Case Tasks
INSERT INTO test_case_tasks (id, jtrack_id, title, description, status, priority, assigned_developer_id, created_by_id, workflow_id, created_date, updated_date) VALUES
(1, 'TCT-101', 'Authentication Regression', 'Full regression of auth module.', 'OPEN', 'High', 2, 4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Bugs
INSERT INTO bugs (id, jtrack_id, bug_task_id, title, description, status, priority, severity, raised_by_id, assigned_developer_id, workflow_id, created_date, updated_date, is_in_pool, in_pool_date) VALUES
(1, 'BUG-201', 1, 'Token expiration mismatch', 'JWT expires sooner than expected, causing logout.', 'OPEN', 'High', 'Critical', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(2, 'BUG-202', 2, 'Sidebar overlap on iPhone 13', 'Mobile view layout issues in Safari.', 'IN_PROGRESS', 'Medium', 'High', 4, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(3, 'BUG-203', NULL, 'Validation Error on Signup', 'Email validation regex is too restrictive.', 'UAT_TESTING', 'Low', 'Medium', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(4, 'BUG-204', NULL, 'Bulk Bug 1', 'Pagination test data.', 'OPEN', 'High', 'Critical', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(5, 'BUG-205', NULL, 'Bulk Bug 2', 'Pagination test data.', 'IN_PROGRESS', 'Medium', 'High', 4, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(6, 'BUG-206', NULL, 'Bulk Bug 3', 'Pagination test data.', 'OPEN', 'Low', 'Low', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(7, 'BUG-207', NULL, 'Bulk Bug 4', 'Pagination test data.', 'OPEN', 'High', 'Critical', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(8, 'BUG-208', NULL, 'Bulk Bug 5', 'Pagination test data.', 'IN_PROGRESS', 'Medium', 'High', 4, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(9, 'BUG-209', NULL, 'Bulk Bug 6', 'Pagination test data.', 'OPEN', 'Low', 'Low', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(10, 'BUG-210', NULL, 'Bulk Bug 7', 'Pagination test data.', 'OPEN', 'High', 'Critical', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(11, 'BUG-211', NULL, 'Bulk Bug 8', 'Pagination test data.', 'IN_PROGRESS', 'Medium', 'High', 4, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(12, 'BUG-212', NULL, 'Bulk Bug 9', 'Pagination test data.', 'OPEN', 'Low', 'Low', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(13, 'BUG-213', NULL, 'Bulk Bug 10', 'Pagination test data.', 'CLOSED', 'High', 'Critical', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(14, 'BUG-214', NULL, 'Bulk Bug 11', 'Pagination test data.', 'CLOSED', 'Medium', 'High', 4, 3, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL),
(15, 'BUG-215', NULL, 'Bulk Bug 12', 'Pagination test data.', 'CLOSED', 'Low', 'Low', 4, 2, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false, NULL);

-- Test Cases
INSERT INTO test_cases (id, test_case_task_id, title, description, steps, expected_result, created_by_id, created_date) VALUES
(1, 1, 'Valid Login Test', 'Verify successful login with correct creds', '1. Enter user\n2. Enter pass\n3. Click Login', 'Redirect to Dashboard', 4, CURRENT_TIMESTAMP),
(2, 1, 'Expired Token Test', 'Verify access is denied with expired token', '1. Use old token\n2. Call API', '401 Unauthorized', 4, CURRENT_TIMESTAMP),
(3, 1, 'Dashboard Widget Loading', 'Verify widgets load data from API correctly', '1. Open Dashboard\n2. Wait for loaders', 'All widgets show data', 4, CURRENT_TIMESTAMP),
(4, 1, 'Rate Limit Test', 'Verify 429 error after 100 requests', '1. Execute loop\n2. Check status', '429 Too Many Requests', 4, CURRENT_TIMESTAMP),
(5, 1, 'Bulk Test 1', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(6, 1, 'Bulk Test 2', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(7, 1, 'Bulk Test 3', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(8, 1, 'Bulk Test 4', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(9, 1, 'Bulk Test 5', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(10, 1, 'Bulk Test 6', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(11, 1, 'Bulk Test 7', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(12, 1, 'Bulk Test 8', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(13, 1, 'Bulk Test 9', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(14, 1, 'Bulk Test 10', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(15, 1, 'Bulk Test 11', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP),
(16, 1, 'Bulk Test 12', 'Pagination test data.', 'Steps...', 'Expected...', 4, CURRENT_TIMESTAMP);

-- Comments
INSERT INTO comments (id, entity_type, entity_id, text, user_id, created_date) VALUES
(1, 'TASK', 1, 'Security logic started.', 2, CURRENT_TIMESTAMP),
(2, 'BUG', 1, 'Confirmed, linked to BT-101.', 2, CURRENT_TIMESTAMP),
(3, 'BUG', 2, 'Investigating Safari specific CSS.', 3, CURRENT_TIMESTAMP);

-- Audit Logs
INSERT INTO audit_logs (id, entity_type, entity_id, field_name, old_value, new_value, changed_by_id, changed_date) VALUES
(1, 'TASK', 1, 'status', 'OPEN', 'IN_PROGRESS', 1, CURRENT_TIMESTAMP),
(2, 'BUG', 3, 'status', 'OPEN', 'RESOLVED', 2, CURRENT_TIMESTAMP);

-- Runtime simulation for all 12 tasks
INSERT INTO task_workflow_map (task_id, workflow_id, step_id, step_name, step_type, sequence, status, created_at, updated_at) VALUES 
-- DT-101 (OPEN)
(1, 1, 1, 'OPEN', 'TASK', 1, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-102 (IN_PROGRESS)
(2, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-103 (SIT_DEPLOYED)
(3, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-104 (SIT_TESTING)
(4, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-105 (SIT_COMPLETED)
(5, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-106 (CODE_REVIEW)
(6, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 1, 6, 'CODE_REVIEW', 'CODE_REVIEW', 6, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-107 (UAT_DEPLOYED)
(7, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 6, 'CODE_REVIEW', 'CODE_REVIEW', 6, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 1, 7, 'MOVE_TO_UAT', 'TASK', 7, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-108 (UAT_TESTING)
(8, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 6, 'CODE_REVIEW', 'CODE_REVIEW', 6, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 7, 'MOVE_TO_UAT', 'TASK', 7, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 1, 8, 'UAT_TESTING', 'TESTING', 8, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-109 (UAT_COMPLETED)
(9, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 6, 'CODE_REVIEW', 'CODE_REVIEW', 6, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 7, 'UAT_DEPLOYED', 'TASK', 7, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 8, 'UAT_TESTING', 'TESTING', 8, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 1, 9, 'UAT_COMPLETED', 'TASK', 9, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-110 (PROD_DEPLOYED)
(10, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 6, 'CODE_REVIEW', 'CODE_REVIEW', 6, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 7, 'UAT_DEPLOYED', 'TASK', 7, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 8, 'UAT_TESTING', 'TESTING', 8, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 9, 'UAT_COMPLETED', 'TASK', 9, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 10, 'PROD_DEPLOYED', 'TASK', 10, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- DT-111 (PROD_COMPLETED)
(11, 1, 1, 'OPEN', 'TASK', 1, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 2, 'IN_PROGRESS', 'TASK', 2, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 3, 'SIT_DEPLOYED', 'TASK', 3, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 4, 'SIT_TESTING', 'TESTING', 4, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 5, 'SIT_COMPLETED', 'TASK', 5, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 6, 'CODE_REVIEW', 'CODE_REVIEW', 6, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 7, 'UAT_DEPLOYED', 'TASK', 7, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 8, 'UAT_TESTING', 'TESTING', 8, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 9, 'UAT_COMPLETED', 'TASK', 9, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 10, 'PROD_DEPLOYED', 'TASK', 10, 'CLOSED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 11, 'PROD_COMPLETED', 'TASK', 11, 'IN_PROGRESS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Reset Sequences for H2 (Restart with ID + 1 to avoid PK violations)
ALTER TABLE task_workflow_map ALTER COLUMN id RESTART WITH 100;
ALTER TABLE users ALTER COLUMN id RESTART WITH 100;
ALTER TABLE workflows ALTER COLUMN id RESTART WITH 100;
ALTER TABLE task_types ALTER COLUMN id RESTART WITH 100;
ALTER TABLE workflow_steps ALTER COLUMN id RESTART WITH 100;
ALTER TABLE tasks ALTER COLUMN id RESTART WITH 200;
ALTER TABLE bug_tasks ALTER COLUMN id RESTART WITH 200;
ALTER TABLE test_case_tasks ALTER COLUMN id RESTART WITH 200;
ALTER TABLE bugs ALTER COLUMN id RESTART WITH 200;
ALTER TABLE test_cases ALTER COLUMN id RESTART WITH 200;
ALTER TABLE comments ALTER COLUMN id RESTART WITH 200;
ALTER TABLE audit_logs ALTER COLUMN id RESTART WITH 200;
ALTER TABLE app_configs ALTER COLUMN id RESTART WITH 200;
