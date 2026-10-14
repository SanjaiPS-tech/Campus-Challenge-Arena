package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.CompetitionRegistration;
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
public class RegistrationDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public RegistrationDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<CompetitionRegistration> rowMapper = (rs, rowNum) -> {
        Timestamp regTs = rs.getTimestamp("registration_time");
        CompetitionRegistration reg = new CompetitionRegistration(
                rs.getInt("registration_id"),
                rs.getInt("competition_id"),
                rs.getInt("student_id"),
                regTs != null ? regTs.toLocalDateTime() : null,
                rs.getString("participation_status")
        );
        // Map joined fields if present in result set
        try {
            reg.setStudentName(rs.getString("student_name"));
        } catch (Exception ignored) {}
        try {
            reg.setStudentEmail(rs.getString("email"));
        } catch (Exception ignored) {}
        try {
            reg.setCompetitionName(rs.getString("competition_name"));
        } catch (Exception ignored) {}
        return reg;
    };

    public int register(int competitionId, int studentId, String status) {
        String sql = "INSERT INTO COMPETITION_REGISTRATIONS (competition_id, student_id, registration_time, participation_status) " +
                     "VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, competitionId);
            ps.setInt(2, studentId);
            ps.setTimestamp(3, Timestamp.valueOf(LocalDateTime.now()));
            ps.setString(4, status != null ? status : "REGISTERED");
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            return keyHolder.getKey().intValue();
        }
        return 0;
    }

    public Optional<CompetitionRegistration> findByCompetitionAndStudent(int competitionId, int studentId) {
        String sql = "SELECT r.*, s.student_name, s.email, c.competition_name " +
                     "FROM COMPETITION_REGISTRATIONS r " +
                     "JOIN STUDENTS s ON r.student_id = s.student_id " +
                     "JOIN COMPETITIONS c ON r.competition_id = c.competition_id " +
                     "WHERE r.competition_id = ? AND r.student_id = ?";
        try {
            CompetitionRegistration reg = jdbcTemplate.queryForObject(sql, rowMapper, competitionId, studentId);
            return Optional.ofNullable(reg);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<CompetitionRegistration> findByCompetitionId(int competitionId) {
        String sql = "SELECT r.*, s.student_name, s.email, c.competition_name " +
                     "FROM COMPETITION_REGISTRATIONS r " +
                     "JOIN STUDENTS s ON r.student_id = s.student_id " +
                     "JOIN COMPETITIONS c ON r.competition_id = c.competition_id " +
                     "WHERE r.competition_id = ? ORDER BY r.registration_time ASC";
        return jdbcTemplate.query(sql, rowMapper, competitionId);
    }

    public List<CompetitionRegistration> findByStudentId(int studentId) {
        String sql = "SELECT r.*, s.student_name, s.email, c.competition_name " +
                     "FROM COMPETITION_REGISTRATIONS r " +
                     "JOIN STUDENTS s ON r.student_id = s.student_id " +
                     "JOIN COMPETITIONS c ON r.competition_id = c.competition_id " +
                     "WHERE r.student_id = ? ORDER BY r.registration_time DESC";
        return jdbcTemplate.query(sql, rowMapper, studentId);
    }

    public int countByCompetitionId(int competitionId) {
        String sql = "SELECT COUNT(*) FROM COMPETITION_REGISTRATIONS WHERE competition_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, competitionId);
        return count != null ? count : 0;
    }

    public boolean updateParticipationStatus(int competitionId, int studentId, String status) {
        String sql = "UPDATE COMPETITION_REGISTRATIONS SET participation_status = ? " +
                     "WHERE competition_id = ? AND student_id = ?";
        return jdbcTemplate.update(sql, status, competitionId, studentId) > 0;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM COMPETITION_REGISTRATIONS", Integer.class);
        return count != null ? count : 0;
    }
}
