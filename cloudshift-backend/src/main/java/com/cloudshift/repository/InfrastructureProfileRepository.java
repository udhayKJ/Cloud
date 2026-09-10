package com.cloudshift.repository;

import com.cloudshift.entity.InfrastructureProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InfrastructureProfileRepository extends JpaRepository<InfrastructureProfile, String> {

    List<InfrastructureProfile> findByProjectId(String projectId);

    Optional<InfrastructureProfile> findFirstByProjectIdOrderByCreatedAtDesc(String projectId);
}
