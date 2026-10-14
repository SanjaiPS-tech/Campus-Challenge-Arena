package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Challenge;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;
import java.util.Optional;

@Repository
public class ChallengeDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public ChallengeDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Challenge> rowMapper = (rs, rowNum) -> new Challenge(
            rs.getInt("challenge_id"),
            rs.getInt("competition_id"),
            rs.getString("challenge_title"),
            rs.getString("question_description"),
            rs.getInt("points"),
            rs.getString("correct_answer")
    );

    public int save(Challenge challenge) {
        String sql = "INSERT INTO CHALLENGES (competition_id, challenge_title, question_description, points, correct_answer) " +
                     "VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, challenge.getCompetitionId());
            ps.setString(2, challenge.getChallengeTitle());
            ps.setString(3, challenge.getQuestionDescription());
            ps.setInt(4, challenge.getPoints());
            ps.setString(5, challenge.getCorrectAnswer());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            challenge.setChallengeId(keyHolder.getKey().intValue());
            return challenge.getChallengeId();
        }
        return 0;
    }

    public Optional<Challenge> findById(int challengeId) {
        String sql = "SELECT * FROM CHALLENGES WHERE challenge_id = ?";
        try {
            Challenge challenge = jdbcTemplate.queryForObject(sql, rowMapper, challengeId);
            return Optional.ofNullable(challenge);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Challenge> findByCompetitionId(int competitionId) {
        String sql = "SELECT * FROM CHALLENGES WHERE competition_id = ? ORDER BY challenge_id ASC";
        return jdbcTemplate.query(sql, rowMapper, competitionId);
    }

    public int countByCompetitionId(int competitionId) {
        String sql = "SELECT COUNT(*) FROM CHALLENGES WHERE competition_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, competitionId);
        return count != null ? count : 0;
    }

    public int getTotalPointsByCompetitionId(int competitionId) {
        String sql = "SELECT COALESCE(SUM(points), 0) FROM CHALLENGES WHERE competition_id = ?";
        Integer total = jdbcTemplate.queryForObject(sql, Integer.class, competitionId);
        return total != null ? total : 0;
    }

    public boolean delete(int challengeId) {
        String sql = "DELETE FROM CHALLENGES WHERE challenge_id = ?";
        return jdbcTemplate.update(sql, challengeId) > 0;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM CHALLENGES", Integer.class);
        return count != null ? count : 0;
    }
}
