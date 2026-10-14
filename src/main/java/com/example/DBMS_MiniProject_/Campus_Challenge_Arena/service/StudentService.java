package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.StudentDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class StudentService {

    private final StudentDao studentDao;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    @Autowired
    public StudentService(StudentDao studentDao) {
        this.studentDao = studentDao;
    }

    public Student registerStudent(Student student) {
        if (student.getStudentName() == null || student.getStudentName().trim().isEmpty()) {
            throw new IllegalArgumentException("Student name cannot be empty.");
        }
        if (student.getEmail() == null || !EMAIL_PATTERN.matcher(student.getEmail().trim()).matches()) {
            throw new IllegalArgumentException("Invalid email format: " + student.getEmail());
        }
        if (student.getDepartment() == null || student.getDepartment().trim().isEmpty()) {
            throw new IllegalArgumentException("Department cannot be empty.");
        }
        if (student.getYearOfStudy() < 1 || student.getYearOfStudy() > 5) {
            throw new IllegalArgumentException("Year of study must be between 1 and 5.");
        }

        // Check unique email
        Optional<Student> existing = studentDao.findByEmail(student.getEmail().trim());
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Student with email '" + student.getEmail() + "' is already registered.");
        }

        student.setStudentName(student.getStudentName().trim());
        student.setEmail(student.getEmail().trim().toLowerCase());
        student.setDepartment(student.getDepartment().trim());

        int id = studentDao.save(student);
        student.setStudentId(id);
        return student;
    }

    public Optional<Student> getStudentById(int studentId) {
        return studentDao.findById(studentId);
    }

    public Optional<Student> getStudentByEmail(String email) {
        return studentDao.findByEmail(email);
    }

    public List<Student> getAllStudents() {
        return studentDao.findAll();
    }

    public boolean updateStudent(Student student) {
        return studentDao.update(student);
    }
}
