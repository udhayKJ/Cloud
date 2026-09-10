package com.cloudshift.dto.project;

import com.cloudshift.entity.Project;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {

    private String id;
    private String name;
    private String description;
    private String status;
    private String ownerId;
    private String ownerEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int infrastructureProfileCount;
    private int migrationPlanCount;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .status(project.getStatus().name())
                .ownerId(project.getOwner().getId())
                .ownerEmail(project.getOwner().getEmail())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .infrastructureProfileCount(project.getInfrastructureProfiles().size())
                .migrationPlanCount(project.getMigrationPlans().size())
                .build();
    }
}
