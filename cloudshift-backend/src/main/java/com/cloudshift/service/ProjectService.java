package com.cloudshift.service;

import com.cloudshift.dto.project.ProjectRequest;
import com.cloudshift.dto.project.ProjectResponse;
import com.cloudshift.entity.Project;
import com.cloudshift.entity.User;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.ProjectRepository;
import com.cloudshift.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CRUD operations for {@link Project}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    // ===== Read =====

    @Transactional(readOnly = true)
    public List<ProjectResponse> listMyProjects() {
        String ownerId = getCurrentUserId();
        return projectRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(String projectId) {
        Project project = findOwnedProject(projectId);
        return ProjectResponse.from(project);
    }

    // ===== Create =====

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        User owner = getCurrentUser();

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .status(Project.ProjectStatus.DRAFT)
                .build();

        project = projectRepository.save(project);
        log.info("Created project '{}' (id={}) for user {}", project.getName(),
                project.getId(), owner.getEmail());

        return ProjectResponse.from(project);
    }

    // ===== Update =====

    @Transactional
    public ProjectResponse updateProject(String projectId, ProjectRequest request) {
        Project project = findOwnedProject(projectId);

        project.setName(request.getName());
        project.setDescription(request.getDescription());

        return ProjectResponse.from(projectRepository.save(project));
    }

    // ===== Delete =====

    @Transactional
    public void deleteProject(String projectId) {
        Project project = findOwnedProject(projectId);
        projectRepository.delete(project);
        log.info("Deleted project {} by user {}", projectId, getCurrentUserId());
    }

    // ===== Helpers =====

    /**
     * Returns the authenticated user's ID from the Security context.
     */
    public String getCurrentUserId() {
        return getCurrentUser().getId();
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Project findOwnedProject(String projectId) {
        String ownerId = getCurrentUserId();
        return projectRepository.findByIdAndOwnerId(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
    }
}
