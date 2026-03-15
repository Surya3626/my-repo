# DevTrack SQL Scripts

This folder contains SQL scripts for the DevTrack application database.

## Files

### 1. schema.sql
**Purpose**: Database schema creation script

**Contains**:
- Task table definition with all required columns
- Primary key and auto-increment configuration
- Indexes for optimized query performance

**Usage**:
```sql
-- Run this script to create the database schema
-- This will drop existing table and recreate it
```

**When to use**:
- Initial database setup
- Database reset/cleanup
- Schema migration

---

### 2. data.sql
**Purpose**: Sample data insertion script

**Contains**:
- 15 sample task records with realistic data
- Various task types: Feature, Bug, Enhancement, Task
- Different statuses: In Progress, Completed, Done, Blocked, To Do
- Multiple developers and priorities

**Usage**:
```sql
-- Run this script to populate the database with sample data
-- Useful for testing and demonstration
```

**When to use**:
- Development environment setup
- Testing the application
- Demo presentations

---

### 3. queries.sql
**Purpose**: Common SQL queries for task management

**Contains**:
- 15 useful queries for various reporting needs
- Task filtering by developer, status, priority
- Aggregation queries for analytics
- Timeline and deadline tracking queries

**Query Categories**:
- **Filtering**: Get tasks by developer, status, priority, type
- **Analytics**: Count tasks, sum efforts, calculate averages
- **Deadlines**: Find overdue tasks, upcoming SIT/UAT dates
- **Reporting**: Task distribution, timeline analysis

**Usage**:
```sql
-- Copy and execute individual queries as needed
-- Modify WHERE clauses to fit your specific requirements
```

---

## Database Configuration

The application uses H2 in-memory database by default (configured in `application.properties`):

```properties
spring.datasource.url=jdbc:h2:mem:devtrackdb
spring.datasource.driverClassName=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=password
```

## How to Execute Scripts

### Option 1: H2 Console
1. Start the application
2. Navigate to `http://localhost:8080/h2-console`
3. Use connection details from `application.properties`
4. Copy and paste script contents
5. Execute

### Option 2: Spring Boot Data Initialization
Rename files to use Spring Boot's automatic initialization:
- `schema.sql` → Keep as is (Spring Boot auto-detects)
- `data.sql` → Keep as is (Spring Boot auto-detects)

Add to `application.properties`:
```properties
spring.sql.init.mode=always
```

### Option 3: Command Line (for production databases)
```bash
# For MySQL
mysql -u username -p database_name < schema.sql
mysql -u username -p database_name < data.sql

# For PostgreSQL
psql -U username -d database_name -f schema.sql
psql -U username -d database_name -f data.sql
```

## Notes

- **schema.sql** includes `DROP TABLE IF EXISTS` - use with caution in production
- **data.sql** clears existing data before insertion
- All scripts are compatible with H2 database syntax
- Modify scripts as needed for other database systems (MySQL, PostgreSQL, etc.)

## Task Table Schema

| Column | Type | Description |
|--------|------|-------------|
| id | BIGINT | Primary key, auto-increment |
| developer_name | VARCHAR(255) | Name of the developer |
| task_name | VARCHAR(255) | Task title |
| status | VARCHAR(50) | Current status (In Progress, Completed, etc.) |
| sit_date | DATE | System Integration Testing date |
| uat_date | DATE | User Acceptance Testing date |
| prod_date | DATE | Production deployment date |
| type | VARCHAR(50) | Task type (Feature, Bug, Enhancement, Task) |
| branch | VARCHAR(255) | Git branch name |
| priority | VARCHAR(50) | Priority level (High, Medium, Low) |
| jtrack_id | VARCHAR(100) | Jira/tracking system ID |
| description | TEXT | Detailed task description |
| efforts | DOUBLE | Estimated efforts in person-days (PDs) |
| dev_start_date | DATE | Development start date |
