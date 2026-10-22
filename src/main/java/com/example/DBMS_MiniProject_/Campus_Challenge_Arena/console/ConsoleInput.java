package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.console;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Scanner;

public class ConsoleInput {

    private static final Scanner scanner = new Scanner(System.in);
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public static String readString(String prompt) {
        System.out.print(AnsiColor.info("➤ ") + prompt + ": ");
        return scanner.nextLine().trim();
    }

    public static String readString(String prompt, String defaultValue) {
        System.out.print(AnsiColor.info("➤ ") + prompt + " [" + AnsiColor.warn(defaultValue) + "]: ");
        String line = scanner.nextLine().trim();
        return line.isEmpty() ? defaultValue : line;
    }

    public static String readNonEmptyString(String prompt) {
        while (true) {
            String val = readString(prompt);
            if (!val.isEmpty()) {
                return val;
            }
            System.out.println(AnsiColor.error("Input cannot be empty. Please try again."));
        }
    }

    public static int readInt(String prompt) {
        while (true) {
            String input = readString(prompt);
            try {
                return Integer.parseInt(input);
            } catch (NumberFormatException e) {
                System.out.println(AnsiColor.error("Invalid number. Please enter a valid integer."));
            }
        }
    }

    public static int readInt(String prompt, int min, int max) {
        while (true) {
            int val = readInt(prompt);
            if (val >= min && val <= max) {
                return val;
            }
            System.out.println(AnsiColor.error("Please enter a value between " + min + " and " + max + "."));
        }
    }

    public static int readInt(String prompt, int defaultValue) {
        while (true) {
            System.out.print(AnsiColor.info("➤ ") + prompt + " [" + AnsiColor.warn(String.valueOf(defaultValue)) + "]: ");
            String line = scanner.nextLine().trim();
            if (line.isEmpty()) {
                return defaultValue;
            }
            try {
                return Integer.parseInt(line);
            } catch (NumberFormatException e) {
                System.out.println(AnsiColor.error("Invalid number. Please enter a valid integer."));
            }
        }
    }

    public static LocalDateTime readDateTime(String prompt, LocalDateTime defaultVal) {
        String defaultStr = defaultVal != null ? defaultVal.format(DATE_TIME_FORMATTER) : "now";
        while (true) {
            System.out.print(AnsiColor.info("➤ ") + prompt + " (YYYY-MM-DD HH:MM) [" + AnsiColor.warn(defaultStr) + "]: ");
            String line = scanner.nextLine().trim();
            if (line.isEmpty()) {
                return defaultVal != null ? defaultVal : LocalDateTime.now();
            }
            try {
                return LocalDateTime.parse(line, DATE_TIME_FORMATTER);
            } catch (DateTimeParseException e) {
                System.out.println(AnsiColor.error("Invalid date format. Use YYYY-MM-DD HH:MM (e.g. 2026-10-25 14:00)"));
            }
        }
    }

    public static boolean readConfirm(String prompt) {
        System.out.print(AnsiColor.warn("❓ ") + prompt + " (y/N): ");
        String line = scanner.nextLine().trim().toLowerCase();
        return line.equals("y") || line.equals("yes");
    }

    public static void pause() {
        System.out.print(AnsiColor.DIM + "\nPress Enter to return to menu..." + AnsiColor.RESET);
        try {
            scanner.nextLine();
        } catch (Exception ignored) {}
    }
}
