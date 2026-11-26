package com.smoothroute.dto;

public record ReadingResponse(Long readingId, Long clusterId, String severity, int clusterReports) {
}
