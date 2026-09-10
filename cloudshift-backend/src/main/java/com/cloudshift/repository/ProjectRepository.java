package com.cloudshift.repository;

import com.cloudshift.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(String ownerId);

    Optional<Project> findByIdAndOwnerId(String id, String ownerId);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.owner.id = :ownerId")
    long countByOwnerId(@Param("ownerId") String ownerId);
}
