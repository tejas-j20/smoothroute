package com.smoothroute.dto;

import java.util.List;

public record BatchResponse(int received, int saved, int rejected, List<ReadingResponse> results) {
}
