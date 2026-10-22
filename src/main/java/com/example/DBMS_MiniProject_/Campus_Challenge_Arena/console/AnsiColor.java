package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.console;

public class AnsiColor {
    public static final String RESET = "\u001B[0m";
    public static final String BOLD = "\u001B[1m";
    public static final String DIM = "\u001B[2m";
    public static final String UNDERLINE = "\u001B[4m";

    public static final String BLACK = "\u001B[30m";
    public static final String RED = "\u001B[31m";
    public static final String GREEN = "\u001B[32m";
    public static final String YELLOW = "\u001B[33m";
    public static final String BLUE = "\u001B[34m";
    public static final String MAGENTA = "\u001B[35m";
    public static final String CYAN = "\u001B[36m";
    public static final String WHITE = "\u001B[37m";

    public static final String BRIGHT_RED = "\u001B[91m";
    public static final String BRIGHT_GREEN = "\u001B[92m";
    public static final String BRIGHT_YELLOW = "\u001B[93m";
    public static final String BRIGHT_BLUE = "\u001B[94m";
    public static final String BRIGHT_MAGENTA = "\u001B[95m";
    public static final String BRIGHT_CYAN = "\u001B[96m";
    public static final String BRIGHT_WHITE = "\u001B[97m";

    public static final String BG_BLUE = "\u001B[44m";
    public static final String BG_GREEN = "\u001B[42m";
    public static final String BG_MAGENTA = "\u001B[45m";
    public static final String BG_CYAN = "\u001B[46m";
    public static final String BG_DARK = "\u001B[100m";

    public static String color(String text, String colorCode) {
        return colorCode + text + RESET;
    }

    public static String bold(String text) {
        return BOLD + text + RESET;
    }

    public static String success(String text) {
        return BRIGHT_GREEN + text + RESET;
    }

    public static String error(String text) {
        return BRIGHT_RED + text + RESET;
    }

    public static String warn(String text) {
        return BRIGHT_YELLOW + text + RESET;
    }

    public static String info(String text) {
        return BRIGHT_CYAN + text + RESET;
    }

    public static String highlight(String text) {
        return BRIGHT_WHITE + BOLD + text + RESET;
    }
}
