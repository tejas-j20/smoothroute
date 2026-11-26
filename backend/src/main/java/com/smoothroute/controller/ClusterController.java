package com.smoothroute.controller;

import com.smoothroute.dto.ClusterDetailResponse;
import com.smoothroute.dto.ClusterResponse;
import com.smoothroute.service.ClusterQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** The rough spots shown on the map. */
@RestController
@RequestMapping("/api")
public class ClusterController {

    private final ClusterQueryService queryService;

    public ClusterController(ClusterQueryService queryService) {
        this.queryService = queryService;
    }

    /**
     * GET /api/clusters
     * Optional filters: minLat, maxLat, minLng, maxLng (the visible part of the map),
     * minReports (for example 2 = only spots reported at least twice),
     * minSeverity (minor, moderate or severe).
     */
    @GetMapping("/clusters")
    public List<ClusterResponse> list(
            @RequestParam(name = "minLat", required = false) Double minLat,
            @RequestParam(name = "maxLat", required = false) Double maxLat,
            @RequestParam(name = "minLng", required = false) Double minLng,
            @RequestParam(name = "maxLng", required = false) Double maxLng,
            @RequestParam(name = "minReports", required = false) Integer minReports,
            @RequestParam(name = "minSeverity", required = false) String minSeverity) {
        return queryService.list(minLat, maxLat, minLng, maxLng, minReports, minSeverity);
    }

    /** One spot with its most recent reports. */
    @GetMapping("/clusters/{id}")
    public ClusterDetailResponse get(@PathVariable("id") Long id) {
        return queryService.get(id);
    }
}
