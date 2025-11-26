package com.example.devtrack.model;

import jakarta.persistence.*;

@Entity
public class TestCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String testCaseId;
    private String description;
    private String status; // PASS, FAIL, PENDING
    private String remarks;

    @ManyToOne
    @JoinColumn(name = "change_request_id")
    private ChangeRequest changeRequest;

    public TestCase() {
    }

    public TestCase(String testCaseId, String description, String status, String remarks, ChangeRequest changeRequest) {
        this.testCaseId = testCaseId;
        this.description = description;
        this.status = status;
        this.remarks = remarks;
        this.changeRequest = changeRequest;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTestCaseId() {
        return testCaseId;
    }

    public void setTestCaseId(String testCaseId) {
        this.testCaseId = testCaseId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public ChangeRequest getChangeRequest() {
        return changeRequest;
    }

    public void setChangeRequest(ChangeRequest changeRequest) {
        this.changeRequest = changeRequest;
    }
}
