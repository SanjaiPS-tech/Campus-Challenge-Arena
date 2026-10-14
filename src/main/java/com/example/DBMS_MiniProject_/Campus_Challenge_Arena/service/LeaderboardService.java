package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.CompetitionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.LeaderboardDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.LeaderboardEntry;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class LeaderboardService {

    private final LeaderboardDao leaderboardDao;
    private final CompetitionDao competitionDao;

    @Autowired
    public LeaderboardService(LeaderboardDao leaderboardDao, CompetitionDao competitionDao) {
        this.leaderboardDao = leaderboardDao;
        this.competitionDao = competitionDao;
    }

    /**
     * Retrieves live leaderboard for a specific competition directly from MySQL.
     */
    public Map<String, Object> getLiveLeaderboardForCompetition(int competitionId) {
        Optional<Competition> compOpt = competitionDao.findById(competitionId);
        if (compOpt.isEmpty()) {
            throw new IllegalArgumentException("Competition ID " + competitionId + " not found.");
        }

        List<LeaderboardEntry> entries = leaderboardDao.getLeaderboardByCompetition(competitionId);

        Map<String, Object> result = new HashMap<>();
        result.put("competition", compOpt.get());
        result.put("leaderboard", entries);
        result.put("totalParticipants", entries.size());
        result.put("timestamp", System.currentTimeMillis());
        return result;
    }

    /**
     * Retrieves global college leaderboard.
     */
    public List<LeaderboardEntry> getGlobalLeaderboard() {
        return leaderboardDao.getGlobalLeaderboard();
    }
}
