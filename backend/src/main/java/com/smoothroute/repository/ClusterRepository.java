package com.smoothroute.repository;

import com.smoothroute.model.Cluster;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClusterRepository extends JpaRepository<Cluster, Long> {

    /** Spots inside a box on the map (used for nearby look-ups and for the map view). */
    List<Cluster> findByLatBetweenAndLngBetween(double minLat, double maxLat, double minLng, double maxLng);
}
