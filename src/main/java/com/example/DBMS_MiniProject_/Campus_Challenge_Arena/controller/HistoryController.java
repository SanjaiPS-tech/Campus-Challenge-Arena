package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.CompetitionHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class HistoryController {

    private final CompetitionHistoryService historyService;

    @Autowired
    public HistoryController(CompetitionHistoryService historyService) {
        this.historyService = historyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCompletedCompetitions() {
        return ResponseEntity.ok(ApiResponse.ok("Competition history records retrieved", historyService.getCompletedCompetitionsHistory()));
    }

    @GetMapping("/{competitionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCompetitionDossier(@PathVariable("competitionId") int competitionId) {
        try {
            return ResponseEntity.ok(ApiResponse.ok("Competition dossier retrieved", historyService.getCompetitionDossier(competitionId)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
