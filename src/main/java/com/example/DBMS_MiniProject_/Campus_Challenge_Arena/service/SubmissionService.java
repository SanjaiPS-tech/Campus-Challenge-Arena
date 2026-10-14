package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.ChallengeDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.CompetitionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.RegistrationDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.SubmissionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Challenge;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Submission;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SubmissionService {

    private final SubmissionDao submissionDao;
    private final ChallengeDao challengeDao;
    private final CompetitionDao competitionDao;
    private final RegistrationDao registrationDao;

    @Autowired
    public SubmissionService(SubmissionDao submissionDao, ChallengeDao challengeDao, 
                             CompetitionDao competitionDao, RegistrationDao registrationDao) {
        this.submissionDao = submissionDao;
        this.challengeDao = challengeDao;
        this.competitionDao = competitionDao;
        this.registrationDao = registrationDao;
    }

    /**
     * Submit an answer with all strict validations:
     * 1. Only registered students can submit.
     * 2. Submissions accepted only within the competition window.
     * 3. Score evaluation evaluated consistently against challenge correct_answer.
     */
    public Submission submitAnswer(int challengeId, int studentId, String submittedAnswer) {
        if (submittedAnswer == null || submittedAnswer.trim().isEmpty()) {
            throw new IllegalArgumentException("Submitted answer cannot be blank.");
        }

        // 1. Validate Challenge exists
        Optional<Challenge> challengeOpt = challengeDao.findById(challengeId);
        if (challengeOpt.isEmpty()) {
            throw new IllegalArgumentException("Challenge with ID " + challengeId + " does not exist.");
        }
        Challenge challenge = challengeOpt.get();

        // 2. Validate Competition
        int competitionId = challenge.getCompetitionId();
        Optional<Competition> compOpt = competitionDao.findById(competitionId);
        if (compOpt.isEmpty()) {
            throw new IllegalArgumentException("Competition not found for challenge ID " + challengeId);
        }
        Competition comp = compOpt.get();

        // 3. Mandatory Validation: ONLY registered students can participate
        boolean isRegistered = registrationDao.findByCompetitionAndStudent(competitionId, studentId).isPresent();
        if (!isRegistered) {
            throw new SecurityException("Access Denied: Student ID " + studentId + 
                    " is NOT registered for competition '" + comp.getCompetitionName() + "'. You must register before participating.");
        }

        // 4. Mandatory Validation: Submissions accepted only within competition period
        LocalDateTime now = LocalDateTime.now();
        if (comp.getStartTime() != null && now.isBefore(comp.getStartTime())) {
            throw new IllegalStateException("Competition has not started yet. Starts at: " + comp.getStartTime());
        }
        if (comp.getEndTime() != null && now.isAfter(comp.getEndTime())) {
            throw new IllegalStateException("Submissions closed: Competition ended at " + comp.getEndTime());
        }
        if ("COMPLETED".equalsIgnoreCase(comp.getCompetitionStatus())) {
            throw new IllegalStateException("Competition status is marked as COMPLETED. Further submissions are not accepted.");
        }

        // 5. Update student's participation status to PARTICIPATING
        registrationDao.updateParticipationStatus(competitionId, studentId, "PARTICIPATING");

        // 6. Score Evaluation: Evaluate submitted answer against correct answer
        String studentAns = submittedAnswer.trim();
        String expectedAns = challenge.getCorrectAnswer() != null ? challenge.getCorrectAnswer().trim() : "";

        int calculatedScore;
        String evalStatus;

        if (isAnswerCorrect(studentAns, expectedAns)) {
            calculatedScore = challenge.getPoints();
            evalStatus = "EVALUATED";
        } else {
            calculatedScore = 0;
            evalStatus = "EVALUATED";
        }

        Submission submission = new Submission();
        submission.setChallengeId(challengeId);
        submission.setStudentId(studentId);
        submission.setSubmittedAnswer(studentAns);
        submission.setSubmissionTime(now);
        submission.setScore(calculatedScore);
        submission.setEvaluationStatus(evalStatus);
        submission.setChallengeTitle(challenge.getChallengeTitle());
        submission.setCompetitionId(competitionId);
        submission.setCompetitionName(comp.getCompetitionName());
        submission.setMaxPoints(challenge.getPoints());

        int subId = submissionDao.save(submission);
        submission.setSubmissionId(subId);
        return submission;
    }

    /**
     * Compare student answer with expected answer:
     * - Case-insensitive match
     * - Normalized spacing
     * - Trimmed comparison
     */
    private boolean isAnswerCorrect(String studentAnswer, String expectedAnswer) {
        if (studentAnswer == null || expectedAnswer == null) return false;
        String cleanStudent = studentAnswer.trim().replaceAll("\\s+", " ").toLowerCase();
        String cleanExpected = expectedAnswer.trim().replaceAll("\\s+", " ").toLowerCase();
        return cleanStudent.equals(cleanExpected);
    }

    /**
     * Manual score evaluation / grading override by organizer.
     */
    public boolean evaluateSubmissionManual(int submissionId, int score, String status) {
        Optional<Submission> subOpt = submissionDao.findById(submissionId);
        if (subOpt.isEmpty()) {
            throw new IllegalArgumentException("Submission ID " + submissionId + " not found.");
        }
        String upperStatus = status != null ? status.toUpperCase() : "EVALUATED";
        if (!upperStatus.equals("PENDING") && !upperStatus.equals("EVALUATED") && !upperStatus.equals("REJECTED")) {
            throw new IllegalArgumentException("Status must be PENDING, EVALUATED, or REJECTED");
        }
        return submissionDao.updateScoreAndStatus(submissionId, score, upperStatus);
    }

    public List<Submission> getSubmissionsByCompetition(int competitionId) {
        return submissionDao.findByCompetitionId(competitionId);
    }

    public List<Submission> getSubmissionsByStudentAndCompetition(int studentId, int competitionId) {
        return submissionDao.findByStudentAndCompetition(studentId, competitionId);
    }

    public List<Submission> getSubmissionsByStudent(int studentId) {
        return submissionDao.findByStudentId(studentId);
    }

    public Optional<Submission> getSubmissionById(int submissionId) {
        return submissionDao.findById(submissionId);
    }
}
