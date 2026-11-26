package com.smoothroute.logic;

/** How rough a bump is. The score lets us average several reports of the same spot. */
public enum Severity {
    MINOR(1), MODERATE(2), SEVERE(3);

    private final int score;

    Severity(int score) {
        this.score = score;
    }

    public int getScore() {
        return score;
    }

    /** Turns an average score (between 1 and 3) back into a label. */
    public static Severity fromAverage(double average) {
        if (average >= 2.5) return SEVERE;
        if (average >= 1.5) return MODERATE;
        return MINOR;
    }

    public String label() {
        return name().toLowerCase();
    }
}
