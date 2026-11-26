package com.smoothroute.controller;

import com.smoothroute.logic.Severity;
import com.smoothroute.model.Cluster;
import com.smoothroute.repository.ClusterRepository;
import com.smoothroute.repository.ReadingRepository;
import com.smoothroute.service.ClusterQueryService;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** A quick check that the server is alive, and a few totals for demos and slides. */
@RestController
@RequestMapping("/api")
public class HealthController {

    private final ReadingRepository readings;
    private final ClusterRepository clusters;
    private final ClusterQueryService queryService;

    public HealthController(ReadingRepository readings, ClusterRepository clusters, ClusterQueryService queryService) {
        this.readings = readings;
        this.clusters = clusters;
        this.queryService = queryService;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "ok");
        body.put("time", Instant.now().toString());
        return body;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        List<Cluster> all = clusters.findAll();
        int confirmReports = queryService.getConfirmReports();
        Map<String, Long> bySeverity = new LinkedHashMap<>();
        for (Severity s : Severity.values()) {
            bySeverity.put(s.label(), all.stream()
                    .filter(c -> Severity.fromAverage(c.getAvgSeverity()) == s)
                    .count());
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("readings", readings.count());
        body.put("spots", all.size());
        body.put("confirmedSpots", all.stream().filter(c -> c.getReportCount() >= confirmReports).count());
        body.put("spotsBySeverity", bySeverity);
        return body;
    }
}
