package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto;

import java.io.Serializable;
import java.time.LocalDateTime;

public class LeaderboardEntry implements Serializable {
    private int rank;
    private int studentId;
    private String studentName;
    private String email;
    private String department;
    private int yearOfStudy;
    private int totalScore;
    private int challengesSolved;
    private LocalDateTime lastSubmissionTime;
    private String badge; // e.g. GOLD, SILVER, BRONZE, TOP_PERFORMER

    public LeaderboardEntry() {}

    public LeaderboardEntry(int rank, int studentId, String studentName, String email, 
                            String department, int yearOfStudy, int totalScore, 
                            int challengesSolved, LocalDateTime lastSubmissionTime) {
        this.rank = rank;
        this.studentId = studentId;
        this.studentName = studentName;
        this.email = email;
        this.department = department;
        this.yearOfStudy = yearOfStudy;
        this.totalScore = totalScore;
        this.challengesSolved = challengesSolved;
        this.lastSubmissionTime = lastSubmissionTime;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public int getYearOfStudy() {
        return yearOfStudy;
    }

    public void setYearOfStudy(int yearOfStudy) {
        this.yearOfStudy = yearOfStudy;
    }

    public int getTotalScore() {
        return totalScore;
    }

    public void setTotalScore(int totalScore) {
        this.totalScore = totalScore;
    }

    public int getChallengesSolved() {
        return challengesSolved;
    }

    public void setChallengesSolved(int challengesSolved) {
        this.challengesSolved = challengesSolved;
    }

    public LocalDateTime getLastSubmissionTime() {
        return lastSubmissionTime;
    }

    public void setLastSubmissionTime(LocalDateTime lastSubmissionTime) {
        this.lastSubmissionTime = lastSubmissionTime;
    }

    public String getBadge() {
        return badge;
    }

    public void setBadge(String badge) {
        this.badge = badge;
    }
}
