package com.smoothroute.model;

import com.smoothroute.logic.DetectionMode;
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

/** One bump reported by a phone. */
@Entity
@Table(name = "readings", indexes = {
        @Index(name = "idx_readings_cluster", columnList = "cluster_id"),
        @Index(name = "idx_readings_device_time", columnList = "device_id,recorded_at")
})
public class Reading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cluster_id", nullable = false)
    private Long clusterId;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    /** Speed in metres per second when the bump was felt. */
    @Column(nullable = false)
    private double speed;

    /** The detector's value for the bump (jolt, or jolt per m/s in normalised mode). */
    @Column(name = "detect_value", nullable = false)
    private double detectValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "detect_mode", nullable = false, length = 16)
    private DetectionMode detectMode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Severity severity;

    /** GPS accuracy in metres (may be unknown). */
    private Double accuracy;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;

    /** Random anonymous id made by the phone (no name, no phone number). */
    @Column(name = "device_id", length = 64)
    private String deviceId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public Long getClusterId() { return clusterId; }
    public void setClusterId(Long clusterId) { this.clusterId = clusterId; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
    public double getSpeed() { return speed; }
    public void setSpeed(double speed) { this.speed = speed; }
    public double getDetectValue() { return detectValue; }
    public void setDetectValue(double detectValue) { this.detectValue = detectValue; }
    public DetectionMode getDetectMode() { return detectMode; }
    public void setDetectMode(DetectionMode detectMode) { this.detectMode = detectMode; }
    public Severity getSeverity() { return severity; }
    public void setSeverity(Severity severity) { this.severity = severity; }
    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
