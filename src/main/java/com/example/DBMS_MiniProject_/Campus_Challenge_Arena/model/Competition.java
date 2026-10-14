package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model;

import java.io.Serializable;
import java.time.LocalDateTime;

public class Competition implements Serializable {
    private int competitionId;
    private String competitionName;
    private String competitionType;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int maxParticipants;
    private String competitionStatus; // UPCOMING, ACTIVE, COMPLETED

    public Competition() {}

    public Competition(int competitionId, String competitionName, String competitionType, 
                       String description, LocalDateTime startTime, LocalDateTime endTime, 
                       int maxParticipants, String competitionStatus) {
        this.competitionId = competitionId;
        this.competitionName = competitionName;
        this.competitionType = competitionType;
        this.description = description;
        this.startTime = startTime;
        this.endTime = endTime;
        this.maxParticipants = maxParticipants;
        this.competitionStatus = competitionStatus;
    }

    public int getCompetitionId() {
        return competitionId;
    }

    public void setCompetitionId(int competitionId) {
        this.competitionId = competitionId;
    }

    public String getCompetitionName() {
        return competitionName;
    }

    public void setCompetitionName(String competitionName) {
        this.competitionName = competitionName;
    }

    public String getCompetitionType() {
        return competitionType;
    }

    public void setCompetitionType(String competitionType) {
        this.competitionType = competitionType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public int getMaxParticipants() {
        return maxParticipants;
    }

    public void setMaxParticipants(int maxParticipants) {
        this.maxParticipants = maxParticipants;
    }

    public String getCompetitionStatus() {
        return competitionStatus;
    }

    public void setCompetitionStatus(String competitionStatus) {
        this.competitionStatus = competitionStatus;
    }

    @Override
    public String toString() {
        return "Competition{" +
                "competitionId=" + competitionId +
                ", competitionName='" + competitionName + '\'' +
                ", competitionType='" + competitionType + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", maxParticipants=" + maxParticipants +
                ", competitionStatus='" + competitionStatus + '\'' +
                '}';
    }
}
