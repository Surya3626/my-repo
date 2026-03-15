-- DevTrack Common Queries
-- This script contains useful queries for task management and reporting

-- 1. Get all tasks for a specific developer
SELECT * FROM task 
WHERE developer_name = 'John Doe'
ORDER BY dev_start_date DESC;

-- 2. Get all high priority tasks
SELECT * FROM task 
WHERE priority = 'High'
ORDER BY dev_start_date;

-- 3. Get tasks by status
SELECT * FROM task 
WHERE status = 'In Progress'
ORDER BY dev_start_date;

-- 4. Get tasks due for SIT this week
SELECT * FROM task 
WHERE sit_date BETWEEN CURRENT_DATE AND DATEADD('DAY', 7, CURRENT_DATE)
ORDER BY sit_date;

-- 5. Get total efforts by developer
SELECT developer_name, SUM(efforts) as total_efforts, COUNT(*) as task_count
FROM task
GROUP BY developer_name
ORDER BY total_efforts DESC;

-- 6. Get task count by status
SELECT status, COUNT(*) as count
FROM task
GROUP BY status
ORDER BY count DESC;

-- 7. Get overdue tasks (SIT date passed but not completed)
SELECT * FROM task 
WHERE sit_date < CURRENT_DATE 
AND status NOT IN ('Completed', 'Done')
ORDER BY sit_date;

-- 8. Get tasks by type
SELECT type, COUNT(*) as count, SUM(efforts) as total_efforts
FROM task
GROUP BY type
ORDER BY count DESC;

-- 9. Get blocked tasks
SELECT * FROM task 
WHERE status = 'Blocked'
ORDER BY priority DESC, dev_start_date;

-- 10. Get tasks starting this week
SELECT * FROM task 
WHERE dev_start_date BETWEEN CURRENT_DATE AND DATEADD('DAY', 7, CURRENT_DATE)
ORDER BY dev_start_date;

-- 11. Get average efforts by task type
SELECT type, AVG(efforts) as avg_efforts, COUNT(*) as task_count
FROM task
GROUP BY type
ORDER BY avg_efforts DESC;

-- 12. Get tasks by priority distribution
SELECT priority, COUNT(*) as count, 
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM task), 2) as percentage
FROM task
GROUP BY priority
ORDER BY count DESC;

-- 13. Get tasks with upcoming UAT dates
SELECT * FROM task 
WHERE uat_date BETWEEN CURRENT_DATE AND DATEADD('DAY', 14, CURRENT_DATE)
ORDER BY uat_date;

-- 14. Get completed tasks in the last 30 days
SELECT * FROM task 
WHERE status IN ('Completed', 'Done')
AND prod_date >= DATEADD('DAY', -30, CURRENT_DATE)
ORDER BY prod_date DESC;

-- 15. Get task timeline (all dates)
SELECT jtrack_id, task_name, developer_name,
       dev_start_date, sit_date, uat_date, prod_date,
       DATEDIFF('DAY', dev_start_date, prod_date) as total_days
FROM task
WHERE dev_start_date IS NOT NULL AND prod_date IS NOT NULL
ORDER BY dev_start_date DESC;
