package com.smoothroute.dto;

import com.smoothroute.logic.Severity;
import com.smoothroute.model.Cluster;
import java.time.Instant;

/** A rough spot as the map sees it. */
public record ClusterResponse(
        Long id,
        double lat,
        double lng,
        int reports,
        boolean confirmed,
        String severity,
        String maxSeverity,
        double avgSeverity,
        Instant firstSeen,
        Instant lastSeen) {

    public static ClusterResponse from(Cluster c, int confirmReports) {
        return new ClusterResponse(
                c.getId(),
                c.getLat(),
                c.getLng(),
                c.getReportCount(),
                c.getReportCount() >= confirmReports,
                Severity.fromAverage(c.getAvgSeverity()).label(),
                c.getMaxSeverity().label(),
                c.getAvgSeverity(),
                c.getFirstSeen(),
                c.getLastSeen());
    }
}
