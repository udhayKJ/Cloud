package com.cloudshift.controller;

import com.cloudshift.dto.infra.InfraProfileRequest;
import com.cloudshift.dto.infra.InfraProfileResponse;
import com.cloudshift.service.InfrastructureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for managing Infrastructure Profiles.
 * All endpoints require a valid JWT.
 */
@RestController
@RequestMapping("/api/infrastructure")
@RequiredArgsConstructor
public class InfrastructureController {

    private final InfrastructureService infraService;

    /**
     * GET /api/infrastructure?projectId={projectId}
     * List all infrastructure profiles for a project.
     */
    @GetMapping
    public ResponseEntity<List<InfraProfileResponse>> listProfiles(
            @RequestParam String projectId) {
        return ResponseEntity.ok(infraService.getProfilesForProject(projectId));
    }

    /**
     * GET /api/infrastructure/{id}
     * Get a single infrastructure profile.
     */
    @GetMapping("/{id}")
    public ResponseEntity<InfraProfileResponse> getProfile(@PathVariable String id) {
        return ResponseEntity.ok(infraService.getProfile(id));
    }

    /**
     * POST /api/infrastructure
     * Create an infrastructure profile for a project.
     */
    @PostMapping
    public ResponseEntity<InfraProfileResponse> createProfile(
            @Valid @RequestBody InfraProfileRequest request) {
        InfraProfileResponse profile = infraService.createProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(profile);
    }

    /**
     * PUT /api/infrastructure/{id}
     * Update an existing infrastructure profile.
     */
    @PutMapping("/{id}")
    public ResponseEntity<InfraProfileResponse> updateProfile(
            @PathVariable String id,
            @Valid @RequestBody InfraProfileRequest request) {
        return ResponseEntity.ok(infraService.updateProfile(id, request));
    }

    /**
     * DELETE /api/infrastructure/{id}
     * Delete an infrastructure profile.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable String id) {
        infraService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}
