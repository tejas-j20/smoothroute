package com.smoothroute.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * One bump found by a phone. Example:
 * {"lat":12.9716,"lng":77.5946,"speed":6.2,"value":5.4,"mode":"plain","accuracy":8,"time":1794460000000,"deviceId":"abc123"}
 */
public record ReadingRequest(
        @NotNull @DecimalMin("-90.0") @DecimalMax("90.0") Double lat,
        @NotNull @DecimalMin("-180.0") @DecimalMax("180.0") Double lng,
        /* metres per second */
        @NotNull @DecimalMin("0.0") @DecimalMax("100.0") Double speed,
        /* the detector's value for the bump */
        @NotNull @DecimalMin("0.0") @DecimalMax("1000.0") Double value,
        @NotNull @Pattern(regexp = "plain|normalised", message = "must be 'plain' or 'normalised'") String mode,
        @DecimalMin("0.0") @DecimalMax("10000.0") Double accuracy,
        /* when the bump happened, in milliseconds since 1970 */
        @NotNull Long time,
        @Size(max = 64) String deviceId) {
}
