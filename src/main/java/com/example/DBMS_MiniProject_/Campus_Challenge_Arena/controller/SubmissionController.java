package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Submission;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.SubmissionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@CrossOrigin(origins = "*")
public class SubmissionController {

    private final SubmissionService submissionService;

    @Autowired
    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Submission>> submitAnswer(@RequestBody Map<String, Object> body) {
        try {
            int challengeId = Integer.parseInt(body.get("challengeId").toString());
            int studentId = Integer.parseInt(body.get("studentId").toString());
            String submittedAnswer = (String) body.get("submittedAnswer");

            Submission result = submissionService.submitAnswer(challengeId, studentId, submittedAnswer);
            return ResponseEntity.ok(ApiResponse.ok("Submission evaluated successfully!", result));
        } catch (SecurityException e) {
            // Student not registered
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalStateException e) {
            // Timing or status violations
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to process submission: " + e.getMessage()));
        }
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<ApiResponse<List<Submission>>> getByCompetition(@PathVariable("competitionId") int competitionId) {
        return ResponseEntity.ok(ApiResponse.ok(submissionService.getSubmissionsByCompetition(competitionId)));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<Submission>>> getByStudent(@PathVariable("studentId") int studentId) {
        return ResponseEntity.ok(ApiResponse.ok(submissionService.getSubmissionsByStudent(studentId)));
    }

    @GetMapping("/student/{studentId}/competition/{competitionId}")
    public ResponseEntity<ApiResponse<List<Submission>>> getByStudentAndCompetition(@PathVariable("studentId") int studentId,
                                                                                  @PathVariable("competitionId") int competitionId) {
        return ResponseEntity.ok(ApiResponse.ok(submissionService.getSubmissionsByStudentAndCompetition(studentId, competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Submission>> getById(@PathVariable("id") int id) {
        return submissionService.getSubmissionById(id)
                .map(sub -> ResponseEntity.ok(ApiResponse.ok(sub)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<ApiResponse<String>> evaluateManual(@PathVariable("id") int id, @RequestBody Map<String, Object> body) {
        try {
            int score = Integer.parseInt(body.get("score").toString());
            String status = (String) body.get("status");
            boolean updated = submissionService.evaluateSubmissionManual(id, score, status);
            if (updated) {
                return ResponseEntity.ok(ApiResponse.ok("Submission graded successfully", null));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("Could not update submission"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
