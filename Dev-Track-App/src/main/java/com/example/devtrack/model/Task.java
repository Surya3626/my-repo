
package com.example.devtrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;

import java.time.LocalDate;

@Entity
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String developerName;
    private String taskName;
    private String status;

    private LocalDate sitDate;
    private LocalDate uatDate;
    private LocalDate prodDate;

    // New fields
    private String type;
    private String branch;
    private String priority;
    private String jtrackId;

    // Additional fields requested
    private String description;
    private Double efforts; // in PDs
    private LocalDate devStartDate;

    @Column(columnDefinition = "TEXT")
    private String comments;

    @ManyToOne
    @JoinColumn(name = "assigned_user_id")
    private User assignedUser;

    public Task() {
    }

    public Task(Long id, String developerName, String taskName, String status, LocalDate sitDate, LocalDate uatDate,
            LocalDate prodDate, String type, String branch, String priority, String jtrackId, String description,
            Double efforts, LocalDate devStartDate, User assignedUser) {
        this.id = id;
        this.developerName = developerName;
        this.taskName = taskName;
        this.status = status;
        this.sitDate = sitDate;
        this.uatDate = uatDate;
        this.prodDate = prodDate;
        this.type = type;
        this.branch = branch;
        this.priority = priority;
        this.jtrackId = jtrackId;
        this.description = description;
        this.efforts = efforts;
        this.devStartDate = devStartDate;
        this.assignedUser = assignedUser;
        this.assignedUser = assignedUser;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDeveloperName() {
        return developerName;
    }

    public void setDeveloperName(String developerName) {
        this.developerName = developerName;
    }

    public String getTaskName() {
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDate getSitDate() {
        return sitDate;
    }

    public void setSitDate(LocalDate sitDate) {
        this.sitDate = sitDate;
    }

    public LocalDate getUatDate() {
        return uatDate;
    }

    public void setUatDate(LocalDate uatDate) {
        this.uatDate = uatDate;
    }

    public LocalDate getProdDate() {
        return prodDate;
    }

    public void setProdDate(LocalDate prodDate) {
        this.prodDate = prodDate;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getJtrackId() {
        return jtrackId;
    }

    public void setJtrackId(String jtrackId) {
        this.jtrackId = jtrackId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getEfforts() {
        return efforts;
    }

    public void setEfforts(Double efforts) {
        this.efforts = efforts;
    }

    public LocalDate getDevStartDate() {
        return devStartDate;
    }

    public void setDevStartDate(LocalDate devStartDate) {
        this.devStartDate = devStartDate;
    }

    public User getAssignedUser() {
        return assignedUser;
    }

    public void setAssignedUser(User assignedUser) {
        this.assignedUser = assignedUser;
    }

    public LocalDate getDueDate() {
        if (devStartDate != null && efforts != null) {
            return devStartDate.plusDays(efforts.longValue());
        }
        return null;
    }
}
