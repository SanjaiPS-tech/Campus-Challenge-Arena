package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model;

import java.io.Serializable;

public class Challenge implements Serializable {
    private int challengeId;
    private int competitionId;
    private String challengeTitle;
    private String questionDescription;
    private int points;
    private String correctAnswer;

    public Challenge() {}

    public Challenge(int challengeId, int competitionId, String challengeTitle, 
                     String questionDescription, int points, String correctAnswer) {
        this.challengeId = challengeId;
        this.competitionId = competitionId;
        this.challengeTitle = challengeTitle;
        this.questionDescription = questionDescription;
        this.points = points;
        this.correctAnswer = correctAnswer;
    }

    public Challenge(int competitionId, String challengeTitle, 
                     String questionDescription, int points, String correctAnswer) {
        this.competitionId = competitionId;
        this.challengeTitle = challengeTitle;
        this.questionDescription = questionDescription;
        this.points = points;
        this.correctAnswer = correctAnswer;
    }

    public int getChallengeId() {
        return challengeId;
    }

    public void setChallengeId(int challengeId) {
        this.challengeId = challengeId;
    }

    public int getCompetitionId() {
        return competitionId;
    }

    public void setCompetitionId(int competitionId) {
        this.competitionId = competitionId;
    }

    public String getChallengeTitle() {
        return challengeTitle;
    }

    public void setChallengeTitle(String challengeTitle) {
        this.challengeTitle = challengeTitle;
    }

    public String getQuestionDescription() {
        return questionDescription;
    }

    public void setQuestionDescription(String questionDescription) {
        this.questionDescription = questionDescription;
    }

    public int getPoints() {
        return points;
    }

    public void setPoints(int points) {
        this.points = points;
    }

    public String getCorrectAnswer() {
        return correctAnswer;
    }

    public void setCorrectAnswer(String correctAnswer) {
        this.correctAnswer = correctAnswer;
    }

    @Override
    public String toString() {
        return "Challenge{" +
                "challengeId=" + challengeId +
                ", competitionId=" + competitionId +
                ", challengeTitle='" + challengeTitle + '\'' +
                ", points=" + points +
                '}';
    }
}
