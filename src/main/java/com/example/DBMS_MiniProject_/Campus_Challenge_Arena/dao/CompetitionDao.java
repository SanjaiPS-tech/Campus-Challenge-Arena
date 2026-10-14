package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
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
public class CompetitionDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public CompetitionDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Competition> rowMapper = (rs, rowNum) -> {
        Timestamp startTs = rs.getTimestamp("start_time");
        Timestamp endTs = rs.getTimestamp("end_time");
        return new Competition(
                rs.getInt("competition_id"),
                rs.getString("competition_name"),
                rs.getString("competition_type"),
                rs.getString("description"),
                startTs != null ? startTs.toLocalDateTime() : null,
                endTs != null ? endTs.toLocalDateTime() : null,
                rs.getInt("max_participants"),
                rs.getString("competition_status")
        );
    };

    public int save(Competition competition) {
        String sql = "INSERT INTO COMPETITIONS (competition_name, competition_type, description, start_time, end_time, max_participants, competition_status) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, competition.getCompetitionName());
            ps.setString(2, competition.getCompetitionType());
            ps.setString(3, competition.getDescription());
            ps.setTimestamp(4, Timestamp.valueOf(competition.getStartTime()));
            ps.setTimestamp(5, Timestamp.valueOf(competition.getEndTime()));
            ps.setInt(6, competition.getMaxParticipants());
            ps.setString(7, competition.getCompetitionStatus());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            competition.setCompetitionId(keyHolder.getKey().intValue());
            return competition.getCompetitionId();
        }
        return 0;
    }

    public Optional<Competition> findById(int competitionId) {
        String sql = "SELECT * FROM COMPETITIONS WHERE competition_id = ?";
        try {
            Competition comp = jdbcTemplate.queryForObject(sql, rowMapper, competitionId);
            return Optional.ofNullable(comp);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Competition> findAll() {
        String sql = "SELECT * FROM COMPETITIONS ORDER BY start_time DESC, competition_id DESC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public List<Competition> findByStatus(String status) {
        String sql = "SELECT * FROM COMPETITIONS WHERE LOWER(competition_status) = LOWER(?) ORDER BY start_time ASC";
        return jdbcTemplate.query(sql, rowMapper, status);
    }

    public boolean updateStatus(int competitionId, String status) {
        String sql = "UPDATE COMPETITIONS SET competition_status = ? WHERE competition_id = ?";
        return jdbcTemplate.update(sql, status, competitionId) > 0;
    }

    public boolean updateScheduleAndStatus(int competitionId, LocalDateTime start, LocalDateTime end, String status) {
        String sql = "UPDATE COMPETITIONS SET start_time = ?, end_time = ?, competition_status = ? WHERE competition_id = ?";
        return jdbcTemplate.update(sql, Timestamp.valueOf(start), Timestamp.valueOf(end), status, competitionId) > 0;
    }

    public int getRegisteredParticipantCount(int competitionId) {
        String sql = "SELECT COUNT(*) FROM COMPETITION_REGISTRATIONS WHERE competition_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, competitionId);
        return count != null ? count : 0;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM COMPETITIONS", Integer.class);
        return count != null ? count : 0;
    }
}
