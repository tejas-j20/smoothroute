package com.smoothroute.service;

import com.smoothroute.dto.ClusterDetailResponse;
import com.smoothroute.dto.ClusterResponse;
import com.smoothroute.logic.Severity;
import com.smoothroute.model.Cluster;
import com.smoothroute.repository.ClusterRepository;
import com.smoothroute.repository.ReadingRepository;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Read-only look-ups used by the map. */
@Service
public class ClusterQueryService {

    private static final int MAX_RESULTS = 2000;

    private final ClusterRepository clusters;
    private final ReadingRepository readings;
    private final int confirmReports;

    public ClusterQueryService(ClusterRepository clusters,
                               ReadingRepository readings,
                               @Value("${smoothroute.cluster.confirm-reports}") int confirmReports) {
        this.clusters = clusters;
        this.readings = readings;
        this.confirmReports = confirmReports;
    }

    /** All spots, or only those inside a box (the part of the map being viewed). */
    @Transactional(readOnly = true)
    public List<ClusterResponse> list(Double minLat, Double maxLat, Double minLng, Double maxLng,
                                      Integer minReports, String minSeverity) {
        List<Cluster> found = (minLat != null && maxLat != null && minLng != null && maxLng != null)
                ? clusters.findByLatBetweenAndLngBetween(minLat, maxLat, minLng, maxLng)
                : clusters.findAll();
        int minCount = minReports == null ? 1 : minReports;
        int minScore = parseSeverityScore(minSeverity);
        return found.stream()
                .filter(c -> c.getReportCount() >= minCount)
                .filter(c -> Severity.fromAverage(c.getAvgSeverity()).getScore() >= minScore)
                .limit(MAX_RESULTS)
                .map(c -> ClusterResponse.from(c, confirmReports))
                .toList();
    }

    @Transactional(readOnly = true)
    public ClusterDetailResponse get(Long id) {
        Cluster cluster = clusters.findById(id).orElseThrow(() -> new NoSuchElementException("spot not found"));
        List<ClusterDetailResponse.ReportSummary> recent = readings.findTop20ByClusterIdOrderByRecordedAtDesc(id)
                .stream()
                .map(r -> new ClusterDetailResponse.ReportSummary(
                        r.getRecordedAt(), r.getSeverity().label(), r.getDetectValue(), r.getDetectMode().label(), r.getSpeed()))
                .toList();
        return new ClusterDetailResponse(ClusterResponse.from(cluster, confirmReports), recent);
    }

    public int getConfirmReports() {
        return confirmReports;
    }

    private static int parseSeverityScore(String text) {
        if (text == null || text.isBlank()) return 0;
        try {
            return Severity.valueOf(text.trim().toUpperCase()).getScore();
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("minSeverity must be minor, moderate or severe");
        }
    }
}
