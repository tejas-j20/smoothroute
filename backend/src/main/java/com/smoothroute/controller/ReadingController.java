package com.smoothroute.controller;

import com.smoothroute.dto.BatchResponse;
import com.smoothroute.dto.ReadingRequest;
import com.smoothroute.dto.ReadingResponse;
import com.smoothroute.service.IngestService;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Phones send the bumps they detect here. */
@RestController
@RequestMapping("/api")
public class ReadingController {

    private final IngestService ingestService;
    private final Validator validator;
    private final int maxBatchSize;

    public ReadingController(IngestService ingestService,
                             Validator validator,
                             @Value("${smoothroute.max-batch-size}") int maxBatchSize) {
        this.ingestService = ingestService;
        this.validator = validator;
        this.maxBatchSize = maxBatchSize;
    }

    /** One bump. */
    @PostMapping("/readings")
    public ResponseEntity<ReadingResponse> create(@Valid @RequestBody ReadingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ingestService.ingest(request));
    }

    /** Several bumps at once (for example all the bumps of a ride). Bad ones are skipped, not fatal. */
    @PostMapping("/readings/batch")
    public BatchResponse createBatch(@RequestBody List<ReadingRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new IllegalArgumentException("send at least one reading");
        }
        if (requests.size() > maxBatchSize) {
            throw new IllegalArgumentException("at most " + maxBatchSize + " readings per request");
        }
        List<ReadingResponse> results = new ArrayList<>();
        int rejected = 0;
        for (ReadingRequest request : requests) {
            if (request == null || !validator.validate(request).isEmpty()) {
                rejected++;
                continue;
            }
            try {
                results.add(ingestService.ingest(request));
            } catch (IllegalArgumentException e) {
                rejected++;
            }
        }
        return new BatchResponse(requests.size(), results.size(), rejected, results);
    }
}
