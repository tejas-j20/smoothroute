package com.smoothroute.logic;

/** Which measure the phone used: plain jolt, or jolt divided by speed. */
public enum DetectionMode {
    PLAIN, NORMALISED;

    public static DetectionMode parse(String text) {
        return "normalised".equalsIgnoreCase(text) ? NORMALISED : PLAIN;
    }

    public String label() {
        return name().toLowerCase();
    }
}
