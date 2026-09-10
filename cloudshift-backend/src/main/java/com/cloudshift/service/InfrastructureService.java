package com.cloudshift.service;

import com.cloudshift.dto.infra.InfraProfileRequest;
import com.cloudshift.dto.infra.InfraProfileResponse;
import com.cloudshift.entity.InfrastructureProfile;
import com.cloudshift.entity.Project;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.InfrastructureProfileRepository;
import com.cloudshift.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD operations for {@link InfrastructureProfile}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InfrastructureService {

    private final InfrastructureProfileRepository infraRepo;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;

    // ===== Read =====

    @Transactional(readOnly = true)
    public List<InfraProfileResponse> getProfilesForProject(String projectId) {
        verifyProjectOwnership(projectId);
        return infraRepo.findByProjectId(projectId)
                .stream()
                .map(InfraProfileResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InfraProfileResponse getProfile(String profileId) {
        InfrastructureProfile profile = findProfile(profileId);
        verifyProjectOwnership(profile.getProject().getId());
        return InfraProfileResponse.from(profile);
    }

    // ===== Create =====

    @Transactional
    public InfraProfileResponse createProfile(InfraProfileRequest request) {
        Project project = verifyProjectOwnership(request.getProjectId());

        InfrastructureProfile profile = InfrastructureProfile.builder()
                .project(project)
                .serverCount(request.getServerCount())
                .averageCpuUtilizationPct(request.getAverageCpuUtilizationPct())
                .averageRamGb(request.getAverageRamGb())
                .totalStorageGb(request.getTotalStorageGb())
                .storageType(request.getStorageType())
                .dbType(request.getDbType())
                .dbSizeGb(request.getDbSizeGb())
                .userCount(request.getUserCount())
                .peakRps(request.getPeakRps())
                .budgetTier(request.getBudgetTier())
                .rtoHours(request.getRtoHours())
                .rpoHours(request.getRpoHours())
                .availabilityRequirement(request.getAvailabilityRequirement())
                .networkBandwidthGbps(request.getNetworkBandwidthGbps())
                .complianceRequirements(request.getComplianceRequirements())
                .currentOs(request.getCurrentOs())
                .isContainerized(request.getIsContainerized() != null
                        ? request.getIsContainerized() : false)
                .hasMicroservices(request.getHasMicroservices() != null
                        ? request.getHasMicroservices() : false)
                .notes(request.getNotes())
                .build();

        profile = infraRepo.save(profile);
        log.info("Created infrastructure profile {} for project {}", profile.getId(),
                project.getId());

        return InfraProfileResponse.from(profile);
    }

    // ===== Update =====

    @Transactional
    public InfraProfileResponse updateProfile(String profileId, InfraProfileRequest request) {
        InfrastructureProfile profile = findProfile(profileId);
        verifyProjectOwnership(profile.getProject().getId());

        // Update all mutable fields
        profile.setServerCount(request.getServerCount());
        profile.setAverageCpuUtilizationPct(request.getAverageCpuUtilizationPct());
        profile.setAverageRamGb(request.getAverageRamGb());
        profile.setTotalStorageGb(request.getTotalStorageGb());
        profile.setStorageType(request.getStorageType());
        profile.setDbType(request.getDbType());
        profile.setDbSizeGb(request.getDbSizeGb());
        profile.setUserCount(request.getUserCount());
        profile.setPeakRps(request.getPeakRps());
        profile.setBudgetTier(request.getBudgetTier());
        profile.setRtoHours(request.getRtoHours());
        profile.setRpoHours(request.getRpoHours());
        profile.setAvailabilityRequirement(request.getAvailabilityRequirement());
        profile.setNetworkBandwidthGbps(request.getNetworkBandwidthGbps());
        profile.setComplianceRequirements(request.getComplianceRequirements());
        profile.setCurrentOs(request.getCurrentOs());
        if (request.getIsContainerized() != null) {
            profile.setIsContainerized(request.getIsContainerized());
        }
        if (request.getHasMicroservices() != null) {
            profile.setHasMicroservices(request.getHasMicroservices());
        }
        profile.setNotes(request.getNotes());

        return InfraProfileResponse.from(infraRepo.save(profile));
    }

    // ===== Delete =====

    @Transactional
    public void deleteProfile(String profileId) {
        InfrastructureProfile profile = findProfile(profileId);
        verifyProjectOwnership(profile.getProject().getId());
        infraRepo.delete(profile);
        log.info("Deleted infrastructure profile {}", profileId);
    }

    // ===== Helpers =====

    private InfrastructureProfile findProfile(String profileId) {
        return infraRepo.findById(profileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "InfrastructureProfile", "id", profileId));
    }

    private Project verifyProjectOwnership(String projectId) {
        String ownerId = projectService.getCurrentUserId();
        Project project = projectRepository.findByIdAndOwnerId(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        return project;
    }
}
