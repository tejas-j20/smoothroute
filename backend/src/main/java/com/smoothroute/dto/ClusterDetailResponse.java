package com.smoothroute.dto;

import java.time.Instant;
import java.util.List;

public record ClusterDetailResponse(ClusterResponse spot, List<ReportSummary> recentReports) {

    public record ReportSummary(Instant time, String severity, double value, String mode, double speed) {
    }
}
