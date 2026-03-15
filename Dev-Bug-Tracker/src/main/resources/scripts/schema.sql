-- DevTrack Database Schema
-- This script creates the Task table for the DevTrack application

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS task;

-- Create Task table
CREATE TABLE task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    developer_name VARCHAR(255),
    task_name VARCHAR(255),
    status VARCHAR(50),
    sit_date DATE,
    uat_date DATE,
    prod_date DATE,
    type VARCHAR(50),
    branch VARCHAR(255),
    priority VARCHAR(50),
    jtrack_id VARCHAR(100),
    description TEXT,
    efforts DOUBLE,
    dev_start_date DATE
);

-- Create indexes for better query performance
CREATE INDEX idx_developer_name ON task(developer_name);
CREATE INDEX idx_status ON task(status);
CREATE INDEX idx_jtrack_id ON task(jtrack_id);
CREATE INDEX idx_dev_start_date ON task(dev_start_date);
