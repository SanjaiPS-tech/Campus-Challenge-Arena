package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Student;
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
public class StudentDao {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public StudentDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<Student> rowMapper = (rs, rowNum) -> new Student(
            rs.getInt("student_id"),
            rs.getString("student_name"),
            rs.getString("email"),
            rs.getString("department"),
            rs.getInt("year_of_study")
    );

    public int save(Student student) {
        String sql = "INSERT INTO STUDENTS (student_name, email, department, year_of_study) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, student.getStudentName());
            ps.setString(2, student.getEmail());
            ps.setString(3, student.getDepartment());
            ps.setInt(4, student.getYearOfStudy());
            return ps;
        }, keyHolder);

        if (keyHolder.getKey() != null) {
            student.setStudentId(keyHolder.getKey().intValue());
            return student.getStudentId();
        }
        return 0;
    }

    public Optional<Student> findById(int studentId) {
        String sql = "SELECT student_id, student_name, email, department, year_of_study FROM STUDENTS WHERE student_id = ?";
        try {
            Student student = jdbcTemplate.queryForObject(sql, rowMapper, studentId);
            return Optional.ofNullable(student);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<Student> findByEmail(String email) {
        String sql = "SELECT student_id, student_name, email, department, year_of_study FROM STUDENTS WHERE LOWER(email) = LOWER(?)";
        try {
            Student student = jdbcTemplate.queryForObject(sql, rowMapper, email);
            return Optional.ofNullable(student);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Student> findAll() {
        String sql = "SELECT student_id, student_name, email, department, year_of_study FROM STUDENTS ORDER BY student_id ASC";
        return jdbcTemplate.query(sql, rowMapper);
    }

    public boolean update(Student student) {
        String sql = "UPDATE STUDENTS SET student_name = ?, email = ?, department = ?, year_of_study = ? WHERE student_id = ?";
        int updated = jdbcTemplate.update(sql,
                student.getStudentName(),
                student.getEmail(),
                student.getDepartment(),
                student.getYearOfStudy(),
                student.getStudentId()
        );
        return updated > 0;
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM STUDENTS", Integer.class);
        return count != null ? count : 0;
    }
}
