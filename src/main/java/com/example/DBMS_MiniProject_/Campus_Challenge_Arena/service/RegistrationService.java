package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.CompetitionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.RegistrationDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.StudentDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.CompetitionRegistration;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Student;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class RegistrationService {

    private final RegistrationDao registrationDao;
    private final StudentDao studentDao;
    private final CompetitionDao competitionDao;

    @Autowired
    public RegistrationService(RegistrationDao registrationDao, StudentDao studentDao, CompetitionDao competitionDao) {
        this.registrationDao = registrationDao;
        this.studentDao = studentDao;
        this.competitionDao = competitionDao;
    }

    public CompetitionRegistration registerStudentForCompetition(int competitionId, int studentId) {
        // Validation 1: Student exists
        Optional<Student> studentOpt = studentDao.findById(studentId);
        if (studentOpt.isEmpty()) {
            throw new IllegalArgumentException("Student with ID " + studentId + " does not exist. Please register student first.");
        }

        // Validation 2: Competition exists
        Optional<Competition> compOpt = competitionDao.findById(competitionId);
        if (compOpt.isEmpty()) {
            throw new IllegalArgumentException("Competition with ID " + competitionId + " does not exist.");
        }
        Competition comp = compOpt.get();

        // Validation 3: Competition is open for registration
        LocalDateTime now = LocalDateTime.now();
        if ("COMPLETED".equalsIgnoreCase(comp.getCompetitionStatus()) || (comp.getEndTime() != null && now.isAfter(comp.getEndTime()))) {
            throw new IllegalStateException("Registration is closed. Competition has already ended.");
        }

        // Validation 4: Check participant limit
        int currentCount = registrationDao.countByCompetitionId(competitionId);
        if (currentCount >= comp.getMaxParticipants()) {
            throw new IllegalStateException("Competition participant limit of " + comp.getMaxParticipants() + " has been reached.");
        }

        // Validation 5: Check if already registered
        Optional<CompetitionRegistration> existing = registrationDao.findByCompetitionAndStudent(competitionId, studentId);
        if (existing.isPresent()) {
            throw new IllegalStateException("Student is already registered for this competition (Registration ID: " + existing.get().getRegistrationId() + ").");
        }

        int regId = registrationDao.register(competitionId, studentId, "REGISTERED");
        CompetitionRegistration reg = new CompetitionRegistration(regId, competitionId, studentId, now, "REGISTERED");
        reg.setStudentName(studentOpt.get().getStudentName());
        reg.setStudentEmail(studentOpt.get().getEmail());
        reg.setCompetitionName(comp.getCompetitionName());
        return reg;
    }

    public boolean isStudentRegistered(int competitionId, int studentId) {
        return registrationDao.findByCompetitionAndStudent(competitionId, studentId).isPresent();
    }

    public List<CompetitionRegistration> getRegistrationsByCompetition(int competitionId) {
        return registrationDao.findByCompetitionId(competitionId);
    }

    public List<CompetitionRegistration> getRegistrationsByStudent(int studentId) {
        return registrationDao.findByStudentId(studentId);
    }

    public boolean updateParticipationStatus(int competitionId, int studentId, String status) {
        return registrationDao.updateParticipationStatus(competitionId, studentId, status);
    }
}
