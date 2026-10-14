package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Student;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.StudentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @Autowired
    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Student>> registerStudent(@RequestBody Student student) {
        try {
            Student saved = studentService.registerStudent(student);
            return ResponseEntity.ok(ApiResponse.ok("Student registered successfully!", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to register student: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Student>>> getAllStudents() {
        return ResponseEntity.ok(ApiResponse.ok(studentService.getAllStudents()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Student>> getStudentById(@PathVariable("id") int id) {
        return studentService.getStudentById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.ok(s)))
                .orElse(ResponseEntity.notFound().build());
    }
}
