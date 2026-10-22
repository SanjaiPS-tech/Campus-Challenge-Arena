package com.example.DBMS_MiniProject_.Campus_Challenge_Arena.console;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class TablePrinter {

    private final List<String> headers;
    private final List<List<String>> rows = new ArrayList<>();
    private final List<Integer> colWidths = new ArrayList<>();

    public TablePrinter(String... headers) {
        this.headers = Arrays.asList(headers);
        for (String h : headers) {
            colWidths.add(visibleLength(h));
        }
    }

    public TablePrinter addRow(Object... values) {
        List<String> row = new ArrayList<>();
        for (int i = 0; i < values.length; i++) {
            String val = values[i] == null ? "-" : String.valueOf(values[i]);
            row.add(val);
            int len = visibleLength(val);
            if (i < colWidths.size()) {
                if (len > colWidths.get(i)) {
                    colWidths.set(i, len);
                }
            } else {
                colWidths.add(len);
            }
        }
        rows.add(row);
        return this;
    }

    public void print() {
        if (headers.isEmpty()) return;

        // Top border
        printDivider("┌", "┬", "┐");

        // Header row
        StringBuilder sb = new StringBuilder("│");
        for (int i = 0; i < headers.size(); i++) {
            String h = headers.get(i);
            int w = colWidths.get(i);
            sb.append(" ").append(AnsiColor.BOLD).append(padRight(h, w)).append(AnsiColor.RESET).append(" │");
        }
        System.out.println(sb);

        // Header separator
        printDivider("├", "┼", "┤");

        // Rows
        if (rows.isEmpty()) {
            int totalWidth = colWidths.stream().mapToInt(w -> w + 3).sum() - 1;
            String emptyMsg = "No records found";
            System.out.println("│ " + padCenter(emptyMsg, totalWidth) + " │");
        } else {
            for (List<String> row : rows) {
                StringBuilder rowSb = new StringBuilder("│");
                for (int i = 0; i < headers.size(); i++) {
                    String val = i < row.size() ? row.get(i) : "-";
                    int w = colWidths.get(i);
                    rowSb.append(" ").append(padRightWithAnsi(val, w)).append(" │");
                }
                System.out.println(rowSb);
            }
        }

        // Bottom border
        printDivider("└", "┴", "┘");
    }

    private void printDivider(String left, String mid, String right) {
        StringBuilder sb = new StringBuilder(left);
        for (int i = 0; i < headers.size(); i++) {
            int w = colWidths.get(i) + 2;
            sb.append("─".repeat(w));
            if (i < headers.size() - 1) {
                sb.append(mid);
            }
        }
        sb.append(right);
        System.out.println(sb);
    }

    private static String padRight(String text, int width) {
        int diff = width - text.length();
        if (diff <= 0) return text;
        return text + " ".repeat(diff);
    }

    private static String padRightWithAnsi(String text, int width) {
        int vLen = visibleLength(text);
        int diff = width - vLen;
        if (diff <= 0) return text;
        return text + " ".repeat(diff);
    }

    private static String padCenter(String text, int width) {
        int diff = width - visibleLength(text);
        if (diff <= 0) return text;
        int left = diff / 2;
        int right = diff - left;
        return " ".repeat(left) + text + " ".repeat(right);
    }

    public static int visibleLength(String s) {
        if (s == null) return 0;
        return s.replaceAll("\u001B\\[[;\\d]*m", "").length();
    }
}
