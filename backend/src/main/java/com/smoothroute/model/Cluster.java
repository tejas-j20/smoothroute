package com.smoothroute.model;

import com.smoothroute.logic.Severity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.Instant;

/** One rough spot on a road. Many reports from different phones are merged into one cluster. */
@Entity
@Table(name = "clusters", indexes = @Index(name = "idx_clusters_position", columnList = "lat,lng"))
public class Cluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @Column(name = "report_count", nullable = false)
    private int reportCount;

    /** Average of the reports' severity scores (1 = minor, 2 = moderate, 3 = severe). */
    @Column(name = "avg_severity", nullable = false)
    private double avgSeverity;

    @Enumerated(EnumType.STRING)
    @Column(name = "max_severity", nullable = false, length = 16)
    private Severity maxSeverity;

    @Column(name = "first_seen", nullable = false)
    private Instant firstSeen;

    @Column(name = "last_seen", nullable = false)
    private Instant lastSeen;

    public Long getId() { return id; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
    public int getReportCount() { return reportCount; }
    public void setReportCount(int reportCount) { this.reportCount = reportCount; }
    public double getAvgSeverity() { return avgSeverity; }
    public void setAvgSeverity(double avgSeverity) { this.avgSeverity = avgSeverity; }
    public Severity getMaxSeverity() { return maxSeverity; }
    public void setMaxSeverity(Severity maxSeverity) { this.maxSeverity = maxSeverity; }
    public Instant getFirstSeen() { return firstSeen; }
    public void setFirstSeen(Instant firstSeen) { this.firstSeen = firstSeen; }
    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }
}
