package com.smoothroute.logic;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class SeverityScorerTest {

    private final SeverityScorer scorer = new SeverityScorer(4.5, 7.5, 0.75, 1.25);

    @Test
    void plainModeGradesByJolt() {
        assertEquals(Severity.MINOR, scorer.score(DetectionMode.PLAIN, 3.1));
        assertEquals(Severity.MODERATE, scorer.score(DetectionMode.PLAIN, 4.5));
        assertEquals(Severity.MODERATE, scorer.score(DetectionMode.PLAIN, 7.4));
        assertEquals(Severity.SEVERE, scorer.score(DetectionMode.PLAIN, 7.5));
        assertEquals(Severity.SEVERE, scorer.score(DetectionMode.PLAIN, 20));
    }

    @Test
    void normalisedModeUsesItsOwnLimits() {
        assertEquals(Severity.MINOR, scorer.score(DetectionMode.NORMALISED, 0.5));
        assertEquals(Severity.MODERATE, scorer.score(DetectionMode.NORMALISED, 0.75));
        assertEquals(Severity.SEVERE, scorer.score(DetectionMode.NORMALISED, 1.25));
    }

    @Test
    void sameNumberMeansDifferentThingsInEachMode() {
        // 4.6 is moderate as a plain jolt but severe as a jolt per m/s
        assertEquals(Severity.MODERATE, scorer.score(DetectionMode.PLAIN, 4.6));
        assertEquals(Severity.SEVERE, scorer.score(DetectionMode.NORMALISED, 4.6));
    }

    @Test
    void rejectsLimitsInTheWrongOrder() {
        assertThrows(IllegalArgumentException.class, () -> new SeverityScorer(7.5, 4.5, 0.75, 1.25));
        assertThrows(IllegalArgumentException.class, () -> new SeverityScorer(4.5, 7.5, 0, 1.25));
    }

    @Test
    void averageScoreBecomesALabel() {
        assertEquals(Severity.MINOR, Severity.fromAverage(1.0));
        assertEquals(Severity.MODERATE, Severity.fromAverage(1.5));
        assertEquals(Severity.MODERATE, Severity.fromAverage(2.4));
        assertEquals(Severity.SEVERE, Severity.fromAverage(2.5));
    }

    @Test
    void modeIsParsedFromText() {
        assertEquals(DetectionMode.NORMALISED, DetectionMode.parse("normalised"));
        assertEquals(DetectionMode.NORMALISED, DetectionMode.parse("NORMALISED"));
        assertEquals(DetectionMode.PLAIN, DetectionMode.parse("plain"));
        assertEquals(DetectionMode.PLAIN, DetectionMode.parse(null));
    }
}
