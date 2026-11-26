package com.smoothroute.service;

import com.smoothroute.dto.ReadingRequest;
import com.smoothroute.dto.ReadingResponse;
import com.smoothroute.logic.ClusterMath;
import com.smoothroute.logic.DetectionMode;
import com.smoothroute.logic.Haversine;
import com.smoothroute.logic.Severity;
import com.smoothroute.model.Cluster;
import com.smoothroute.model.Reading;
import com.smoothroute.repository.ClusterRepository;
import com.smoothroute.repository.ReadingRepository;
import java.time.Instant;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Saves a reading and merges it into the nearest rough spot (cluster), or starts a new spot.
 * Always called through IngestService, which makes sure only one report is merged at a time.
 */
@Service
public class ClusterService {

    private final ClusterRepository clusters;
    private final ReadingRepository readings;
    private final double radiusMeters;

    public ClusterService(ClusterRepository clusters,
                          ReadingRepository readings,
                          @Value("${smoothroute.cluster.radius-meters}") double radiusMeters) {
        this.clusters = clusters;
        this.readings = readings;
        this.radiusMeters = radiusMeters;
    }

    @Transactional
    public ReadingResponse save(ReadingRequest r, DetectionMode mode, Severity severity) {
        Instant when = Instant.ofEpochMilli(r.time());

        // The same phone sending the same bump twice (network retry): keep only the first.
        if (r.deviceId() != null && !r.deviceId().isBlank()) {
            Optional<Reading> existing = readings.findFirstByDeviceIdAndRecordedAt(r.deviceId(), when);
            if (existing.isPresent()) {
                Reading e = existing.get();
                int reports = clusters.findById(e.getClusterId()).map(Cluster::getReportCount).orElse(0);
                return new ReadingResponse(e.getId(), e.getClusterId(), e.getSeverity().label(), reports);
            }
        }

        Cluster cluster = findNearest(r.lat(), r.lng());
        if (cluster == null) {
            cluster = new Cluster();
            cluster.setLat(r.lat());
            cluster.setLng(r.lng());
            cluster.setReportCount(0);
            cluster.setAvgSeverity(0);
            cluster.setMaxSeverity(severity);
            cluster.setFirstSeen(when);
            cluster.setLastSeen(when);
        }

        // Merge: move the spot towards the average position and update the counts.
        int n = cluster.getReportCount();
        cluster.setLat(ClusterMath.weightedMean(cluster.getLat(), n, r.lat()));
        cluster.setLng(ClusterMath.weightedMean(cluster.getLng(), n, r.lng()));
        cluster.setAvgSeverity(ClusterMath.weightedMean(cluster.getAvgSeverity(), n, severity.getScore()));
        if (severity.getScore() > cluster.getMaxSeverity().getScore()) {
            cluster.setMaxSeverity(severity);
        }
        if (when.isBefore(cluster.getFirstSeen())) cluster.setFirstSeen(when);
        if (when.isAfter(cluster.getLastSeen())) cluster.setLastSeen(when);
        cluster.setReportCount(n + 1);
        cluster = clusters.save(cluster);

        Reading reading = new Reading();
        reading.setClusterId(cluster.getId());
        reading.setLat(r.lat());
        reading.setLng(r.lng());
        reading.setSpeed(r.speed());
        reading.setDetectValue(r.value());
        reading.setDetectMode(mode);
        reading.setSeverity(severity);
        reading.setAccuracy(r.accuracy());
        reading.setRecordedAt(when);
        reading.setDeviceId(r.deviceId());
        reading.setCreatedAt(Instant.now());
        reading = readings.save(reading);

        return new ReadingResponse(reading.getId(), cluster.getId(), severity.label(), cluster.getReportCount());
    }

    /** The closest existing spot within the cluster radius, or null. */
    private Cluster findNearest(double lat, double lng) {
        double[] box = ClusterMath.boundingBox(lat, lng, radiusMeters);
        Cluster nearest = null;
        double best = Double.MAX_VALUE;
        for (Cluster c : clusters.findByLatBetweenAndLngBetween(box[0], box[1], box[2], box[3])) {
            double d = Haversine.meters(lat, lng, c.getLat(), c.getLng());
            if (d <= radiusMeters && d < best) {
                best = d;
                nearest = c;
            }
        }
        return nearest;
    }
}
