package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model;

import java.io.Serializable;
import java.time.LocalDateTime;

public class CompetitionRegistration implements Serializable {
    private int registrationId;
    private int competitionId;
    private int studentId;
    private LocalDateTime registrationTime;
    private String participationStatus; // REGISTERED, PARTICIPATING, COMPLETED

    // Additional transient / joined fields for display convenience
    private String studentName;
    private String studentEmail;
    private String competitionName;

    public CompetitionRegistration() {}

    public CompetitionRegistration(int registrationId, int competitionId, int studentId, 
                                   LocalDateTime registrationTime, String participationStatus) {
        this.registrationId = registrationId;
        this.competitionId = competitionId;
        this.studentId = studentId;
        this.registrationTime = registrationTime;
        this.participationStatus = participationStatus;
    }

    public int getRegistrationId() {
        return registrationId;
    }

    public void setRegistrationId(int registrationId) {
        this.registrationId = registrationId;
    }

    public int getCompetitionId() {
        return competitionId;
    }

    public void setCompetitionId(int competitionId) {
        this.competitionId = competitionId;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public LocalDateTime getRegistrationTime() {
        return registrationTime;
    }

    public void setRegistrationTime(LocalDateTime registrationTime) {
        this.registrationTime = registrationTime;
    }

    public String getParticipationStatus() {
        return participationStatus;
    }

    public void setParticipationStatus(String participationStatus) {
        this.participationStatus = participationStatus;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getCompetitionName() {
        return competitionName;
    }

    public void setCompetitionName(String competitionName) {
        this.competitionName = competitionName;
    }

    @Override
    public String toString() {
        return "CompetitionRegistration{" +
                "registrationId=" + registrationId +
                ", competitionId=" + competitionId +
                ", studentId=" + studentId +
                ", participationStatus='" + participationStatus + '\'' +
                '}';
    }
}
