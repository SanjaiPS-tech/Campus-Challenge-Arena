package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Submission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class SubmissionDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public SubmissionDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Submission> rowMapper = (rs, rowNum) -> {
        Timestamp subTs = rs.getTimestamp("submission_time");
        Submission sub = new Submission(
                rs.getInt("submission_id"),
                rs.getInt("challenge_id"),
                rs.getInt("student_id"),
                rs.getString("submitted_answer"),
                subTs != null ? subTs.toLocalDateTime() : null,
                rs.getInt("score"),
                rs.getString("evaluation_status")
        );
        try {
            sub.setChallengeTitle(rs.getString("challenge_title"));
        } catch (Exception ignored) {}
        try {
            sub.setStudentName(rs.getString("student_name"));
        } catch (Exception ignored) {}
        try {
            sub.setCompetitionId(rs.getInt("competition_id"));
        } catch (Exception ignored) {}
        try {
            sub.setCompetitionName(rs.getString("competition_name"));
        } catch (Exception ignored) {}
        try {
            sub.setMaxPoints(rs.getInt("points"));
        } catch (Exception ignored) {}
        return sub;
    };

    public int save(Submission submission) {
        String sql = "INSERT INTO SUBMISSIONS (challenge_id, student_id, submitted_answer, submission_time, score, evaluation_status) " +
                     "VALUES (?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, submission.getChallengeId());
            ps.setInt(2, submission.getStudentId());
            ps.setString(3, submission.getSubmittedAnswer());
            ps.setTimestamp(4, Timestamp.valueOf(submission.getSubmissionTime() != null ? submission.getSubmissionTime() : LocalDateTime.now()));
            ps.setInt(5, submission.getScore());
            ps.setString(6, submission.getEvaluationStatus() != null ? submission.getEvaluationStatus() : "PENDING");
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            submission.setSubmissionId(keyHolder.getKey().intValue());
            return submission.getSubmissionId();
        }
        return 0;
    }

    public Optional<Submission> findById(int submissionId) {
        String sql = "SELECT sub.*, ch.challenge_title, ch.points, ch.competition_id, comp.competition_name, s.student_name " +
                     "FROM SUBMISSIONS sub " +
                     "JOIN CHALLENGES ch ON sub.challenge_id = ch.challenge_id " +
                     "JOIN COMPETITIONS comp ON ch.competition_id = comp.competition_id " +
                     "JOIN STUDENTS s ON sub.student_id = s.student_id " +
                     "WHERE sub.submission_id = ?";
        try {
            Submission submission = jdbcTemplate.queryForObject(sql, rowMapper, submissionId);
            return Optional.ofNullable(submission);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Submission> findByStudentAndCompetition(int studentId, int competitionId) {
        String sql = "SELECT sub.*, ch.challenge_title, ch.points, ch.competition_id, comp.competition_name, s.student_name " +
                     "FROM SUBMISSIONS sub " +
                     "JOIN CHALLENGES ch ON sub.challenge_id = ch.challenge_id " +
                     "JOIN COMPETITIONS comp ON ch.competition_id = comp.competition_id " +
                     "JOIN STUDENTS s ON sub.student_id = s.student_id " +
                     "WHERE sub.student_id = ? AND ch.competition_id = ? " +
                     "ORDER BY sub.submission_time DESC";
        return jdbcTemplate.query(sql, rowMapper, studentId, competitionId);
    }

    public List<Submission> findByCompetitionId(int competitionId) {
        String sql = "SELECT sub.*, ch.challenge_title, ch.points, ch.competition_id, comp.competition_name, s.student_name " +
                     "FROM SUBMISSIONS sub " +
                     "JOIN CHALLENGES ch ON sub.challenge_id = ch.challenge_id " +
                     "JOIN COMPETITIONS comp ON ch.competition_id = comp.competition_id " +
                     "JOIN STUDENTS s ON sub.student_id = s.student_id " +
                     "WHERE ch.competition_id = ? " +
                     "ORDER BY sub.submission_time DESC";
        return jdbcTemplate.query(sql, rowMapper, competitionId);
    }

    public List<Submission> findByStudentId(int studentId) {
        String sql = "SELECT sub.*, ch.challenge_title, ch.points, ch.competition_id, comp.competition_name, s.student_name " +
                     "FROM SUBMISSIONS sub " +
                     "JOIN CHALLENGES ch ON sub.challenge_id = ch.challenge_id " +
                     "JOIN COMPETITIONS comp ON ch.competition_id = comp.competition_id " +
                     "JOIN STUDENTS s ON sub.student_id = s.student_id " +
                     "WHERE sub.student_id = ? " +
                     "ORDER BY sub.submission_time DESC";
        return jdbcTemplate.query(sql, rowMapper, studentId);
    }

    public Optional<Submission> findLatestByStudentAndChallenge(int studentId, int challengeId) {
        String sql = "SELECT sub.*, ch.challenge_title, ch.points, ch.competition_id, comp.competition_name, s.student_name " +
                     "FROM SUBMISSIONS sub " +
                     "JOIN CHALLENGES ch ON sub.challenge_id = ch.challenge_id " +
                     "JOIN COMPETITIONS comp ON ch.competition_id = comp.competition_id " +
                     "JOIN STUDENTS s ON sub.student_id = s.student_id " +
                     "WHERE sub.student_id = ? AND sub.challenge_id = ? " +
                     "ORDER BY sub.submission_time DESC LIMIT 1";
        try {
            Submission submission = jdbcTemplate.queryForObject(sql, rowMapper, studentId, challengeId);
            return Optional.ofNullable(submission);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean updateScoreAndStatus(int submissionId, int score, String status) {
        String sql = "UPDATE SUBMISSIONS SET score = ?, evaluation_status = ? WHERE submission_id = ?";
        return jdbcTemplate.update(sql, score, status, submissionId) > 0;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM SUBMISSIONS", Integer.class);
        return count != null ? count : 0;
    }
}
