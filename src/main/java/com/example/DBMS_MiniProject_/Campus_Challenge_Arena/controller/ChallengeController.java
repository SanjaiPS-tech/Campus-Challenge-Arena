package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Challenge;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.ChallengeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@CrossOrigin(origins = "*")
public class ChallengeController {

    private final ChallengeService challengeService;

    @Autowired
    public ChallengeController(ChallengeService challengeService) {
        this.challengeService = challengeService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Challenge>> addChallenge(@RequestBody Challenge challenge) {
        try {
            Challenge created = challengeService.addChallenge(challenge);
            return ResponseEntity.ok(ApiResponse.ok("Challenge question added successfully!", created));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to add challenge: " + e.getMessage()));
        }
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<ApiResponse<List<Challenge>>> getChallengesByCompetition(@PathVariable("competitionId") int competitionId) {
        return ResponseEntity.ok(ApiResponse.ok(challengeService.getChallengesByCompetition(competitionId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Challenge>> getChallengeById(@PathVariable("id") int id) {
        return challengeService.getChallengeById(id)
                .map(ch -> ResponseEntity.ok(ApiResponse.ok(ch)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteChallenge(@PathVariable("id") int id) {
        boolean deleted = challengeService.deleteChallenge(id);
        if (deleted) {
            return ResponseEntity.ok(ApiResponse.ok("Challenge deleted successfully", null));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Challenge not found with ID " + id));
    }
}
