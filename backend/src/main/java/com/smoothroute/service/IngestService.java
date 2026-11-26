package com.smoothroute.service;

import com.smoothroute.dto.ReadingRequest;
import com.smoothroute.dto.ReadingResponse;
import com.smoothroute.logic.DetectionMode;
import com.smoothroute.logic.Severity;
import com.smoothroute.logic.SeverityScorer;
import java.util.concurrent.locks.ReentrantLock;
import org.springframework.stereotype.Service;

/**
 * Front door for new reports: checks the time, scores the severity, then hands over to
 * ClusterService. The lock makes sure two reports of the same spot are never merged at the
 * same moment (which could create two clusters for one pothole). It is enough for one server
 * instance, which is what this project runs.
 */
@Service
public class IngestService {

    private static final long FUTURE_SLACK_MS = 5 * 60 * 1000L;
    private static final long MAX_AGE_MS = 366L * 24 * 60 * 60 * 1000L;

    private final ReentrantLock lock = new ReentrantLock();
    private final SeverityScorer scorer;
    private final ClusterService clusterService;

    public IngestService(SeverityScorer scorer, ClusterService clusterService) {
        this.scorer = scorer;
        this.clusterService = clusterService;
    }

    public ReadingResponse ingest(ReadingRequest request) {
        long now = System.currentTimeMillis();
        if (request.time() > now + FUTURE_SLACK_MS || request.time() < now - MAX_AGE_MS) {
            throw new IllegalArgumentException("time is outside the accepted range");
        }
        DetectionMode mode = DetectionMode.parse(request.mode());
        Severity severity = scorer.score(mode, request.value());

        lock.lock();
        try {
            return clusterService.save(request, mode, severity);
        } finally {
            lock.unlock();
        }
    }
}
