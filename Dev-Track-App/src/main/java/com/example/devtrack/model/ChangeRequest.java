package com.example.devtrack.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class ChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String jtrackId;
    private String description;
    private LocalDate uatStartDate;
    private LocalDate createdAt;

    public ChangeRequest() {
        this.createdAt = LocalDate.now();
    }

    public ChangeRequest(String title, String jtrackId, String description, LocalDate uatStartDate) {
        this.title = title;
        this.jtrackId = jtrackId;
        this.description = description;
        this.uatStartDate = uatStartDate;
        this.createdAt = LocalDate.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
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

    public LocalDate getUatStartDate() {
        return uatStartDate;
    }

    public void setUatStartDate(LocalDate uatStartDate) {
        this.uatStartDate = uatStartDate;
    }

    public LocalDate getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDate createdAt) {
        this.createdAt = createdAt;
    }
}
