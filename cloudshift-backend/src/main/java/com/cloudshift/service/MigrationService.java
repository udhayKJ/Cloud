package com.cloudshift.service;

import com.cloudshift.dto.migration.ArchitectureGraph;
import com.cloudshift.dto.migration.MigrationAnalysisRequest;
import com.cloudshift.dto.migration.MigrationAnalysisResponse;
import com.cloudshift.engine.ArchitectureGeneratorService;
import com.cloudshift.engine.MigrationDecisionEngine;
import com.cloudshift.entity.InfrastructureProfile;
import com.cloudshift.entity.MigrationPlan;
import com.cloudshift.entity.Project;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.InfrastructureProfileRepository;
import com.cloudshift.repository.MigrationPlanRepository;
import com.cloudshift.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Orchestrates the Migration Decision Engine and persists results.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MigrationService {

    private final MigrationDecisionEngine decisionEngine;
    private final ArchitectureGeneratorService archGenerator;
    private final InfrastructureProfileRepository infraRepo;
    private final MigrationPlanRepository migrationPlanRepo;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    /**
     * Runs the migration analysis for all 3 priority profiles and persists each as a MigrationPlan.
     * Returns the plan for the BALANCED profile (or the one matching the request's target profile).
     */
    @Transactional
    public List<MigrationAnalysisResponse> analyse(MigrationAnalysisRequest request) {
        // Verify ownership
        String ownerId = projectService.getCurrentUserId();
        Project project = projectRepository.findByIdAndOwnerId(request.getProjectId(), ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", request.getProjectId()));

        InfrastructureProfile infra = infraRepo.findById(request.getInfraProfileId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "InfrastructureProfile", "id", request.getInfraProfileId()));

        // Determine which profiles to generate
        List<MigrationPlan.PriorityProfile> profiles = determineProfiles(request);

        List<MigrationAnalysisResponse> results = new ArrayList<>();

        for (MigrationPlan.PriorityProfile profile : profiles) {
            MigrationDecisionEngine.DecisionResult decision = decisionEngine.analyse(infra, profile);

            // Generate React Flow architecture JSON
            String archJson = archGenerator.generateArchitectureJson(decision, profile);

            // Persist as MigrationPlan
            MigrationPlan plan = MigrationPlan.builder()
                    .project(project)
                    .infraProfile(infra)
                    .migrationStrategy(decision.getMigrationStrategy())
                    .priorityProfile(profile)
                    .computeService(decision.getComputeService())
                    .dbService(decision.getDbService())
                    .storageService(decision.getStorageService())
                    .migrationMethod(decision.getMigrationMethod())
                    .drStrategy(decision.getDrStrategy())
                    .networkingServices(decision.getNetworkingServices())
                    .securityServices(decision.getSecurityServices())
                    .estimatedCostMonthly(decision.getEstimatedMonthlyUsd())
                    .architectureJson(archJson)
                    .status(MigrationPlan.PlanStatus.GENERATED)
                    .build();

            plan = migrationPlanRepo.save(plan);
            log.info("Saved migration plan {} ({}) for project {}", plan.getId(), profile, project.getId());

            // Build response
            ArchitectureGraph graph = archGenerator.buildGraph(decision, profile);
            results.add(MigrationAnalysisResponse.builder()
                    .migrationPlanId(plan.getId())
                    .projectId(project.getId())
                    .infraProfileId(infra.getId())
                    .migrationStrategy(decision.getMigrationStrategy().name())
                    .migrationStrategyReason(decision.getMigrationStrategyReason())
                    .priorityProfile(profile.name())
                    .computeService(decision.getComputeService())
                    .dbService(decision.getDbService())
                    .storageService(decision.getStorageService())
                    .migrationMethod(decision.getMigrationMethod())
                    .migrationMethodReason(decision.getMigrationMethodReason())
                    .drStrategy(decision.getDrStrategy())
                    .networkingServices(decision.getNetworkingServices())
                    .securityServices(decision.getSecurityServices())
                    .estimatedMonthlyUsd(decision.getEstimatedMonthlyUsd())
                    .architectureGraph(graph)
                    .keyRecommendations(decision.getRecommendations())
                    .warnings(decision.getWarnings())
                    .build());
        }

        // Update project status to ANALYSING → COMPLETED
        project.setStatus(Project.ProjectStatus.COMPLETED);
        projectRepository.save(project);

        return results;
    }

    /**
     * Returns a previously generated migration plan by ID.
     */
    @Transactional(readOnly = true)
    public List<MigrationAnalysisResponse> getPlansForProject(String projectId) {
        String ownerId = projectService.getCurrentUserId();
        projectRepository.findByIdAndOwnerId(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        return migrationPlanRepo.findByProjectIdOrderByCreatedAtDesc(projectId)
                .stream()
                .map(this::mapPlanToResponse)
                .toList();
    }

    private MigrationAnalysisResponse mapPlanToResponse(MigrationPlan plan) {
        return MigrationAnalysisResponse.builder()
                .migrationPlanId(plan.getId())
                .projectId(plan.getProject().getId())
                .infraProfileId(plan.getInfraProfile() != null ? plan.getInfraProfile().getId() : null)
                .migrationStrategy(plan.getMigrationStrategy().name())
                .priorityProfile(plan.getPriorityProfile().name())
                .computeService(plan.getComputeService())
                .dbService(plan.getDbService())
                .storageService(plan.getStorageService())
                .migrationMethod(plan.getMigrationMethod())
                .drStrategy(plan.getDrStrategy())
                .networkingServices(plan.getNetworkingServices())
                .securityServices(plan.getSecurityServices())
                .estimatedMonthlyUsd(plan.getEstimatedCostMonthly())
                .build();
    }

    private List<MigrationPlan.PriorityProfile> determineProfiles(MigrationAnalysisRequest request) {
        // Always generate all 3 variants — frontend can pick which to display
        return List.of(
                MigrationPlan.PriorityProfile.LOW_COST,
                MigrationPlan.PriorityProfile.BALANCED,
                MigrationPlan.PriorityProfile.HIGH_AVAILABILITY
        );
    }
}
