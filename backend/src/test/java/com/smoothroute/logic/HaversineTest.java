package com.smoothroute.logic;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class HaversineTest {

    @Test
    void samePointIsZeroMetresApart() {
        assertEquals(0.0, Haversine.meters(12.9716, 77.5946, 12.9716, 77.5946), 0.0001);
    }

    @Test
    void oneDegreeOfLatitudeIsAbout111Kilometres() {
        assertEquals(111195.0, Haversine.meters(0, 0, 1, 0), 50.0);
    }

    @Test
    void tinyStepInBengaluruIsAboutTenMetres() {
        // 0.0001 degrees of longitude at this latitude (matches the web app's own test)
        assertEquals(10.84, Haversine.meters(12.9716, 77.5946, 12.9716, 77.5947), 0.1);
    }

    @Test
    void distanceIsTheSameInBothDirections() {
        double a = Haversine.meters(12.9, 77.5, 13.0, 77.6);
        double b = Haversine.meters(13.0, 77.6, 12.9, 77.5);
        assertEquals(a, b, 0.000001);
    }
}
