package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dao.*;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class DatabaseInitService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseInitService.class);

    private final JdbcTemplate jdbcTemplate;
    private final StudentDao studentDao;
    private final CompetitionDao competitionDao;
    private final ChallengeDao challengeDao;
    private final RegistrationDao registrationDao;
    private final SubmissionDao submissionDao;

    @Autowired
    public DatabaseInitService(JdbcTemplate jdbcTemplate, StudentDao studentDao,
                               CompetitionDao competitionDao, ChallengeDao challengeDao,
                               RegistrationDao registrationDao, SubmissionDao submissionDao) {
        this.jdbcTemplate = jdbcTemplate;
        this.studentDao = studentDao;
        this.competitionDao = competitionDao;
        this.challengeDao = challengeDao;
        this.registrationDao = registrationDao;
        this.submissionDao = submissionDao;
    }

    @Override
    public void run(String... args) {
        initSchema();
        if (studentDao.count() == 0 || competitionDao.count() == 0) {
            log.info("Database is empty. Seeding initial demonstration data...");
            seedDemoData();
        } else {
            log.info("Database already contains data (Students: {}, Competitions: {}). Skipping automatic seed.",
                    studentDao.count(), competitionDao.count());
        }
    }

    public void initSchema() {
        log.info("Verifying MySQL schema for Campus Challenge Arena...");
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS STUDENTS (
                student_id INT AUTO_INCREMENT PRIMARY KEY,
                student_name VARCHAR(100) NOT NULL,
                email VARCHAR(150) NOT NULL UNIQUE,
                department VARCHAR(100) NOT NULL,
                year_of_study INT NOT NULL
            );
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS COMPETITIONS (
                competition_id INT AUTO_INCREMENT PRIMARY KEY,
                competition_name VARCHAR(150) NOT NULL,
                competition_type VARCHAR(50) NOT NULL,
                description TEXT,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                max_participants INT NOT NULL DEFAULT 100,
                competition_status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING'
            );
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS CHALLENGES (
                challenge_id INT AUTO_INCREMENT PRIMARY KEY,
                competition_id INT NOT NULL,
                challenge_title VARCHAR(200) NOT NULL,
                question_description TEXT NOT NULL,
                points INT NOT NULL DEFAULT 10,
                correct_answer TEXT NOT NULL,
                FOREIGN KEY (competition_id) REFERENCES COMPETITIONS(competition_id) ON DELETE CASCADE
            );
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS COMPETITION_REGISTRATIONS (
                registration_id INT AUTO_INCREMENT PRIMARY KEY,
                competition_id INT NOT NULL,
                student_id INT NOT NULL,
                registration_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                participation_status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
                FOREIGN KEY (competition_id) REFERENCES COMPETITIONS(competition_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE,
                UNIQUE KEY uk_competition_student (competition_id, student_id)
            );
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS SUBMISSIONS (
                submission_id INT AUTO_INCREMENT PRIMARY KEY,
                challenge_id INT NOT NULL,
                student_id INT NOT NULL,
                submitted_answer TEXT NOT NULL,
                submission_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                score INT NOT NULL DEFAULT 0,
                evaluation_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                FOREIGN KEY (challenge_id) REFERENCES CHALLENGES(challenge_id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES STUDENTS(student_id) ON DELETE CASCADE
            );
        """);
        log.info("Schema verified successfully.");
    }

    public synchronized void seedDemoData() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Seed Students
        Student s1 = new Student("Aarav Sharma", "aarav.sharma@campus.edu", "Computer Science", 3);
        Student s2 = new Student("Priya Nair", "priya.nair@campus.edu", "Information Technology", 4);
        Student s3 = new Student("Rohan Varma", "rohan.varma@campus.edu", "Artificial Intelligence", 2);
        Student s4 = new Student("Ananya Iyer", "ananya.iyer@campus.edu", "Computer Science", 4);
        Student s5 = new Student("Vikram Patel", "vikram.patel@campus.edu", "Data Science", 3);

        int s1Id = studentDao.save(s1);
        int s2Id = studentDao.save(s2);
        int s3Id = studentDao.save(s3);
        int s4Id = studentDao.save(s4);
        int s5Id = studentDao.save(s5);

        // 2. Seed Competitions
        // Comp 1: ACTIVE Coding Contest
        Competition c1 = new Competition();
        c1.setCompetitionName("Apex CodeSprint 2026");
        c1.setCompetitionType("Coding Contest");
        c1.setDescription("The flagship inter-departmental algorithmic sprint. Solve rapid data structures and algorithmic puzzles under time pressure.");
        c1.setStartTime(now.minusHours(1));
        c1.setEndTime(now.plusHours(3));
        c1.setMaxParticipants(50);
        c1.setCompetitionStatus("ACTIVE");
        int c1Id = competitionDao.save(c1);

        // Comp 2: UPCOMING Technical Challenge
        Competition c2 = new Competition();
        c2.setCompetitionName("ByteForge Technical Challenge");
        c2.setCompetitionType("Technical Challenge");
        c2.setDescription("Deep dive into system design, network protocols, and distributed transactions. Open for all engineering students.");
        c2.setStartTime(now.plusDays(2));
        c2.setEndTime(now.plusDays(2).plusHours(4));
        c2.setMaxParticipants(75);
        c2.setCompetitionStatus("UPCOMING");
        int c2Id = competitionDao.save(c2);

        // Comp 3: COMPLETED Database Quiz
        Competition c3 = new Competition();
        c3.setCompetitionName("SQL Titans: Database Invitational");
        c3.setCompetitionType("Quiz");
        c3.setDescription("Comprehensive arena contest covering relational algebra, normalization, query execution plans, and ACID guarantees.");
        c3.setStartTime(now.minusDays(5));
        c3.setEndTime(now.minusDays(5).plusHours(2));
        c3.setMaxParticipants(40);
        c3.setCompetitionStatus("COMPLETED");
        int c3Id = competitionDao.save(c3);

        // 3. Seed Challenges
        // For C1 (Active):
        Challenge ch1 = new Challenge(c1Id, "Array Zero Sum Pair", 
                "Given an integer array nums = [-3, 1, 2, 3, 5], find the pair that sums to zero. Return the values in ascending order separated by comma.",
                20, "-3, 3");
        Challenge ch2 = new Challenge(c1Id, "Balanced Brackets Depth", 
                "What is the maximum nesting depth of the parentheses string: ((()[()]))? Return integer value.",
                15, "4");
        Challenge ch3 = new Challenge(c1Id, "Prime Factorization", 
                "What is the largest prime factor of 315? Return only the prime number.",
                25, "7");

        int ch1Id = challengeDao.save(ch1);
        int ch2Id = challengeDao.save(ch2);
        int ch3Id = challengeDao.save(ch3);

        // For C2 (Upcoming):
        challengeDao.save(new Challenge(c2Id, "CAP Theorem Tradeoffs", 
                "Under network partition in distributed database systems, which property must be sacrificed according to CAP theorem when maintaining Consistency? (A: Availability, B: Partition Tolerance, C: Durability)",
                15, "A"));
        challengeDao.save(new Challenge(c2Id, "TCP Handshake Steps", 
                "What is the 3-packet sequence during standard TCP connection establishment? (e.g. SYN, SYN-ACK, ACK)",
                20, "SYN, SYN-ACK, ACK"));

        // For C3 (Completed):
        Challenge chHistory1 = new Challenge(c3Id, "2NF Violation Condition", 
                "A relation is in 2NF if it is in 1NF and contains no: (A) Transitive Dependency (B) Partial Dependency (C) Multivalued Dependency",
                25, "B");
        Challenge chHistory2 = new Challenge(c3Id, "B-Tree Search Complexity", 
                "What is the worst-case time complexity of searching an element in a balanced B-Tree with N keys? (Format: O(log N))",
                25, "O(log N)");

        int chH1Id = challengeDao.save(chHistory1);
        int chH2Id = challengeDao.save(chHistory2);

        // 4. Seed Registrations
        // Active comp (c1) registrations
        registrationDao.register(c1Id, s1Id, "PARTICIPATING");
        registrationDao.register(c1Id, s2Id, "PARTICIPATING");
        registrationDao.register(c1Id, s3Id, "REGISTERED");
        registrationDao.register(c1Id, s4Id, "PARTICIPATING");

        // Upcoming comp (c2) registrations
        registrationDao.register(c2Id, s1Id, "REGISTERED");
        registrationDao.register(c2Id, s5Id, "REGISTERED");

        // Completed comp (c3) registrations
        registrationDao.register(c3Id, s1Id, "COMPLETED");
        registrationDao.register(c3Id, s2Id, "COMPLETED");
        registrationDao.register(c3Id, s4Id, "COMPLETED");

        // 5. Seed Submissions
        // Active comp submissions
        Submission sub1 = new Submission(0, ch1Id, s1Id, "-3, 3", now.minusMinutes(40), 20, "EVALUATED");
        Submission sub2 = new Submission(0, ch2Id, s1Id, "4", now.minusMinutes(25), 15, "EVALUATED");
        submissionDao.save(sub1);
        submissionDao.save(sub2);

        Submission sub3 = new Submission(0, ch1Id, s2Id, "-3, 3", now.minusMinutes(35), 20, "EVALUATED");
        Submission sub4 = new Submission(0, ch3Id, s2Id, "7", now.minusMinutes(10), 25, "EVALUATED");
        submissionDao.save(sub3);
        submissionDao.save(sub4);

        Submission sub5 = new Submission(0, ch1Id, s4Id, "-3, 3", now.minusMinutes(15), 20, "EVALUATED");
        submissionDao.save(sub5);

        // Completed comp submissions for historical rankings
        Submission hSub1 = new Submission(0, chH1Id, s1Id, "B", now.minusDays(5).plusMinutes(15), 25, "EVALUATED");
        Submission hSub2 = new Submission(0, chH2Id, s1Id, "O(log N)", now.minusDays(5).plusMinutes(30), 25, "EVALUATED");
        submissionDao.save(hSub1);
        submissionDao.save(hSub2);

        Submission hSub3 = new Submission(0, chH1Id, s2Id, "B", now.minusDays(5).plusMinutes(20), 25, "EVALUATED");
        submissionDao.save(hSub3);

        Submission hSub4 = new Submission(0, chH1Id, s4Id, "A", now.minusDays(5).plusMinutes(22), 0, "EVALUATED");
        Submission hSub5 = new Submission(0, chH2Id, s4Id, "O(log N)", now.minusDays(5).plusMinutes(38), 25, "EVALUATED");
        submissionDao.save(hSub4);
        submissionDao.save(hSub5);

        log.info("Demo data seeded successfully.");
    }

    public synchronized void resetAndSeed() {
        log.info("Resetting all data and re-seeding demo records...");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0;");
        jdbcTemplate.execute("TRUNCATE TABLE SUBMISSIONS;");
        jdbcTemplate.execute("TRUNCATE TABLE COMPETITION_REGISTRATIONS;");
        jdbcTemplate.execute("TRUNCATE TABLE CHALLENGES;");
        jdbcTemplate.execute("TRUNCATE TABLE COMPETITIONS;");
        jdbcTemplate.execute("TRUNCATE TABLE STUDENTS;");
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1;");
        seedDemoData();
    }
}
