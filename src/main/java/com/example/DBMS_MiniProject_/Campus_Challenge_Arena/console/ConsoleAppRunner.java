package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.console;

import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.CompetitionSummary;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.dto.LeaderboardEntry;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.model.*;
import com.example.DBMS_MiniProject_.Campus_Challenge_Arena.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@Order(2)
@ConditionalOnProperty(name = "app.console.enabled", havingValue = "true", matchIfMissing = true)
public class ConsoleAppRunner implements CommandLineRunner {

    private final StudentService studentService;
    private final CompetitionService competitionService;
    private final ChallengeService challengeService;
    private final RegistrationService registrationService;
    private final SubmissionService submissionService;
    private final LeaderboardService leaderboardService;
    private final CompetitionHistoryService historyService;
    private final DatabaseInitService databaseInitService;

    private Student activeStudent = null;
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    @Autowired
    public ConsoleAppRunner(StudentService studentService,
                            CompetitionService competitionService,
                            ChallengeService challengeService,
                            RegistrationService registrationService,
                            SubmissionService submissionService,
                            LeaderboardService leaderboardService,
                            CompetitionHistoryService historyService,
                            DatabaseInitService databaseInitService) {
        this.studentService = studentService;
        this.competitionService = competitionService;
        this.challengeService = challengeService;
        this.registrationService = registrationService;
        this.submissionService = submissionService;
        this.leaderboardService = leaderboardService;
        this.historyService = historyService;
        this.databaseInitService = databaseInitService;
    }

    @Override
    public void run(String... args) {
        // Auto-select first student as default active student if available
        List<Student> students = studentService.getAllStudents();
        if (!students.isEmpty()) {
            activeStudent = students.get(0);
        }

        boolean running = true;
        while (running) {
            printBanner();
            printActiveStudentBadge();
            printMainMenu();

            int choice = ConsoleInput.readInt("Select an option", 0, 7);
            System.out.println();

            switch (choice) {
                case 1 -> studentMenu();
                case 2 -> competitionMenu();
                case 3 -> solveArenaMenu();
                case 4 -> leaderboardMenu();
                case 5 -> organizerMenu();
                case 6 -> historyMenu();
                case 7 -> systemMenu();
                case 0 -> {
                    running = false;
                    printExitMessage();
                }
            }
        }
    }

    private void printBanner() {
        System.out.println("\n" + AnsiColor.BRIGHT_CYAN + """
════════════════════════════════════════════════════════════════════════════════
  ██████╗ █████╗ ███╗   ███╗██████╗ ██╗   ██╗███████╗   █████╗ ██████╗ ███████╗███╗   ██╗ █████╗ 
 ██╔════╝██╔══██╗████╗ ████║██╔══██╗██║   ██║██╔════╝  ██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗
 ██║     ███████║██╔████╔██║██████╔╝██║   ██║███████╗  ███████║██████╔╝█████╗  ██╔██╗ ██║███████║
 ██║     ██╔══██║██║╚██╔╝██║██╔═══╝ ██║   ██║╚════██║  ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║██╔══██║
 ╚██████╗██║  ██║██║ ╚═╝ ██║██║     ╚██████╔╝███████║  ██║  ██║██║  ██║███████╗██║ ╚████║██║  ██║
  ╚═════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚══════╝  ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝
                    Interactive College Competition & Leaderboard Arena
════════════════════════════════════════════════════════════════════════════════""" + AnsiColor.RESET);
    }

    private void printActiveStudentBadge() {
        if (activeStudent != null) {
            System.out.println(AnsiColor.color(" 👤 Active Student: ", AnsiColor.BG_BLUE) + " "
                    + AnsiColor.bold(activeStudent.getStudentName())
                    + " (" + activeStudent.getEmail() + " | " + activeStudent.getDepartment() + " Year " + activeStudent.getYearOfStudy() + ")"
                    + " [ID: " + activeStudent.getStudentId() + "]\n");
        } else {
            System.out.println(AnsiColor.warn(" 👤 Active Student: [None selected - Set one in Student Menu]") + "\n");
        }
    }

    private void printMainMenu() {
        System.out.println(AnsiColor.bold("MAIN MENU"));
        System.out.println(AnsiColor.info(" [1]") + " 🎓 Student Directory & Profile Management");
        System.out.println(AnsiColor.info(" [2]") + " 🏆 Competitions & Registration Portal");
        System.out.println(AnsiColor.info(" [3]") + " 🎯 Solve Arena (Interactive Challenge Solver)");
        System.out.println(AnsiColor.info(" [4]") + " 📊 Leaderboards & Live Scoreboards");
        System.out.println(AnsiColor.info(" [5]") + " 🛠️  Organizer & Faculty Studio");
        System.out.println(AnsiColor.info(" [6]") + " 📜 Hall of Fame & Competition Archives");
        System.out.println(AnsiColor.info(" [7]") + " ⚙️  System & Database Administration");
        System.out.println(AnsiColor.info(" [0]") + " 🚪 Exit Application");
        System.out.println("────────────────────────────────────────────────────────────────────────────────");
    }

    // =========================================================================
    // 1. STUDENT MANAGEMENT
    // =========================================================================
    private void studentMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n" + AnsiColor.bold("═══ 🎓 STUDENT DIRECTORY & PROFILE MANAGEMENT ═══"));
            System.out.println(" [1] List All Students");
            System.out.println(" [2] Register New Student");
            System.out.println(" [3] Find Student (by ID or Email)");
            System.out.println(" [4] Set / Switch Active Student");
            System.out.println(" [5] View Student Profile & Performance Stats");
            System.out.println(" [0] Back to Main Menu");

