package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.CompetitionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.LeaderboardDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.SubmissionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.LeaderboardEntry;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Submission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CompetitionHistoryService {

    private final CompetitionDao competitionDao;
    private final LeaderboardDao leaderboardDao;
    private final SubmissionDao submissionDao;

    @Autowired
    public CompetitionHistoryService(CompetitionDao competitionDao, LeaderboardDao leaderboardDao, SubmissionDao submissionDao) {
        this.competitionDao = competitionDao;
        this.leaderboardDao = leaderboardDao;
        this.submissionDao = submissionDao;
    }

    /**
     * Retrieve completed competitions history with winners podium and stats.
     */
    public List<Map<String, Object>> getCompletedCompetitionsHistory() {
        List<Competition> completed = competitionDao.findByStatus("COMPLETED");
        List<Map<String, Object>> historyList = new ArrayList<>();

        for (Competition comp : completed) {
            Map<String, Object> record = new HashMap<>();
            record.put("competition", comp);

            List<LeaderboardEntry> standings = leaderboardDao.getLeaderboardByCompetition(comp.getCompetitionId());
            record.put("finalStandings", standings);
            record.put("totalParticipants", standings.size());

            // Podium
            record.put("winner", !standings.isEmpty() ? standings.get(0) : null);
            record.put("runnerUp", standings.size() > 1 ? standings.get(1) : null);
            record.put("thirdPlace", standings.size() > 2 ? standings.get(2) : null);

            List<Submission> submissions = submissionDao.findByCompetitionId(comp.getCompetitionId());
            record.put("totalSubmissions", submissions.size());

            historyList.add(record);
        }

        return historyList;
    }

    /**
     * Get specific competition full historical dossier.
     */
    public Map<String, Object> getCompetitionDossier(int competitionId) {
        Competition comp = competitionDao.findById(competitionId)
                .orElseThrow(() -> new IllegalArgumentException("Competition not found with ID " + competitionId));

        Map<String, Object> dossier = new HashMap<>();
        dossier.put("competition", comp);
        dossier.put("finalStandings", leaderboardDao.getLeaderboardByCompetition(competitionId));
        dossier.put("submissions", submissionDao.findByCompetitionId(competitionId));

        return dossier;
    }
}
