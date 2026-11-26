package com.smoothroute.api;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Locale;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Tests the whole backend through its HTTP endpoints, using an in-memory database. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = "spring.datasource.url=jdbc:h2:mem:smoothroute_test;DB_CLOSE_DELAY=-1")
class ReadingApiTest {

    @Autowired
    private MockMvc mvc;

    private static String json(double lat, double lng, double value, long time, String device) {
        return String.format(Locale.ROOT,
                "{\"lat\":%s,\"lng\":%s,\"speed\":6.0,\"value\":%s,\"mode\":\"plain\",\"time\":%d,\"deviceId\":\"%s\"}",
                lat, lng, value, time, device);
    }

    @Test
    void healthEndpointSaysOk() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void savesAReadingAndStartsASpot() throws Exception {
        long now = System.currentTimeMillis();
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                        .content(json(12.9716, 77.5946, 5.0, now, "phone-a")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.severity").value("moderate"))
                .andExpect(jsonPath("$.clusterReports").value(1));
    }

    @Test
    void rejectsAnImpossibleLatitude() throws Exception {
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                        .content(json(95.0, 77.5946, 5.0, System.currentTimeMillis(), "phone-a")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsATimeFarInTheFuture() throws Exception {
        long tomorrow = System.currentTimeMillis() + 24L * 60 * 60 * 1000;
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                        .content(json(12.9716, 77.5946, 5.0, tomorrow, "phone-a")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void mergesNearbyReportsIntoOneSpot() throws Exception {
        long now = System.currentTimeMillis();
        // three phones, about 2 m apart (0.00002 degrees)
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                            .content(json(12.9716, 77.5946 + i * 0.00002, 5.0, now + i, "phone-" + i)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.clusterReports").value(i + 1));
        }
        mvc.perform(get("/api/clusters?minLat=12.97&maxLat=12.98&minLng=77.59&maxLng=77.60"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].reports").value(3))
                .andExpect(jsonPath("$[0].confirmed").value(true));
    }

    @Test
    void keepsFarApartBumpsAsSeparateSpots() throws Exception {
        long now = System.currentTimeMillis();
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                .content(json(12.9716, 77.5946, 5.0, now, "phone-a"))).andExpect(status().isCreated());
        // 0.001 degrees of longitude is about 108 m away
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                .content(json(12.9716, 77.5956, 5.0, now + 1, "phone-b"))).andExpect(status().isCreated());
        mvc.perform(get("/api/clusters?minLat=12.97&maxLat=12.98&minLng=77.59&maxLng=77.60"))
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void ignoresTheSameReportSentTwice() throws Exception {
        long now = System.currentTimeMillis();
        String body = json(12.9716, 77.5946, 5.0, now, "phone-a");
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated());
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.clusterReports").value(1));
    }

    @Test
    void batchAcceptsGoodReadingsAndSkipsBadOnes() throws Exception {
        long now = System.currentTimeMillis();
        String batch = "[" + json(12.9716, 77.5946, 5.0, now, "phone-a") + ","
                + json(12.9800, 77.6000, 8.0, now + 1, "phone-a") + ","
                + json(200.0, 77.6000, 8.0, now + 2, "phone-a") + "]";
        mvc.perform(post("/api/readings/batch").contentType(MediaType.APPLICATION_JSON).content(batch))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(3))
                .andExpect(jsonPath("$.saved").value(2))
                .andExpect(jsonPath("$.rejected").value(1));
    }

    @Test
    void severityFilterKeepsOnlyRoughSpots() throws Exception {
        long now = System.currentTimeMillis();
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                .content(json(12.9716, 77.5946, 3.2, now, "phone-a"))).andExpect(status().isCreated());   // minor
        mvc.perform(post("/api/readings").contentType(MediaType.APPLICATION_JSON)
                .content(json(12.9800, 77.6000, 9.0, now + 1, "phone-b"))).andExpect(status().isCreated()); // severe
        mvc.perform(get("/api/clusters?minSeverity=severe"))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].severity").value("severe"));
    }

    @Test
    void unknownSpotIsNotFound() throws Exception {
        mvc.perform(get("/api/clusters/999999")).andExpect(status().isNotFound());
    }
}
