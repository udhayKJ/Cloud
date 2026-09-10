package com.cloudshift.repository;

import com.cloudshift.entity.MigrationPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MigrationPlanRepository extends JpaRepository<MigrationPlan, String> {

    List<MigrationPlan> findByProjectIdOrderByCreatedAtDesc(String projectId);

    List<MigrationPlan> findByProjectIdAndPriorityProfile(
            String projectId, MigrationPlan.PriorityProfile priorityProfile);
}
