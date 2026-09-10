package com.cloudshift.repository;

import com.cloudshift.entity.SimulationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SimulationResultRepository extends JpaRepository<SimulationResult, String> {
    List<SimulationResult> findByMigrationPlanIdOrderByCreatedAtDesc(String migrationPlanId);
}
