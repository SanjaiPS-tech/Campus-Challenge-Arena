package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.ChallengeDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.CompetitionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.RegistrationDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.CompetitionSummary;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CompetitionService {

    private final CompetitionDao competitionDao;
    private final ChallengeDao challengeDao;
    private final RegistrationDao registrationDao;

    @Autowired
    public CompetitionService(CompetitionDao competitionDao, ChallengeDao challengeDao, RegistrationDao registrationDao) {
        this.competitionDao = competitionDao;
        this.challengeDao = challengeDao;
        this.registrationDao = registrationDao;
    }

    public Competition createCompetition(Competition competition) {
        if (competition.getCompetitionName() == null || competition.getCompetitionName().trim().isEmpty()) {
            throw new IllegalArgumentException("Competition name cannot be empty.");
        }
        if (competition.getCompetitionType() == null || competition.getCompetitionType().trim().isEmpty()) {
            competition.setCompetitionType("Coding Contest");
        }
        if (competition.getStartTime() == null || competition.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and End time must be specified.");
        }
        if (competition.getEndTime().isBefore(competition.getStartTime())) {
            throw new IllegalArgumentException("End time must be after Start time.");
        }
        if (competition.getMaxParticipants() <= 0) {
            competition.setMaxParticipants(100);
        }

        // Determine initial status based on current time
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(competition.getStartTime())) {
            competition.setCompetitionStatus("UPCOMING");
        } else if (now.isAfter(competition.getEndTime())) {
            competition.setCompetitionStatus("COMPLETED");
        } else {
            competition.setCompetitionStatus("ACTIVE");
        }

        int id = competitionDao.save(competition);
        competition.setCompetitionId(id);
        return competition;
    }

    public Optional<Competition> getCompetitionById(int competitionId) {
        Optional<Competition> compOpt = competitionDao.findById(competitionId);
        compOpt.ifPresent(this::syncCompetitionStatus);
        return compOpt;
    }

    public List<Competition> getAllCompetitions() {
        List<Competition> list = competitionDao.findAll();
        for (Competition comp : list) {
            syncCompetitionStatus(comp);
        }
        return list;
    }

    public List<CompetitionSummary> getAllCompetitionSummaries() {
        List<Competition> competitions = getAllCompetitions();
        List<CompetitionSummary> summaries = new ArrayList<>();

        for (Competition comp : competitions) {
            int challengeCount = challengeDao.countByCompetitionId(comp.getCompetitionId());
            int registeredCount = registrationDao.countByCompetitionId(comp.getCompetitionId());
            int totalPoints = challengeDao.getTotalPointsByCompetitionId(comp.getCompetitionId());
            summaries.add(new CompetitionSummary(comp, challengeCount, registeredCount, totalPoints));
        }
        return summaries;
    }

    public List<Competition> getCompetitionsByStatus(String status) {
        getAllCompetitions(); // Sync statuses first
        return competitionDao.findByStatus(status);
    }

    public boolean updateStatus(int competitionId, String status) {
        String upper = status.toUpperCase();
        if (!upper.equals("UPCOMING") && !upper.equals("ACTIVE") && !upper.equals("COMPLETED")) {
            throw new IllegalArgumentException("Invalid status: " + status + ". Allowed: UPCOMING, ACTIVE, COMPLETED");
        }
        return competitionDao.updateStatus(competitionId, upper);
    }

    /**
     * Automatically synchronizes competition status with the clock.
     */
    private void syncCompetitionStatus(Competition comp) {
        if (comp == null || comp.getStartTime() == null || comp.getEndTime() == null) return;
        LocalDateTime now = LocalDateTime.now();
        String currentStatus = comp.getCompetitionStatus();

        String expectedStatus;
        if (now.isBefore(comp.getStartTime())) {
            expectedStatus = "UPCOMING";
        } else if (now.isAfter(comp.getEndTime())) {
            expectedStatus = "COMPLETED";
        } else {
            expectedStatus = "ACTIVE";
        }

        if (!expectedStatus.equalsIgnoreCase(currentStatus)) {
            comp.setCompetitionStatus(expectedStatus);
            competitionDao.updateStatus(comp.getCompetitionId(), expectedStatus);
        }
    }
}
