package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.*;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.DatabaseInitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*")
public class SystemController {

    private final StudentDao studentDao;
    private final CompetitionDao competitionDao;
    private final ChallengeDao challengeDao;
    private final RegistrationDao registrationDao;
    private final SubmissionDao submissionDao;
    private final DatabaseInitService databaseInitService;

    @Autowired
    public SystemController(StudentDao studentDao, CompetitionDao competitionDao,
                            ChallengeDao challengeDao, RegistrationDao registrationDao,
                            SubmissionDao submissionDao, DatabaseInitService databaseInitService) {
        this.studentDao = studentDao;
        this.competitionDao = competitionDao;
        this.challengeDao = challengeDao;
        this.registrationDao = registrationDao;
        this.submissionDao = submissionDao;
        this.databaseInitService = databaseInitService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalStudents", studentDao.count());
        stats.put("totalCompetitions", competitionDao.count());
        stats.put("totalChallenges", challengeDao.count());
        stats.put("totalRegistrations", registrationDao.count());
        stats.put("totalSubmissions", submissionDao.count());
        stats.put("databaseStatus", "ONLINE - Connected to MySQL [campus_challenge]");
        return ResponseEntity.ok(ApiResponse.ok("System statistics retrieved", stats));
    }

    @PostMapping("/reset-seed")
    public ResponseEntity<ApiResponse<String>> resetAndSeed() {
        try {
            databaseInitService.resetAndSeed();
            return ResponseEntity.ok(ApiResponse.ok("Database reset and seeded with demonstration records successfully!", null));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to reset database: " + e.getMessage()));
        }
    }
}
