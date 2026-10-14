package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.controller;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.ApiResponse;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.CompetitionRegistration;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@CrossOrigin(origins = "*")
public class RegistrationController {

    private final RegistrationService registrationService;

    @Autowired
    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompetitionRegistration>> register(@RequestBody Map<String, Integer> request) {
        Integer competitionId = request.get("competitionId");
        Integer studentId = request.get("studentId");

        if (competitionId == null || studentId == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Both 'competitionId' and 'studentId' are required."));
        }

        try {
            CompetitionRegistration registration = registrationService.registerStudentForCompetition(competitionId, studentId);
            return ResponseEntity.ok(ApiResponse.ok("Successfully registered for competition!", registration));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    @GetMapping("/competition/{competitionId}")
    public ResponseEntity<ApiResponse<List<CompetitionRegistration>>> getByCompetition(@PathVariable("competitionId") int competitionId) {
        return ResponseEntity.ok(ApiResponse.ok(registrationService.getRegistrationsByCompetition(competitionId)));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<CompetitionRegistration>>> getByStudent(@PathVariable("studentId") int studentId) {
        return ResponseEntity.ok(ApiResponse.ok(registrationService.getRegistrationsByStudent(studentId)));
    }

    @GetMapping("/check")
    public ResponseEntity<ApiResponse<Boolean>> checkRegistration(@RequestParam("competitionId") int competitionId,
                                                                  @RequestParam("studentId") int studentId) {
        boolean registered = registrationService.isStudentRegistered(competitionId, studentId);
        return ResponseEntity.ok(ApiResponse.ok(registered));
    }
}