            int opt = ConsoleInput.readInt("Choose action", 0, 5);
            switch (opt) {
                case 1 -> listAllStudents();
                case 2 -> registerNewStudent();
                case 3 -> searchStudent();
                case 4 -> switchActiveStudent();
                case 5 -> viewStudentProfile();
                case 0 -> back = true;
            }
        }
    }

    private void listAllStudents() {
        List<Student> list = studentService.getAllStudents();
        System.out.println("\n" + AnsiColor.bold("--- Enrolled Students Directory (" + list.size() + ") ---"));
        TablePrinter table = new TablePrinter("ID", "Student Name", "Email", "Department", "Year", "Active?");
        for (Student s : list) {
            String activeMark = (activeStudent != null && activeStudent.getStudentId() == s.getStudentId()) 
                    ? AnsiColor.success("★ ACTIVE") : "";
            table.addRow(s.getStudentId(), s.getStudentName(), s.getEmail(), s.getDepartment(), s.getYearOfStudy(), activeMark);
        }
        table.print();
        ConsoleInput.pause();
    }

    private void registerNewStudent() {
        System.out.println("\n" + AnsiColor.bold("--- Register New Student ---"));
        String name = ConsoleInput.readNonEmptyString("Full Name");
        String email = ConsoleInput.readNonEmptyString("Email Address (e.g. name@campus.edu)");
        String dept = ConsoleInput.readNonEmptyString("Department (e.g. Computer Science, AI, IT)");
        int year = ConsoleInput.readInt("Year of Study (1-5)", 1, 5);

        try {
            Student s = new Student(name, email, dept, year);
            Student saved = studentService.registerStudent(s);
            System.out.println(AnsiColor.success("\n✔ Student registered successfully with ID: " + saved.getStudentId()));
            if (activeStudent == null || ConsoleInput.readConfirm("Set this student as currently active?")) {
                activeStudent = saved;
                System.out.println(AnsiColor.info("Active student set to " + saved.getStudentName()));
            }
        } catch (Exception e) {
            System.out.println(AnsiColor.error("\n✖ Registration failed: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    private void searchStudent() {
        System.out.println("\n" + AnsiColor.bold("--- Find Student ---"));
        System.out.println(" [1] Search by Student ID");
        System.out.println(" [2] Search by Email Address");
        int sub = ConsoleInput.readInt("Search method", 1, 2);

        Optional<Student> studentOpt = Optional.empty();
        if (sub == 1) {
            int id = ConsoleInput.readInt("Enter Student ID");
            studentOpt = studentService.getStudentById(id);
        } else {
            String email = ConsoleInput.readNonEmptyString("Enter Email");
            studentOpt = studentService.getStudentByEmail(email);
        }

        if (studentOpt.isPresent()) {
            Student s = studentOpt.get();
            System.out.println(AnsiColor.success("\nStudent Found:"));
            TablePrinter table = new TablePrinter("Property", "Value");
            table.addRow("Student ID", s.getStudentId());
            table.addRow("Name", s.getStudentName());
            table.addRow("Email", s.getEmail());
            table.addRow("Department", s.getDepartment());
            table.addRow("Year of Study", s.getYearOfStudy());
            table.print();

            if (ConsoleInput.readConfirm("Set as active student?")) {
                activeStudent = s;
                System.out.println(AnsiColor.info("Active student updated."));
            }
        } else {
            System.out.println(AnsiColor.error("No student found with given criteria."));
        }
        ConsoleInput.pause();
    }

    private void switchActiveStudent() {
        System.out.println("\n" + AnsiColor.bold("--- Switch Active Student ---"));
        List<Student> list = studentService.getAllStudents();
        if (list.isEmpty()) {
            System.out.println(AnsiColor.warn("No students registered yet."));
            ConsoleInput.pause();
            return;
        }

        TablePrinter table = new TablePrinter("ID", "Student Name", "Email", "Department");
        for (Student s : list) {
            table.addRow(s.getStudentId(), s.getStudentName(), s.getEmail(), s.getDepartment());
        }
        table.print();

        int id = ConsoleInput.readInt("Enter Student ID to activate");
        Optional<Student> opt = studentService.getStudentById(id);
        if (opt.isPresent()) {
            activeStudent = opt.get();
            System.out.println(AnsiColor.success("✔ Active student set to: " + activeStudent.getStudentName()));
        } else {
            System.out.println(AnsiColor.error("Student ID not found."));
        }
        ConsoleInput.pause();
    }

    private void viewStudentProfile() {
        Student target = selectStudentHelper("View Profile for Student");
        if (target == null) return;

        System.out.println("\n" + AnsiColor.bold("═══ Student Profile: " + target.getStudentName() + " ═══"));
        System.out.println("ID: " + target.getStudentId() + " | Email: " + target.getEmail()
                + " | Department: " + target.getDepartment() + " | Year: " + target.getYearOfStudy());

        // Registrations
        List<CompetitionRegistration> regs = registrationService.getRegistrationsByStudent(target.getStudentId());
        System.out.println("\n" + AnsiColor.info("Registered Competitions (" + regs.size() + "):"));
        if (regs.isEmpty()) {
            System.out.println("  (None)");
        } else {
            TablePrinter regTable = new TablePrinter("Reg ID", "Competition", "Registered Time", "Status");
            for (CompetitionRegistration r : regs) {
                regTable.addRow(r.getRegistrationId(), r.getCompetitionName(),
                        r.getRegistrationTime() != null ? r.getRegistrationTime().format(TIME_FMT) : "-",
                        r.getParticipationStatus());
            }
            regTable.print();
        }

        // Submissions
        List<Submission> subs = submissionService.getSubmissionsByStudent(target.getStudentId());
        int totalScore = subs.stream().mapToInt(Submission::getScore).sum();
        long evaluatedCount = subs.stream().filter(s -> "EVALUATED".equals(s.getEvaluationStatus()) && s.getScore() > 0).count();

        System.out.println("\n" + AnsiColor.info("Submission Performance:"));
        System.out.println("  • Total Submissions: " + subs.size());
        System.out.println("  • Solved / Scored: " + evaluatedCount);
        System.out.println("  • Cumulative Points: " + AnsiColor.bold(String.valueOf(totalScore)));

        if (!subs.isEmpty()) {
            TablePrinter subTable = new TablePrinter("Sub ID", "Competition", "Challenge", "Score", "Max Pts", "Status", "Time");
            for (Submission s : subs) {
                String scoreStr = s.getScore() > 0 ? AnsiColor.success(String.valueOf(s.getScore())) : AnsiColor.error("0");
                subTable.addRow(s.getSubmissionId(), s.getCompetitionName(), s.getChallengeTitle(),
                        scoreStr, s.getMaxPoints(), s.getEvaluationStatus(),
                        s.getSubmissionTime() != null ? s.getSubmissionTime().format(TIME_FMT) : "-");
            }
            subTable.print();
        }

        ConsoleInput.pause();
    }

    // =========================================================================
    // 2. COMPETITIONS & REGISTRATION
    // =========================================================================
    private void competitionMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n" + AnsiColor.bold("═══ 🏆 COMPETITIONS & REGISTRATION PORTAL ═══"));
            System.out.println(" [1] Browse All Competitions (with Summaries)");
            System.out.println(" [2] Filter Competitions (Active, Upcoming, Completed)");
            System.out.println(" [3] View Competition Details & Challenges");
            System.out.println(" [4] Register Student for Competition");
            System.out.println(" [0] Back to Main Menu");

            int opt = ConsoleInput.readInt("Choose action", 0, 4);
            switch (opt) {
                case 1 -> listCompetitionsWithSummaries(null);
                case 2 -> filterCompetitions();
                case 3 -> viewCompetitionDetails();
                case 4 -> registerStudentForCompetition();
                case 0 -> back = true;
            }
        }
    }

    private void listCompetitionsWithSummaries(String statusFilter) {
        List<CompetitionSummary> summaries = competitionService.getAllCompetitionSummaries();
        if (statusFilter != null && !statusFilter.equalsIgnoreCase("ALL")) {
            summaries = summaries.stream()
                    .filter(s -> s.getCompetition().getCompetitionStatus().equalsIgnoreCase(statusFilter))
                    .toList();
        }

        String title = statusFilter == null ? "All Competitions" : statusFilter.toUpperCase() + " Competitions";
        System.out.println("\n" + AnsiColor.bold("--- " + title + " (" + summaries.size() + ") ---"));

        TablePrinter table = new TablePrinter("ID", "Competition Name", "Type", "Status", "Capacity", "Problems", "Total Pts", "Start Time", "End Time");
        for (CompetitionSummary s : summaries) {
            Competition c = s.getCompetition();
            String statusStyled = formatStatus(c.getCompetitionStatus());
            String cap = s.getRegisteredParticipants() + " / " + c.getMaxParticipants();
            table.addRow(
                    c.getCompetitionId(),
                    c.getCompetitionName(),
                    c.getCompetitionType(),
                    statusStyled,
                    cap,
                    s.getTotalChallenges(),
                    s.getTotalPoints(),
                    c.getStartTime() != null ? c.getStartTime().format(TIME_FMT) : "-",
                    c.getEndTime() != null ? c.getEndTime().format(TIME_FMT) : "-"
            );
        }
        table.print();
        ConsoleInput.pause();
    }

    private void filterCompetitions() {
        System.out.println("\n" + AnsiColor.bold("Filter by Status:"));
        System.out.println(" [1] ACTIVE (In-Progress Now)");
        System.out.println(" [2] UPCOMING (Future Events)");
        System.out.println(" [3] COMPLETED (Concluded)");
        int choice = ConsoleInput.readInt("Select filter", 1, 3);
        String status = switch (choice) {
            case 1 -> "ACTIVE";
            case 2 -> "UPCOMING";
            case 3 -> "COMPLETED";
            default -> "ALL";
        };
        listCompetitionsWithSummaries(status);
    }

    private void viewCompetitionDetails() {
        int compId = ConsoleInput.readInt("Enter Competition ID");
        Optional<Competition> opt = competitionService.getCompetitionById(compId);
        if (opt.isEmpty()) {
            System.out.println(AnsiColor.error("Competition ID " + compId + " not found."));
            ConsoleInput.pause();
            return;
        }

        Competition c = opt.get();
        System.out.println("\n" + AnsiColor.bold("══════════════════════════════════════════════════════════════════════════════"));
        System.out.println("  " + AnsiColor.highlight(c.getCompetitionName()) + " [" + formatStatus(c.getCompetitionStatus()) + "]");
        System.out.println("══════════════════════════════════════════════════════════════════════════════");
        System.out.println("Type: " + c.getCompetitionType());
        System.out.println("Description: " + (c.getDescription() != null ? c.getDescription() : "None"));
        System.out.println("Window: " + (c.getStartTime() != null ? c.getStartTime().format(TIME_FMT) : "-")
                + " to " + (c.getEndTime() != null ? c.getEndTime().format(TIME_FMT) : "-"));
        System.out.println("Max Participants: " + c.getMaxParticipants());

        List<Challenge> challenges = challengeService.getChallengesByCompetition(compId);
        System.out.println("\n" + AnsiColor.info("Challenges in this Competition (" + challenges.size() + "):"));
        if (challenges.isEmpty()) {
            System.out.println("  (No challenges assigned yet)");
        } else {
            TablePrinter chTable = new TablePrinter("Ch ID", "Challenge Title", "Points", "Question Preview");
            for (Challenge ch : challenges) {
                String preview = ch.getQuestionDescription() != null
                        ? (ch.getQuestionDescription().length() > 60 ? ch.getQuestionDescription().substring(0, 57) + "..." : ch.getQuestionDescription())
                        : "-";
                chTable.addRow(ch.getChallengeId(), ch.getChallengeTitle(), ch.getPoints(), preview);
            }
            chTable.print();
        }

        List<CompetitionRegistration> regs = registrationService.getRegistrationsByCompetition(compId);
        System.out.println("Total Registered Students: " + regs.size() + " / " + c.getMaxParticipants());

        ConsoleInput.pause();
    }

    private void registerStudentForCompetition() {
        System.out.println("\n" + AnsiColor.bold("--- Register Student for Competition ---"));
        Student student = selectStudentHelper("Select Student to Register");
        if (student == null) return;

        List<Competition> comps = competitionService.getAllCompetitions();
        TablePrinter table = new TablePrinter("ID", "Competition Name", "Status", "Dates");
        for (Competition c : comps) {
            table.addRow(c.getCompetitionId(), c.getCompetitionName(), formatStatus(c.getCompetitionStatus()),
                    (c.getStartTime() != null ? c.getStartTime().format(TIME_FMT) : "-") + " -> " +
                    (c.getEndTime() != null ? c.getEndTime().format(TIME_FMT) : "-"));
        }
        table.print();

        int compId = ConsoleInput.readInt("Enter Competition ID to register for");
        try {
            CompetitionRegistration reg = registrationService.registerStudentForCompetition(compId, student.getStudentId());
            System.out.println(AnsiColor.success("\n✔ Success! " + student.getStudentName() + " is registered for '"
                    + reg.getCompetitionName() + "' (Registration ID: " + reg.getRegistrationId() + ")"));
        } catch (Exception e) {
            System.out.println(AnsiColor.error("\n✖ Registration failed: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    // =========================================================================
    // 3. SOLVE ARENA (CHALLENGE SOLVER)
    // =========================================================================
    private void solveArenaMenu() {
        if (activeStudent == null) {
            System.out.println(AnsiColor.warn("You need to select an Active Student before entering the Solve Arena."));
            switchActiveStudent();
            if (activeStudent == null) return;
        }

        System.out.println("\n" + AnsiColor.bold("═══ 🎯 SOLVE ARENA (PENCIL & CODE SCRATCHPAD) ═══"));
        System.out.println("Logged in as: " + AnsiColor.bold(activeStudent.getStudentName()) + " (ID: " + activeStudent.getStudentId() + ")");

        // Find competitions where student is registered or active competitions
        List<Competition> activeComps = competitionService.getCompetitionsByStatus("ACTIVE");
        if (activeComps.isEmpty()) {
            System.out.println(AnsiColor.warn("\nThere are no ACTIVE competitions right now."));
            System.out.println("Tip: Use [5] Organizer Desk to set a competition status to 'ACTIVE' or browse UPCOMING.");
            ConsoleInput.pause();
            return;
        }

        TablePrinter compTable = new TablePrinter("ID", "Competition Name", "Type", "Status", "End Time", "Registered?");
        for (Competition c : activeComps) {
            boolean isReg = registrationService.isStudentRegistered(c.getCompetitionId(), activeStudent.getStudentId());
            String regStatus = isReg ? AnsiColor.success("✔ YES") : AnsiColor.warn("NO (Must register)");
            compTable.addRow(c.getCompetitionId(), c.getCompetitionName(), c.getCompetitionType(),
                    formatStatus(c.getCompetitionStatus()),
                    c.getEndTime() != null ? c.getEndTime().format(TIME_FMT) : "-",
                    regStatus);
        }
        compTable.print();

        int compId = ConsoleInput.readInt("Enter Competition ID to enter arena (or 0 to cancel)", 0, Integer.MAX_VALUE);
        if (compId == 0) return;

        Optional<Competition> compOpt = competitionService.getCompetitionById(compId);
        if (compOpt.isEmpty()) {
            System.out.println(AnsiColor.error("Competition not found."));
            ConsoleInput.pause();
            return;
        }
        Competition comp = compOpt.get();

        // Check if student registered; offer to register if not
        if (!registrationService.isStudentRegistered(compId, activeStudent.getStudentId())) {
            System.out.println(AnsiColor.warn("You are not registered for '" + comp.getCompetitionName() + "'."));
            if (ConsoleInput.readConfirm("Register now and enter arena?")) {
                try {
                    registrationService.registerStudentForCompetition(compId, activeStudent.getStudentId());
                    System.out.println(AnsiColor.success("✔ Successfully registered! Welcome to the Arena."));
                } catch (Exception e) {
                    System.out.println(AnsiColor.error("Registration failed: " + e.getMessage()));
                    ConsoleInput.pause();
                    return;
                }
            } else {
                return;
            }
        }

        arenaInteractionLoop(comp);
    }

    private void arenaInteractionLoop(Competition comp) {
        boolean inside = true;
        while (inside) {
            List<Challenge> challenges = challengeService.getChallengesByCompetition(comp.getCompetitionId());
            List<Submission> studentSubs = submissionService.getSubmissionsByStudentAndCompetition(activeStudent.getStudentId(), comp.getCompetitionId());

            System.out.println("\n" + AnsiColor.bold("═══ ARENA: " + comp.getCompetitionName() + " ═══"));
            System.out.println("Student: " + activeStudent.getStudentName() + " | Challenges: " + challenges.size());

            if (challenges.isEmpty()) {
                System.out.println(AnsiColor.warn("No challenges available in this competition yet."));
                ConsoleInput.pause();
                return;
            }

            TablePrinter chTable = new TablePrinter("Ch ID", "Challenge Title", "Points", "Your Status", "Score");
            for (Challenge ch : challenges) {
                Optional<Submission> bestSub = studentSubs.stream()
                        .filter(s -> s.getChallengeId() == ch.getChallengeId())
                        .max(Comparator.comparingInt(Submission::getScore));

                String status;
                String score;
                if (bestSub.isPresent()) {
                    Submission s = bestSub.get();
                    if (s.getScore() > 0) {
                        status = AnsiColor.success("✔ SOLVED");
                        score = AnsiColor.success(s.getScore() + " / " + ch.getPoints());
                    } else {
                        status = AnsiColor.warn("✖ ATTEMPTED");
                        score = AnsiColor.error("0 / " + ch.getPoints());
                    }
                } else {
                    status = AnsiColor.info("⚪ UNATTEMPTED");
                    score = "-";
                }

                chTable.addRow(ch.getChallengeId(), ch.getChallengeTitle(), ch.getPoints(), status, score);
            }
            chTable.print();

            System.out.println("\nActions:");
            System.out.println(" [1] Solve / Submit Answer for a Challenge");
            System.out.println(" [2] View My Submissions History for this Arena");
            System.out.println(" [3] View Arena Live Standings");
            System.out.println(" [0] Leave Arena");

            int act = ConsoleInput.readInt("Choose action", 0, 3);
            switch (act) {
                case 1 -> submitChallengeAnswer(comp, challenges);
                case 2 -> viewArenaSubmissions(comp.getCompetitionId());
                case 3 -> showCompetitionLeaderboard(comp.getCompetitionId());
                case 0 -> inside = false;
            }
        }
    }

    private void submitChallengeAnswer(Competition comp, List<Challenge> challenges) {
        int chId = ConsoleInput.readInt("Enter Challenge ID to solve");
        Optional<Challenge> chOpt = challenges.stream().filter(c -> c.getChallengeId() == chId).findFirst();
        if (chOpt.isEmpty()) {
            System.out.println(AnsiColor.error("Invalid Challenge ID for this competition."));
            ConsoleInput.pause();
            return;
        }

        Challenge ch = chOpt.get();
        System.out.println("\n" + AnsiColor.bold("--------------------------------------------------------------------------------"));
        System.out.println("  " + AnsiColor.highlight(ch.getChallengeTitle()) + " (" + ch.getPoints() + " Points)");
        System.out.println("--------------------------------------------------------------------------------");
        System.out.println(AnsiColor.bold("QUESTION:"));
        System.out.println(ch.getQuestionDescription());
        System.out.println("--------------------------------------------------------------------------------");

        String answer = ConsoleInput.readNonEmptyString("Your Solution / Answer");

        try {
            Submission sub = submissionService.submitAnswer(ch.getChallengeId(), activeStudent.getStudentId(), answer);
            System.out.println("\nEvaluating submission in database...");
            Thread.sleep(300);

            if (sub.getScore() > 0) {
                System.out.println(AnsiColor.success("""
                ╔═══════════════════════════════════════════════════════════╗
                ║  🎉 CORRECT ANSWER! CONGRATULATIONS!                     ║
                ║  Points Awarded: +""" + String.format("%-40s", sub.getScore()) + """
                ║  Submission recorded successfully.                        ║
                ╚═══════════════════════════════════════════════════════════╝"""));
            } else {
                System.out.println(AnsiColor.warn("""
                ╔═══════════════════════════════════════════════════════════╗
                ║  ❌ INCORRECT ANSWER                                      ║
                ║  Score: 0                                                 ║
                ║  Don't give up! Review the problem and try again.         ║
                ╚═══════════════════════════════════════════════════════════╝"""));
            }
        } catch (Exception e) {
            System.out.println(AnsiColor.error("\nSubmission error: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    private void viewArenaSubmissions(int compId) {
        List<Submission> subs = submissionService.getSubmissionsByStudentAndCompetition(activeStudent.getStudentId(), compId);
        System.out.println("\n" + AnsiColor.bold("--- Your Submissions for this Competition (" + subs.size() + ") ---"));
        if (subs.isEmpty()) {
            System.out.println("  (No submissions yet)");
        } else {
            TablePrinter table = new TablePrinter("Sub ID", "Challenge", "Your Answer", "Score", "Status", "Timestamp");
            for (Submission s : subs) {
                String scoreStr = s.getScore() > 0 ? AnsiColor.success(String.valueOf(s.getScore())) : AnsiColor.error("0");
                table.addRow(s.getSubmissionId(), s.getChallengeTitle(), s.getSubmittedAnswer(),
                        scoreStr, s.getEvaluationStatus(),
                        s.getSubmissionTime() != null ? s.getSubmissionTime().format(TIME_FMT) : "-");
            }
            table.print();
        }
        ConsoleInput.pause();
    }

    // =========================================================================
    // 4. LEADERBOARDS & RANKINGS
    // =========================================================================
    private void leaderboardMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n" + AnsiColor.bold("═══ 📊 LEADERBOARDS & SCOREBOARDS ═══"));
            System.out.println(" [1] Live Competition Leaderboard");
            System.out.println(" [2] Global Campus Hall of Fame (Cumulative)");
            System.out.println(" [0] Back to Main Menu");

            int opt = ConsoleInput.readInt("Choose action", 0, 2);
            switch (opt) {
                case 1 -> {
                    int compId = ConsoleInput.readInt("Enter Competition ID");
                    showCompetitionLeaderboard(compId);
                }
                case 2 -> showGlobalLeaderboard();
                case 0 -> back = true;
            }
        }
    }

    private void showCompetitionLeaderboard(int compId) {
        try {
            Map<String, Object> data = leaderboardService.getLiveLeaderboardForCompetition(compId);
            Competition comp = (Competition) data.get("competition");
            @SuppressWarnings("unchecked")
            List<LeaderboardEntry> list = (List<LeaderboardEntry>) data.get("leaderboard");

            System.out.println("\n" + AnsiColor.bold("══════════════════════════════════════════════════════════════════════════════"));
            System.out.println("  LEADERBOARD: " + AnsiColor.highlight(comp.getCompetitionName()) + " [" + formatStatus(comp.getCompetitionStatus()) + "]");
            System.out.println("══════════════════════════════════════════════════════════════════════════════");

            if (list == null || list.isEmpty()) {
                System.out.println("  (No participants on the scoreboard yet)");
            } else {
                TablePrinter table = new TablePrinter("Rank", "Student Name", "Department", "Yr", "Score", "Solved", "Last Submission");
                for (LeaderboardEntry e : list) {
                    String medal = getMedal(e.getRank());
                    table.addRow(medal, e.getStudentName(), e.getDepartment(), e.getYearOfStudy(),
                            AnsiColor.bold(String.valueOf(e.getTotalScore())),
                            e.getChallengesSolved(),
                            e.getLastSubmissionTime() != null ? e.getLastSubmissionTime().format(TIME_FMT) : "-");
                }
                table.print();
            }
        } catch (Exception e) {
            System.out.println(AnsiColor.error("Failed to load leaderboard: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    private void showGlobalLeaderboard() {
        List<LeaderboardEntry> list = leaderboardService.getGlobalLeaderboard();
        System.out.println("\n" + AnsiColor.bold("══════════════════════════════════════════════════════════════════════════════"));
        System.out.println("  🌟 GLOBAL CAMPUS HALL OF FAME (CUMULATIVE PERFORMANCE)");
        System.out.println("══════════════════════════════════════════════════════════════════════════════");

        if (list.isEmpty()) {
            System.out.println("  (No submissions recorded across the campus yet)");
        } else {
            TablePrinter table = new TablePrinter("Rank", "Student Name", "Email", "Department", "Yr", "Total Points", "Total Solved");
            for (LeaderboardEntry e : list) {
                String medal = getMedal(e.getRank());
                table.addRow(medal, e.getStudentName(), e.getEmail(), e.getDepartment(), e.getYearOfStudy(),
                        AnsiColor.bold(String.valueOf(e.getTotalScore())),
                        e.getChallengesSolved());
            }
            table.print();
        }
        ConsoleInput.pause();
    }

    private String getMedal(int rank) {
        return switch (rank) {
            case 1 -> "🥇 1st";
            case 2 -> "🥈 2nd";
            case 3 -> "🥉 3rd";
            default -> "#" + rank;
        };
    }

    // =========================================================================
    // 5. ORGANIZER & FACULTY DESK
    // =========================================================================
    private void organizerMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n" + AnsiColor.bold("═══ 🛠️ ORGANIZER & FACULTY STUDIO ═══"));
            System.out.println(" [1] Create New Competition");
            System.out.println(" [2] Add Challenge to Competition");
            System.out.println(" [3] Change Competition Status (UPCOMING / ACTIVE / COMPLETED)");
            System.out.println(" [4] View All Registrations for Competition");
            System.out.println(" [5] Review Submissions & Manual Grade Override");
            System.out.println(" [0] Back to Main Menu");

            int opt = ConsoleInput.readInt("Choose action", 0, 5);
            switch (opt) {
                case 1 -> createCompetition();
                case 2 -> addChallengeToCompetition();
                case 3 -> updateCompetitionStatus();
                case 4 -> viewRegistrationsByCompetition();
                case 5 -> gradeSubmissionsManual();
                case 0 -> back = true;
            }
        }
    }

    private void createCompetition() {
        System.out.println("\n" + AnsiColor.bold("--- Draft New Competition ---"));
        String name = ConsoleInput.readNonEmptyString("Competition Name");

        System.out.println("Select Competition Type:");
        System.out.println(" [1] Coding Contest");
        System.out.println(" [2] Technical Challenge");
        System.out.println(" [3] Quiz");
        System.out.println(" [4] Hackathon");
        int typeChoice = ConsoleInput.readInt("Type", 1, 4);
        String type = switch (typeChoice) {
            case 1 -> "Coding Contest";
            case 2 -> "Technical Challenge";
            case 3 -> "Quiz";
            case 4 -> "Hackathon";
            default -> "Coding Contest";
        };

        String desc = ConsoleInput.readString("Description / Rules", "Inter-departmental competition");
        LocalDateTime start = ConsoleInput.readDateTime("Start Time", LocalDateTime.now());
        LocalDateTime end = ConsoleInput.readDateTime("End Time", LocalDateTime.now().plusHours(3));
        int maxPart = ConsoleInput.readInt("Max Participants limit", 100);

        try {
            Competition comp = new Competition();
            comp.setCompetitionName(name);
            comp.setCompetitionType(type);
            comp.setDescription(desc);
            comp.setStartTime(start);
            comp.setEndTime(end);
            comp.setMaxParticipants(maxPart);

            Competition created = competitionService.createCompetition(comp);
            System.out.println(AnsiColor.success("\n✔ Competition created successfully! ID: " + created.getCompetitionId()
                    + " [Status: " + created.getCompetitionStatus() + "]"));
        } catch (Exception e) {
            System.out.println(AnsiColor.error("\n✖ Failed to create competition: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    private void addChallengeToCompetition() {
        System.out.println("\n" + AnsiColor.bold("--- Add Challenge to Competition ---"));
        int compId = ConsoleInput.readInt("Associated Competition ID");
        Optional<Competition> compOpt = competitionService.getCompetitionById(compId);
        if (compOpt.isEmpty()) {
            System.out.println(AnsiColor.error("Competition ID " + compId + " not found."));
            ConsoleInput.pause();
            return;
        }

        System.out.println(AnsiColor.info("Adding challenge to: " + compOpt.get().getCompetitionName()));
        String title = ConsoleInput.readNonEmptyString("Challenge Title");
        String desc = ConsoleInput.readNonEmptyString("Full Question Description / Problem Statement");
        int points = ConsoleInput.readInt("Points / Score Award", 20);
        String answer = ConsoleInput.readNonEmptyString("Correct Answer (evaluated case-insensitively)");

        try {
            Challenge challenge = new Challenge(compId, title, desc, points, answer);
            Challenge saved = challengeService.addChallenge(challenge);
            System.out.println(AnsiColor.success("\n✔ Challenge attached successfully! ID: " + saved.getChallengeId()));
        } catch (Exception e) {
            System.out.println(AnsiColor.error("\n✖ Failed to add challenge: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    private void updateCompetitionStatus() {
        System.out.println("\n" + AnsiColor.bold("--- Update Competition Status ---"));
        int compId = ConsoleInput.readInt("Competition ID");
        Optional<Competition> compOpt = competitionService.getCompetitionById(compId);
        if (compOpt.isEmpty()) {
            System.out.println(AnsiColor.error("Competition ID not found."));
            ConsoleInput.pause();
            return;
        }

        Competition c = compOpt.get();
        System.out.println("Current status of '" + c.getCompetitionName() + "' is: " + formatStatus(c.getCompetitionStatus()));
        System.out.println("Select New Status:");
        System.out.println(" [1] UPCOMING");
        System.out.println(" [2] ACTIVE");
        System.out.println(" [3] COMPLETED");

        int choice = ConsoleInput.readInt("New Status", 1, 3);
        String newStatus = switch (choice) {
            case 1 -> "UPCOMING";
            case 2 -> "ACTIVE";
            case 3 -> "COMPLETED";
            default -> "ACTIVE";
        };

        boolean ok = competitionService.updateStatus(compId, newStatus);
        if (ok) {
            System.out.println(AnsiColor.success("✔ Status updated to " + newStatus));
        } else {
            System.out.println(AnsiColor.error("✖ Update failed."));
        }
        ConsoleInput.pause();
    }

    private void viewRegistrationsByCompetition() {
        int compId = ConsoleInput.readInt("Competition ID");
        List<CompetitionRegistration> regs = registrationService.getRegistrationsByCompetition(compId);
        System.out.println("\n" + AnsiColor.bold("--- Registered Participants (" + regs.size() + ") ---"));
        if (regs.isEmpty()) {
            System.out.println("  (No students registered yet)");
        } else {
            TablePrinter table = new TablePrinter("Reg ID", "Student Name", "Email", "Reg Time", "Participation Status");
            for (CompetitionRegistration r : regs) {
                table.addRow(r.getRegistrationId(), r.getStudentName(), r.getStudentEmail(),
                        r.getRegistrationTime() != null ? r.getRegistrationTime().format(TIME_FMT) : "-",
                        r.getParticipationStatus());
            }
            table.print();
        }
        ConsoleInput.pause();
    }

    private void gradeSubmissionsManual() {
        System.out.println("\n" + AnsiColor.bold("--- Review & Grade Submissions ---"));
        int compId = ConsoleInput.readInt("Competition ID");
        List<Submission> subs = submissionService.getSubmissionsByCompetition(compId);

        if (subs.isEmpty()) {
            System.out.println(AnsiColor.warn("No submissions recorded for this competition."));
            ConsoleInput.pause();
            return;
        }

        TablePrinter table = new TablePrinter("Sub ID", "Student ID", "Challenge ID", "Answer", "Score", "Max Pts", "Status");
        for (Submission s : subs) {
            table.addRow(s.getSubmissionId(), s.getStudentId(), s.getChallengeId(),
                    s.getSubmittedAnswer(), s.getScore(), s.getMaxPoints(), s.getEvaluationStatus());
        }
        table.print();

        if (ConsoleInput.readConfirm("Do you wish to manually override a submission score?")) {
            int subId = ConsoleInput.readInt("Enter Submission ID");
            int newScore = ConsoleInput.readInt("Enter New Score");
            String status = ConsoleInput.readString("Status (EVALUATED / PENDING / REJECTED)", "EVALUATED");

            try {
                boolean ok = submissionService.evaluateSubmissionManual(subId, newScore, status);
                if (ok) {
                    System.out.println(AnsiColor.success("✔ Submission updated successfully."));
                } else {
                    System.out.println(AnsiColor.error("Failed to update submission."));
                }
            } catch (Exception e) {
                System.out.println(AnsiColor.error("Error: " + e.getMessage()));
            }
        }
        ConsoleInput.pause();
    }

    // =========================================================================
    // 6. COMPETITION HISTORY & ARCHIVES
    // =========================================================================
    private void historyMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n" + AnsiColor.bold("═══ 📜 HALL OF FAME & PAST SEASONS ═══"));
            System.out.println(" [1] View Completed Competitions Archive");
            System.out.println(" [2] View Champions Podium for a Past Event");
            System.out.println(" [3] Full Historical Competition Dossier");
            System.out.println(" [0] Back to Main Menu");

            int opt = ConsoleInput.readInt("Choose action", 0, 3);
            switch (opt) {
                case 1 -> viewCompletedArchive();
                case 2 -> viewChampionsPodium();
                case 3 -> viewCompetitionDossier();
                case 0 -> back = true;
            }
        }
    }

    private void viewCompletedArchive() {
        List<Map<String, Object>> list = historyService.getCompletedCompetitionsHistory();
        System.out.println("\n" + AnsiColor.bold("--- Completed Seasons & Tournaments (" + list.size() + ") ---"));
        if (list.isEmpty()) {
            System.out.println("  (No competitions marked as COMPLETED yet)");
        } else {
            TablePrinter table = new TablePrinter("Comp ID", "Competition Name", "Winner (1st)", "Runner Up (2nd)", "Submissions");
            for (Map<String, Object> record : list) {
                Competition comp = (Competition) record.get("competition");
                LeaderboardEntry w = (LeaderboardEntry) record.get("winner");
                LeaderboardEntry r = (LeaderboardEntry) record.get("runnerUp");
                int totalSubs = (int) record.get("totalSubmissions");

                String winnerStr = w != null ? "🥇 " + w.getStudentName() + " (" + w.getTotalScore() + " pts)" : "-";
                String runnerStr = r != null ? "🥈 " + r.getStudentName() + " (" + r.getTotalScore() + " pts)" : "-";

                table.addRow(comp.getCompetitionId(), comp.getCompetitionName(), winnerStr, runnerStr, totalSubs);
            }
            table.print();
        }
        ConsoleInput.pause();
    }

    private void viewChampionsPodium() {
        int compId = ConsoleInput.readInt("Enter Completed Competition ID");
        try {
            Map<String, Object> dossier = historyService.getCompetitionDossier(compId);
            Competition comp = (Competition) dossier.get("competition");
            @SuppressWarnings("unchecked")
            List<LeaderboardEntry> standings = (List<LeaderboardEntry>) dossier.get("finalStandings");

            System.out.println("\n" + AnsiColor.bold("══════════════════════════════════════════════════════════════════════════════"));
            System.out.println("  🏆 CHAMPIONS PODIUM: " + comp.getCompetitionName());
            System.out.println("══════════════════════════════════════════════════════════════════════════════");

            if (standings.isEmpty()) {
                System.out.println("  (No participants recorded for this event)");
            } else {
                if (standings.size() >= 1) {
                    LeaderboardEntry p1 = standings.get(0);
                    System.out.println(AnsiColor.BRIGHT_YELLOW + """
                           _______
                          |  #1   |  🥇 CHAMPION
                          |_______|  """ + p1.getStudentName() + " (" + p1.getDepartment() + ")\n"
                          + "                     Score: " + p1.getTotalScore() + " | Solved: " + p1.getChallengesSolved() + AnsiColor.RESET);
                }
                if (standings.size() >= 2) {
                    LeaderboardEntry p2 = standings.get(1);
                    System.out.println(AnsiColor.WHITE + """
                           _______
                          |  #2   |  🥈 1ST RUNNER UP
                          |_______|  """ + p2.getStudentName() + " (" + p2.getDepartment() + ")\n"
                          + "                     Score: " + p2.getTotalScore() + " | Solved: " + p2.getChallengesSolved() + AnsiColor.RESET);
                }
                if (standings.size() >= 3) {
                    LeaderboardEntry p3 = standings.get(2);
                    System.out.println(AnsiColor.BRIGHT_MAGENTA + """
                           _______
                          |  #3   |  🥉 2ND RUNNER UP
                          |_______|  """ + p3.getStudentName() + " (" + p3.getDepartment() + ")\n"
                          + "                     Score: " + p3.getTotalScore() + " | Solved: " + p3.getChallengesSolved() + AnsiColor.RESET);
                }
            }
        } catch (Exception e) {
            System.out.println(AnsiColor.error("Failed to load podium: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    private void viewCompetitionDossier() {
        int compId = ConsoleInput.readInt("Enter Competition ID");
        try {
            Map<String, Object> dossier = historyService.getCompetitionDossier(compId);
            Competition comp = (Competition) dossier.get("competition");
            @SuppressWarnings("unchecked")
            List<LeaderboardEntry> standings = (List<LeaderboardEntry>) dossier.get("finalStandings");
            @SuppressWarnings("unchecked")
            List<Submission> subs = (List<Submission>) dossier.get("submissions");

            System.out.println("\n" + AnsiColor.bold("═══ COMPETITION DOSSIER: " + comp.getCompetitionName() + " ═══"));
            System.out.println("Status: " + comp.getCompetitionStatus() + " | Type: " + comp.getCompetitionType());
            System.out.println("Total Submissions: " + subs.size() + " | Total Ranked Participants: " + standings.size());

            TablePrinter table = new TablePrinter("Rank", "Participant", "Department", "Score", "Challenges Solved");
            for (LeaderboardEntry e : standings) {
                table.addRow(getMedal(e.getRank()), e.getStudentName(), e.getDepartment(), e.getTotalScore(), e.getChallengesSolved());
            }
            table.print();
        } catch (Exception e) {
            System.out.println(AnsiColor.error("Error: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    // =========================================================================
    // 7. SYSTEM & DATABASE TOOLS
    // =========================================================================
    private void systemMenu() {
        boolean back = false;
        while (!back) {
            System.out.println("\n" + AnsiColor.bold("═══ ⚙️ SYSTEM & DATABASE ADMINISTRATION ═══"));
            System.out.println(" [1] System Health & Database Statistics");
            System.out.println(" [2] Reset & Re-seed Initial Demonstration Data");
            System.out.println(" [3] Run Schema Verification");
            System.out.println(" [0] Back to Main Menu");

            int opt = ConsoleInput.readInt("Choose action", 0, 3);
            switch (opt) {
                case 1 -> showSystemStats();
                case 2 -> resetDemoData();
                case 3 -> verifySchema();
                case 0 -> back = true;
            }
        }
    }

    private void showSystemStats() {
        System.out.println("\n" + AnsiColor.bold("--- Database Metrics & Counts ---"));
        TablePrinter table = new TablePrinter("Table / Entity", "Total Records", "Health Status");
        table.addRow("STUDENTS", studentService.getAllStudents().size(), AnsiColor.success("HEALTHY"));
        table.addRow("COMPETITIONS", competitionService.getAllCompetitions().size(), AnsiColor.success("HEALTHY"));
        table.addRow("CHALLENGES", "(Associated per comp)", AnsiColor.success("HEALTHY"));
        table.addRow("LEADERBOARD", leaderboardService.getGlobalLeaderboard().size() + " Ranked", AnsiColor.success("HEALTHY"));
        table.print();
        ConsoleInput.pause();
    }

    private void resetDemoData() {
        System.out.println(AnsiColor.warn("\n⚠️ WARNING: This will truncate all tables and restore initial demo data!"));
        if (ConsoleInput.readConfirm("Are you sure you want to reset and re-seed?")) {
            try {
                databaseInitService.resetAndSeed();
                List<Student> list = studentService.getAllStudents();
                if (!list.isEmpty()) {
                    activeStudent = list.get(0);
                }
                System.out.println(AnsiColor.success("✔ Database successfully reset and re-seeded with demo records."));
            } catch (Exception e) {
                System.out.println(AnsiColor.error("✖ Reset failed: " + e.getMessage()));
            }
        }
        ConsoleInput.pause();
    }

    private void verifySchema() {
        try {
            databaseInitService.initSchema();
            System.out.println(AnsiColor.success("✔ All MySQL tables verified and intact."));
        } catch (Exception e) {
            System.out.println(AnsiColor.error("Schema check failed: " + e.getMessage()));
        }
        ConsoleInput.pause();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================
    private Student selectStudentHelper(String header) {
        if (activeStudent != null) {
            System.out.println("Current active student is: " + AnsiColor.bold(activeStudent.getStudentName())
                    + " [ID: " + activeStudent.getStudentId() + "]");
            if (ConsoleInput.readConfirm("Use this student?")) {
                return activeStudent;
            }
        }

        List<Student> list = studentService.getAllStudents();
        if (list.isEmpty()) {
            System.out.println(AnsiColor.warn("No students registered."));
            return null;
        }

        TablePrinter table = new TablePrinter("ID", "Student Name", "Email");
        for (Student s : list) {
            table.addRow(s.getStudentId(), s.getStudentName(), s.getEmail());
        }
        table.print();

        int id = ConsoleInput.readInt("Enter Student ID");
        Optional<Student> opt = studentService.getStudentById(id);
        if (opt.isPresent()) {
            return opt.get();
        } else {
            System.out.println(AnsiColor.error("Student not found."));
            return null;
        }
    }

    private String formatStatus(String status) {
        if (status == null) return "-";
        return switch (status.toUpperCase()) {
            case "ACTIVE" -> AnsiColor.success("🟢 ACTIVE");
            case "UPCOMING" -> AnsiColor.info("🔵 UPCOMING");
            case "COMPLETED" -> AnsiColor.DIM + "⚪ COMPLETED" + AnsiColor.RESET;
            default -> status;
        };
    }

    private void printExitMessage() {
        System.out.println(AnsiColor.BRIGHT_GREEN + """
        ═══════════════════════════════════════════════════════════
          Thank you for using Campus Challenge Arena Console!
          Good luck on your competitive coding journey! 👋
        ═══════════════════════════════════════════════════════════
        """ + AnsiColor.RESET);
    }
}
