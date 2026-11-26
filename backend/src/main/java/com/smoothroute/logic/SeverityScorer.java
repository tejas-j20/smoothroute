package com.smoothroute.logic;

/**
 * Gives a bump a severity from the strength the phone measured.
 * The limits are settings (application.properties), so they can be tuned from test rides.
 *   value below "moderate"  -> minor
 *   value from "moderate"   -> moderate
 *   value from "severe"     -> severe
 */
public class SeverityScorer {
    private final double plainModerate;
    private final double plainSevere;
    private final double normalisedModerate;
    private final double normalisedSevere;

    public SeverityScorer(double plainModerate, double plainSevere,
                          double normalisedModerate, double normalisedSevere) {
        if (plainModerate <= 0 || plainSevere <= plainModerate
                || normalisedModerate <= 0 || normalisedSevere <= normalisedModerate) {
            throw new IllegalArgumentException("Severity limits must be positive and 'severe' must be above 'moderate'");
        }
        this.plainModerate = plainModerate;
        this.plainSevere = plainSevere;
        this.normalisedModerate = normalisedModerate;
        this.normalisedSevere = normalisedSevere;
    }

    public Severity score(DetectionMode mode, double value) {
        double moderate = mode == DetectionMode.NORMALISED ? normalisedModerate : plainModerate;
        double severe = mode == DetectionMode.NORMALISED ? normalisedSevere : plainSevere;
        if (value >= severe) return Severity.SEVERE;
        if (value >= moderate) return Severity.MODERATE;
        return Severity.MINOR;
    }
}
