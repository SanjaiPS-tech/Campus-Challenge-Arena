package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model;

import java.io.Serializable;
import java.time.LocalDateTime;

public class Submission implements Serializable {
    private int submissionId;
    private int challengeId;
    private int studentId;
    private String submittedAnswer;
    private LocalDateTime submissionTime;
    private int score;
    private String evaluationStatus; // PENDING, EVALUATED, REJECTED

    // Joined / helper fields for UI display
    private String challengeTitle;
    private String studentName;
    private int competitionId;
    private String competitionName;
    private int maxPoints;

    public Submission() {}

    public Submission(int submissionId, int challengeId, int studentId, String submittedAnswer, 
                      LocalDateTime submissionTime, int score, String evaluationStatus) {
        this.submissionId = submissionId;
        this.challengeId = challengeId;
        this.studentId = studentId;
        this.submittedAnswer = submittedAnswer;
        this.submissionTime = submissionTime;
        this.score = score;
        this.evaluationStatus = evaluationStatus;
    }

    public int getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(int submissionId) {
        this.submissionId = submissionId;
    }

    public int getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(int challengeId) {
        this.challengeId = challengeId;
    }

    public int getStudentId() {
        return studentId;
    }

    public void setStudentId(int studentId) {
        this.studentId = studentId;
    }

    public String getSubmittedAnswer() {
        return submittedAnswer;
    }

    public void setSubmittedAnswer(String submittedAnswer) {
        this.submittedAnswer = submittedAnswer;
    }

    public LocalDateTime getSubmissionTime() {
        return submissionTime;
    }

    public void setSubmissionTime(LocalDateTime submissionTime) {
        this.submissionTime = submissionTime;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public String getEvaluationStatus() {
        return evaluationStatus;
    }

    public void setEvaluationStatus(String evaluationStatus) {
        this.evaluationStatus = evaluationStatus;
    }

    public String getChallengeTitle() {
        return challengeTitle;
    }

    public void setChallengeTitle(String challengeTitle) {
        this.challengeTitle = challengeTitle;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
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

    public int getMaxPoints() {
        return maxPoints;
    }

    public void setMaxPoints(int maxPoints) {
        this.maxPoints = maxPoints;
    }

    @Override
    public String toString() {
        return "Submission{" +
                "submissionId=" + submissionId +
                ", challengeId=" + challengeId +
                ", studentId=" + studentId +
                ", score=" + score +
                ", evaluationStatus='" + evaluationStatus + '\'' +
                '}';
    }
}
