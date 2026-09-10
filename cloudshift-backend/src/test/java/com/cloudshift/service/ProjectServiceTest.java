package com.cloudshift.service;

import com.cloudshift.dto.project.ProjectRequest;
import com.cloudshift.dto.project.ProjectResponse;
import com.cloudshift.entity.Project;
import com.cloudshift.entity.User;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.ProjectRepository;
import com.cloudshift.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock ProjectRepository projectRepository;
    @Mock UserRepository userRepository;
    @Mock SecurityContext securityContext;
    @Mock Authentication authentication;

    @InjectMocks ProjectService projectService;

    private static final String USER_ID    = "user-123";
    private static final String USER_EMAIL = "owner@cloudshift.io";
    private static final String PROJECT_ID = "project-456";

    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(USER_ID)
                .email(USER_EMAIL)
                .fullName("Owner User")
                .role(User.UserRole.USER)
                .build();

        when(authentication.getName()).thenReturn(USER_EMAIL);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(owner));
    }

    @Test
    void listMyProjects_returnsMappedResponses() {
        Project p1 = Project.builder().id("p1").name("Project Alpha")
                .owner(owner).status(Project.ProjectStatus.DRAFT).build();
        Project p2 = Project.builder().id("p2").name("Project Beta")
                .owner(owner).status(Project.ProjectStatus.COMPLETED).build();

        when(projectRepository.findByOwnerIdOrderByCreatedAtDesc(USER_ID))
                .thenReturn(List.of(p1, p2));

        List<ProjectResponse> result = projectService.listMyProjects();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Project Alpha");
        assertThat(result.get(1).getName()).isEqualTo("Project Beta");
    }

    @Test
    void createProject_savesAndReturnsResponse() {
        ProjectRequest req = new ProjectRequest();
        req.setName("New Project");
        req.setDescription("A test project");

        when(projectRepository.save(any(Project.class))).thenAnswer(inv -> {
            Project p = inv.getArgument(0);
            p.setId(PROJECT_ID);
            return p;
        });

        ProjectResponse response = projectService.createProject(req);

        assertThat(response.getName()).isEqualTo("New Project");
        assertThat(response.getId()).isEqualTo(PROJECT_ID);
        assertThat(response.getOwnerId()).isEqualTo(USER_ID);
    }

    @Test
    void getProject_notOwner_throwsResourceNotFoundException() {
        when(projectRepository.findByIdAndOwnerId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> projectService.getProject(PROJECT_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteProject_callsRepositoryDelete() {
        Project project = Project.builder().id(PROJECT_ID).name("ToDelete")
                .owner(owner).status(Project.ProjectStatus.DRAFT).build();

        when(projectRepository.findByIdAndOwnerId(PROJECT_ID, USER_ID))
                .thenReturn(Optional.of(project));

        projectService.deleteProject(PROJECT_ID);

        verify(projectRepository).delete(project);
    }
}
