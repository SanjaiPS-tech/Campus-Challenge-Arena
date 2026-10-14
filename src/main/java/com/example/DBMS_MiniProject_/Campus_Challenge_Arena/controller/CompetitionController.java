package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.CompetitionSummary;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.CompetitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/competitions")
@CrossOrigin(origins = "*")
public class CompetitionController {

    private final CompetitionService competitionService;

    @Autowired
    public CompetitionController(CompetitionService competitionService) {
        this.competitionService = competitionService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Competition>> createCompetition(@RequestBody Competition competition) {
        try {
            Competition created = competitionService.createCompetition(competition);
            return ResponseEntity.ok(ApiResponse.ok("Competition created successfully!", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to create competition: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Competition>>> getCompetitions(@RequestParam(value = "status", required = false) String status) {
        if (status != null && !status.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.ok(competitionService.getCompetitionsByStatus(status)));
        }
        return ResponseEntity.ok(ApiResponse.ok(competitionService.getAllCompetitions()));
    }

    @GetMapping("/summaries")
    public ResponseEntity<ApiResponse<List<CompetitionSummary>>> getCompetitionSummaries() {
        return ResponseEntity.ok(ApiResponse.ok(competitionService.getAllCompetitionSummaries()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Competition>> getCompetitionById(@PathVariable("id") int id) {
        return competitionService.getCompetitionById(id)
                .map(c -> ResponseEntity.ok(ApiResponse.ok(c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(@PathVariable("id") int id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing 'status' property"));
        }
        try {
            boolean updated = competitionService.updateStatus(id, status);
            if (updated) {
                return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", status));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error("Competition not found with ID " + id));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
