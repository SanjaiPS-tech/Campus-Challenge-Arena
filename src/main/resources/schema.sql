-- Campus Challenge Arena Database Schema
-- Database: campus_challenge

CREATE TABLE IF NOT EXISTS STUDENTS (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    year_of_study INT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS CHALLENGES (
    challenge_id INT AUTO_INCREMENT PRIMARY KEY,
    competition_id INT NOT NULL,
    challenge_title VARCHAR(200) NOT NULL,
    question_description TEXT NOT NULL,
    points INT NOT NULL DEFAULT 10,
    correct_answer TEXT NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES COMPETITIONS(competition_id) ON DELETE CASCADE
);

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
