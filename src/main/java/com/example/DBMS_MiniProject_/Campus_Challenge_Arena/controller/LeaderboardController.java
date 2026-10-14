package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.LeaderboardEntry;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.LeaderboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
@CrossOrigin(origins = "*")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    @Autowired
    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCompetitionLeaderboard(@PathVariable("competitionId") int competitionId) {
        try {
            Map<String, Object> data = leaderboardService.getLiveLeaderboardForCompetition(competitionId);
            return ResponseEntity.ok(ApiResponse.ok("Live leaderboard fetched successfully", data));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/global")
    public ResponseEntity<ApiResponse<List<LeaderboardEntry>>> getGlobalLeaderboard() {
        return ResponseEntity.ok(ApiResponse.ok(leaderboardService.getGlobalLeaderboard()));
    }
}
