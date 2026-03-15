package com.devtrack.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bugs")
public class Bug {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jtrackId;
    
    @ManyToOne
    @JoinColumn(name = "bug_task_id")
    private BugTask bugTask;

    private String title;
    
    @Column(length = 2000)
    private String description;

    @ManyToOne
    @JoinColumn(name = "raised_by_id")
    private User raisedBy;

    @ManyToOne
    @JoinColumn(name = "assigned_developer_id")
    private User assignedDeveloper;

    private String priority;
    private String severity;
    private String status;

    @Transient
    private String remarks;

    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;

    @ManyToOne
    @JoinColumn(name = "workflow_id")
    private Workflow workflow;

    @ManyToOne
    @JoinColumn(name = "tester_id")
    private User tester;

    private boolean isInPool;
    private LocalDateTime inPoolDate;

    @PrePersist
    protected void onCreate() {
        createdDate = LocalDateTime.now();
        updatedDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedDate = LocalDateTime.now();
    }

    public Bug() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJtrackId() { return jtrackId; }
    public void setJtrackId(String jtrackId) { this.jtrackId = jtrackId; }

    public BugTask getBugTask() { return bugTask; }
    public void setBugTask(BugTask bugTask) { this.bugTask = bugTask; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public User getRaisedBy() { return raisedBy; }
    public void setRaisedBy(User raisedBy) { this.raisedBy = raisedBy; }

    public User getAssignedDeveloper() { return assignedDeveloper; }
    public void setAssignedDeveloper(User assignedDeveloper) { this.assignedDeveloper = assignedDeveloper; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }

    public Workflow getWorkflow() { return workflow; }
    public void setWorkflow(Workflow workflow) { this.workflow = workflow; }

    public User getTester() { return tester; }
    public void setTester(User tester) { this.tester = tester; }

    public boolean isInPool() { return isInPool; }
    public void setInPool(boolean isInPool) { this.isInPool = isInPool; }

    public LocalDateTime getInPoolDate() { return inPoolDate; }
    public void setInPoolDate(LocalDateTime inPoolDate) { this.inPoolDate = inPoolDate; }
}
