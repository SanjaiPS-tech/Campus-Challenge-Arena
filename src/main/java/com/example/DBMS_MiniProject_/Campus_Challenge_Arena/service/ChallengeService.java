package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.ChallengeDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.CompetitionDao;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Challenge;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.Competition;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChallengeService {

    private final ChallengeDao challengeDao;
    private final CompetitionDao competitionDao;

    @Autowired
    public ChallengeService(ChallengeDao challengeDao, CompetitionDao competitionDao) {
        this.challengeDao = challengeDao;
        this.competitionDao = competitionDao;
    }

    public Challenge addChallenge(Challenge challenge) {
        if (challenge.getChallengeTitle() == null || challenge.getChallengeTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Challenge title cannot be empty.");
        }
        if (challenge.getQuestionDescription() == null || challenge.getQuestionDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Question description cannot be empty.");
        }
        if (challenge.getPoints() <= 0) {
            challenge.setPoints(10);
        }
        if (challenge.getCorrectAnswer() == null || challenge.getCorrectAnswer().trim().isEmpty()) {
            throw new IllegalArgumentException("Correct answer must be provided for evaluation.");
        }

        Optional<Competition> compOpt = competitionDao.findById(challenge.getCompetitionId());
        if (compOpt.isEmpty()) {
            throw new IllegalArgumentException("Associated competition ID " + challenge.getCompetitionId() + " does not exist.");
        }

        challenge.setChallengeTitle(challenge.getChallengeTitle().trim());
        challenge.setQuestionDescription(challenge.getQuestionDescription().trim());
        challenge.setCorrectAnswer(challenge.getCorrectAnswer().trim());

        int id = challengeDao.save(challenge);
        challenge.setChallengeId(id);
        return challenge;
    }

    public Optional<Challenge> getChallengeById(int challengeId) {
        return challengeDao.findById(challengeId);
    }

    public List<Challenge> getChallengesByCompetition(int competitionId) {
        return challengeDao.findByCompetitionId(competitionId);
    }

    public boolean deleteChallenge(int challengeId) {
        return challengeDao.delete(challengeId);
    }
}
