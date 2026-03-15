package com.devtrack.api.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String jtrackId;
    private String title;
    
    @Column(length = 2000)
    private String description;
    
    @ManyToOne
    @JoinColumn(name = "task_type_id")
    private TaskType type;
    private String branchName;

    @ManyToOne
    @JoinColumn(name = "assigned_developer_id")
    private User assignedDeveloper;

    @ManyToOne
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    private LocalDate devStartDate;
    private LocalDate sitDate;
    private LocalDate uatDate;
    private LocalDate preprodDate;
    private LocalDate productionDate;

    private String status;
    private String priority;
    private Double efforts;
    private String pds;
    
    @Column(length = 1000)
    private String gitLinks;
    
    @Column(length = 2000)
    private String codeReviewComments;

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

    public Task() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJtrackId() { return jtrackId; }
    public void setJtrackId(String jtrackId) { this.jtrackId = jtrackId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public TaskType getType() { return type; }
    public void setType(TaskType type) { this.type = type; }

    public String getBranchName() { return branchName; }
    public void setBranchName(String branchName) { this.branchName = branchName; }

    public User getAssignedDeveloper() { return assignedDeveloper; }
    public void setAssignedDeveloper(User assignedDeveloper) { this.assignedDeveloper = assignedDeveloper; }

    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }

    public LocalDate getDevStartDate() { return devStartDate; }
    public void setDevStartDate(LocalDate devStartDate) { this.devStartDate = devStartDate; }

    public LocalDate getSitDate() { return sitDate; }
    public void setSitDate(LocalDate sitDate) { this.sitDate = sitDate; }

    public LocalDate getUatDate() { return uatDate; }
    public void setUatDate(LocalDate uatDate) { this.uatDate = uatDate; }

    public LocalDate getPreprodDate() { return preprodDate; }
    public void setPreprodDate(LocalDate preprodDate) { this.preprodDate = preprodDate; }

    public LocalDate getProductionDate() { return productionDate; }
    public void setProductionDate(LocalDate productionDate) { this.productionDate = productionDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Double getEfforts() { return efforts; }
    public void setEfforts(Double efforts) { this.efforts = efforts; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public LocalDateTime getUpdatedDate() { return updatedDate; }

    public String getPds() { return pds; }
    public void setPds(String pds) { this.pds = pds; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getGitLinks() { return gitLinks; }
    public void setGitLinks(String gitLinks) { this.gitLinks = gitLinks; }

    public String getCodeReviewComments() { return codeReviewComments; }
    public void setCodeReviewComments(String codeReviewComments) { this.codeReviewComments = codeReviewComments; }

    public Workflow getWorkflow() { return workflow; }
    public void setWorkflow(Workflow workflow) { this.workflow = workflow; }

    public User getTester() { return tester; }
    public void setTester(User tester) { this.tester = tester; }

    public boolean isInPool() { return isInPool; }
    public void setInPool(boolean inPool) { this.isInPool = inPool; }

    public LocalDateTime getInPoolDate() { return inPoolDate; }
    public void setInPoolDate(LocalDateTime inPoolDate) { this.inPoolDate = inPoolDate; }
}
