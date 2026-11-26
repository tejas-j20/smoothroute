package com.smoothroute.repository;

import com.smoothroute.model.Reading;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReadingRepository extends JpaRepository<Reading, Long> {

    /** Used to ignore a report that the phone sent twice (for example after a network retry). */
    Optional<Reading> findFirstByDeviceIdAndRecordedAt(String deviceId, Instant recordedAt);

    List<Reading> findTop20ByClusterIdOrderByRecordedAtDesc(Long clusterId);
}
