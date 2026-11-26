package com.smoothroute.logic;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class ClusterMathTest {

    @Test
    void firstValueBecomesTheMean() {
        assertEquals(12.9, ClusterMath.weightedMean(0.0, 0, 12.9), 0.000001);
    }

    @Test
    void meanMovesTowardsNewValues() {
        // mean of 2 and 4 is 3, then adding 6 gives (2 + 4 + 6) / 3 = 4
        double mean = ClusterMath.weightedMean(2.0, 1, 4.0);
        assertEquals(3.0, mean, 0.000001);
        assertEquals(4.0, ClusterMath.weightedMean(mean, 2, 6.0), 0.000001);
    }

    @Test
    void boxCoversPointsInsideTheRadius() {
        double lat = 12.9716;
        double lng = 77.5946;
        double[] box = ClusterMath.boundingBox(lat, lng, 15);

        // a point 12 m east (0.0001 degrees is about 10.8 m here, so 0.00011 is about 11.9 m)
        double eastLng = lng + 0.00011;
        assertTrue(Haversine.meters(lat, lng, lat, eastLng) < 15);
        assertTrue(eastLng >= box[2] && eastLng <= box[3]);

        // a point 12 m north
        double northLat = lat + 12.0 / 111_195.0;
        assertTrue(northLat >= box[0] && northLat <= box[1]);
    }

    @Test
    void boxExcludesFarAwayPoints() {
        double[] box = ClusterMath.boundingBox(12.9716, 77.5946, 15);
        double farLng = 77.5946 + 0.001; // about 108 m away
        assertFalse(farLng >= box[2] && farLng <= box[3]);
    }
}
