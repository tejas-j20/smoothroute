package com.smoothroute.config;

import com.smoothroute.logic.SeverityScorer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds the severity scorer from the limits in application.properties. */
@Configuration
public class ScoringConfig {

    @Bean
    public SeverityScorer severityScorer(
            @Value("${smoothroute.severity.plain.moderate}") double plainModerate,
            @Value("${smoothroute.severity.plain.severe}") double plainSevere,
            @Value("${smoothroute.severity.normalised.moderate}") double normalisedModerate,
            @Value("${smoothroute.severity.normalised.severe}") double normalisedSevere) {
        return new SeverityScorer(plainModerate, plainSevere, normalisedModerate, normalisedSevere);
    }
}
