package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.LeaderboardEntry;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

@Repository
public class LeaderboardDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public LeaderboardDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Retrieve live competition leaderboard from MySQL.
     * Takes the best score per challenge for each registered student in the competition,
     * sums them up, counts challenges solved, and resolves ties by earliest last submission.
     */
    public List<LeaderboardEntry> getLeaderboardByCompetition(int competitionId) {
        String sql = """
            SELECT 
                s.student_id,
                s.student_name,
                s.email,
                s.department,
                s.year_of_study,
                COALESCE(SUM(best_scores.max_score), 0) AS total_score,
                COUNT(CASE WHEN best_scores.max_score > 0 THEN 1 END) AS challenges_solved,
                MAX(best_scores.latest_sub_time) AS last_submission_time
            FROM COMPETITION_REGISTRATIONS reg
            JOIN STUDENTS s ON reg.student_id = s.student_id
            LEFT JOIN (
                SELECT 
                    sub.student_id,
                    sub.challenge_id,
                    MAX(sub.score) AS max_score,
                    MAX(sub.submission_time) AS latest_sub_time
                FROM SUBMISSIONS sub
                JOIN CHALLENGES ch ON sub.challenge_id = ch.challenge_id
                WHERE ch.competition_id = ?
                GROUP BY sub.student_id, sub.challenge_id
            ) best_scores ON s.student_id = best_scores.student_id
            WHERE reg.competition_id = ?
            GROUP BY s.student_id, s.student_name, s.email, s.department, s.year_of_study
            ORDER BY total_score DESC, challenges_solved DESC, last_submission_time ASC, s.student_id ASC
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("last_submission_time");
            LeaderboardEntry entry = new LeaderboardEntry(
                    rowNum + 1,
                    rs.getInt("student_id"),
                    rs.getString("student_name"),
                    rs.getString("email"),
                    rs.getString("department"),
                    rs.getInt("year_of_study"),
                    rs.getInt("total_score"),
                    rs.getInt("challenges_solved"),
                    ts != null ? ts.toLocalDateTime() : null
            );
            if (entry.getRank() == 1) entry.setBadge("GOLD");
            else if (entry.getRank() == 2) entry.setBadge("SILVER");
            else if (entry.getRank() == 3) entry.setBadge("BRONZE");
            else if (entry.getRank() <= 10 && entry.getTotalScore() > 0) entry.setBadge("TOP_PERFORMER");
            return entry;
        }, competitionId, competitionId);
    }

    /**
     * Retrieve college-wide global leaderboard across all competitions.
     */
    public List<LeaderboardEntry> getGlobalLeaderboard() {
        String sql = """
            SELECT 
                s.student_id,
                s.student_name,
                s.email,
                s.department,
                s.year_of_study,
                COALESCE(SUM(best_scores.max_score), 0) AS total_score,
                COUNT(CASE WHEN best_scores.max_score > 0 THEN 1 END) AS challenges_solved,
                MAX(best_scores.latest_sub_time) AS last_submission_time
            FROM STUDENTS s
            LEFT JOIN (
                SELECT 
                    sub.student_id,
                    sub.challenge_id,
                    MAX(sub.score) AS max_score,
                    MAX(sub.submission_time) AS latest_sub_time
                FROM SUBMISSIONS sub
                GROUP BY sub.student_id, sub.challenge_id
            ) best_scores ON s.student_id = best_scores.student_id
            GROUP BY s.student_id, s.student_name, s.email, s.department, s.year_of_study
            HAVING total_score > 0
            ORDER BY total_score DESC, challenges_solved DESC, last_submission_time ASC
            LIMIT 50
        """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            Timestamp ts = rs.getTimestamp("last_submission_time");
            LeaderboardEntry entry = new LeaderboardEntry(
                    rowNum + 1,
                    rs.getInt("student_id"),
                    rs.getString("student_name"),
                    rs.getString("email"),
                    rs.getString("department"),
                    rs.getInt("year_of_study"),
                    rs.getInt("total_score"),
                    rs.getInt("challenges_solved"),
                    ts != null ? ts.toLocalDateTime() : null
            );
            if (entry.getRank() == 1) entry.setBadge("GOLD");
            else if (entry.getRank() == 2) entry.setBadge("SILVER");
            else if (entry.getRank() == 3) entry.setBadge("BRONZE");
            else if (entry.getRank() <= 10) entry.setBadge("TOP_PERFORMER");
            return entry;
        });
    }
}
