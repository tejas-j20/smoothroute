package com.smoothroute.logic;

/** Small calculations used when merging a new report into an existing spot. */
public final class ClusterMath {
    private static final double METERS_PER_DEGREE = 111_000.0;

    private ClusterMath() {
    }

    /**
     * A box around a point, slightly bigger than the circle of the given radius.
     * Used to ask the database for nearby spots cheaply before measuring exact distances.
     * Returns {minLat, maxLat, minLng, maxLng}.
     */
    public static double[] boundingBox(double lat, double lng, double radiusMeters) {
        double dLat = radiusMeters / METERS_PER_DEGREE;
        double cos = Math.max(Math.cos(Math.toRadians(lat)), 0.01);
        double dLng = radiusMeters / (METERS_PER_DEGREE * cos);
        return new double[]{lat - dLat, lat + dLat, lng - dLng, lng + dLng};
    }

    /** New average after adding one more value to `oldCount` earlier ones. */
    public static double weightedMean(double oldMean, int oldCount, double newValue) {
        return (oldMean * oldCount + newValue) / (oldCount + 1);
    }
}
