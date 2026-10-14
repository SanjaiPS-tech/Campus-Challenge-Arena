package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import java.io.Serializable;

public class CompetitionSummary implements Serializable {
    private Competition competition;
    private int totalChallenges;
    private int registeredParticipants;
    private int totalPoints;
    private boolean isRegistrationOpen;
    private boolean isFull;
    private boolean isOngoing;

    public CompetitionSummary() {}

    public CompetitionSummary(Competition competition, int totalChallenges, 
                              int registeredParticipants, int totalPoints) {
        this.competition = competition;
        this.totalChallenges = totalChallenges;
        this.registeredParticipants = registeredParticipants;
        this.totalPoints = totalPoints;
        this.isFull = registeredParticipants >= competition.getMaxParticipants();
        this.isRegistrationOpen = !isFull && !"COMPLETED".equalsIgnoreCase(competition.getCompetitionStatus());
        this.isOngoing = "ACTIVE".equalsIgnoreCase(competition.getCompetitionStatus());
    }

    public Competition getCompetition() {
        return competition;
    }

    public void setCompetition(Competition competition) {
        this.competition = competition;
    }

    public int getTotalChallenges() {
        return totalChallenges;
    }

    public void setTotalChallenges(int totalChallenges) {
        this.totalChallenges = totalChallenges;
    }

    public int getRegisteredParticipants() {
        return registeredParticipants;
    }

    public void setRegisteredParticipants(int registeredParticipants) {
        this.registeredParticipants = registeredParticipants;
    }

    public int getTotalPoints() {
        return totalPoints;
    }

    public void setTotalPoints(int totalPoints) {
        this.totalPoints = totalPoints;
    }

    public boolean isRegistrationOpen() {
        return isRegistrationOpen;
    }

    public void setRegistrationOpen(boolean registrationOpen) {
        isRegistrationOpen = registrationOpen;
    }

    public boolean isFull() {
        return isFull;
    }

    public void setFull(boolean full) {
        isFull = full;
    }

    public boolean isOngoing() {
        return isOngoing;
    }

    public void setOngoing(boolean ongoing) {
        isOngoing = ongoing;
    }
}
